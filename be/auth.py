import os
import secrets
import logging
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import timedelta
from sqlalchemy import create_engine, text
from functools import wraps

# Load .env variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_NAME = "auth"
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")

# Step 1: Create DB if not exists
temp_engine = create_engine(f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}")
with temp_engine.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DATABASE_NAME}"))

# Step 2: Set final DB URL
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{DATABASE_NAME}"
os.environ["DATABASE_URL"] = DATABASE_URL

# Secret key handling
if not os.getenv('JWT_SECRET_KEY'):
    new_secret = secrets.token_hex(32)
    with open(".env", "a") as env_file:
        env_file.write(f"\nJWT_SECRET_KEY={new_secret}\n")
    os.environ['JWT_SECRET_KEY'] = new_secret

# Flask setup
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'user' or 'admin'

# Audit model for tracking changes
class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(100), nullable=False)
    entity = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.now())
    user_id = db.Column(db.Integer, nullable=False)

with app.app_context():
    db.create_all()

# Custom decorator for role-based access
def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in roles:
                return jsonify({'error': 'Forbidden, insufficient role'}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper

# Signup route with input validation (Fixed to avoid JWT call during signup)
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')

    # Input validation
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password should be at least 6 characters long'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User already exists'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password, role=role)
    db.session.add(new_user)
    db.session.commit()

    # Log the action in audit trail (no JWT needed during signup)
    log_audit('User Signup', 'User', new_user.id, None)  # Removed JWT identity

    return jsonify({'message': 'User registered successfully'}), 201

# Login route with JWT expiration and secure password check
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"username": user.username, "role": user.role}
    )
    return jsonify({'access_token': access_token}), 200

# Audit trail for data changes (Modified to avoid JWT in signup)
def log_audit(action, entity, entity_id, user_id):
    # user_id can be passed as None if there is no JWT (e.g., during signup)
    audit_log = AuditLog(action=action, entity=entity, entity_id=entity_id, user_id=user_id if user_id else 0)
    db.session.add(audit_log)
    db.session.commit()

# Example protected route
@app.route('/admin-only', methods=['GET'])
@role_required('admin')
def admin_only():
    return jsonify({'message': 'Welcome, admin!'})

@app.route('/user-or-admin', methods=['GET'])
@role_required('user', 'admin')
def user_or_admin():
    return jsonify({'message': 'Welcome user or admin!'})

# Run the app
if __name__ == '__main__':
    app.run(debug=True, port=5001, ssl_context='adhoc')  # Enabling HTTPS for local testing
