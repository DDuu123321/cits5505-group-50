from flask import Blueprint, render_template
from flask import render_template, request, redirect, url_for, flash
from .forms import StudyRecordForm
from app.models import StudySession
from app import db
from datetime import datetime
from flask import jsonify
main = Blueprint('main', __name__)   # create a blueprint instead of using the app directly
@main.route('/')
def index():
    return render_template('index.html')

@main.route('/upload', methods=['GET', 'POST'])
def upload():
    form = StudyRecordForm()
    if form.validate_on_submit():
        new_session = StudySession(
            subject=form.subject.data,
            date=form.date.data,
            start_time=form.start_time.data,
            end_time=form.end_time.data,
            location=form.location.data,
            efficiency=form.efficiency.data,
            notes=form.notes.data,
            interruptions=0  # 手动输入没有 interruptions，先写默认值
        )
        db.session.add(new_session)
        db.session.commit()
        print("Saved:", new_session)


        flash('Study session saved successfully!', 'success')
        return redirect(url_for('main.upload'))
    return render_template('upload.html', form=form)

@main.route('/visualize')
def visualize():
    sessions = StudySession.query.order_by(StudySession.date.desc()).all() #对study_session这张表发起一个查询
    return render_template('visualize.html', sessions=sessions, datetime=datetime)  #传递datetime方法给模版


@main.route('/share')
def share():
    return render_template('share.html')


from flask import jsonify

@main.route('/api/analytics-data', methods=['POST'])  #定义一个新的路由/api/analytics-data，作用是接收POST请求，过滤时间返回一个符合时间范围json数据
def analytics_data():
    data = request.get_json()
    date_from = datetime.strptime(data['date_from'], '%Y-%m-%d').date()
    date_to = datetime.strptime(data['date_to'], '%Y-%m-%d').date()

    sessions = StudySession.query.filter(
        StudySession.date >= date_from,
        StudySession.date <= date_to
    ).all()

    result = []
    for s in sessions:
        duration = datetime.combine(s.date, s.end_time) - datetime.combine(s.date, s.start_time)
        result.append({
            "date": s.date.strftime('%Y-%m-%d'),
            "subject": s.subject,
            "duration": f"{duration.seconds // 3600}h {duration.seconds % 3600 // 60}m",
            "efficiency": s.efficiency,
            "location": s.location,
            "interruptions": s.interruptions
        })

    return jsonify({"sessions": result})






''' shared route definiton'''

from flask import request, render_template, redirect, url_for, flash
from app.models import SharedReport, db
import json
from flask_login import current_user, login_required

@app.route('/share', methods=['GET', 'POST'])
@login_required
def share():
    if request.method == 'POST':
        title = request.form.get('title')
        data = request.form.get('data')  # You can format or validate this

        report = SharedReport(
            title=title,
            user_id=current_user.id,
            data=json.dumps(data),
            is_public=True
        )
        db.session.add(report)
        db.session.commit()
        flash('Report shared successfully!')
        return redirect(url_for('view_shared_report', report_id=report.report_id))

    return render_template('share.html')

@app.route('/share/<report_id>')
def view_shared_report(report_id):
    report = SharedReport.query.filter_by(report_id=report_id, is_public=True).first_or_404()
    report_data = json.loads(report.data)
    return render_template('view_shared.html', report=report, data=report_data)

