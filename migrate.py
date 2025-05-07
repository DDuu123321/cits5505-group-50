from flask import Flask
from run import app
from app import db
from flask_migrate import Migrate

migrate = Migrate(app, db)

if __name__ == '__main__':
    app.run()

'''shared '''
export FLASK_APP=run.py
flask db migrate -m "Add SharedReport model"
flask db upgrade
