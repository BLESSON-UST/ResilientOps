# Service Risk API Documentation

## Overview
The **Service Risk API** is a Flask-based RESTful API designed for managing services, their Business Impact Analysis (BIA), risk assessments, audit logs, and integrations. It uses JWT (JSON Web Token) for authentication and authorization, supports role-based access control (RBAC), and integrates with a MySQL database. The API includes Swagger UI for interactive documentation and is built with scalability and maintainability in mind.

The API supports the following key functionalities:
- User authentication (signup and login)
- Service management (create, read, update, delete services and their BIA)
- Risk analysis (automated and manual risk scoring)
- Audit logging for tracking actions
- Service status and downtime tracking
- Integration management (e.g., AWS, Slack)
- Health checks and uptime calculations

## Setup and Configuration

### Prerequisites
- **Python 3.8+**
- **MySQL** (running locally or remotely)
- **Dependencies** (listed in `requirements.txt`):
  ```bash
  flask
  flask-restx
  flask-sqlalchemy
  flask-jwt-extended
  werkzeug
  python-dotenv
  flask-cors
  pymysql
  apscheduler
  ```

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables in a `.env` file:
   ```plaintext
   MYSQL_USER=<your-mysql-username>
   MYSQL_PASSWORD=<your-mysql-password>
   MYSQL_HOST=<your-mysql-host>
   MYSQL_PORT=<your-mysql-port>
   JWT_SECRET_KEY=<your-jwt-secret-key>
   ```
   - If `JWT_SECRET_KEY` is not provided, a random key is generated using `secrets.token_hex(32)`.
4. Ensure MySQL is running and accessible.
5. Run the application:
   ```bash
   python app.py
   ```
   The API will be available at `https://localhost:5001/api` with Swagger UI at `/api`.

### Database Setup
- The application automatically creates a MySQL database named `auth` if it does not exist.
- Tables are created on startup using SQLAlchemy's `db.create_all()`.

### Configuration
- **Database**: Configured via `DATABASE_URL` (MySQL with `pymysql` driver).
- **JWT**: Tokens expire after 1 hour (`JWT_ACCESS_TOKEN_EXPIRES`).
- **CORS**: Enabled to allow cross-origin requests.
- **Scheduler**: Runs health checks every 15 minutes using APScheduler.

## Data Models

### User
Represents a user with authentication credentials and a role.
- **id**: Integer, primary key
- **username**: String(80), unique, required
- **password**: String(200), hashed, required
- **role**: String(20), default=`user` (e.g., `user`, `Business Owner`, `Ops Analyst`, `Engineer`)

### Service
Represents a service being monitored.
- **id**: Integer, primary key
- **name**: String(100), required
- **description**: Text, optional
- **created_by**: String(100), username of creator
- **bia**: One-to-one relationship with BIA
- **status**: One-to-one relationship with Status
- **downtimes**: One-to-many relationship with Downtime
- **integrations**: One-to-many relationship with Integration
- **risks**: One-to-many relationship with Risk

### BIA (Business Impact Analysis)
Stores business impact details for a service.
- **id**: Integer, primary key
- **service_id**: Integer, foreign key to Service
- **criticality**: String(20), e.g., `High`, `Medium`, `Low`
- **impact**: String(50), e.g., `High`, `Severe`
- **rto**: Integer, Recovery Time Objective (minutes)
- **rpo**: Integer, Recovery Point Objective (minutes)
- **signed_off**: Boolean, default=`False`
- **dependencies**: Many-to-many relationship with Service via `service_dependencies` table

### Status
Tracks the operational status of a service.
- **id**: Integer, primary key
- **service_id**: Integer, foreign key to Service
- **status**: String(20), e.g., `Healthy`, `Degraded`, `Down`, `Unknown`
- **last_updated**: DateTime, timestamp of last update

### Downtime
Records downtime events for a service.
- **id**: Integer, primary key
- **service_id**: Integer, foreign key to Service
- **start_time**: DateTime, required
- **end_time**: DateTime, optional
- **reason**: String(255), optional

### Integration
Stores integration details for a service (e.g., AWS, Slack).
- **id**: Integer, primary key
- **service_id**: Integer, foreign key to Service
- **type**: String(50), e.g., `AWS`, `Slack`
- **config**: JSON, stores configuration (e.g., API keys, URLs)
- **created_by**: String(100), username of creator
- **created_at**: DateTime, creation timestamp

### Risk
Stores risk assessment data for a service.
- **id**: Integer, primary key
- **service_id**: Integer, foreign key to Service
- **risk_score**: Integer, 0–100
- **risk_level**: String(20), e.g., `Low`, `Medium`, `High`
- **reason**: Text, explanation of risk score
- **source**: String(20), `automated` or `manual`
- **created_by**: String(100), username of creator
- **created_at**: DateTime, creation timestamp

### AuditLog
Tracks actions performed in the system.
- **id**: Integer, primary key
- **action**: String(100), e.g., `User Signup`, `Service Created`
- **entity**: String(50), e.g., `User`, `Service`, `Risk`
- **entity_id**: Integer, ID of the affected entity
- **timestamp**: DateTime, action timestamp
- **user_id**: Integer, ID of the user performing the action

## Authentication
- **JWT-based**: Uses `flask-jwt-extended` for token-based authentication.
- **Endpoints**:
  - **POST /api/auth/signup**: Register a new user.
  - **POST /api/auth/login**: Authenticate and receive a JWT token.
- **Token Usage**: Include the JWT in the `Authorization` header as `Bearer <token>` for protected endpoints.
- **Roles**: 
  - `Business Owner`: Can create, update, delete services, statuses, and BIAs.
  - `Ops Analyst`: Can save and update risk scores.
  - `Engineer`: Can manage integrations and view dependencies.
  - `user`: Default role with limited access (e.g., view services).

## API Endpoints

### Authentication
- **POST /api/auth/signup**
  - **Description**: Register a new user.
  - **Payload**:
    ```json
    {
      "username": "string",
      "password": "string",
      "role": "string" // Optional, defaults to "user"
    }
    ```
  - **Responses**:
    - `201`: `{ "message": "User registered successfully" }`
    - `400`: `{ "error": "Username is required" }`, `{ "error": "Password is required" }`, `{ "error": "Password must be at least 6 characters long" }`, `{ "error": "User already exists" }`

- **POST /api/auth/login**
  - **Description**: Authenticate a user and return a JWT token.
  - **Payload**:
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
  - **Responses**:
    - `200`: `{ "access_token": "string" }`
    - `401`: `{ "error": "Invalid username or password" }`

### Services
- **POST /api/services**
  - **Description**: Create a new service (requires `Business Owner` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "name": "string",
      "description": "string",
      "criticality": "string",
      "impact": "string",
      "rto": integer,
      "rpo": integer,
      "dependencies": [integer],
      "signed_off": boolean
    }
    ```
  - **Responses**:
    - `201`: `{ "message": "Service created" }`
    - `403`: `{ "error": "Forbidden" }`

- **GET /api/services**
  - **Description**: Retrieve all services.
  - **Authorization**: Bearer token
  - **Response**:
    ```json
    [
      {
        "id": integer,
        "name": "string",
        "description": "string",
        "created_by": "string",
        "bia": {
          "criticality": "string",
          "impact": "string",
          "rto": integer,
          "rpo": integer,
          "signed_off": boolean,
          "dependencies": [integer]
        },
        "status": "string",
        "last_updated": "string"
      }
    ]
    ```

- **PUT /api/services**
  - **Description**: Update a service (requires `Business Owner` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "id": integer,
      "name": "string",
      "description": "string",
      "criticality": "string",
      "impact": "string",
      "rto": integer,
      "rpo": integer,
      "dependencies": [integer],
      "signed_off": boolean
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "Service updated successfully" }`
    - `403`: `{ "error": "Forbidden" }`
    - `404`: Service not found

- **DELETE /api/services**
  - **Description**: Delete a service (requires `Business Owner` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "id": integer
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "Service deleted successfully" }`
    - `403`: `{ "error": "Forbidden" }`
    - `404`: Service not found

### Service Status
- **POST /api/services/<service_id>/status**
  - **Description**: Create or update service status (requires `Business Owner` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "status": "string" // e.g., "Healthy", "Degraded", "Down"
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "Status updated" }`
    - `403`: `{ "error": "Forbidden" }`

- **PUT /api/services/<service_id>/status**
  - **Description**: Update service status (requires `Business Owner` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "status": "string"
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "Status updated successfully" }`
    - `403`: `{ "error": "Forbidden" }`

### BIA
- **PUT /api/services/<service_id>/bia**
  - **Description**: Update BIA for a service (requires `Business Owner` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "criticality": "string",
      "impact": "string",
      "rto": integer,
      "rpo": integer,
      "signed_off": boolean,
      "dependencies": [integer]
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "BIA updated successfully" }`
    - `403`: `{ "error": "Forbidden" }`
    - `404`: Service not found

- **DELETE /api/services/<service_id>/bia**
  - **Description**: Delete BIA for a service (requires `Business Owner` role).
  - **Authorization**: Bearer token
  - **Responses**:
    - `200`: `{ "message": "BIA deleted successfully" }`
    - `403`: `{ "error": "Forbidden" }`
    - `404`: `{ "error": "No BIA found for this service" }`

### Risk Analysis
- **GET /api/risk/<service_id>**
  - **Description**: Retrieve the latest risk score for a service.
  - **Authorization**: Bearer token
  - **Response**:
    ```json
    {
      "service_id": integer,
      "risk_score": integer,
      "risk_level": "string",
      "reason": "string",
      "source": "string",
      "created_by": "string",
      "created_at": "string"
    }
    ```
  - **Responses**:
    - `200`: Risk data
    - `404`: `{ "message": "No risk score available for this service" }`

- **POST /api/risk/<service_id>/save**
  - **Description**: Save an automated risk score (requires `Ops Analyst` role).
  - **Authorization**: Bearer token
  - **Responses**:
    - `200`: `{ "message": "Risk score saved", "service_id": integer, "risk_score": integer, "risk_level": "string", "reason": "string" }`
    - `403`: `{ "error": "Forbidden" }`
    - `404`: Service not found

- **POST /api/risk/<service_id>/manual**
  - **Description**: Add a manual risk score (requires `Ops Analyst` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "risk_score": integer,
      "risk_level": "string",
      "reason": "string"
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "Manual risk score added" }`
    - `403`: `{ "error": "Forbidden" }`

- **PUT /api/risk/<service_id>/manual**
  - **Description**: Update a manual risk score (requires `Ops Analyst` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "risk_score": integer,
      "risk_level": "string",
      "reason": "string"
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "Manual risk score updated" }`
    - `403`: `{ "error": "Forbidden" }`
    - `404`: `{ "message": "No manual risk record found to update" }`

### Audit Logs
- **GET /api/audit**
  - **Description**: Retrieve all audit logs.
  - **Authorization**: Bearer token
  - **Response**:
    ```json
    [
      {
        "id": integer,
        "action": "string",
        "entity": "string",
        "entity_id": integer,
        "timestamp": "string",
        "user_id": integer
      }
    ]
    ```

### Integrations
- **POST /api/services/integrations**
  - **Description**: Add an integration for a service (requires `Engineer` role).
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "service_id": integer,
      "type": "string",
      "config": {}
    }
    ```
  - **Responses**:
    - `201`: `{ "message": "Integration added successfully" }`
    - `403`: `{ "error": "Forbidden" }`
    - `404`: `{ "error": "Service not found" }`

- **GET /api/services/integrations**
  - **Description**: Retrieve all integrations (requires `Engineer` role).
  - **Authorization**: Bearer token
  - **Response**:
    ```json
    [
      {
        "id": integer,
        "service_id": integer,
        "type": "string",
        "config": {},
        "created_by": "string",
        "created_at": "string"
      }
    ]
    ```

### Dependencies
- **GET /api/services/dependencies**
  - **Description**: Retrieve dependency information for all services (requires `Engineer` role).
  - **Authorization**: Bearer token
  - **Response**:
    ```json
    {
      "dependencies": [
        {
          "service_id": integer,
          "service_name": "string",
          "dependencies": [
            {
              "service_id": integer,
              "service_name": "string",
              "criticality": "string",
              "impact": "string",
              "rto": integer,
              "rpo": integer,
              "status": "string"
            }
          ]
        }
      ]
    }
    ```

### Downtime
- **POST /api/services/<service_id>/downtime**
  - **Description**: Log a downtime event for a service.
  - **Authorization**: Bearer token
  - **Payload**:
    ```json
    {
      "start_time": "string", // ISO 8601 format
      "end_time": "string", // Optional, ISO 8601 format
      "reason": "string" // Optional
    }
    ```
  - **Responses**:
    - `200`: `{ "message": "Downtime logged", "downtime": {...} }`
    - `400`: `{ "message": "Invalid date format. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)." }`
    - `404`: Service not found

- **GET /api/services/<service_id>/downtime**
  - **Description**: Retrieve downtime history for a service.
  - **Authorization**: Bearer token
  - **Response**:
    ```json
    {
      "service_id": integer,
      "service_name": "string",
      "downtime_count": integer,
      "downtimes": [
        {
          "start_time": "string",
          "end_time": "string",
          "reason": "string",
          "duration": "string",
          "total_minutes": integer
        }
      ]
    }
    ```

### Health Check
- **GET /api/services/<service_id>/health**
  - **Description**: Retrieve health information for a service.
  - **Authorization**: Bearer token
  - **Response**:
    ```json
    {
      "service_id": integer,
      "name": "string",
      "last_updated": "string",
      "bia": {
        "criticality": "string",
        "rto": integer,
        "rpo": integer
      },
      "downtime": {
        "start_time": "string",
        "reason": "string"
      },
      "overall_health": "string",
      "reason": "string",
      "uptime_percentage": float
    }
    ```

## Risk Calculation
The `calculate_risk_score` function computes a risk score (0–100) and level (`Low`, `Medium`, `High`) based on:
- **Service Status**: `Down` (+40 points)
- **Recent Downtime**: >2 hours in last 7 days (+20 points)
- **BIA Criticality**: `High` (+15), `Medium` (+10)
- **BIA Impact**: `High` or `Severe` (+10)
- **RTO/RPO**: RTO < 60 min (+10), RPO < 60 min (+5)
- **Dependencies**: Down dependencies (+20)
- **Integrations**: >3 integrations (+10)
- **Risk Level**:
  - `High`: Score ≥ 80
  - `Medium`: Score ≥ 50
  - `Low`: Score < 50

## Health Checks
- A background scheduler runs `run_health_checks` every 15 minutes.
- Updates service status based on last update time:
  - >10 minutes: `Down`
  - >5 minutes: `Degraded`
  - ≤5 minutes: `Healthy`
- Sends alerts (via `send_alert`) for down services (currently logs to console).

## Usage Example
1. **Signup**:
   ```bash
   curl -X POST https://localhost:5001/api/auth/signup \
   -H "Content-Type: application/json" \
   -d '{"username": "admin", "password": "password123", "role": "Business Owner"}'
   ```
2. **Login**:
   ```bash
   curl -X POST https://localhost:5001/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username": "admin", "password": "password123"}'
   ```
   Response: `{ "access_token": "<token>" }`
3. **Create Service**:
   ```bash
   curl -X POST https://localhost:5001/api/services \
   -H "Authorization: Bearer <token>" \
   -H "Content-Type: application/json" \
   -d '{"name": "MyService", "description": "Test service", "criticality": "High", "rto": 30}'
   ```
4. **Get Risk Score**:
   ```bash
   curl -X GET https://localhost:5001/api/risk/1 \
   -H "Authorization: Bearer <token>"
   ```

## Security Considerations
- **JWT Tokens**: Ensure tokens are stored securely (e.g., `sessionStorage` in the frontend with proper cleanup).
- **Role-Based Access**: Enforced via the `role_required` decorator. Backend validation is critical for security.
- **Password Hashing**: Uses `werkzeug.security` for secure password storage.
- **CORS**: Configured to allow cross-origin requests; restrict origins in production.
- **SSL**: Runs with `adhoc` SSL context in debug mode; use a proper certificate in production.

## Limitations
- The `send_alert` function is a placeholder (logs to console). Implement integration with email or Slack for production.
- The `get_health_trend` function is commented out in some places; implement if needed.
- Manual risk updates fetch the latest risk regardless of source; consider filtering by `source='manual'`.
- No pagination for large datasets (e.g., audit logs, services).

## Future Improvements
- Add pagination for endpoints returning lists (e.g., `/api/audit`, `/api/services`).
- Implement proper alerting (e.g., email, Slack) in `send_alert`.
- Add input validation for all payloads using `flask-restx` models.
- Support additional integration types and validation for `config` JSON.
- Enhance risk calculation with more sophisticated algorithms or machine learning.

## License
This project is licensed under the MIT License.