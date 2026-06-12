import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    conn = psycopg2.connect(
        host="kodama.proxy.rlwy.net",
        port="37110",
        database="railway",
        user="postgres",
        password="DJNRFtKSxkkqjrEOBZAipTIZjYRSdiZT"
    )
    cursor = conn.cursor()
    
    print("--- ALL USERS ---")
    cursor.execute("SELECT id, nom, email, role FROM utilisateur ORDER BY id ASC;")
    users = cursor.fetchall()
    for u in users:
        print(f"ID: {u[0]} | Nom: {u[1]} | Email: {u[2]} | Role: {u[3]}")

    cursor.close()
    conn.close()
except Exception as e:
    print("Error querying db:", e)
