"""
Script para gestionar inscripciones de estudiantes en materias
"""
from app import create_app
from backend.extensions import db
from backend.models.models import User, Course, User_course

app = create_app()

def listar_estudiantes():
    """Muestra todos los estudiantes"""
    estudiantes = User.query.filter_by(role='student').all()
    print("\n=== ESTUDIANTES ===")
    for e in estudiantes:
        print(f"ID: {e.id} | {e.primer_nombre} {e.primer_apellido} | CI: {e.ci}")
    return estudiantes

def listar_materias():
    """Muestra todas las materias"""
    materias = Course.query.all()
    print("\n=== MATERIAS ===")
    for m in materias:
        print(f"ID: {m.id} | {m.name}")
    return materias

def ver_inscripciones(course_id):
    """Muestra estudiantes inscritos en una materia"""
    materia = Course.query.get(course_id)
    if not materia:
        print("Materia no encontrada")
        return
    
    inscritos = db.session.query(User).join(User_course).filter(
        User_course.course_id == course_id,
        User.role == 'student'
    ).all()
    
    print(f"\n=== ESTUDIANTES EN {materia.name} ===")
    if inscritos:
        for e in inscritos:
            print(f"ID: {e.id} | {e.primer_nombre} {e.primer_apellido} | CI: {e.ci}")
    else:
        print("No hay estudiantes inscritos")

def inscribir_estudiante(user_id, course_id):
    """Inscribe un estudiante en una materia"""
    # Verificar que existe el estudiante
    estudiante = User.query.filter_by(id=user_id, role='student').first()
    if not estudiante:
        print("Estudiante no encontrado")
        return False
    
    # Verificar que existe la materia
    materia = Course.query.get(course_id)
    if not materia:
        print("Materia no encontrada")
        return False
    
    # Verificar si ya está inscrito
    existe = User_course.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existe:
        print(f"{estudiante.primer_nombre} ya está inscrito en {materia.name}")
        return False
    
    # Crear inscripción
    inscripcion = User_course(user_id=user_id, course_id=course_id)
    db.session.add(inscripcion)
    db.session.commit()
    print(f"✓ {estudiante.primer_nombre} {estudiante.primer_apellido} inscrito en {materia.name}")
    return True

def inscribir_multiples(user_ids, course_id):
    """Inscribe múltiples estudiantes en una materia"""
    for user_id in user_ids:
        inscribir_estudiante(user_id, course_id)

def menu():
    """Menú interactivo"""
    with app.app_context():
        while True:
            print("\n" + "="*50)
            print("GESTIÓN DE INSCRIPCIONES")
            print("="*50)
            print("1. Ver todos los estudiantes")
            print("2. Ver todas las materias")
            print("3. Ver estudiantes inscritos en una materia")
            print("4. Inscribir un estudiante en una materia")
            print("5. Inscribir múltiples estudiantes en una materia")
            print("0. Salir")
            
            opcion = input("\nSeleccione una opción: ").strip()
            
            if opcion == "1":
                listar_estudiantes()
            
            elif opcion == "2":
                listar_materias()
            
            elif opcion == "3":
                listar_materias()
                course_id = input("\nID de la materia: ").strip()
                if course_id.isdigit():
                    ver_inscripciones(int(course_id))
            
            elif opcion == "4":
                listar_estudiantes()
                user_id = input("\nID del estudiante: ").strip()
                listar_materias()
                course_id = input("\nID de la materia: ").strip()
                if user_id.isdigit() and course_id.isdigit():
                    inscribir_estudiante(int(user_id), int(course_id))
            
            elif opcion == "5":
                listar_estudiantes()
                user_ids = input("\nIDs de estudiantes (separados por coma): ").strip()
                listar_materias()
                course_id = input("\nID de la materia: ").strip()
                if course_id.isdigit():
                    ids = [int(x.strip()) for x in user_ids.split(",") if x.strip().isdigit()]
                    inscribir_multiples(ids, int(course_id))
            
            elif opcion == "0":
                print("Saliendo...")
                break

if __name__ == "__main__":
    menu()
