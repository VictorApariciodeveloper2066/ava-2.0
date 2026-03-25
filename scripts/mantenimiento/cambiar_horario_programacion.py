from backend.extensions import db
from backend.models import Course
from app import create_app
from datetime import time

app = create_app()

with app.app_context():
    programacion = Course.query.filter_by(name='Programación').first()
    
    if programacion:
        print(f"Materia: {programacion.name}")
        print(f"Horario actual: {programacion.start_time} - {programacion.end_time}")
        
        programacion.start_time = time(9, 0)  # 9:00 AM
        programacion.end_time = time(20, 0)   # 8:00 PM
        
        db.session.commit()
        
        print(f"Nuevo horario: {programacion.start_time} - {programacion.end_time}")
        print("Horario actualizado correctamente")
    else:
        print("Materia Programación no encontrada")
