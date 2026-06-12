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
    
    print("--- REFRESH TOKEN ID SEQUENCE ---")
    cursor.execute("SELECT pg_get_serial_sequence('refresh_token', 'id');")
    seq_name = cursor.fetchone()[0]
    print("Sequence name:", seq_name)

    if seq_name:
        cursor.execute(f"SELECT last_value, is_called FROM {seq_name};")
        val = cursor.fetchone()
        print(f"Last value: {val[0]} | Is called: {val[1]}")
        
        cursor.execute("SELECT MAX(id) FROM refresh_token;")
        max_id = cursor.fetchone()[0]
        print(f"Max ID in table: {max_id}")

    cursor.close()
    conn.close()
except Exception as e:
    print("Error querying db:", e)
