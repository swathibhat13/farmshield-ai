from app import app, db, User, bcrypt

with app.app_context():
    user = User.query.filter_by(email='swathi@gmail.com').first()
    if user:
        user.password = bcrypt.generate_password_hash('123456789').decode('utf-8')
        db.session.commit()
        print("Password updated successfully for swathi@gmail.com")
    else:
        print("User not found")
