from backend.extensions import db
from backend.models import User
from app import create_app

app = create_app()

with app.app_context():
    user = User.query.filter_by(username='victor123').first()
    
    if user:
        user.es_comandante = True
        db.session.commit()
        print(f"Usuario '{user.username}' ahora es Comandante de Curso")
        print(f"  - Nombre: {user.primer_nombre} {user.primer_apellido}")
        print(f"  - Role: {user.role}")
        print(f"  - Comandante: {user.es_comandante}")
    else:
        print("Usuario 'victor123' no encontrado")
