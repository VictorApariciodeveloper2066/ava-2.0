"""
Generate initial professor codes for AVA 2.0
Creates 10 unique 4-character alphanumeric codes
"""

from backend.extensions import db
from backend.models import CodigoProfesor
import random
import string


def generate_professor_codes(app, quantity=10):
    """
    Generate initial professor registration codes.
    Codes are 4-character alphanumeric strings.
    """
    with app.app_context():
        print('[INIT] Generando codigos de profesor...')
        
        # Check existing codes
        existing = CodigoProfesor.query.count()
        if existing >= quantity:
            print(f'[INFO] Ya existen {existing} codigos. No se crean nuevos.')
            return
        
        codes_to_create = quantity - existing
        created = 0
        attempts = 0
        max_attempts = 100
        
        while created < codes_to_create and attempts < max_attempts:
            # Generate 4-character alphanumeric code
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            
            # Check if code already exists
            if CodigoProfesor.query.filter_by(codigo=code).first():
                attempts += 1
                continue
            
            # Create code
            codigo_obj = CodigoProfesor(codigo=code, usado=False)
            db.session.add(codigo_obj)
            created += 1
            print(f'[OK] Codigo creado: {code}')
        
        db.session.commit()
        print(f'[DONE] {created} codigos de profesor creados.')
        
        # Show all codes
        print('')
        print('Codigos disponibles para registro de profesores:')
        print('=' * 40)
        codigos = CodigoProfesor.query.filter_by(usado=False).all()
        for c in codigos:
            print(f'  {c.codigo}')
        print('=' * 40)


if __name__ == '__main__':
    import sys
    from pathlib import Path
    
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    from app import create_app
    
    app = create_app()
    generate_professor_codes(app)
