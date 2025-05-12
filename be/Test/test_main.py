import pytest
from flask import Flask
from app import app, db  # Import the Flask app from your main.py file

@pytest.fixture(scope="module")
def test_client():
    # Set up a test Flask client
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'  # Use an in-memory database for testing
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'  # Set a test JWT secret key
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()  # Create the tables in the test database
        yield client  # Yield the client for use in tests
        with app.app_context():
            db.drop_all()  # Clean up after tests by dropping the tables

def test_signup(test_client):
    response = test_client.post('/auth/signup', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    assert response.status_code == 201
    assert b'User registered successfully' in response.data

def test_login(test_client):
    response = test_client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    assert response.status_code == 200
    assert b'access_token' in response.data  # Check if the access token is returned

def test_create_service(test_client):
    # First, authenticate to get a valid JWT token
    login_response = test_client.post('/auth/login', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    token = login_response.json['access_token']

    # Create a service
    response = test_client.post('/services', json={
        'name': 'Test Service',
        'description': 'Test service description',
    }, headers={'Authorization': f'Bearer {token}'})
    
    assert response.status_code == 201
    assert b'Service created' in response.data
