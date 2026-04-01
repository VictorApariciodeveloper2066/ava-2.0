"""
Reset UNIFA data - Complete re-creation of secciones with corrected schedules
Deletes all secciones and inscripciones, recreates with new data
"""

from backend.extensions import db
from backend.models import (
    User, Institucion, Carrera, Asignatura, 
    PeriodoAcademico, Seccion, Inscripcion
)
from datetime import time


def reset_unifa_data(app):
    """
    Reset and recreate all UNIFA semester 5 data with corrected schedules.
    """
    with app.app_context():
        print('[RESET] Iniciando reset de datos UNIFA...')
        
        # 1. Delete all inscripciones
        inscripciones = Inscripcion.query.all()
        for insc in inscripciones:
            db.session.delete(insc)
        print('[DEL] Eliminadas ' + str(len(inscripciones)) + ' inscripciones')
        
        # 2. Delete all secciones
        secciones = Seccion.query.all()
        for sec in secciones:
            db.session.delete(sec)
        print('[DEL] Eliminadas ' + str(len(secciones)) + ' secciones')
        
        db.session.commit()
        print('[OK] Base de datos limpiada')
        
        # 3. Get or create Institution
        institucion = Institucion.query.filter_by(nombre='UNIFA').first()
        if not institucion:
            institucion = Institucion(nombre='UNIFA', codigo='UNIFA', activo=True)
            db.session.add(institucion)
            db.session.flush()
            print('[OK] Institucion creada')
        
        # 4. Get or create Career
        carrera = Carrera.query.filter_by(institucion_id=institucion.id, codigo='SIS').first()
        if not carrera:
            carrera = Carrera(
                institucion_id=institucion.id,
                nombre='Ingenieria en Sistemas',
                codigo='SIS',
                duracion_semestres=10,
                activo=True
            )
            db.session.add(carrera)
            db.session.flush()
            print('[OK] Carrera creada')
        
        # 5. Get Period
        periodo = PeriodoAcademico.query.filter_by(es_actual=True, activo=True).first()
        if not periodo:
            periodo = PeriodoAcademico.query.filter_by(activo=True).first()
        if not periodo:
            from datetime import date
            periodo = PeriodoAcademico(
                institucion_id=institucion.id,
                nombre='1-2026',
                fecha_inicio=date(2026, 1, 15),
                fecha_fin=date(2026, 7, 15),
                activo=True,
                es_actual=True
            )
            db.session.add(periodo)
            db.session.flush()
        print('[OK] Periodo: ' + periodo.nombre)
        
        # 6. Define subjects with schedules and professors
        subjects_data = [
            {
                'codigo': 'SYC-32514',
                'nombre': 'Analisis de Sistemas',
                'semestre': 5,
                'uv': 4,
                'profesor': 'Jackmary Del Valle Henriquez Ramos',
                'horarios': [
                    (4, '10:00', '12:15'),  # Jue
                    (1, '13:45', '16:00'),  # Lun
                ]
            },
            {
                'codigo': 'SYC-32614',
                'nombre': 'Bases de Datos',
                'semestre': 5,
                'uv': 4,
                'profesor': 'Jackmary Del Valle Henriquez Ramos',
                'horarios': [
                    (3, '12:15', '16:45'),  # Mie
                ]
            },
            {
                'codigo': 'ELN-30514',
                'nombre': 'Circuitos Logicos',
                'semestre': 5,
                'uv': 4,
                'profesor': 'Niurka Isabel Cedeno Yepez',
                'horarios': [
                    (2, '17:30', '22:00'),  # Mar
                ]
            },
            {
                'codigo': 'DIN-31153',
                'nombre': 'Defensa Integral de la Nacion V',
                'semestre': 5,
                'uv': 3,
                'profesor': 'William Alejandro Lopez Garcia',
                'horarios': [
                    (5, '07:00', '07:45'),  # Vie
                    (5, '10:00', '12:15'),  # Vie
                ]
            },
            {
                'codigo': 'MAT-30925',
                'nombre': 'Investigacion de Operaciones',
                'semestre': 5,
                'uv': 5,
                'profesor': 'Siuri Sujey Blanco Romero',
                'horarios': [
                    (3, '12:15', '13:00'),  # Mie
                    (4, '13:00', '17:30'),  # Jue
                ]
            },
            {
                'codigo': 'SYC-32235',
                'nombre': 'Lenguajes de Programacion II',
                'semestre': 5,
                'uv': 5,
                'profesor': 'Eduardo Jose Rivero',
                'horarios': [
                    (2, '13:00', '15:15'),  # Mar
                ]
            },
            {
                'codigo': 'MAT-31104',
                'nombre': 'Teoria de Grafos',
                'semestre': 5,
                'uv': 4,
                'profesor': 'Darwin Jesus Perez Echeverria',
                'horarios': [
                    (1, '17:30', '22:00'),  # Lun
                ]
            },
            {
                'codigo': 'ADG-10820',
                'nombre': 'Catedra Bolivariana I',
                'semestre': 5,
                'uv': 2,
                'profesor': 'William Alejandro Lopez Garcia',
                'horarios': [
                    (1, '16:45', '17:30'),  # Lun
                    (2, '16:45', '17:30'),  # Mar
                ]
            },
        ]
        
        day_names = ['', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
        
        # 7. Process each subject
        for subj in subjects_data:
            # Get or create asignatura
            asignatura = Asignatura.query.filter_by(
                carrera_id=carrera.id,
                codigo=subj['codigo']
            ).first()
            
            if not asignatura:
                asignatura = Asignatura(
                    carrera_id=carrera.id,
                    codigo=subj['codigo'],
                    nombre=subj['nombre'],
                    semestre=subj['semestre'],
                    uv=subj['uv'],
                    activo=True
                )
                db.session.add(asignatura)
                db.session.flush()
                print('[OK] Asignatura: ' + asignatura.nombre)
            else:
                print('[INFO] Asignatura existe: ' + asignatura.nombre)
            
            # Get or create professor
            nombre_parts = subj['profesor'].split()
            primer_nombre = nombre_parts[0] if nombre_parts else ''
            segundo_nombre = nombre_parts[1] if len(nombre_parts) > 3 else ''
            primer_apellido = nombre_parts[-2] if len(nombre_parts) > 1 else ''
            segundo_apellido = nombre_parts[-1] if len(nombre_parts) > 2 else ''
            
            profesor = User.query.filter(
                User.primer_nombre == primer_nombre,
                User.primer_apellido == primer_apellido
            ).first()
            
            if not profesor:
                username = primer_nombre.lower() + '.' + primer_apellido.lower()
                profesor = User(
                    username=username,
                    email=username + '@unifa.edu.ve',
                    primer_nombre=primer_nombre,
                    primer_apellido=primer_apellido,
                    role='profesor',
                    activo=True
                )
                profesor.set_password('profesor123')
                db.session.add(profesor)
                db.session.flush()
                print('[OK] Profesor: ' + subj['profesor'])
            
            # Create secciones for each schedule
            for idx, (dia, start_str, end_str) in enumerate(subj['horarios'], 1):
                seccion_code = subj['codigo'] + '-' + str(idx)
                
                start_parts = start_str.split(':')
                end_parts = end_str.split(':')
                start_time = time(int(start_parts[0]), int(start_parts[1]))
                end_time = time(int(end_parts[0]), int(end_parts[1]))
                
                seccion = Seccion(
                    codigo=seccion_code,
                    asignatura_id=asignatura.id,
                    periodo_id=periodo.id,
                    profesor_id=profesor.id,
                    aula='Por asignar',
                    dia=dia,
                    start_time=start_time,
                    end_time=end_time,
                    capacidad=30,
                    activo=True
                )
                db.session.add(seccion)
                print('   [ADD] ' + seccion_code + ': ' + day_names[dia] + ' ' + start_str + '-' + end_str)
        
        # 8. Commit all changes
        db.session.commit()
        print('')
        print('[DONE] Reset completado exitosamente!')
        print('   Institucion: ' + institucion.nombre)
        print('   Carrera: ' + carrera.nombre)
        print('   Periodo: ' + periodo.nombre)
        print('   Asignaturas: 8')
        print('   Secciones: 12')


if __name__ == '__main__':
    import sys
    from pathlib import Path
    
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    from app import create_app
    
    app = create_app()
    reset_unifa_data(app)
