from app import create_app, db
from app.models import User, StudySession, Subject, Report
from flask_migrate import Migrate

app = create_app()
migrate = Migrate(app, db)


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
