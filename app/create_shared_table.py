import sqlite3
import os

db_path = 'instance/site.db'

if not os.path.exists(db_path):
    print(f"Error: Database file {db_path} not found.")
    exit(1)

print(f"Connecting to database: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='shared_with'")
table_exists = cursor.fetchone()

if table_exists:
    print("Table 'shared_with' already exists.")
else:
    print("Creating 'shared_with' table...")
    
    cursor.execute('''
    CREATE TABLE shared_with (
        id INTEGER NOT NULL PRIMARY KEY,
        report_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        shared_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        permission_level VARCHAR(20) DEFAULT 'view',
        FOREIGN KEY(report_id) REFERENCES report(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES user(id)
    )
    ''')
    
    cursor.execute('''
    CREATE INDEX idx_report_user ON shared_with(report_id, user_id)
    ''')
    
    print("Table and index created successfully.")

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("\nCurrent tables in database:")
for table in tables:
    print(f"- {table[0]}")

conn.commit()
conn.close()
print("\nDatabase connection closed.")