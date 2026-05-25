import sqlite3
conn = sqlite3.connect('instance/farmshield.db')
conn.execute('UPDATE user SET name="Swathi" WHERE email="swathi@gmail.com"')
conn.execute('UPDATE user SET name="Sawthi" WHERE email="sawthi@gmail.com"')
conn.commit()
conn.close()
