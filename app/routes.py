from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, abort
from app.forms import RegistrationForm, LoginForm, StudyRecordForm, SubjectForm, ReportForm
from app.models import User, StudySession, Subject, Report, DirectShare
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

@main.route('/share', methods=['GET', 'POST']) # 允许 GET 和 POST 请求
@login_required
def share():
    if request.method == 'POST':
        recipient_username = request.form.get('recipient_username')

        if not recipient_username:
            flash('Please select a user to share with.', 'warning')
            return redirect(url_for('main.share'))

        recipient = User.query.filter_by(username=recipient_username).first()

        if not recipient:
            flash('Selected user not found.', 'danger')
            return redirect(url_for('main.share'))

        if recipient.id == current_user.id:
            flash('You cannot share stats with yourself.', 'warning')
            return redirect(url_for('main.share'))

        # -- 1. Calculate the total learning time of the sharer (in minutes) --
        # According to your StudySession structure, calculate the total duration using start_time and end_time
        all_sessions_for_total = StudySession.query.filter_by(user_id=current_user.id).all()

        total_duration_seconds = 0
        for sess in all_sessions_for_total:
            # Ensure that start_time and end_time exist and are datetime.time objects, and date exists and is a datetime.date object
            # We need to combine date and time into datetime objects for calculation
            if sess.start_time and sess.end_time and sess.date:
                try:
                    # Combine date and time
                    start_dt = datetime.combine(sess.date, sess.start_time)
                    end_dt = datetime.combine(sess.date, sess.end_time)

                    session_duration = end_dt - start_dt

                    # Handle overnight sessions (if end_time is less than start_time)
                    if session_duration.total_seconds() < 0:
                         session_duration += timedelta(days=1) # Add one day time difference

                    total_duration_seconds += session_duration.total_seconds()
                except Exception as e:
                     # Print or log errors for debugging
                     print(f"Error calculating duration for session ID {sess.id}: {e}")
                     # Can choose to skip this session or handle the error as needed

        total_duration_minutes_query = total_duration_seconds // 60 # Convert total seconds to total minutes (integer)

        total_study_time_str = "0 minutes"
        if total_duration_minutes_query is not None and total_duration_minutes_query > 0:
            hours = int(total_duration_minutes_query // 60)
            minutes = int(total_duration_minutes_query % 60)
            if hours > 0:
                total_study_time_str = f"{hours} hour(s) {minutes} minute(s)"
            else:
                total_study_time_str = f"{minutes} minute(s)"
        elif total_duration_minutes_query == 0:
             total_study_time_str = "0 minutes"
        # Note: If total_duration_minutes_query is None (scalar() returns None when there are no records), the above if already handles it

        # --- 2. Calculate the longest study day and its duration ---
        # Based on your StudySession structure, calculate the total daily duration through iteration
        daily_durations_calculated = {}
        # Get all user's StudySessions, sorted by date for easier handling of overnight sessions (although the overnight handling above already covers this)
        all_sessions_for_longest = StudySession.query.filter_by(user_id=current_user.id).order_by(StudySession.date, StudySession.start_time).all()

        for sess in all_sessions_for_longest:
             if sess.start_time and sess.end_time and sess.date:
                try:
                    start_dt = datetime.combine(sess.date, sess.start_time)
                    end_dt = datetime.combine(sess.date, sess.end_time)

                    session_duration_calc = end_dt - start_dt

                    if session_duration_calc.total_seconds() < 0: # Handle overnight sessions
                        session_duration_calc += timedelta(days=1)

                    # Accumulate each day's total duration in the dictionary (in minutes)
                    # Use date as the dictionary key
                    daily_durations_calculated.setdefault(sess.date, 0)
                    daily_durations_calculated[sess.date] += session_duration_calc.total_seconds() // 60
                except Exception as e:
                    print(f"Error calculating daily duration for session ID {sess.id}: {e}")
                    # continue # Skip this session

        longest_study_day_info_str = "N/A"

        if daily_durations_calculated:
            # Find the day with the longest total duration (the key with maximum value in the dictionary)
            # Filter out days with zero duration, unless all days have zero duration
            days_with_duration = {date: duration for date, duration in daily_durations_calculated.items() if duration > 0}

            if not days_with_duration and daily_durations_calculated: # If there are records but all durations are 0
                 # Can handle specially or keep as N/A
                 pass # Keep as N/A
            elif days_with_duration:
                longest_day_date = max(days_with_duration, key=days_with_duration.get)
                longest_duration_minutes = days_with_duration[longest_day_date]

                hours = int(longest_duration_minutes // 60)
                minutes = int(longest_duration_minutes % 60)

                longest_study_day_info_str = f"{longest_day_date.strftime('%Y-%m-%d')} ({hours} hour(s) {minutes} minute(s))"


        # --- Create share record ---
        # Check if exactly the same content has already been shared with this person, to avoid duplicates (optional)
        # Note: If statistics change, a new share record will be created even for the same person
        existing_share = DirectShare.query.filter_by(
            sharer_id=current_user.id,
            recipient_id=recipient.id,
            shared_total_study_time=total_study_time_str,
            shared_longest_study_day_info=longest_study_day_info_str
        ).first()

        if existing_share:
            flash(f'You have already shared these exact stats with {recipient.username}. No new share created.', 'info')
            return redirect(url_for('main.share'))

        # Create new share record
        new_share = DirectShare(
            sharer_id=current_user.id,
            recipient_id=recipient.id,
            shared_total_study_time=total_study_time_str,
            shared_longest_study_day_info=longest_study_day_info_str
            # shared_at is handled by default=datetime.utcnow in the model
        )
        db.session.add(new_share)
        db.session.commit()

        flash(f'Successfully shared your study stats with {recipient.username}!', 'success')
        return redirect(url_for('main.share'))

    # --- Below is the GET request logic (when user visits /share page) ---

    # Get all other users for selection in the dropdown sharing menu
    all_other_users = User.query.filter(User.id != current_user.id).order_by(User.username).all()

    # Get records shared with the current user
    # Use DirectShare model and get the sharer's username through join
    received_direct_shares = db.session.query(
        DirectShare.shared_total_study_time,
        DirectShare.shared_longest_study_day_info,
        DirectShare.shared_at,
        User.username.label('sharer_username') # Get the sharer's username
    ).join(User, DirectShare.sharer_id == User.id)\
     .filter(DirectShare.recipient_id == current_user.id)\
     .order_by(DirectShare.shared_at.desc()).all()

    # Old report-related logic can be temporarily commented out or removed to simplify the page
    # my_reports = Report.query.filter_by(owner_id=current_user.id).order_by(Report.created_at.desc()).all()
    my_reports = [] # Pass an empty list because we're not currently focused on old reports

    # shared_reports = [] # This variable is no longer used in the old way
    access_error = request.args.get('access_error') # If access_code is no longer used, this can also be considered for removal

    return render_template(
        'share.html',
        title="Share Study Data",
        my_reports=my_reports,
        # shared_reports=shared_reports, # No longer needed because we use received_direct_shares
        access_error=access_error,
        all_other_users_for_sharing=all_other_users, # New: Pass user list to template
        received_direct_shares=received_direct_shares # New: Pass direct shares list to template
    )


@main.route('/edit_report/<int:report_id>', methods=['GET', 'POST'])
@login_required
def edit_report(report_id):
    """
    Edit an existing study report.
    
    This function:
    1. Retrieves the report by ID
    2. Verifies the current user is the owner
    3. Displays the report edit form
    4. Processes form submission
    5. Updates the report details and sharing permissions
    """
    # Get the report
    report = Report.query.get_or_404(report_id)
    
    # Check ownership
    if report.owner_id != current_user.id:
        flash('You do not have permission to edit this report.', 'danger')
        return redirect(url_for('main.share'))
    
    # Initialize form with report data
    form = ReportForm(user=current_user, obj=report)
    
    # Pre-populate form fields that have different names than the model
    if request.method == 'GET':
        form.date_from.data = report.start_date
        form.date_to.data = report.end_date
        form.expiry_date.data = report.expires_at
        if report.subjects:
            form.subjects.data = report.subjects.split(',')
            
        # Pre-select shared users
        current_shares = DirectShare.query.filter_by(report_id=report.id).all()
        form.share_with_users.data = [share.user_id for share in current_shares]
    
    if form.validate_on_submit():
        try:
            # Update report details
            report.title = form.title.data
            report.description = form.description.data
            report.start_date = form.date_from.data
            report.end_date = form.date_to.data
            report.subjects = ','.join(form.subjects.data) if form.subjects.data else ''
            report.permission_level = form.permission_level.data
            report.expires_at = form.expiry_date.data
            
            # Update sharing permissions
            # Remove all existing shares and add new ones
            DirectShare.query.filter_by(report_id=report.id).delete()
            
            # Add new shares from form
            if form.share_with_users.data:
                for user_id in form.share_with_users.data:
                    shared_with = DirectShare(
                        report_id=report.id,
                        user_id=user_id,
                        permission_level=form.permission_level.data
                    )
                    db.session.add(shared_with)
            
            # Handle email sharing (optional)
            if form.share_with.data:
                # Look up user by email
                email = form.share_with.data.strip()
                user = User.query.filter_by(email=email).first()
                if user and user.id != current_user.id and user.id not in form.share_with_users.data:
                    shared_with = DirectShare(
                        report_id=report.id,
                        user_id=user.id,
                        permission_level=form.permission_level.data
                    )
                    db.session.add(shared_with)
            
            db.session.commit()
            
            flash('Report updated successfully!', 'success')
            return redirect(url_for('main.share'))
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating report: {str(e)}")  
            flash(f'Error updating report: {str(e)}', 'danger')
    else:
        if request.method == 'POST':
            print("Form validation failed")
            print(form.errors)  
    
    return render_template('create_report.html', title='Edit Report', form=form, editing=True)

@main.route('/delete_report/<int:report_id>', methods=['POST'])
@login_required
def delete_report(report_id):
    """
    Delete a study report.
    
    This function:
    1. Retrieves the report by ID
    2. Verifies the current user is the owner
    3. Deletes the report and all associated shares from the database
    """
    # Get the report
    report = Report.query.get_or_404(report_id)
    
    # Check ownership
    if report.owner_id != current_user.id:
        flash('You do not have permission to delete this report.', 'danger')
        return redirect(url_for('main.share'))
    
    try:
        # Delete the report (cascade will handle removing DirectShare entries)
        db.session.delete(report)
        db.session.commit()
        
        flash('Report deleted successfully.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting report: {str(e)}', 'danger')
    
    return redirect(url_for('main.share'))

@main.route('/access_report', methods=['POST'])
def access_report():
    """
    Access a report using its access code.
    
    This function:
    1. Gets the access code from the form
    2. Tries to find a report with that code
    3. Redirects to the report view if found
    4. Shows an error message if not found or expired
    """
    access_code = request.form.get('access_code')
    
    if not access_code:
        return redirect(url_for('main.share', access_error='Please enter an access code.'))
    
    # Try to find a report with this access code
    report = Report.query.filter_by(access_code=access_code).first()
    
    if not report:
        return redirect(url_for('main.share', access_error='Invalid access code. Please check and try again.'))
    
    # Check if the report has expired
    if report.expires_at and report.expires_at < datetime.utcnow():
        return redirect(url_for('main.share', access_error='This report has expired.'))
    
    # All good, redirect to view the report
    return redirect(url_for('main.view_report', access_code=access_code))

@main.route('/report/<access_code>')
def view_report(access_code):
    """
    View a shared report using its access code.
    
    This function:
    1. Retrieves the report by access code
    2. Checks if the report has expired
    3. Verifies the current user has permission to view the report
    4. Retrieves relevant study session data
    5. Renders the report view template with visualization data
    """
    # Get the report
    report = Report.query.filter_by(access_code=access_code).first_or_404()
    
    # Check if report has expired
    if report.expires_at and report.expires_at < datetime.utcnow():
        flash('This report has expired', 'danger')
        return redirect(url_for('main.share'))
    
    # Check permission - user must be the owner or have the report shared with them
    if current_user.is_authenticated:
        has_permission = (current_user.id == report.owner_id) or \
                         (DirectShare.query.filter_by(report_id=report.id, user_id=current_user.id).first() is not None)
        
        # If user doesn't have permission and is logged in, deny access
        if not has_permission:
            flash('You do not have permission to view this report.', 'danger')
            return redirect(url_for('main.share'))
    
    # Get subject list from the report
    subject_list = report.subjects.split(',') if report.subjects else ['']
    
    # Filter study sessions based on report criteria
    sessions = StudySession.query.filter(
        StudySession.user_id == report.owner_id,
        StudySession.date >= report.start_date,
        StudySession.date <= report.end_date,
        StudySession.subject.in_(subject_list) if subject_list[0] else True
    ).all()
    
    # Process session data for display
    session_data = []
    total_hours = 0
    total_efficiency = 0
    subject_times = {}
    daily_times = {}
    location_efficiency = {}
    
    for s in sessions:
        # Calculate duration
        duration = datetime.combine(s.date, s.end_time) - datetime.combine(s.date, s.start_time)
        if duration.total_seconds() < 0:  # Handle overnight sessions
            duration += timedelta(days=1)
        
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        duration_str = f"{hours}h {minutes}m"
        
        # Update totals
        total_hours += duration.total_seconds() / 3600
        total_efficiency += s.efficiency
        
        # Track subject study time
        if s.subject in subject_times:
            subject_times[s.subject] += duration.total_seconds() / 60  # minutes
        else:
            subject_times[s.subject] = duration.total_seconds() / 60
            
        # Track daily study time
        day_str = s.date.strftime('%Y-%m-%d')
        if day_str in daily_times:
            daily_times[day_str] += duration.total_seconds() / 3600  # hours
        else:
            daily_times[day_str] = duration.total_seconds() / 3600
            
        # Track location efficiency
        if s.location in location_efficiency:
            location_efficiency[s.location].append(s.efficiency)
        else:
            location_efficiency[s.location] = [s.efficiency]
        
        # Format session for display
        session_data.append({
            'id': s.id,
            'date': s.date.strftime('%Y-%m-%d'),
            'subject': s.subject,
            'duration': duration_str,
            'efficiency': s.efficiency,
            'location': s.location,
            'notes': s.notes,
            'interruptions': 'None'  # Placeholder, could be expanded in the future
        })
    
    # Calculate averages and prepare chart data
    avg_efficiency = round(total_efficiency / len(sessions), 1) if sessions else 0
    
    # Calculate average efficiency by location
    location_avg_efficiency = {}
    for loc, ratings in location_efficiency.items():
        location_avg_efficiency[loc] = sum(ratings) / len(ratings)
    
    # Prepare chart data
    chart_data = {
        'subject_time_labels': list(subject_times.keys()),
        'subject_time_values': list(subject_times.values()),
        'daily_labels': list(daily_times.keys()),
        'daily_values': list(daily_times.values()),
        'location_labels': list(location_avg_efficiency.keys()),
        'location_values': list(location_avg_efficiency.values())
    }
    
    # Get the owner's details
    owner = User.query.get(report.owner_id)
    
    # Get comments if allowed (not implemented in this version)
    comments = []  # Placeholder for future implementation
    
    # Check the current user's permission level for this report
    can_comment = False
    if current_user.is_authenticated:
        if current_user.id == report.owner_id:
            can_comment = True
        else:
            shared = DirectShare.query.filter_by(report_id=report.id, user_id=current_user.id).first()
            if shared and shared.permission_level == 'comment':
                can_comment = True
    
    return render_template(
        'view_report.html',
        report=report,
        sessions=session_data,
        owner=owner,
        total_hours=round(total_hours, 1),
        avg_efficiency=avg_efficiency,
        subject_times=subject_times,
        daily_times=daily_times,
        location_efficiency=location_avg_efficiency,
        chart_data=chart_data,
        comments=comments,
        can_comment=can_comment
    )

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
        
        # Use parameters passed by user directly, don't check default values
        date_from_str = data.get('dateFrom')
        date_to_str = data.get('dateTo')
        
        # Convert date strings to date objects
        date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
        date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
        
        # Query this user's study sessions within the specified date range
        # Keep user ID filtering to ensure data security
        sessions = StudySession.query.filter(
            StudySession.user_id == current_user.id,
            StudySession.date >= date_from,
            StudySession.date <= date_to
        ).all()
        
        # Process session data only, don't calculate statistics
        sessions_data = []
        for session in sessions:
            # Calculate session duration
            duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
            if duration.total_seconds() < 0:  # Handle overnight sessions
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
        
        # Return session data only, don't return summary
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
