from backend.extensions import db
from backend.models import User, Course, User_course
from app import create_app

app = create_app()

with app.app_context():
    # Buscar profesoras
    nicol = User.query.filter_by(username='Nicol').first()
    maria = User.query.filter_by(username='teacher').first()
    
    if not nicol:
        print("ERROR: Profesora Nicol no encontrada")
    if not maria:
        print("ERROR: Profesora teacher (Maria Castillo) no encontrada")
    
    if nicol and maria:
        # Obtener todas las materias
        programacion = Course.query.filter_by(name='Programación').first()
        ingles = Course.query.filter_by(name='Inglés').first()
        matematicas = Course.query.filter_by(name='Matemáticas').first()
        historia = Course.query.filter_by(name='Historia').first()
        educacion_fisica = Course.query.filter_by(name='Educación Física').first()
        
        materias = [programacion, ingles, matematicas, historia, educacion_fisica]
        
        print("\n=== ASIGNANDO PROFESORES A MATERIAS ===\n")
        
        # Asignar Nicol a Programación
        if programacion:
            # Eliminar asignaciones previas de profesores
            User_course.query.filter_by(course_id=programacion.id).filter(
                User_course.user_id.in_(
                    db.session.query(User.id).filter(User.role == 'teacher')
                )
            ).delete(synchronize_session=False)
            
            # Asignar Nicol
            asignacion = User_course.query.filter_by(user_id=nicol.id, course_id=programacion.id).first()
            if not asignacion:
                nueva_asignacion = User_course(user_id=nicol.id, course_id=programacion.id)
                db.session.add(nueva_asignacion)
            print(f"Programacion -> Profesora: {nicol.primer_nombre} {nicol.primer_apellido}")
        
        # Asignar María a las demás materias
        for materia in [ingles, matematicas, historia, educacion_fisica]:
            if materia:
                # Eliminar asignaciones previas de profesores
                User_course.query.filter_by(course_id=materia.id).filter(
                    User_course.user_id.in_(
                        db.session.query(User.id).filter(User.role == 'teacher')
                    )
                ).delete(synchronize_session=False)
                
                # Asignar María
                asignacion = User_course.query.filter_by(user_id=maria.id, course_id=materia.id).first()
                if not asignacion:
                    nueva_asignacion = User_course(user_id=maria.id, course_id=materia.id)
                    db.session.add(nueva_asignacion)
                print(f"{materia.name} -> Profesora: {maria.primer_nombre} {maria.primer_apellido}")
        
        db.session.commit()
        print("\n=== ASIGNACIONES COMPLETADAS ===")
        print(f"\n{nicol.primer_nombre} {nicol.primer_apellido}: Programacion")
        print(f"{maria.primer_nombre} {maria.primer_apellido}: Ingles, Matematicas, Historia, Educacion Fisica")
