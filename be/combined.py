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
from flask import request
from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app

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
scheduler = BackgroundScheduler()
scheduler.start()
jwt = JWTManager(app)

api = Api(app, version="1.0", title="Service Risk API", description="API with JWT Auth, Risk Analysis & Swagger UI",prefix="/api")
auth_ns = Namespace('auth', description='Authentication operations')
service_ns = Namespace('services', description='Service and BIA operations')
risk_ns = Namespace('risk', description='Risk analysis')
audit_ns = Namespace('audit', description='Audit log operations')

api.add_namespace(auth_ns)
api.add_namespace(service_ns)
api.add_namespace(risk_ns)
api.add_namespace(audit_ns)

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
    

# Association Table
service_dependencies = db.Table(
    'service_dependencies',
    db.Column('service_id', db.Integer, db.ForeignKey('service.id'), primary_key=True),
    db.Column('dependency_id', db.Integer, db.ForeignKey('service.id'), primary_key=True)
)

class BIA(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    criticality = db.Column(db.String(20))
    impact = db.Column(db.String(50))
    rto = db.Column(db.Integer)
    rpo = db.Column(db.Integer)
    signed_off = db.Column(db.Boolean, default=False)

    # Use relationship to link dependent services
    dependencies = db.relationship(
        'Service',
        secondary=service_dependencies,
        primaryjoin=service_id == service_dependencies.c.service_id,
        secondaryjoin=service_dependencies.c.dependency_id == Service.id,
        backref='dependent_on'
    )


class Status(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    status = db.Column(db.String(20))
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
class Downtime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    reason = db.Column(db.String(255))  # Reason for downtime

    service = db.relationship('Service', backref=db.backref('downtimes', lazy=True))

class Integration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    type = db.Column(db.String(50))  # e.g., 'AWS', 'Slack'
    config = db.Column(db.JSON)      # Store API keys, URLs, etc.
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    service = db.relationship('Service', backref=db.backref('integrations', lazy=True))

class Risk(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    risk_score = db.Column(db.Integer, nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.Text)
    source = db.Column(db.String(20), default='automated')  # or 'manual'
    created_by = db.Column(db.String(100))  # JWT identity
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    service = db.relationship("Service", backref=db.backref("risks", lazy=True))


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
                # return jsonify({'error': 'Forbidden'}), 403
                 return {'error': 'Forbidden'}, 403

            return fn(*args, **kwargs)
        return decorated
    return wrapper

def calculate_risk_score(service, bia, status, all_services):
    score = 0
    reasons = []

    # 1. Service status
    if status and status.status == 'Down':
        score += 40
        reasons.append("Service is currently down")

    # 2. Recent downtime analysis (last 7 days)
    recent_downtimes = [
        d for d in service.downtimes
        if d.start_time >= datetime.utcnow() - timedelta(days=7)
    ]
    total_downtime_minutes = sum(
        ((d.end_time or datetime.utcnow()) - d.start_time).total_seconds() / 60
        for d in recent_downtimes
    )

    if total_downtime_minutes > 120:  # More than 2 hours in last 7 days
        score += 20
        reasons.append("Frequent or prolonged downtimes in the last 7 days")

    # 3. BIA - Criticality
    if bia:
        if bia.criticality and bia.criticality.lower() == 'high':
            score += 15
            reasons.append("High criticality in BIA")
        elif bia.criticality and bia.criticality.lower() == 'medium':
            score += 10
            reasons.append("Medium criticality in BIA")

        # 4. BIA - Impact
        if bia.impact and bia.impact.lower() in ['high', 'severe']:
            score += 10
            reasons.append(f"High impact in BIA: {bia.impact}")

        # 5. BIA - RTO/RPO
        if bia.rto and bia.rto < 60:
            score += 10
            reasons.append("RTO < 1 hour")
        if bia.rpo and bia.rpo < 60:
            score += 5
            reasons.append("RPO < 1 hour")

        # 6. Dependency health
        if bia.dependencies:
            down_dependencies = [
                dep.name for dep in bia.dependencies
                if dep.status and dep.status.status == 'Down'
            ]
            if down_dependencies:
                score += 20
                reasons.append(f"Dependencies down: {', '.join(down_dependencies)}")

    # 7. Integration complexity
    if len(service.integrations) > 3:
        score += 10
        reasons.append("High number of integrations")

    # Risk level classification
    level = 'Low'
    if score >= 80:
        level = 'High'
    elif score >= 50:
        level = 'Medium'

    return {
        'risk_score': min(score, 100),
        'risk_level': level,
        'reason': ', '.join(reasons)
    }


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
    'dependencies': fields.List(fields.Integer),
    'signed_off': fields.Boolean
})

status_model = service_ns.model('StatusUpdate', {
    'status': fields.String(required=True)
})

audit_model = auth_ns.model('AuditLog', {
    'id': fields.Integer,
    'action': fields.String,
    'entity': fields.String,
    'entity_id': fields.Integer,
    'timestamp': fields.DateTime,
    'user_id': fields.Integer
})

integration_model = service_ns.model('Integration', {
    'service_id': fields.Integer(required=True),
    'type': fields.String(required=True, example='Slack'),
    'config': fields.Raw(required=True, description="Integration configuration as JSON"),
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
    @role_required('Business Owner')
    @api.doc(security='Bearer')
    @service_ns.expect(service_model)
    def post(self):
        data = service_ns.payload
        user = User.query.get(get_jwt_identity())
        
        # Create new Service instance
        service = Service(
            name=data['name'],
            description=data.get('description'),
            created_by=user.username
        )
        db.session.add(service)
        db.session.commit()

        # Create a new BIA instance
        bia = BIA(
            service_id=service.id,
            criticality=data.get('criticality'),
            impact=data.get('impact'),
            rto=data.get('rto'),
            rpo=data.get('rpo'),
            signed_off=data.get('signed_off', False)
        )
        db.session.add(bia)
        db.session.commit()

        # Now handle dependencies - ensure you're passing Service instances, not just IDs
        dependencies = data.get('dependencies', [])
        for dep_id in dependencies:
            dependent_service = Service.query.get(dep_id)  # Fetch Service by ID
            if dependent_service:
                bia.dependencies.append(dependent_service)  # Add the dependent service to the BIA's dependencies

        db.session.commit()  # Commit the relationship updates

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
                    'signed_off': s.bia.signed_off if s.bia else False,
                    'dependencies': [dep.id for dep in s.bia.dependencies] if s.bia else []  # List only IDs of dependencies
                },
                'status': s.status.status if s.status else "Unknown",
                'last_updated': s.status.last_updated.isoformat() if s.status and s.status.last_updated else None
            })
        return results


    @jwt_required()
    @role_required('Business Owner')
    @service_ns.expect(service_model)
    def put(self):
        data = service_ns.payload
        service = Service.query.get_or_404(data['id'])

        # Update Service fields
        service.name = data.get('name', service.name)
        service.description = data.get('description', service.description)

        # Update BIA fields if they exist
        if service.bia:
            service.bia.criticality = data.get('criticality', service.bia.criticality)
            service.bia.impact = data.get('impact', service.bia.impact)
            service.bia.rto = data.get('rto', service.bia.rto)
            service.bia.rpo = data.get('rpo', service.bia.rpo)
            service.bia.signed_off = data.get('signed_off', service.bia.signed_off)
            # Handle dependencies properly
            dependency_ids = data.get('dependencies')
            if dependency_ids is not None:
                service.bia.dependencies = [
                    Service.query.get(dep_id) for dep_id in dependency_ids if Service.query.get(dep_id)
                ]

        db.session.commit()
        log_audit("Service Updated", "Service", service.id, get_jwt_identity())
        return {'message': 'Service updated successfully'}, 200


    @jwt_required()
    @role_required('Business Owner')  
    def delete(self):
        data = service_ns.payload
        service = Service.query.get_or_404(data['id'])
        db.session.delete(service)
        db.session.commit()

        log_audit("Service Deleted", "Service", service.id, get_jwt_identity())
        return {'message': 'Service deleted successfully'}, 200


# --- Service Status Route ---
@service_ns.route('/<int:service_id>/status')
class ServiceStatus(Resource):
    @jwt_required()
    @role_required('Business Owner') 
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

    @jwt_required()
    @role_required('Business Owner') 
    @service_ns.expect(status_model)
    def put(self, service_id):
        data = service_ns.payload
        status = Status.query.filter_by(service_id=service_id).first()
        if not status:
            # If the status does not exist, create a new one
            status = Status(service_id=service_id, status=data['status'])
        else:
            # Update the existing status
            status.status = data['status']
            status.last_updated = datetime.utcnow()

        db.session.add(status)
        db.session.commit()
        log_audit("Status Updated", "Status", service_id, get_jwt_identity())
        return {'message': 'Status updated successfully'}, 200


# --- BIA Route ---
@service_ns.route('/<int:service_id>/bia')
class BIAResource(Resource):
    @jwt_required()
    @role_required('Business Owner')
    @service_ns.expect(service_model)
    def put(self, service_id):
        data = service_ns.payload
        service = Service.query.get_or_404(service_id)

        # Resolve dependency IDs into Service instances 
        dependency_ids = data.get('dependencies')
        resolved_dependencies = [
            Service.query.get(dep_id) for dep_id in dependency_ids if Service.query.get(dep_id)
        ] if dependency_ids else []

        # If BIA doesn't exist, create it
        if not service.bia:
            bia = BIA(
                service_id=service.id,
                criticality=data.get('criticality'),
                impact=data.get('impact'),
                rto=data.get('rto'),
                rpo=data.get('rpo'),
                signed_off=data.get('signed_off', False),
                dependencies=resolved_dependencies
            )
            db.session.add(bia)
        else:
            service.bia.criticality = data.get('criticality', service.bia.criticality)
            service.bia.impact = data.get('impact', service.bia.impact)
            service.bia.rto = data.get('rto', service.bia.rto)
            service.bia.rpo = data.get('rpo', service.bia.rpo)
            service.bia.signed_off = data.get('signed_off', service.bia.signed_off)
            service.bia.dependencies = resolved_dependencies

        db.session.commit()
        log_audit("BIA Updated", "BIA", service_id, get_jwt_identity())
        return {'message': 'BIA updated successfully'}, 200


    @jwt_required()
    @role_required('Business Owner')
    def delete(self, service_id):
        service = Service.query.get_or_404(service_id)
        if service.bia:
            db.session.delete(service.bia)
            db.session.commit()
            log_audit("BIA Deleted", "BIA", service_id, get_jwt_identity())
            return {'message': 'BIA deleted successfully'}, 200
        else:
            return {'error': 'No BIA found for this service'}, 404

# --- Risk Route ---

@risk_ns.route('/<int:service_id>')
class GetRisk(Resource):
    @jwt_required()
    def get(self, service_id):
        service = Service.query.get_or_404(service_id)
        
        # Fetch the latest risk entry (manual or automated)
        latest_risk = Risk.query.filter_by(service_id=service.id).order_by(Risk.created_at.desc()).first()
        
        if not latest_risk:
            return {'message': 'No risk score available for this service'}, 404

        return {
            'service_id': latest_risk.service_id,
            'risk_score': latest_risk.risk_score,
            'risk_level': latest_risk.risk_level,
            'reason': latest_risk.reason,
            'source': latest_risk.source,
            'created_by': latest_risk.created_by,
            'created_at': latest_risk.created_at.isoformat()
        }, 200


@risk_ns.route('/<int:service_id>/save')
class SaveRisk(Resource):
    @jwt_required()
    @role_required('Ops Analyst')
    def post(self, service_id):
        service = Service.query.get_or_404(service_id)
        bia = BIA.query.filter_by(service_id=service.id).first()
        status = Status.query.filter_by(service_id=service.id).first()
        all_services = Service.query.all()

        result = calculate_risk_score(service, bia, status, all_services)

        risk = Risk(
            service_id=service.id,
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            reason=result['reason'],
            source='automated',
            created_by=get_jwt_identity()
        )
        db.session.add(risk)
        db.session.commit()

        log_audit("Automated Risk Score Saved", "Risk", service_id, get_jwt_identity())

        return {
            'message': 'Risk score saved',
            'service_id': service.id,
            'risk_score': result['risk_score'],
            'risk_level': result['risk_level'],
            'reason': result['reason']
        }, 200


@risk_ns.route('/<int:service_id>/manual')
class ManualRisk(Resource):
    @role_required('Ops Analyst')
    def post(self, service_id):
        data = risk_ns.payload
        risk = Risk(
            service_id=service_id,
            risk_score=data['risk_score'],
            risk_level=data['risk_level'],
            reason=data.get('reason', ''),
            source='manual',
            created_by=get_jwt_identity()
        )
        db.session.add(risk)
        db.session.commit()

        log_audit("Manual Risk Score Added", "Risk", service_id, get_jwt_identity())
        return {'message': 'Manual risk score added'}, 200

    @role_required('Ops Analyst')
    def put(self, service_id):
        data = risk_ns.payload

        # Find the most recent manual risk for the service
        # risk = Risk.query.filter_by(service_id=service_id, source='manual') \
        #                  .order_by(Risk.created_at.desc()).first()
        risk = Risk.query.filter_by(service_id=service_id) \
                 .order_by(Risk.created_at.desc()).first()

        
        if not risk:
            return {'message': 'No manual risk record found to update.'}, 404

        # Update fields
        risk.risk_score = data['risk_score']
        risk.risk_level = data['risk_level']
        risk.reason = data.get('reason', risk.reason)
        risk.created_at = datetime.utcnow()
        risk.created_by = get_jwt_identity()

        db.session.commit()

        log_audit("Manual Risk Score Updated", "Risk", service_id, get_jwt_identity())
        return {'message': 'Manual risk score updated'}, 200



# --- Audit Route ---
@audit_ns.route('')
class AuditLogList(Resource):
    @jwt_required()
    def get(self):
        logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
        return [{
            'id': log.id,
            'action': log.action,
            'entity': log.entity,
            'entity_id': log.entity_id,
            'timestamp': log.timestamp.isoformat(),
            'user_id': log.user_id
        } for log in logs]

# --- Integration Route ---
@service_ns.route('/integrations')
class IntegrationAPI(Resource):

    @service_ns.expect(integration_model)
    @jwt_required()
    @role_required('Engineer')
    def post(self):
        data = request.get_json()
        service = Service.query.get(data['service_id'])
        if not service:
            return {"error": "Service not found"}, 404

        integration = Integration(
            service_id=data['service_id'],
            type=data['type'],
            config=data['config'],
            created_by=get_jwt_identity()
        )
        db.session.add(integration)
        db.session.commit()
        return {"message": "Integration added successfully"}, 201

    @jwt_required()
    @role_required('Engineer')
    def get(self):
        # Optional: return all integrations
        integrations = Integration.query.all()
        return [{
            'id': i.id,
            'service_id': i.service_id,
            'type': i.type,
            'config': i.config,
            'created_by': i.created_by,
            'created_at': i.created_at.isoformat()
        } for i in integrations], 200


@service_ns.route('/dependencies')
class ServiceDependencies(Resource):
    @jwt_required()
    @role_required('Engineer')
    def get(self):
        services = Service.query.all()
        result = []

        for service in services:
            if service.bia and service.bia.dependencies:
                dependencies_info = []

                for dep in service.bia.dependencies:
                    dep_bia = dep.bia
                    dep_status = dep.status

                    dependencies_info.append({
                        "service_id": dep.id,
                        "service_name": dep.name,
                        "criticality": dep_bia.criticality if dep_bia else None,
                        "impact": dep_bia.impact if dep_bia else None,
                        "rto": dep_bia.rto if dep_bia else None,
                        "rpo": dep_bia.rpo if dep_bia else None,
                        "status": dep_status.status if dep_status else None
                    })

                result.append({
                    "service_id": service.id,
                    "service_name": service.name,
                    "dependencies": dependencies_info
                })

        return {"dependencies": result}, 200

    

@service_ns.route('/<int:service_id>/downtime')
class ServiceDowntime(Resource):
    @jwt_required()
    def post(self, service_id):
        data = request.get_json()
        service = Service.query.get_or_404(service_id)

        try:
            # Parse and validate timestamps
            start_time = datetime.fromisoformat(data['start_time'])
            end_time = datetime.fromisoformat(data['end_time']) if data.get('end_time') else None
        except ValueError:
            return {'message': 'Invalid date format. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS).'}, 400

        reason = data.get('reason', 'Not specified')

        # Log downtime
        downtime = Downtime(
            service_id=service.id,
            start_time=start_time,
            end_time=end_time,
            reason=reason
        )
        db.session.add(downtime)
        db.session.commit()

        log_audit("Downtime Logged", "Downtime", service_id, get_jwt_identity())

        return {
            'message': 'Downtime logged',
            'downtime': {
                'service_id': service.id,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat() if end_time else None,
                'reason': reason
            }
        }, 200
        
    @jwt_required()
    def get(self, service_id):
        service = Service.query.get_or_404(service_id)
        downtimes = Downtime.query.filter_by(service_id=service.id).order_by(Downtime.start_time.desc()).all()

        downtime_list = []
        for dt in downtimes:
            start = dt.start_time
            end = dt.end_time or datetime.utcnow()
            duration = end - start
            total_minutes = int(duration.total_seconds() / 60)

            downtime_list.append({
                'start_time': start.isoformat(),
                'end_time': dt.end_time.isoformat() if dt.end_time else None,
                'reason': dt.reason,
                'duration': str(duration),
                'total_minutes': total_minutes
            })

        return jsonify({
            'service_id': service.id,
            'service_name': service.name,
            'downtime_count': len(downtime_list),
            'downtimes': downtime_list
        })

# --- health check ---
def run_health_checks():
    with app.app_context():
        services = Service.query.all()

        status_changes = False

        for service in services:
            status = service.status
            now = datetime.utcnow()

            if status and status.last_updated:
                delta = now - status.last_updated

                # Define different states based on how long since the last check
                if delta > timedelta(minutes=10):  # Down state after 10 mins
                    if status.status != "Down":
                        status.status = "Down"
                        status_changes = True
                        send_alert(service)  # You can define this function for notifications
                elif delta > timedelta(minutes=5):  # Degraded state
                    if status.status != "Degraded":
                        status.status = "Degraded"
                        status_changes = True
                else:  # Healthy state
                    if status.status != "Healthy":
                        status.status = "Healthy"
                        status_changes = True
            else:
                if not status:
                    status = Status(service_id=service.id)
                    db.session.add(status)
                if status.status != "Unknown":
                    status.status = "Unknown"
                    status_changes = True

            status.last_updated = now

        if status_changes:
            db.session.commit()

def send_alert(service):
    # Function to send email or Slack alert
    # Here you would integrate with your alerting system (email, Slack, etc.)
    print(f"ALERT: {service.name} is down!")


@service_ns.route('/<int:service_id>/health')
class ServiceHealth(Resource):
    @jwt_required()
    def get(self, service_id):
        service = Service.query.get_or_404(service_id)
        bia = service.bia
        status = service.status
        latest_downtime = Downtime.query.filter_by(service_id=service_id).order_by(Downtime.start_time.desc()).first()
        all_services = Service.query.all()

        result = calculate_risk_score(service, bia, status, all_services)

        # Include additional information about historical health, uptime, etc.
        health_info = {
            "service_id": service.id,
            "name": service.name,
            # "status": status.status if status else "Unknown",
            "last_updated": status.last_updated.isoformat() if status and status.last_updated else None,
            "bia": {
                "criticality": bia.criticality if bia else None,
                "rto": bia.rto if bia else None,
                "rpo": bia.rpo if bia else None
            },
            "downtime": {
                "start_time": latest_downtime.start_time.isoformat() if latest_downtime else None,
                "reason": latest_downtime.reason if latest_downtime else None
            },
            "overall_health": result['risk_level'],
            "reason": result['reason'],
            # "health_trend": get_health_trend(service.id),  # New health trend data
            "uptime_percentage": calculate_uptime_percentage(service)  # Uptime calculation
        }

        return health_info, 200

def get_health_trend(service_id):
    # Fetch historical status changes over the last week/month/etc.
    recent_statuses = Status.query.filter_by(service_id=service_id).order_by(Status.last_updated.desc()).limit(10).all()
    trend = []
    for status in recent_statuses:
        trend.append({
            "status": status.status,
            "last_updated": status.last_updated.isoformat()
        })
    return trend

def calculate_uptime_percentage(service):
    # Calculate uptime percentage based on downtime records
    total_time = datetime.utcnow() - service.status.last_updated  # Or use a specific timeframe
    downtime = Downtime.query.filter_by(service_id=service.id).all()

    downtime_duration = sum([(downtime.end_time or datetime.utcnow()) - downtime.start_time for downtime in downtime], timedelta())
    uptime_duration = total_time - downtime_duration

    uptime_percentage = (uptime_duration / total_time) * 100 if total_time else 100
    return round(uptime_percentage, 2)


scheduler = BackgroundScheduler()
scheduler.add_job(run_health_checks, 'interval', minutes=15)
scheduler.start()

# --- Init & Run ---
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5001, ssl_context='adhoc')
