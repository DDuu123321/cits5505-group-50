from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()  # ✅ 提前定义

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'super-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)  # ✅ 先初始化数据库

    # ✅ 再导入蓝图和模型，避免循环导入
    from app.routes import main
    from app.models import StudySession

    app.register_blueprint(main)

    return app


__all__ = ['create_app', 'db']
