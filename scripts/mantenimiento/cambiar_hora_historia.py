from backend.extensions import db
from backend.models import Course
from app import create_app
from datetime import time

app = create_app()

with app.app_context():
    historia = Course.query.filter_by(name='Historia').first()
    
    if historia:
        historia.start_time = time(10, 0)
        db.session.commit()
        print(f"Materia '{historia.name}' actualizada")
        print(f"  - Hora inicio: {historia.start_time.strftime('%H:%M')}")
        print(f"  - Hora fin: {historia.end_time.strftime('%H:%M')}")
    else:
        print("Materia 'Historia' no encontrada")
