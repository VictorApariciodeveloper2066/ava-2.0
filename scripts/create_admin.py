"""
Create initial admin user for AVA 2.0
Run this script once to create the first administrator
"""

from backend.extensions import db
from backend.models import User


def create_admin(app, username='admin', email='admin@ava.com', password='admin123'):
    """
    Create admin user if not exists
    """
    with app.app_context():
        print('[INIT] Verificando usuario administrador...')
        
        # Check if admin exists
        existing = User.query.filter_by(username=username).first()
        if existing:
            print(f'[INFO] Admin ya existe: {existing.username}')
            if existing.role != 'admin':
                existing.role = 'admin'
                db.session.commit()
                print('[OK] Rol actualizado a admin')
            return
        
        # Create admin
        admin = User(
            username=username,
            email=email,
            role='admin',
            primer_nombre='Administrador',
            primer_apellido='Sistema',
            ci='0000000000',
            activo=True
        )
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        
        print('[OK] Administrador creado exitosamente')
        print(f'   Username: {username}')
        print(f'   Email: {email}')
        print(f'   Password: {password}')


if __name__ == '__main__':
    import sys
    from pathlib import Path
    
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    from app import create_app
    
    app = create_app()
    create_admin(app)
