import smtplib
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="e:/My folder/project/backend/.env")

username = os.getenv("MAIL_USERNAME")
password = os.getenv("MAIL_PASSWORD")

try:
    print(f"Trying to login with {username} and password {password}")
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(username, password)
    print("Login successful!")
    server.quit()
except Exception as e:
    print(f"Login failed: {e}")
    
    # Try without spaces
    try:
        print("Trying without spaces...")
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(username, password.replace(" ", ""))
        print("Login without spaces successful!")
        server.quit()
    except Exception as e2:
        print(f"Login without spaces failed: {e2}")
