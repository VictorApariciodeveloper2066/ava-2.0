"""
AVA 2.0 - Sistema de Asistencia Virtual
Flask Application Factory

This is the main entry point for the AVA application.
Uses configuration from config/default.py
"""

from backend.extensions import db, cors, migrate, mail
from flask import Flask
from flask_jwt_extended import JWTManager
from backend.routes.auth import auth_bp
from backend.routes.front import front_bp
from dotenv import load_dotenv
from pathlib import Path
import os
import shutil

# Load environment variables from .env
load_dotenv()

# Get app directory
APP_DIR = Path(__file__).resolve().parent


def create_app():
    """
    Application factory for AVA 2.0
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(
        __name__,
        template_folder=str(APP_DIR / 'frontend' / 'templates'),
        static_folder=str(APP_DIR / 'frontend' / 'static'),
        static_url_path='/static'
    )

    # === Copy existing database to instance folder if needed ===
    _setup_database_location()

    # === Load Configuration ===
    # Use config/default.py for all settings
    try:
        app.config.from_object('config.default.Config')
    except Exception as e:
        print(f"Warning: Could not load config.default.Config: {e}")
    
    # Override with environment variables (highest priority)
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', app.config.get('SECRET_KEY', 'supersecretkey'))
    
    # === Initialize Extensions ===
    _init_extensions(app)
    
    # === Initialize Database and Seed Data ===
    _init_database(app)
    
    # === Register Blueprints (Routes) ===
    _register_blueprints(app)
    
    # === Initialize OAuth ===
    _init_oauth(app)
    
    return app


def _setup_database_location():
    """
    Ensure instance directory exists and copy database if needed.
    This helps with database location for SQLite.
    """
    instance_dir = APP_DIR / 'instance'
    instance_dir.mkdir(parents=True, exist_ok=True)
    instance_db_path = instance_dir / 'users.db'
    project_users_db = APP_DIR / 'users.db'
    
    try:
        if not instance_db_path.exists() and project_users_db.exists():
            shutil.copy2(project_users_db, instance_db_path)
            print(f"Copied {project_users_db} -> {instance_db_path}")
    except Exception as e:
        print('Failed copying users.db to instance:', e)


def _init_extensions(app):
    """Initialize Flask extensions"""
    # Database
    db.init_app(app)
    
    # CORS - Allow API access from mobile apps
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    cors_methods = app.config.get('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    cors_headers = app.config.get('CORS_HEADERS', ['Content-Type', 'Authorization'])
    cors.init_app(app, resources={r"/api/*": {
        "origins": cors_origins,
        "methods": cors_methods,
        "allow_headers": cors_headers
    }})
    
    # Migrations
    migrate.init_app(app, db)
    
    # Email
    mail.init_app(app)
    
    # JWT (for Mobile API authentication)
    JWTManager(app)


def _init_database(app):
    """Initialize database tables and seed initial data"""
    try:
        from scripts.init_db import seed_if_empty
        seed_if_empty(app)
    except Exception as e:
        print(f"Warning: Could not initialize database: {e}")
        import traceback
        traceback.print_exc()


def _register_blueprints(app):
    """Register Flask blueprints (routes)"""
    # Web routes (Jinja2 templates)
    app.register_blueprint(front_bp)
    app.register_blueprint(auth_bp)
    
    # API routes (JSON REST API for mobile)
    from backend.api import register_routes
    register_routes(app)


def _init_oauth(app):
    """Initialize Google OAuth"""
    from backend.routes.auth import init_oauth
    init_oauth(app)


# === Application Entry Point ===
app = create_app()


if __name__ == '__main__':
    # Run the application
    # Use --host=0.0.0.0 to allow network access (for mobile testing)
    import argparse
    
    parser = argparse.ArgumentParser(description='AVA 2.0 - Sistema de Asistencia')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    args = parser.parse_args()
    
    app.run(
        host=args.host,
        port=args.port,
        debug=args.debug or app.config.get('DEBUG', False),
        use_reloader=False  # Disable reloader to avoid duplicate initialization
    )
