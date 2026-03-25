from backend.extensions import db
from backend.models import User, Course, User_course
from app import create_app

app = create_app()

alumnos_data = [
    {"username": "jperez", "email": "juan.perez@gmail.com", "primer_nombre": "Juan", "primer_apellido": "Pérez", "ci": "12345678", "password": "juan2024"},
    {"username": "mgomez", "email": "maria.gomez@gmail.com", "primer_nombre": "María", "primer_apellido": "Gómez", "ci": "23456789", "password": "maria2024"},
    {"username": "crodriguez", "email": "carlos.rodriguez@gmail.com", "primer_nombre": "Carlos", "primer_apellido": "Rodríguez", "ci": "34567890", "password": "carlos2024"},
    {"username": "amartinez", "email": "ana.martinez@gmail.com", "primer_nombre": "Ana", "primer_apellido": "Martínez", "ci": "45678901", "password": "ana2024"},
    {"username": "lgarcia", "email": "luis.garcia@gmail.com", "primer_nombre": "Luis", "primer_apellido": "García", "ci": "56789012", "password": "luis2024"},
    {"username": "shernandez", "email": "sofia.hernandez@gmail.com", "primer_nombre": "Sofía", "primer_apellido": "Hernández", "ci": "67890123", "password": "sofia2024"},
    {"username": "dlopez", "email": "diego.lopez@gmail.com", "primer_nombre": "Diego", "primer_apellido": "López", "ci": "78901234", "password": "diego2024"},
    {"username": "vfernandez", "email": "valentina.fernandez@gmail.com", "primer_nombre": "Valentina", "primer_apellido": "Fernández", "ci": "89012345", "password": "valentina2024"},
    {"username": "mdiaz", "email": "miguel.diaz@gmail.com", "primer_nombre": "Miguel", "primer_apellido": "Díaz", "ci": "90123456", "password": "miguel2024"},
    {"username": "cruiz", "email": "camila.ruiz@gmail.com", "primer_nombre": "Camila", "primer_apellido": "Ruiz", "ci": "01234567", "password": "camila2024"},
    {"username": "jtorres", "email": "jorge.torres@gmail.com", "primer_nombre": "Jorge", "primer_apellido": "Torres", "ci": "11234567", "password": "jorge2024"},
    {"username": "lsanchez", "email": "laura.sanchez@gmail.com", "primer_nombre": "Laura", "primer_apellido": "Sánchez", "ci": "21234567", "password": "laura2024"},
    {"username": "aramirez", "email": "andres.ramirez@gmail.com", "primer_nombre": "Andrés", "primer_apellido": "Ramírez", "ci": "31234567", "password": "andres2024"},
    {"username": "pcastillo", "email": "paula.castillo@gmail.com", "primer_nombre": "Paula", "primer_apellido": "Castillo", "ci": "41234567", "password": "paula2024"},
    {"username": "rmorales", "email": "ricardo.morales@gmail.com", "primer_nombre": "Ricardo", "primer_apellido": "Morales", "ci": "51234567", "password": "ricardo2024"},
    {"username": "ivargas", "email": "isabella.vargas@gmail.com", "primer_nombre": "Isabella", "primer_apellido": "Vargas", "ci": "61234567", "password": "isabella2024"},
    {"username": "fjimenez", "email": "fernando.jimenez@gmail.com", "primer_nombre": "Fernando", "primer_apellido": "Jiménez", "ci": "71234567", "password": "fernando2024"},
    {"username": "mreyes", "email": "mariana.reyes@gmail.com", "primer_nombre": "Mariana", "primer_apellido": "Reyes", "ci": "81234567", "password": "mariana2024"},
    {"username": "pmoreno", "email": "pablo.moreno@gmail.com", "primer_nombre": "Pablo", "primer_apellido": "Moreno", "ci": "91234567", "password": "pablo2024"},
    {"username": "aortiz", "email": "andrea.ortiz@gmail.com", "primer_nombre": "Andrea", "primer_apellido": "Ortiz", "ci": "10234567", "password": "andrea2024"},
    {"username": "snavarro", "email": "sebastian.navarro@gmail.com", "primer_nombre": "Sebastián", "primer_apellido": "Navarro", "ci": "12034567", "password": "sebastian2024"},
    {"username": "nromero", "email": "natalia.romero@gmail.com", "primer_nombre": "Natalia", "primer_apellido": "Romero", "ci": "12304567", "password": "natalia2024"},
    {"username": "ggutierrez", "email": "gabriel.gutierrez@gmail.com", "primer_nombre": "Gabriel", "primer_apellido": "Gutiérrez", "ci": "12340567", "password": "gabriel2024"},
    {"username": "dsilva", "email": "daniela.silva@gmail.com", "primer_nombre": "Daniela", "primer_apellido": "Silva", "ci": "12345067", "password": "daniela2024"},
    {"username": "jmendez", "email": "javier.mendez@gmail.com", "primer_nombre": "Javier", "primer_apellido": "Méndez", "ci": "12345607", "password": "javier2024"},
    {"username": "vcastro", "email": "victoria.castro@gmail.com", "primer_nombre": "Victoria", "primer_apellido": "Castro", "ci": "12345670", "password": "victoria2024"},
    {"username": "mrivera", "email": "mateo.rivera@gmail.com", "primer_nombre": "Mateo", "primer_apellido": "Rivera", "ci": "22345678", "password": "mateo2024"},
    {"username": "eflores", "email": "emilia.flores@gmail.com", "primer_nombre": "Emilia", "primer_apellido": "Flores", "ci": "32345678", "password": "emilia2024"},
    {"username": "dchavez", "email": "daniel.chavez@gmail.com", "primer_nombre": "Daniel", "primer_apellido": "Chávez", "ci": "42345678", "password": "daniel2024"},
    {"username": "rmedina", "email": "renata.medina@gmail.com", "primer_nombre": "Renata", "primer_apellido": "Medina", "ci": "52345678", "password": "renata2024"}
]

with app.app_context():
    # Obtener todas las materias
    materias = Course.query.all()
    
    print("=== CREANDO 30 ALUMNOS ===\n")
    print("CREDENCIALES DE ACCESO:")
    print("-" * 60)
    
    for alumno_data in alumnos_data:
        # Verificar si ya existe
        existe = User.query.filter_by(username=alumno_data["username"]).first()
        if existe:
            print(f"✓ {alumno_data['username']} ya existe")
            continue
        
        # Crear usuario
        nuevo_alumno = User(
            username=alumno_data["username"],
            email=alumno_data["email"],
            primer_nombre=alumno_data["primer_nombre"],
            primer_apellido=alumno_data["primer_apellido"],
            ci=alumno_data["ci"],
            role="student",
            career="Ingeniería en Sistemas",
            es_comandante=False
        )
        nuevo_alumno.set_password(alumno_data["password"])
        db.session.add(nuevo_alumno)
        db.session.flush()
        
        # Inscribir en todas las materias
        for materia in materias:
            inscripcion = User_course(user_id=nuevo_alumno.id, course_id=materia.id)
            db.session.add(inscripcion)
        
        print(f"Usuario: {alumno_data['username']:15} | Contraseña: {alumno_data['password']:15} | Email: {alumno_data['email']}")
    
    db.session.commit()
    print("-" * 60)
    print(f"\n✓ {len(alumnos_data)} alumnos creados exitosamente")
    print(f"✓ Todos inscritos en {len(materias)} materias")
    print("\nPuedes usar cualquiera de estas credenciales para iniciar sesión.")
