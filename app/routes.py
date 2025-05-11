from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from app.forms import RegistrationForm, LoginForm, StudyRecordForm, SubjectForm, ReportForm
from app.models import User, StudySession, Subject, Report
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

@main.route('/share')
@login_required
def share():
    my_reports = Report.query.filter_by(owner_id=current_user.id).all()
    return render_template('share.html', my_reports=my_reports)

@main.route('/create_report', methods=['GET', 'POST'])
@login_required
def create_report():
    form = ReportForm(user=current_user)
    if form.validate_on_submit():
        access_code = str(uuid.uuid4())[:8]
        
        new_report = Report(
            title=form.title.data,
            description=form.description.data,
            start_date=form.start_date.data,
            end_date=form.end_date.data,
            subjects=','.join(form.subjects.data),
            permission_level=form.permission_level.data,
            expires_at=form.expires_at.data,
            access_code=access_code,
            owner_id=current_user.id
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        flash('Report created successfully!', 'success')
        return redirect(url_for('main.share'))
        
    return render_template('create_report.html', title='Create Report', form=form)

@main.route('/report/<access_code>')
def view_report(access_code):
    report = Report.query.filter_by(access_code=access_code).first_or_404()
    
    # Check if report has expired
    if report.expires_at < datetime.utcnow():
        flash('This report has expired', 'danger')
        return redirect(url_for('main.index'))
        
    # Ensure correct date range is passed
    subject_list = report.subjects.split(',') if report.subjects else ['']
    
    sessions = StudySession.query.filter(
        StudySession.user_id == report.owner_id,
        StudySession.date >= report.start_date,
        StudySession.date <= report.end_date,
        StudySession.subject.in_(subject_list) if subject_list[0] else True
    ).all()
    
    session_data = []
    for s in sessions:
        duration = datetime.combine(s.date, s.end_time) - datetime.combine(s.date, s.start_time)
        if duration.total_seconds() < 0:  # Handle overnight sessions
            duration += timedelta(days=1)
            
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        
        session_data.append({
            'id': s.id,
            'date': s.date.strftime('%Y-%m-%d'),
            'duration': f"{hours}h {minutes}m",
            'efficiency': s.efficiency,
            'location': s.location,
            'notes': s.notes
        })
        
    return render_template('view_report.html', report=report, sessions=session_data)

@main.route('/profile')
@login_required
def profile():
    subjects = Subject.query.filter_by(user_id=current_user.id).all()
    sessions_count = StudySession.query.filter_by(user_id=current_user.id).count()
    
    # Calculate total study time
    sessions = StudySession.query.filter_by(user_id=current_user.id).all()
    total_seconds = 0
    
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
        subject = Subject(
            name=form.name.data,
            color_code=form.color_code.data,
            user_id=current_user.id
        )
        
        db.session.add(subject)
        db.session.commit()
        
        flash('Subject added successfully!', 'success')
        return redirect(url_for('main.profile'))
        
    return render_template('subject_form.html', title='Add Subject', form=form)

@main.route('/api/analytics-data', methods=['POST'])
@login_required
def analytics_data():
    data = request.json
    date_from = datetime.strptime(data.get('dateFrom', '2000-01-01'), '%Y-%m-%d').date()
    date_to = datetime.strptime(data.get('dateTo', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
    # Ensure date is valid
    if date_from > date_to:
        date_from, date_to = date_to, date_from
    
    # Query study sessions for this user in the specified date range
    sessions = StudySession.query.filter(
        StudySession.user_id == current_user.id,
        StudySession.date >= date_from,
        StudySession.date <= date_to
    ).all()
    
    sessions_data = []
    total_minutes = 0
    total_efficiency = 0
    subject_minutes = {}
    location_efficiency = {}
    day_minutes = {}
    for session in sessions:
        # Calculate session duration (minutes)
        duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
        if duration.total_seconds() < 0:  # Handle overnight sessions
            duration += timedelta(days=1)
        
        minutes = int(duration.total_seconds() // 60)
        total_minutes += minutes
        total_efficiency += session.efficiency
        
        # Track subject study time
        if session.subject in subject_minutes:
            subject_minutes[session.subject] += minutes
        else:
            subject_minutes[session.subject] = minutes
        
        # Track location efficiency
        if session.location in location_efficiency:
            location_efficiency[session.location].append(session.efficiency)
        else:
            location_efficiency[session.location] = [session.efficiency]
            
        # Track daily study time
        day_str = session.date.strftime('%Y-%m-%d')
        if day_str in day_minutes:
            day_minutes[day_str] += minutes
        else:
            day_minutes[day_str] = minutes
        
        # Format time display
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
    # Calculate statistics
    avg_efficiency = round(total_efficiency / len(sessions), 1) if sessions else 0
    
    # Calculate daily study time variance as a stability indicator
    day_values = list(day_minutes.values()) if day_minutes else [0]
    variance = 0
    if len(day_values) > 1:
        mean = sum(day_values) / len(day_values)
        variance = sum((x - mean) ** 2 for x in day_values) / len(day_values)
    
    return jsonify({
        'sessions': sessions_data,
        'summary': {
            'total_time': f"{total_minutes // 60}h {total_minutes % 60}m",
            'avg_efficiency': avg_efficiency,
            'study_variance': round(variance, 2),
            'subject_distribution': subject_minutes,
            'day_distribution': day_minutes
        }
    })

@main.route('/api/ai-recommendations', methods=['POST'])
@login_required
def ai_recommendations():
    """Use Gemini API to generate intelligent recommendations based on study data"""
    # Get data sent from frontend
    data = request.json
    subject_distribution = data.get('subjectDistribution', {})
    time_location_data = data.get('timeLocationData', {})
    
    if not subject_distribution or not time_location_data:
        return jsonify({
            "recommendations": []
        })
    
    try:
        # Get API key
        api_key = "AIzaSyC9XgtjAb_dx2ORw78gjSMuu8CkTrx14cM"  # Direct API key setting
            
        # Prepare prompt for Gemini
        prompt = f"""
        As an AI study coach, analyze this data and provide 3-4 specific, actionable recommendations to improve study efficiency.
        
        Study subject distribution (in minutes):
        {json.dumps(subject_distribution)}
        
        Study time-location efficiency data:
        Time slots: {json.dumps(time_location_data.get('timeSlots', []))}
        Locations: {json.dumps(time_location_data.get('locations', []))}
        Data points (sample of up to 10):
        {json.dumps(time_location_data.get('dataPoints', [])[:10])}
        
        For each recommendation, provide:
        1. A short, clear title (1-5 words)
        2. A detailed explanation with actionable advice (1-3 sentences)
        3. An appropriate Font Awesome icon class from this list: fa-clock, fa-map-marker-alt, fa-hourglass-half, fa-calendar-check, fa-balance-scale, fa-lightbulb, fa-brain
        
        Format your response as a JSON array of objects like this:
        [
          {{
            "title": "Example Title",
            "description": "Example detailed description with advice.",
            "icon": "fa-example-icon"
          }}
        ]
        
        Ensure your response is valid JSON and nothing else.
        """
        
        # Gemini API URL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        
        # Call Gemini API
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
        
        # Process response
        if response.status_code != 200:
            print(f"Gemini API error: {response.status_code}, {response.text}")
            return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_data.get('dataPoints', []))})
            
        response_data = response.json()
        
        # Ensure response format is correct
        if 'candidates' not in response_data or not response_data['candidates']:
            print("Gemini API returned no candidates")
            return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_data.get('dataPoints', []))})
            
        response_text = response_data['candidates'][0]['content']['parts'][0]['text']
        
        # Extract JSON part
        import re
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            try:
                recommendations = json.loads(json_match.group())
                if recommendations and isinstance(recommendations, list):
                    # Validate each recommendation format
                    validated_recommendations = []
                    for rec in recommendations:
                        if isinstance(rec, dict) and 'title' in rec and 'description' in rec:
                            validated_rec = {
                                "title": rec.get("title", "Study Tip"),
                                "description": rec.get("description", "Continue maintaining good study habits."),
                                "icon": rec.get("icon", "fa-lightbulb")
                            }
                            validated_recommendations.append(validated_rec)
                    
                    return jsonify({"recommendations": validated_recommendations})
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from API response: {e}")
        
        # If unable to extract valid recommendations from the response, return fallback recommendations
        return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_data.get('dataPoints', []))})
            
    except Exception as e:
        import traceback
        print(f"AI recommendations error: {str(e)}")
        print(traceback.format_exc())
        # Exception handling, return fallback recommendations
        return jsonify({"recommendations": generate_fallback_recommendations(subject_distribution, time_location_data.get('dataPoints', []))})

def generate_fallback_recommendations(subject_distribution, data_points):
    """Generate fallback recommendations when API is unavailable or returns invalid data"""
    recommendations = []
    
    # Add general study advice
    recommendations.append({
        "title": "Establish Study Routine",
        "description": "Research shows that having regular study habits leads to better learning outcomes. Try to study at the same time each day, even if for shorter periods, as this is more effective than irregular longer sessions.",
        "icon": "fa-calendar-check"
    })
    
    # Add location advice
    location_efficiency = {}
    for point in data_points:
        location = point.get('location')
        if location:
            if location not in location_efficiency:
                location_efficiency[location] = {"total": 0, "count": 0}
            location_efficiency[location]["total"] += point.get('efficiency', 0)
            location_efficiency[location]["count"] += 1
    
    # Find highest efficiency location
    best_location = None
    best_avg = 0
    for loc, data in location_efficiency.items():
        if data["count"] >= 3:  # At least 3 data points
            avg = data["total"] / data["count"]
            if avg > best_avg:
                best_avg = avg
                best_location = loc
    
    if best_location:
        recommendations.append({
            "title": "Optimal Study Environment",
            "description": f"Your study efficiency is highest at {best_location} (average rating: {best_avg:.1f}/5). Consider studying more frequently in this environment.",
            "icon": "fa-map-marker-alt"
        })
    
    # Add time management advice
    time_efficiency = {}
    for point in data_points:
        time_slot = point.get('timeSlot')
        if time_slot:
            if time_slot not in time_efficiency:
                time_efficiency[time_slot] = {"total": 0, "count": 0}
            time_efficiency[time_slot]["total"] += point.get('efficiency', 0)
            time_efficiency[time_slot]["count"] += 1
    
    # Find highest efficiency time slot
    best_time = None
    best_time_avg = 0
    for time, data in time_efficiency.items():
        if data["count"] >= 2:  # At least 2 data points
            avg = data["total"] / data["count"]
            if avg > best_time_avg:
                best_time_avg = avg
                best_time = time
    
    if best_time:
        recommendations.append({
            "title": "Optimal Study Time",
            "description": f"Your study efficiency is highest during {best_time} (average rating: {best_time_avg:.1f}/5). Try to schedule important study tasks during this time period.",
            "icon": "fa-clock"
        })
    
    # Add subject balance advice
    if len(subject_distribution) >= 2:
        recommendations.append({
            "title": "Balance Study Subjects",
            "description": "When studying multiple subjects, use interleaving technique to improve efficiency. Try focusing on one subject for 25 minutes, take a short break, then switch to another subject. This approach keeps your brain active.",
            "icon": "fa-balance-scale"
        })
    
    return recommendations
