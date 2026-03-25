from app import app, db
from backend.models import User, Course

with app.app_context():
    # Crear todas las tablas
    db.create_all()
    print("✅ Tablas creadas")
    
    # Verificar si ya existen datos
    if User.query.first():
        print("⚠️ La base de datos ya tiene datos")
    else:
        # Crear usuario admin
        admin = User(username='admin', email='admin@ava.com')
        admin.set_password('admin123')
        admin.role = 'teacher'
        admin.primer_nombre = 'Administrador'
        admin.primer_apellido = 'Sistema'
        admin.ci = '0000000000'
        admin.career = 'Profesor'
        db.session.add(admin)
        
        # Crear materias básicas
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
        print("✅ Datos iniciales creados")
        print("📧 Usuario: admin@ava.com")
        print("🔑 Contraseña: admin123")
