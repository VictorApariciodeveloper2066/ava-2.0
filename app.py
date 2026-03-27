from backend.extensions import db, cors, migrate, mail
from flask import Flask
from flask_jwt_extended import JWTManager
from backend.routes.auth import auth_bp
from backend.routes.front import front_bp
from dotenv import load_dotenv
from pathlib import Path
import os
import shutil
from backend.models import User, Course

load_dotenv()
APP_DIR = Path(__file__).resolve().parent

def create_app():
    app = Flask(
        __name__,
        template_folder=str(APP_DIR / 'frontend' / 'templates'),
        static_folder=str(APP_DIR / 'frontend' / 'static'),
        static_url_path='/static'
    )

    # Ensure instance directory exists and prefer instance/user.db as primary DB.
    instance_dir = APP_DIR / 'instance'
    instance_dir.mkdir(parents=True, exist_ok=True)
    instance_db_path = instance_dir / 'users.db'
    # If instance DB doesn't exist but project users.db does, copy it into instance
    project_users_db = APP_DIR / 'users.db'
    try:
        if not instance_db_path.exists() and project_users_db.exists():
            shutil.copy2(project_users_db, instance_db_path)
            print(f"Copied {project_users_db} -> {instance_db_path}")
    except Exception as e:
        print('Failed copying users.db to instance:', e)

    # Load default config from config/default.py if available
    try:
        app.config.from_object('config.default.Config')
    except Exception:
        # fallback to environment variables below
        pass

    # Allow environment variables to override values and ensure secret is set
    app.secret_key = os.getenv('FLASK_SECRET_KEY', app.config.get('SECRET_KEY', 'supersecretkey'))
    
    # JWT Configuration - must be set before JWTManager initialization
    jwt_secret = os.getenv('JWT_SECRET_KEY', app.secret_key)
    # Ensure JWT secret is at least 32 characters
    if len(jwt_secret) < 32:
        jwt_secret = jwt_secret + "_extra_padding_for_security_"
    app.config['JWT_SECRET_KEY'] = jwt_secret
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = 2592000  # 30 days
    
    # Initialize JWT manager
    jwt = JWTManager(app)

    # Database configuration
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Render/Heroku PostgreSQL
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Local SQLite
        instance_db_path = APP_DIR / 'instance' / 'users.db'
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{instance_db_path}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Google OAuth configuration
    app.config['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID')
    app.config['GOOGLE_CLIENT_SECRET'] = os.getenv('GOOGLE_CLIENT_SECRET')
    
    # Solo mostrar warning si OAuth está siendo usado
    if not app.config['GOOGLE_CLIENT_ID'] or not app.config['GOOGLE_CLIENT_SECRET']:
        pass  # OAuth deshabilitado, no mostrar warning
    else:
        print(f"Google OAuth configured with client ID: {app.config['GOOGLE_CLIENT_ID'][:20]}...")

    # Ensure mail defaults come from env or config.default
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', app.config.get('MAIL_SERVER', 'smtp.gmail.com'))
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', app.config.get('MAIL_PORT', 587)))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', str(app.config.get('MAIL_USE_TLS', True))) in ('True', 'true', '1')
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', app.config.get('MAIL_USERNAME'))
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', app.config.get('MAIL_PASSWORD'))
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', app.config.get('MAIL_DEFAULT_SENDER', app.config.get('MAIL_USERNAME')))
    # Mail configuration (can be set via environment variables)
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') in ('True', 'true', '1')
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', app.config.get('MAIL_USERNAME'))

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})
    migrate.init_app(app, db)
    mail.init_app(app)
    
    # Initialize JWT for API authentication
    jwt = JWTManager(app)
    # Ensure DB tables exist for this simple development environment
    try:
        with app.app_context():
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'user' not in tables:
                print('📦 Creando tablas...')
                db.create_all()
                print('✅ Tablas creadas')
                
                # Crear datos iniciales solo si no existen
                if not User.query.first():
                    print('📝 Creando datos iniciales...')
                    
                    admin = User(username='admin', email='admin@ava.com')
                    admin.set_password('admin123')
                    admin.role = 'teacher'
                    admin.primer_nombre = 'Administrador'
                    admin.primer_apellido = 'Sistema'
                    admin.ci = '0000000000'
                    admin.career = 'Profesor'
                    db.session.add(admin)
                    
                    materias = [
                        Course(name='Inglés', dia=1, start_time='08:00', end_time='10:00', aula='A-101'),
                        Course(name='Matemáticas', dia=2, start_time='08:00', end_time='10:00', aula='A-102'),
                        Course(name='Historia', dia=3, start_time='10:00', end_time='15:30', aula='A-103'),
                        Course(name='Programación', dia=4, start_time='09:00', end_time='20:00', aula='LAB-1'),
                        Course(name='Educación Física', dia=5, start_time='08:00', end_time='10:00', aula='CANCHA'),
                    ]
                    for materia in materias:
                        db.session.add(materia)
                    
                    db.session.commit()
                    print('✅ Datos iniciales creados')
                    print('📧 Usuario: admin@ava.com')
                    print('🔑 Contraseña: admin123')
    except Exception:
        import traceback
        traceback.print_exc()

    app.register_blueprint(front_bp)
    app.register_blueprint(auth_bp)
    
    # Register API blueprints for mobile app
    from backend.api import register_routes
    register_routes(app)
    
    # Initialize OAuth
    from backend.routes.auth import init_oauth
    init_oauth(app)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
