from backend.extensions import db
from backend.models import User, Asistencia, DetalleAsistencia
from app import create_app

app = create_app()

with app.app_context():
    # Buscar a Juan Pérez
    juan = User.query.filter_by(username='jperez').first()
    
    if juan:
        print(f"Usuario encontrado: {juan.username} - {juan.primer_nombre} {juan.primer_apellido}")
        print(f"Role actual: {juan.role}")
        
        # Cambiar a estudiante
        juan.role = 'student'
        juan.career = 'Ingeniería en Sistemas'
        
        # Eliminar registros de asistencia (profesores no deben tener asistencia)
        asistencias = Asistencia.query.filter_by(user_id=juan.id).all()
        for asistencia in asistencias:
            db.session.delete(asistencia)
        print(f"Eliminados {len(asistencias)} registros de asistencia")
        
        # Eliminar detalles de asistencia en historiales
        detalles = DetalleAsistencia.query.filter_by(user_id=juan.id).all()
        for detalle in detalles:
            db.session.delete(detalle)
        print(f"Eliminados {len(detalles)} detalles de historial")
        
        db.session.commit()
        
        print(f"\n✓ Juan Pérez ahora es estudiante")
        print(f"✓ Role: {juan.role}")
        print(f"✓ Carrera: {juan.career}")
        print(f"✓ Registros de asistencia eliminados")
    else:
        print("Usuario jperez no encontrado")
