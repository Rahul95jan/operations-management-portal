from database import engine

try:
    conn = engine.connect()
    print("Connected to Neon Successfully!")
    conn.close()
except Exception as e:
    print("Error:", e)