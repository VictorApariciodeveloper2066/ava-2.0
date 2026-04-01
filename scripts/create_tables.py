"""
Create new tables for professor features
"""

from backend.extensions import db


def create_professor_tables(app):
    """Create tables for professor features"""
    with app.app_context():
        print('[CREATE] Creando tablas de profesor...')
        
        try:
            # Create all tables (safe - only creates if not exists)
            db.create_all()
            print('[OK] Tablas creadas exitosamente')
        except Exception as e:
            print(f'[ERROR] Error al crear tablas: {e}')
        
        print('[DONE] Proceso completado')


if __name__ == '__main__':
    import sys
    from pathlib import Path
    
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    from app import create_app
    
    app = create_app()
    create_professor_tables(app)
