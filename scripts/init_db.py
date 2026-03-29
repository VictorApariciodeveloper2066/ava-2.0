"""
Initial database data seeder for AVA 2.0

This script creates initial data needed for the application to work:
- Admin user
- Default courses
- Default periods (future: semesters)

Usage:
    python -m scripts.init_db
    # or
    from scripts.init_db import seed_database
    seed_database(app)
"""

from backend.extensions import db
from backend.models import User, Course


def seed_database(app):
    """
    Seed the database with initial data.
    Call this function within an app context.
    
    Args:
        app: Flask application instance
    """
    with app.app_context():
        # Check if data already exists
        if User.query.first():
            print('ℹ️  Database already contains data, skipping seed.')
            return
        
        print('📝 Creating initial data...')
        
        # Create admin user
        admin = User(
            username='admin',
            email='admin@ava.com',
            role='profesor'
        )
        admin.set_password('admin123')
        admin.primer_nombre = 'Administrador'
        admin.primer_apellido = 'Sistema'
        admin.ci = '0000000000'
        admin.career = 'Profesor'
        db.session.add(admin)
        
        # Create default courses
        default_courses = [
            Course(
                name='Inglés',
                dia=1,  # Monday
                start_time='08:00',
                end_time='10:00',
                aula='A-101'
            ),
            Course(
                name='Matemáticas',
                dia=2,  # Tuesday
                start_time='08:00',
                end_time='10:00',
                aula='A-102'
            ),
            Course(
                name='Historia',
                dia=3,  # Wednesday
                start_time='10:00',
                end_time='15:30',
                aula='A-103'
            ),
            Course(
                name='Programación',
                dia=4,  # Thursday
                start_time='09:00',
                end_time='20:00',
                aula='LAB-1'
            ),
            Course(
                name='Educación Física',
                dia=5,  # Friday
                start_time='08:00',
                end_time='10:00',
                aula='CANCHA'
            ),
        ]
        
        for course in default_courses:
            db.session.add(course)
        
        db.session.commit()
        
        print('✅ Initial data created successfully!')
        print('   👤 Admin user: admin@ava.com / admin123')


def seed_if_empty(app):
    """
    Wrapper that ensures tables exist before seeding.
    Safe to call multiple times.
    """
    with app.app_context():
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'user' not in tables:
            print('📦 Creating database tables...')
            db.create_all()
            print('✅ Tables created')
        
        seed_database(app)


if __name__ == '__main__':
    import sys
    from pathlib import Path
    
    # Add parent directory to path for imports
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    from app import create_app
    
    app = create_app()
    seed_if_empty(app)
