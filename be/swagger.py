# --- Imports ---
import os, secrets, logging
from flask import Flask, jsonify
from flask_restx import Api, Resource, fields, Namespace
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import timedelta, datetime
from sqlalchemy import create_engine, text
from functools import wraps

# --- ENV & Logging ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- MySQL DB Setup ---
DATABASE_NAME = "auth"
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")

temp_engine = create_engine(f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}")
with temp_engine.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DATABASE_NAME}"))

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{DATABASE_NAME}"
os.environ["DATABASE_URL"] = DATABASE_URL

# --- App Initialization ---
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY') or secrets.token_hex(32)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

db = SQLAlchemy(app)
jwt = JWTManager(app)

api = Api(app, version="1.0", title="Service Risk API", description="API with JWT Auth, Risk Analysis & Swagger UI")
auth_ns = Namespace('auth', description='Authentication operations')
service_ns = Namespace('services', description='Service and BIA operations')
risk_ns = Namespace('risk', description='Risk analysis')

api.add_namespace(auth_ns)
api.add_namespace(service_ns)
api.add_namespace(risk_ns)

# --- Models ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(100), nullable=False)
    entity = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.now())
    user_id = db.Column(db.Integer, nullable=False)

class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.String(100))
    bia = db.relationship("BIA", backref="service", uselist=False)
    status = db.relationship("Status", backref="service", uselist=False)

class BIA(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    criticality = db.Column(db.String(20))
    impact = db.Column(db.String(50))
    rto = db.Column(db.Integer)
    rpo = db.Column(db.Integer)
    dependencies = db.Column(db.PickleType)

class Status(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    status = db.Column(db.String(20))
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

# --- Utility ---
def log_audit(action, entity, entity_id, user_id):
    audit_log = AuditLog(action=action, entity=entity, entity_id=entity_id, user_id=user_id or 0)
    db.session.add(audit_log)
    db.session.commit()

def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({'error': 'Forbidden'}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper

def calculate_risk_score(service, bia, status, all_services):
    score, reason = 0, []

    if status and status.status == 'Down':
        score += 50
        reason.append("Service is down")
    if bia and bia.rto and bia.rto < 60:
        score += 25
        reason.append("RTO < 1 hour")

    services_by_id = {s.id: s for s in all_services}
    for dep_id in bia.dependencies or []:
        dep = services_by_id.get(dep_id)
        if dep and dep.status and dep.status.status == 'Down':
            score += 25
            reason.append(f"Dependency {dep.name} is down")

    level = 'Low'
    if score >= 80: level = 'High'
    elif score >= 50: level = 'Medium'

    return {'risk_score': score, 'risk_level': level, 'reason': ', '.join(reason)}

# --- Schemas ---
signup_model = auth_ns.model('Signup', {
    'username': fields.String(required=True),
    'password': fields.String(required=True),
    'role': fields.String(default='user')
})

login_model = auth_ns.model('Login', {
    'username': fields.String(required=True),
    'password': fields.String(required=True)
})

service_model = service_ns.model('Service', {
    'name': fields.String(required=True),
    'description': fields.String,
    'criticality': fields.String,
    'impact': fields.String,
    'rto': fields.Integer,
    'rpo': fields.Integer,
    'dependencies': fields.List(fields.Integer)
})

status_model = service_ns.model('StatusUpdate', {
    'status': fields.String(required=True)
})

# --- Auth Routes ---
@auth_ns.route('/signup')
class Signup(Resource):
    @auth_ns.expect(signup_model)
    def post(self):
        data = auth_ns.payload
        if not data['username']:
            return {'error': 'Username is required'}, 400

        if not data['password']:
            return {'error': 'Password is required'}, 400

        if len(data['password']) < 6:
            return {'error': 'Password must be at least 6 characters long'}, 400

        if User.query.filter_by(username=data['username']).first():
            return {'error': 'User already exists'}, 400
        user = User(
            username=data['username'],
            password=generate_password_hash(data['password']),
            role=data.get('role', 'user')
        )
        db.session.add(user)
        db.session.commit()
        log_audit("User Signup", "User", user.id, None)
        return {'message': 'User registered successfully'}, 201

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        data = auth_ns.payload
        user = User.query.filter_by(username=data['username']).first()
        if not user or not check_password_hash(user.password, data['password']):
            return {'error': 'Invalid username or password'}, 401
        token = create_access_token(identity=str(user.id),
                                    additional_claims={"username": user.username, "role": user.role})
        return {'access_token': token}, 200

# --- Service Routes ---
@service_ns.route('')
class ServiceList(Resource):
    @jwt_required()
    @service_ns.expect(service_model)
    def post(self):
        data = service_ns.payload
        user = User.query.get(get_jwt_identity())
        service = Service(name=data['name'], description=data.get('description'), created_by=user.username)
        db.session.add(service)
        db.session.commit()

        bia = BIA(service_id=service.id,
                  criticality=data.get('criticality'),
                  impact=data.get('impact'),
                  rto=data.get('rto'),
                  rpo=data.get('rpo'),
                  dependencies=data.get('dependencies', []))
        db.session.add(bia)
        db.session.commit()
        log_audit("Service Created", "Service", service.id, user.id)
        return {'message': 'Service created'}, 201

    @jwt_required()
    def get(self):
        services = Service.query.all()
        results = []
        for s in services:
            results.append({
                'id': s.id,
                'name': s.name,
                'description': s.description,
                'created_by': s.created_by,
                'bia': {
                    'criticality': s.bia.criticality if s.bia else None,
                    'impact': s.bia.impact if s.bia else None,
                    'rto': s.bia.rto if s.bia else None,
                    'rpo': s.bia.rpo if s.bia else None,
                    'dependencies': s.bia.dependencies if s.bia else []
                },
                'status': s.status.status if s.status else "Unknown"
            })
        return results

@service_ns.route('/<int:service_id>/status')
class ServiceStatus(Resource):
    @jwt_required()
    @service_ns.expect(status_model)
    def post(self, service_id):
        data = service_ns.payload
        status = Status.query.filter_by(service_id=service_id).first()
        if not status:
            status = Status(service_id=service_id, status=data['status'])
        else:
            status.status = data['status']
            status.last_updated = datetime.utcnow()
        db.session.add(status)
        db.session.commit()
        log_audit("Status Updated", "Status", service_id, get_jwt_identity())
        return {'message': 'Status updated'}, 200

# --- Risk Analysis Route ---
@risk_ns.route('/<int:service_id>')
class Risk(Resource):
    @jwt_required()
    def get(self, service_id):
        service = Service.query.get_or_404(service_id)
        all_services = Service.query.all()
        result = calculate_risk_score(service, service.bia, service.status, all_services)
        return {'service_id': service.id, 'service_name': service.name, **result}

# --- Init & Run ---
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5001, ssl_context='adhoc')
