from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, abort
from app.forms import RegistrationForm, LoginForm, StudyRecordForm, SubjectForm, ReportForm
from app.models import User, StudySession, Subject, Report, SharedWith
from flask_login import login_user, current_user, logout_user, login_required
from datetime import datetime, timedelta
from app import db, bcrypt
import uuid
import requests
import json

main = Blueprint('main', __name__)

@main.route('/')
def index():
    form = LoginForm()
    return render_template('index.html', form=form)

@main.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
        
    form = RegistrationForm()    
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(username=form.username.data, email=form.email.data, password=hashed_password)
        db.session.add(user)
        db.session.flush()  # Ensure user.id is available
        
        # Add default subjects
        default_subjects = [
            {'name': 'Mathematics', 'color_code': '#ff6384'},
            {'name': 'Computer Science', 'color_code': '#36a2eb'},
            {'name': 'Physics', 'color_code': '#ffcd56'},
            {'name': 'Literature', 'color_code': '#9966ff'}
        ]
        
        for subject_data in default_subjects:
            subject = Subject(
                name=subject_data['name'],
                color_code=subject_data['color_code'],
                user_id=user.id
            )
            db.session.add(subject)
        
        db.session.commit()
        flash('Your account has been created! You are now able to log in', 'success')
        return redirect(url_for('main.login'))
        
    return render_template('register.html', title='Register', form=form)

@main.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
        
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.dashboard'))
        else:
            flash('Login failed. Please check your email and password.', 'danger')
            
    return render_template('login.html', title='Login', form=form)
    
@main.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))

@main.route('/dashboard')
@login_required
def dashboard():
    recent_sessions = StudySession.query.filter_by(user_id=current_user.id).order_by(StudySession.date.desc()).limit(5).all()
    subjects = Subject.query.filter_by(user_id=current_user.id).all()
    # Calculate weekly study time
    today = datetime.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    weekly_sessions = StudySession.query.filter(
        StudySession.user_id==current_user.id,
        StudySession.date >= start_of_week
    ).all()
    total_weekly_time = 0  # Initialize with 0
    for session in weekly_sessions:
        duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
        if duration.total_seconds() < 0:  # Handle overnight sessions
            duration += timedelta(days=1)
        total_weekly_time += duration.total_seconds() / 3600  # Convert to hours
    
    return render_template(
        'dashboard.html', 
        title='Dashboard',
        recent_sessions=recent_sessions,
        subjects=subjects,
        weekly_time=round(total_weekly_time, 1),        
        total_weekly_time=total_weekly_time if total_weekly_time is not None else 0,  # Ensure this variable is passed to the template
        datetime=datetime,
        timedelta=timedelta
    )

@main.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    form = StudyRecordForm(user=current_user)
    # Process AJAX request (JSON data)
    if request.is_json:
        try:
            data = request.get_json()
            # Validate data
            if not data.get('subject_id') or not data.get('location'):
                return jsonify({'error': 'Missing required fields'}), 400
                
            # Get subject
            subject = Subject.query.filter_by(id=data['subject_id'], user_id=current_user.id).first()
            if not subject:
                return jsonify({'error': 'Invalid subject'}), 400
                
            # Parse duration
            duration_str = data.get('duration', '0h 0m')
            hours = int(duration_str.split('h')[0])
            minutes = int(duration_str.split(' ')[1].replace('m', ''))
            
            # Calculate start and end times
            now = datetime.now()
            start_time = (now - timedelta(hours=hours, minutes=minutes)).time()
            end_time = now.time()
            # Get efficiency rating (default to 5)
            efficiency = int(data.get('efficiency', 5))
            # Ensure efficiency rating is in valid range
            if efficiency < 1 or efficiency > 5:
                efficiency = 5
            
            # Create new session
            new_session = StudySession(
                subject=subject.name,
                date=now.date(),
                start_time=start_time,
                end_time=end_time,
                location=data['location'],
                efficiency=efficiency,  # Use user-provided efficiency rating
                notes=data.get('notes', "Recorded using timer"),
                user_id=current_user.id
            )
            
            # Save to database
            db.session.add(new_session)
            db.session.commit()
            
            return jsonify({'message': 'Study session saved successfully!'}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error saving timer session: {str(e)}")
            return jsonify({'error': str(e)}), 500
    # Process regular form submission
    if form.validate_on_submit():
        try:
            # Debug output
            print("Form validated successfully")
            
            new_session = StudySession(
                subject=form.subject.data,
                date=form.date.data,
                start_time=form.start_time.data,
                end_time=form.end_time.data,
                location=form.location.data,
                efficiency=int(form.efficiency.data),                
                notes=form.notes.data,
                user_id=current_user.id
            )
            db.session.add(new_session)
            db.session.commit()
            flash('Study record saved successfully!', 'success')
            return redirect(url_for('main.upload'))        
        except Exception as e:
            db.session.rollback()
            flash(f'Error saving data: {str(e)}', 'danger')
            print(f"Error saving session: {e}")  # Debug output
    elif request.method == 'POST':
        print("Form validation failed")  # Debug output
        print(form.errors)  # Output form errors
    
    # Get recent study records
    recent_sessions = StudySession.query.filter_by(user_id=current_user.id).order_by(StudySession.date.desc()).limit(5).all()
    
    # Process session data for display in the table
    session_data = []
    for session in recent_sessions:
        # Calculate duration
        duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
        if duration.total_seconds() < 0:  # Handle overnight sessions
            duration += timedelta(days=1)
        
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        
        session_data.append({
            'id': session.id,
            'date': session.date.strftime('%Y-%m-%d'),
            'subject': session.subject,
            'duration': f"{hours}h {minutes}m",
            'efficiency': session.efficiency,
            'location': session.location,
            'notes': session.notes
        })
    
    subjects = Subject.query.filter_by(user_id=current_user.id).all()
    return render_template(
        'upload.html',
        form=form,
        recent_sessions=session_data,
        subjects=subjects,
        datetime=datetime,
        timedelta=timedelta
    )

@main.route('/visualize')
@login_required
def visualize():
    # Filter data by user ID
    sessions = StudySession.query.filter_by(user_id=current_user.id).order_by(StudySession.date.desc()).all()
    
    return render_template('visualize.html', sessions=sessions, datetime=datetime)


@main.route('/profile')
@login_required
def profile():
    subjects = Subject.query.filter_by(user_id=current_user.id).all()
    sessions_count = StudySession.query.filter_by(user_id=current_user.id).count()
    
    # Calculate total study time
    sessions = StudySession.query.filter_by(user_id=current_user.id).all()
    total_seconds = 0
    total_study_time = 0  # 初始化为0，确保即使没有会话也有默认值
    
    if sessions:  # 只有在有会话时才计算
        for session in sessions:
            duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
            if duration.total_seconds() < 0:
                duration += timedelta(days=1)
            total_seconds += duration.total_seconds()
        total_study_time = total_seconds // 3600  # Convert to hours
    
    return render_template(
        'profile.html', 
        title='Profile',
        subjects=subjects,
        sessions_count=sessions_count,
        total_study_time=total_study_time
    )

@main.route('/add_subject', methods=['GET', 'POST'])
@login_required
def add_subject():
    form = SubjectForm()
    
    if form.validate_on_submit():
        try:
            target_hours = float(form.target_hours_per_week.data)
            subject = Subject(
                name=form.name.data,
                color_code=form.color_code.data,
                target_hours_per_week=target_hours,
                user_id=current_user.id
            )
            
            db.session.add(subject)
            db.session.commit()
            
            flash('Subject added successfully!', 'success')
            return redirect(url_for('main.profile'))
        except ValueError as e:
            flash(f'Error saving subject: Invalid number format for target hours', 'danger')
        except Exception as e:
            flash(f'Error saving subject: {str(e)}', 'danger')
    
    return render_template('subject_form.html', title='Add Subject', form=form)

@main.route('/api/analytics-data', methods=['POST'])
@login_required
def analytics_data():
    try:
        data = request.json or {}
        
        # 直接使用用户传入的日期参数，不检查默认值
        date_from_str = data.get('dateFrom')
        date_to_str = data.get('dateTo')
        
        # 转换日期字符串为日期对象
        date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
        date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
        
        # 查询此用户在指定日期范围内的学习会话
        # 保留用户ID过滤，确保数据安全
        sessions = StudySession.query.filter(
            StudySession.user_id == current_user.id,
            StudySession.date >= date_from,
            StudySession.date <= date_to
        ).all()
        
        # 只处理会话数据，不计算统计信息
        sessions_data = []
        for session in sessions:
            # 计算会话时长
            duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
            if duration.total_seconds() < 0:  # 处理跨夜会话
                duration += timedelta(days=1)
            
            minutes = int(duration.total_seconds() // 60)
            hours = int(minutes // 60)
            mins = minutes % 60
            
            sessions_data.append({
                'id': session.id,
                'subject': session.subject,
                'date': session.date.strftime('%Y-%m-%d'),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'location': session.location,
                'efficiency': session.efficiency,
                'notes': session.notes,
                'duration': f"{hours}h {mins}m",
                'minutes': minutes,
                'hour_of_day': session.start_time.hour
            })
        
        # 只返回会话数据，不返回summary
        return jsonify({
            'sessions': sessions_data
        })
    except Exception as e:
        print(f"Analytics data error: {str(e)}")
        return jsonify({
            'error': str(e),
            'sessions': []
        })

@main.route('/api/ai-recommendations', methods=['POST'])
@login_required
def ai_recommendations():
    """Use Gemini API to generate intelligent recommendations based on study data"""

    data = request.json
    subject_distribution = data.get('subjectDistribution', {})
    time_location_map = data.get('timeLocationMap', {})

    if not subject_distribution or not time_location_map:
        return jsonify({"recommendations": []})

    try:
        # Set your Gemini API key
        api_key = "AIzaSyC9XgtjAb_dx2ORw78gjSMuu8CkTrx14cM"

        # Prepare prompt for Gemini
        prompt = f"""
As an AI study coach, analyze this student's data and provide 4 highly specific, personalized recommendations. Focus on the following key areas:

SUBJECT TIME DISTRIBUTION (minutes spent on each subject):
{json.dumps(subject_distribution)}

TIME-LOCATION EFFICIENCY MAP (avg. efficiency per time slot and location):
{json.dumps(time_location_map)}

Please provide PRECISE recommendations on:
1. OPTIMAL STUDY LOCATION & TIME: Based on efficiency data, identify the exact location and time period where the student performs best.
2. SUBJECT BALANCE: Identify which subjects receive too little study time. Suggest specific time redistributions.
3. LOCATION OPTIMIZATION: Recommend location changes for specific subjects.
4. TIME SLOT UTILIZATION: Suggest how to use the most productive time slots for hard subjects.

For each recommendation, provide:
- a concise title (3-5 words)
- a clear explanation (2-3 sentences)
- a Font Awesome icon (choose from: fa-clock, fa-map-marker-alt, fa-book, fa-calendar-check, fa-lightbulb, fa-brain, fa-balance-scale)

Respond ONLY with a valid JSON array, like:
[
  {{
    "title": "Study Physics at Library",
    "description": "Your efficiency for Physics increases to 4.8/5 at the Library. Schedule your most challenging topics during Afternoon sessions there.",
    "icon": "fa-map-marker-alt"
  }}
]
"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

        response = requests.post(
            url,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "topP": 0.8,
                    "topK": 40
                }
            },
            timeout=15
        )

        if response.status_code != 200:
            print(f"Gemini API error: {response.status_code}, {response.text}")
            return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_map)})

        response_data = response.json()
        if 'candidates' not in response_data or not response_data['candidates']:
            print("Gemini API returned no candidates")
            return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_map)})

        response_text = response_data['candidates'][0]['content']['parts'][0]['text']

        # Try extracting JSON from Gemini response
        import re
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            try:
                recommendations = json.loads(json_match.group())
                if isinstance(recommendations, list):
                    validated = []
                    for rec in recommendations:
                        if isinstance(rec, dict) and 'title' in rec and 'description' in rec:
                            validated.append({
                                "title": rec.get("title", "Study Tip"),
                                "description": rec.get("description", "Continue maintaining good study habits."),
                                "icon": rec.get("icon", "fa-lightbulb")
                            })
                    return jsonify({"recommendations": validated})
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")

        # fallback if JSON parsing fails
        return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_map)})

    except Exception as e:
        import traceback
        print(f"AI recommendations error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_map)})


# Helper function for generating unique access codes for reports
def generate_unique_access_code():
    """Generate a unique access code for reports"""
    while True:
        code = str(uuid.uuid4())[:8]  # Take first 8 chars of a UUID
        # Check if code already exists
        existing = Report.query.filter_by(access_code=code).first()
        if not existing:
            return code
