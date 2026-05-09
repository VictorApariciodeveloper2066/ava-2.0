"""
Seed script for UNIFA career data - Semester 5
Creates career, subjects, professors, and sections with schedules
"""

from backend.extensions import db
from backend.models import (
    User, Institucion, Carrera, Asignatura, 
    PeriodoAcademico, Seccion
)
from datetime import time, date


def seed_unifa_data(app):
    """
    Seed database with UNIFA career data for semester 5.
    """
    with app.app_context():
        print('[SEED] Iniciando seed de datos UNIFA...')
        
        # 1. Create or get Institution
        institucion = Institucion.query.filter_by(nombre='UNIFA').first()
        if not institucion:
            institucion = Institucion(
                nombre='UNIFA',
                codigo='UNIFA',
                activo=True
            )
            db.session.add(institucion)
            db.session.flush()
            print('[OK] Institucion creada: ' + institucion.nombre)
        else:
            print('[INFO] Institucion ya existe: ' + institucion.nombre)
        
        # 2. Create or get Career
        carrera = Carrera.query.filter_by(
            institucion_id=institucion.id,
            codigo='SIS'
        ).first()
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
            print('[OK] Carrera creada: ' + carrera.nombre)
        else:
            print('[INFO] Carrera ya existe: ' + carrera.nombre)
        
        # 3. Create Period (1-2026)
        periodo = PeriodoAcademico.query.filter_by(
            institucion_id=institucion.id,
            nombre='1-2026'
        ).first()
        if not periodo:
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
            print('[OK] Periodo creado: ' + periodo.nombre)
        else:
            print('[INFO] Periodo ya existe: ' + periodo.nombre)
        
        # 4. Create subjects for semester 5
        subjects_data = [
            {
                'codigo': 'SYC-32514',
                'nombre': 'Analisis de Sistemas',
                'semestre': 5,
                'uv': 4,
                'secciones': [
                    {
                        'profesor': 'Jackmary Henriquez',
                        'horarios': [
                            (1, '10:00', '12:15'),  # Lunes
                            (2, '13:45', '16:00'),  # Martes
                        ]
                    }
                ]
            },
            {
                'codigo': 'SYC-32614',
                'nombre': 'Bases de Datos',
                'semestre': 5,
                'uv': 4,
                'secciones': [
                    {
                        'profesor': 'Jackmary Henriquez',
                        'horarios': [
                            (1, '12:15', '13:45'),  # Lunes
                            (2, '16:00', '16:45'),  # Martes
                            (3, '14:30', '16:00'),  # Miercoles
                        ]
                    }
                ]
            },
            {
                'codigo': 'ELN-30514',
                'nombre': 'Circuitos Logicos',
                'semestre': 5,
                'uv': 4,
                'secciones': [
                    {
                        'profesor': 'Niurka Cedeno',
                        'horarios': [
                            (3, '17:30', '22:00'),  # Miercoles
                        ]
                    }
                ]
            },
            {
                'codigo': 'DIN-31153',
                'nombre': 'Defensa Int. de la Nacion V',
                'semestre': 5,
                'uv': 3,
                'secciones': [
                    {
                        'profesor': 'William Lopez',
                        'horarios': [
                            (1, '07:00', '07:45'),  # Lunes
                            (2, '10:00', '12:15'),  # Martes
                        ]
                    }
                ]
            },
            {
                'codigo': 'MAT-30925',
                'nombre': 'Inv. de Operaciones',
                'semestre': 5,
                'uv': 5,
                'secciones': [
                    {
                        'profesor': 'Siuri Blanco',
                        'horarios': [
                            (1, '12:15', '13:00'),  # Lunes
                            (3, '16:00', '17:30'),  # Miercoles
                            (4, '12:15', '17:30'),  # Jueves
                        ]
                    }
                ]
            },
            {
                'codigo': 'SYC-32235',
                'nombre': 'Lenguajes Programacion II',
                'semestre': 5,
                'uv': 5,
                'secciones': [
                    {
                        'profesor': 'Eduardo Rivero',
                        'horarios': [
                            (1, '13:00', '13:45'),  # Lunes
                            (2, '13:45', '15:15'),  # Martes
                            (3, '13:45', '14:30'),  # Miercoles
                        ]
                    }
                ]
            },
            {
                'codigo': 'MAT-31104',
                'nombre': 'Teoria de Grafos',
                'semestre': 5,
                'uv': 4,
                'secciones': [
                    {
                        'profesor': 'Darwin Perez',
                        'horarios': [
                            (3, '17:30', '21:15'),  # Miercoles
                        ]
                    }
                ]
            },
            {
                'codigo': 'ADG-10820',
                'nombre': 'Catedra Bolivariana I',
                'semestre': 5,
                'uv': 2,
                'secciones': [
                    {
                        'profesor': 'William Lopez',
                        'horarios': [
                            (3, '16:45', '17:30'),  # Miercoles
                            (4, '16:45', '17:30'),  # Jueves
                        ]
                    }
                ]
            },
        ]
        
        day_names = ['', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
        
        # Process each subject
        for subj_data in subjects_data:
            # Check if subject exists
            asignatura = Asignatura.query.filter_by(
                carrera_id=carrera.id,
                codigo=subj_data['codigo']
            ).first()
            
            if not asignatura:
                asignatura = Asignatura(
                    carrera_id=carrera.id,
                    codigo=subj_data['codigo'],
                    nombre=subj_data['nombre'],
                    semestre=subj_data['semestre'],
                    uv=subj_data['uv'],
                    activo=True
                )
                db.session.add(asignatura)
                db.session.flush()
                print('[OK] Asignatura creada: ' + asignatura.nombre)
            else:
                print('[INFO] Asignatura ya existe: ' + asignatura.nombre)
            
            # Create secciones
            for sec_idx, sec_data in enumerate(subj_data['secciones'], 1):
                # Get or create professor
                profesor_nombre = sec_data['profesor']
                nombre_parts = profesor_nombre.split()
                primer_nombre = nombre_parts[0] if nombre_parts else ''
                primer_apellido = nombre_parts[1] if len(nombre_parts) > 1 else ''
                
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
                    print('[OK] Profesor creado: ' + profesor_nombre)
                
                # Create secciones for each schedule
                for horario_idx, (dia, start_str, end_str) in enumerate(sec_data['horarios'], 1):
                    # Generate seccion code
                    seccion_code = subj_data['codigo'] + '-' + str(sec_idx) + str(horario_idx)
                    
                    # Check if seccion exists
                    seccion = Seccion.query.filter_by(
                        codigo=seccion_code
                    ).first()
                    
                    if not seccion:
                        # Parse times
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
                        db.session.flush()
                        
                        print('[OK] Seccion creada: ' + seccion_code + ' - ' + day_names[dia] + ' ' + start_str + '-' + end_str)
                    else:
                        print('[INFO] Seccion ya existe: ' + seccion_code)
        
        # Commit all changes
        db.session.commit()
        print('')
        print('[DONE] Seed completado exitosamente!')
        print('   Carrera: ' + carrera.nombre)
        print('   Periodo: ' + periodo.nombre)
        print('   Asignaturas semestre 5: ' + str(len(subjects_data)))


if __name__ == '__main__':
    import sys
    from pathlib import Path
    
    # Add parent directory to path
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    from app import create_app
    
    app = create_app()
    seed_unifa_data(app)
