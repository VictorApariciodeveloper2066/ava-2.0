"""
Update schedules for semester 5 subjects
Only updates secciones (time slots), keeps all other data intact
"""

from backend.extensions import db
from backend.models import (
    User, Institucion, Carrera, Asignatura, 
    PeriodoAcademico, Seccion
)
from datetime import time


def update_schedules(app):
    """
    Update subject schedules in the database.
    Only modifies secciones, keeps everything else.
    """
    with app.app_context():
        print('[UPDATE] Iniciando actualizacion de horarios...')
        
        # Define new schedules: {codigo: [(dia, start, end), ...]}
        new_schedules = {
            'SYC-32514': [  # Analisis de Sistemas
                (1, '13:45', '16:00'),  # Lun
                (4, '10:00', '12:15'),  # Jue
            ],
            'SYC-32614': [  # Bases de Datos
                (3, '12:15', '16:45'),  # Mie
            ],
            'ELN-30514': [  # Circuitos Logicos
                (2, '17:30', '22:00'),  # Mar
            ],
            'DIN-31153': [  # Defensa Int.
                (5, '07:00', '07:45'),  # Vie
                (5, '10:00', '12:15'),  # Vie
            ],
            'MAT-30925': [  # Inv. de Operaciones
                (3, '12:15', '13:00'),  # Mie
                (4, '13:00', '17:30'),  # Jue
            ],
            'SYC-32235': [  # Lenguajes Prog. II
                (2, '13:00', '15:15'),  # Mar
            ],
            'MAT-31104': [  # Teoria de Grafos
                (1, '17:30', '22:00'),  # Lun
            ],
            'ADG-10820': [  # Catedra Bolivariana
                (1, '16:45', '17:30'),  # Lun
                (2, '16:45', '17:30'),  # Mar
            ],
        }
        
        day_names = ['', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
        
        # Get period
        periodo = PeriodoAcademico.query.filter_by(es_actual=True, activo=True).first()
        if not periodo:
            print('[ERROR] No hay periodo academico activo')
            return
        
        print('[INFO] Periodo: ' + periodo.nombre)
        
        # Process each subject
        for codigo, horarios in new_schedules.items():
            # Find asignatura
            asignatura = Asignatura.query.filter_by(codigo=codigo).first()
            if not asignatura:
                print('[WARN] Asignatura no encontrada: ' + codigo)
                continue
            
            print('[OK] Procesando: ' + asignatura.nombre)
            
            # Delete existing secciones for this asignatura in this period
            existing = Seccion.query.filter_by(
                asignatura_id=asignatura.id,
                periodo_id=periodo.id
            ).all()
            
            for seccion in existing:
                db.session.delete(seccion)
            
            if existing:
                print('   [DEL] Eliminadas ' + str(len(existing)) + ' secciones viejas')
            
            # Get professor from existing secciones (if any)
            profesor_id = None
            if existing:
                profesor_id = existing[0].profesor_id
            
            # Create new secciones
            for idx, (dia, start_str, end_str) in enumerate(horarios, 1):
                # Generate code
                seccion_code = codigo + '-' + str(idx)
                
                # Parse times
                start_parts = start_str.split(':')
                end_parts = end_str.split(':')
                start_time = time(int(start_parts[0]), int(start_parts[1]))
                end_time = time(int(end_parts[0]), int(end_parts[1]))
                
                # Create seccion
                seccion = Seccion(
                    codigo=seccion_code,
                    asignatura_id=asignatura.id,
                    periodo_id=periodo.id,
                    profesor_id=profesor_id,
                    aula='Por asignar',
                    dia=dia,
                    start_time=start_time,
                    end_time=end_time,
                    capacidad=30,
                    activo=True
                )
                db.session.add(seccion)
                print('   [ADD] ' + seccion_code + ': ' + day_names[dia] + ' ' + start_str + '-' + end_str)
        
        # Commit all changes
        db.session.commit()
        print('')
        print('[DONE] Horarios actualizados exitosamente!')


if __name__ == '__main__':
    import sys
    from pathlib import Path
    
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    
    from app import create_app
    
    app = create_app()
    update_schedules(app)
