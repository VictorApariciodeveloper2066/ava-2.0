import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    # === Flask Core ===
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'supersecretkey')
    
    # === Database ===
    # Use DATABASE_URL env var for production (PostgreSQL on Render/Heroku)
    # Fallback to local SQLite for development
    _database_url = os.getenv('DATABASE_URL')
    if _database_url:
        # Convert postgres:// to postgresql:// for SQLAlchemy
        if _database_url.startswith('postgres://'):
            _database_url = _database_url.replace('postgres://', 'postgresql://', 1)
        SQLALCHEMY_DATABASE_URI = _database_url
    else:
        # Local SQLite in instance folder
        instance_dir = BASE_DIR / 'instance'
        instance_dir.mkdir(parents=True, exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{instance_dir / "users.db"}'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # === JWT Authentication (for Mobile API) ===
    _jwt_secret = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    if len(_jwt_secret) < 32:
        _jwt_secret = _jwt_secret + "_extra_padding_for_security_"
    JWT_SECRET_KEY = _jwt_secret
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days
    
    # === Google OAuth ===
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    
    # === Email (Flask-Mail) ===
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') in ('True', 'true', '1')
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER') or MAIL_USERNAME
    
    # === CORS (for Mobile API) ===
    CORS_ORIGINS = '*'
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization']
