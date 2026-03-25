import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os

# PostgreSQL URL de Render
PG_URL = os.getenv('DATABASE_URL', 'postgresql://ava_db_msbk_user:xGottcmEVjrP4y7WFihYfQaHNODATEn2@dpg-d66bh9rh46gs73dqlcdg-a.oregon-postgres.render.com/ava_db_msbk')

# Conectar a SQLite
sqlite_conn = sqlite3.connect('instance/users.db')
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

# Conectar a PostgreSQL
pg_conn = psycopg2.connect(PG_URL)
pg_cur = pg_conn.cursor()

print("Migrando datos de SQLite a PostgreSQL...")

# Limpiar tablas en orden correcto (respetando foreign keys)
print("Limpiando base de datos PostgreSQL...")
pg_cur.execute("TRUNCATE TABLE log_asistencia, historial_asistencia, justificativo, asistencia, user_course, course, \"user\" RESTART IDENTITY CASCADE")
pg_conn.commit()
print("Base de datos limpiada")

# Migrar User
print("Migrando usuarios...")
sqlite_cur.execute("SELECT * FROM user")
users = [dict(row) for row in sqlite_cur.fetchall()]
if users:
    # Convertir booleanos
    for u in users:
        if 'es_comandante' in u:
            u['es_comandante'] = bool(u['es_comandante'])
        if 'notificaciones_activas' in u:
            u['notificaciones_activas'] = bool(u['notificaciones_activas'])
    cols = list(users[0].keys())
    query = f"INSERT INTO \"user\" ({','.join(cols)}) VALUES %s"
    execute_values(pg_cur, query, [tuple(u.values()) for u in users])
    print(f"{len(users)} usuarios migrados")

# Migrar Course
print("Migrando materias...")
sqlite_cur.execute("SELECT * FROM course")
courses = [dict(row) for row in sqlite_cur.fetchall()]
if courses:
    cols = courses[0].keys()
    query = f"INSERT INTO course ({','.join(cols)}) VALUES %s ON CONFLICT (id) DO NOTHING"
    execute_values(pg_cur, query, [tuple(c.values()) for c in courses])
    print(f"{len(courses)} materias migradas")

# Migrar User_course
print("Migrando inscripciones...")
sqlite_cur.execute("SELECT * FROM user_course")
enrollments = [dict(row) for row in sqlite_cur.fetchall()]
if enrollments:
    # Filtrar inscripciones con user_id o course_id inexistentes
    valid_user_ids = {u['id'] for u in users}
    valid_course_ids = {c['id'] for c in courses}
    enrollments = [e for e in enrollments if e['user_id'] in valid_user_ids and e['course_id'] in valid_course_ids]
    
    if enrollments:
        cols = enrollments[0].keys()
        query = f"INSERT INTO user_course ({','.join(cols)}) VALUES %s"
        execute_values(pg_cur, query, [tuple(e.values()) for e in enrollments])
        print(f"{len(enrollments)} inscripciones migradas")
    else:
        print("0 inscripciones validas")

# Migrar Asistencia
print("Migrando asistencias...")
sqlite_cur.execute("SELECT * FROM asistencia")
attendances = [dict(row) for row in sqlite_cur.fetchall()]
if attendances:
    valid_user_ids = {u['id'] for u in users}
    valid_course_ids = {c['id'] for c in courses}
    attendances = [a for a in attendances if a['user_id'] in valid_user_ids and a['course_id'] in valid_course_ids]
    
    if attendances:
        cols = attendances[0].keys()
        query = f"INSERT INTO asistencia ({','.join(cols)}) VALUES %s"
        execute_values(pg_cur, query, [tuple(a.values()) for a in attendances])
        print(f"{len(attendances)} asistencias migradas")
    else:
        print("0 asistencias validas")

# Migrar Justificativo
print("Migrando justificativos...")
sqlite_cur.execute("SELECT * FROM justificativo")
justificativos = [dict(row) for row in sqlite_cur.fetchall()]
if justificativos:
    valid_user_ids = {u['id'] for u in users}
    valid_course_ids = {c['id'] for c in courses}
    justificativos = [j for j in justificativos if j['user_id'] in valid_user_ids and j['course_id'] in valid_course_ids]
    
    if justificativos:
        cols = justificativos[0].keys()
        query = f"INSERT INTO justificativo ({','.join(cols)}) VALUES %s"
        execute_values(pg_cur, query, [tuple(j.values()) for j in justificativos])
        print(f"{len(justificativos)} justificativos migrados")
    else:
        print("0 justificativos validos")

# Migrar HistorialAsistencia
print("Migrando historial...")
sqlite_cur.execute("SELECT * FROM historial_asistencia")
historiales = [dict(row) for row in sqlite_cur.fetchall()]
if historiales:
    valid_course_ids = {c['id'] for c in courses}
    historiales = [h for h in historiales if h['course_id'] in valid_course_ids]
    
    if historiales:
        cols = historiales[0].keys()
        query = f"INSERT INTO historial_asistencia ({','.join(cols)}) VALUES %s"
        execute_values(pg_cur, query, [tuple(h.values()) for h in historiales])
        print(f"{len(historiales)} historiales migrados")
    else:
        print("0 historiales validos")

# Migrar LogAsistencia
print("Migrando logs...")
sqlite_cur.execute("SELECT * FROM log_asistencia")
logs = [dict(row) for row in sqlite_cur.fetchall()]
if logs:
    valid_course_ids = {c['id'] for c in courses}
    valid_user_ids = {u['id'] for u in users}
    logs = [l for l in logs if l['course_id'] in valid_course_ids and (l['user_id'] is None or l['user_id'] in valid_user_ids) and (l['modificado_por'] is None or l['modificado_por'] in valid_user_ids)]
    
    if logs:
        cols = logs[0].keys()
        query = f"INSERT INTO log_asistencia ({','.join(cols)}) VALUES %s"
        execute_values(pg_cur, query, [tuple(l.values()) for l in logs])
        print(f"{len(logs)} logs migrados")
    else:
        print("0 logs validos")

pg_conn.commit()
pg_cur.close()
pg_conn.close()
sqlite_cur.close()
sqlite_conn.close()

print("\nMigracion completada exitosamente!")
