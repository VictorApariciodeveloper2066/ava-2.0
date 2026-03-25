from backend.extensions import db
from backend.models import User
from app import create_app

app = create_app()

with app.app_context():
    profesores = User.query.filter_by(role='teacher').all()
    
    print("\n=== PROFESORES EN LA BASE DE DATOS ===\n")
    if profesores:
        for prof in profesores:
            print(f"Username: {prof.username}")
            print(f"Nombre: {prof.primer_nombre} {prof.primer_apellido}")
            print(f"Email: {prof.email}")
            print("-" * 40)
    else:
        print("No hay profesores registrados")
        print("\nCreando profesoras...")
        
        # Crear Nicol
        nicol = User(
            username='nicol1',
            email='nicol@profesor.com',
            primer_nombre='Nicol',
            primer_apellido='Rodríguez',
            ci='99999999',
            role='teacher'
        )
        nicol.set_password('nicol2024')
        db.session.add(nicol)
        
        # Crear María
        maria = User(
            username='mariacastillo',
            email='maria.castillo@profesor.com',
            primer_nombre='María',
            primer_apellido='Castillo',
            ci='88888888',
            role='teacher'
        )
        maria.set_password('maria2024')
        db.session.add(maria)
        
        db.session.commit()
        
        print("\n✓ Profesoras creadas:")
        print(f"  - nicol1 / nicol2024 (Nicol Rodríguez)")
        print(f"  - mariacastillo / maria2024 (María Castillo)")
