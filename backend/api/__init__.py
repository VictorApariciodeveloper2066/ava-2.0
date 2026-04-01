# Backend API - REST endpoints for React Native mobile app
# This module provides JSON API endpoints that are independent of Flask sessions
# Uses JWT for authentication (flask-jwt-extended)

from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import and register sub-blueprints
# These are imported at the bottom to avoid circular imports
def register_routes(app):
    """Register all API blueprints with the Flask app."""
    from .auth import auth_api_bp
    from .secciones import secciones_api_bp
    from .asistencia import asistencia_api_bp
    from .justificativos import justificativos_api_bp
    from .sync import sync_api_bp
    from .inscripcion import inscripcion_api_bp
    from .profesor import profesor_api_bp
    from .admin import admin_api_bp
    
    app.register_blueprint(auth_api_bp, url_prefix='/api/auth')
    app.register_blueprint(secciones_api_bp, url_prefix='/api/secciones')
    app.register_blueprint(asistencia_api_bp, url_prefix='/api/asistencia')
    app.register_blueprint(justificativos_api_bp, url_prefix='/api/justificativos')
    app.register_blueprint(sync_api_bp, url_prefix='/api/sync')
    app.register_blueprint(inscripcion_api_bp, url_prefix='/api/inscripcion')
    app.register_blueprint(profesor_api_bp, url_prefix='/api/profesor')
    app.register_blueprint(admin_api_bp, url_prefix='/api/admin')