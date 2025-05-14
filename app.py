
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from flask_migrate import Migrate

#from models import db, SharedReport, StudyGroup, GroupMember


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///share.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

class SharedReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, nullable=False, default=1)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    subjects = db.Column(db.String(256))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    shared_with = db.Column(db.String(256))
    permission = db.Column(db.String(50))
    expiry_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
class StudyGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)  # ✅ Add this
    owner_id = db.Column(db.Integer, nullable=False)


class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('study_group.id'), nullable=False)
    email = db.Column(db.String(120), nullable=False)


@app.route('/share')
def share():
    return render_template('share.html')

@app.route('/api/my-reports')
def get_my_reports():
    reports = SharedReport.query.filter_by(user_id=1).order_by(SharedReport.created_at.desc()).all()
    return jsonify([{
        "title": r.title,
        "description": r.description,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for r in reports])

@app.route('/share/create', methods=['POST'])
def create_report():
    data = request.get_json()
    try:
        report = SharedReport(
            title=data.get('title'),
            description=data.get('description'),
            subjects=','.join(data.get('subjects', [])),
            start_date=datetime.strptime(data.get('startDate'), '%Y-%m-%d') if data.get('startDate') else None,
            end_date=datetime.strptime(data.get('endDate'), '%Y-%m-%d') if data.get('endDate') else None,
            shared_with=','.join(data.get('emails', [])),
            permission=data.get('permission'),
            expiry_date=datetime.strptime(data.get('expiryDate'), '%Y-%m-%d') if data.get('expiryDate') else None,
            user_id=1
        )
        db.session.add(report)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)


@app.route('/group/create', methods=['POST'])
def create_group():
    data = request.get_json()
    group = StudyGroup(name=data['name'], owner_id=1)
    db.session.add(group)
    db.session.commit()
    return jsonify({"success": True, "group_id": group.id})

@app.route('/group/<int:group_id>/add-member', methods=['POST'])
def add_member(group_id):
    data = request.get_json()
    member = GroupMember(group_id=group_id, email=data['email'])
    db.session.add(member)
    db.session.commit()
    return jsonify({"success": True})
@app.route('/group/<int:group_id>/members')
def get_group_members(group_id):
    members = GroupMember.query.filter_by(group_id=group_id).all()
    return jsonify([m.email for m in members])

@app.route('/api/groups')
def list_groups():
    groups = StudyGroup.query.all()
    data = []
    for group in groups:
        members = [m.email for m in GroupMember.query.filter_by(group_id=group.id).all()]
        data.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "members": members
        })
    return jsonify(data)