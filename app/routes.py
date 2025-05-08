from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, abort, current_app
from flask_login import login_user, current_user, logout_user, login_required
from app import db, bcrypt # app is the Flask application instance or package containing db, bcrypt
from app.models import User, StudySession, Subject, Interruption, SharePermission, SharedReport
from app.forms import (
    RegistrationForm, LoginForm, StudyRecordForm,
    SubjectForm, InterruptionForm, ShareReportForm
)
from datetime import datetime, timedelta, date, time as dt_time # rename time to dt_time to avoid conflict
import secrets # for generating secure random strings (like access_code)
import random # for generating random color codes

main = Blueprint('main', __name__) # create blueprint

# ==============================================================================
# 1. Core/Auth Routes
#    - Home page (displays different content based on login status)
#    - User registration
#    - User login
#    - User logout
# ==============================================================================

@main.route('/', methods=['GET', 'POST'])
@main.route('/index', methods=['GET', 'POST'])
def index():
    """
    Home page route.
    If user is logged in, display dashboard (dashboard.html).
    If user is not logged in, display home page with login form (index.html).
    """
    if current_user.is_authenticated: # check if user is logged in
        today = datetime.utcnow().date()
        week_start = today - timedelta(days=today.weekday()) # get first day of week (Monday)
        
        # Query current user's study records for this week
        weekly_sessions = StudySession.query.filter(
            StudySession.user_id == current_user.id,
            StudySession.date >= week_start,
            StudySession.date <= today
        ).all()

        total_weekly_time = 0 # initialize total weekly study time (seconds)
        for session in weekly_sessions:
            # Ensure session.date is date type, session.start_time and session.end_time are time type
            if isinstance(session.date, date) and isinstance(session.start_time, dt_time) and isinstance(session.end_time, dt_time):
                try:
                    start_dt = datetime.combine(session.date, session.start_time) # combine date and time
                    end_dt = datetime.combine(session.date, session.end_time)
                    duration = end_dt - start_dt # calculate duration
                    if duration.total_seconds() < 0: # handle overnight sessions
                        duration += timedelta(hours=24)
                    total_weekly_time += duration.total_seconds()
                except TypeError:
                    # Theoretically shouldn't happen after type checking, but as a backup
                    pass # or log error
            
        total_weekly_time_hours = round(total_weekly_time / 3600, 1) # convert seconds to hours, round to 1 decimal place

        # Get 5 most recent study records
        recent_sessions = StudySession.query.filter_by(user_id=current_user.id).order_by(StudySession.date.desc(), StudySession.start_time.desc()).limit(5).all()
        # Get all subjects for the user
        subjects = Subject.query.filter_by(user_id=current_user.id).all()

        return render_template(
            'dashboard.html', # render dashboard template
            title='Dashboard',
            recent_sessions=recent_sessions,
            subjects=subjects,
            total_weekly_time=total_weekly_time_hours,
            datetime=datetime, # pass datetime object to template
            timedelta=timedelta # pass timedelta object to template
        )

    # If user is not logged in, display login form
    form = LoginForm()
    if form.validate_on_submit(): # if form is submitted and validated
        user = User.query.filter_by(email=form.email.data).first() # query user by email
        if user and bcrypt.check_password_hash(user.password_hash, form.password.data): # check if user exists and password is correct
            login_user(user, remember=form.remember.data) # login user
            next_page = request.args.get('next') # get redirect parameter
            flash(f'Welcome back, {user.username}!', 'success') # display welcome message
            return redirect(next_page) if next_page else redirect(url_for('main.index')) # redirect to target page or home page
        else:
            flash('Login failed. Please check your email and password.', 'danger') # display error message
    return render_template('index.html', title='Home', form=form) # render home page template (with login/register options)

@main.route('/register', methods=['GET', 'POST'])
def register():
    """
    User registration route.
    If user is logged in, redirect to home page.
    Otherwise, handle registration form submission.
    """
    if current_user.is_authenticated:
        return redirect(url_for('main.index')) # redirect logged in users to home page
    
    form = RegistrationForm() # create registration form instance
    if form.validate_on_submit(): # if form is submitted and validated
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8') # encrypt password
        user = User(username=form.username.data, email=form.email.data, password_hash=hashed_password) # create user object
        db.session.add(user)
        db.session.commit() # commit user to database to get user.id

        # Add default subjects for new user
        default_subjects_data = [
            {'name': 'Mathematics', 'color_code': '#FF6384', 'target_hours': 5.0},
            {'name': 'Computer Science', 'color_code': '#36A2EB', 'target_hours': 5.0},
            {'name': 'Physics', 'color_code': '#FFCE56', 'target_hours': 5.0},
        ]
        for subject_data in default_subjects_data:
            subject = Subject(
                name=subject_data['name'],
                color_code=subject_data['color_code'],
                target_hours_per_week=subject_data['target_hours'],
                user_id=user.id # associate with newly created user
            )
            db.session.add(subject)
        db.session.commit() # commit default subjects

        flash('Your account has been successfully created! You can now log in.', 'success') # display success message
        return redirect(url_for('main.login')) # redirect to login page
    return render_template('register.html', title='Register', form=form) # render registration page template

@main.route('/login', methods=['GET', 'POST'])
def login():
    """
    User login route.
    If user is logged in, redirect to home page.
    Otherwise, handle login form submission.
    """
    if current_user.is_authenticated:
        return redirect(url_for('main.index')) # redirect logged in users to home page
    
    form = LoginForm() # create login form instance
    if form.validate_on_submit(): # if form is submitted and validated
        user = User.query.filter_by(email=form.email.data).first() # query user by email
        if user and bcrypt.check_password_hash(user.password_hash, form.password.data): # check if user exists and password is correct
            login_user(user, remember=form.remember.data) # login user
            next_page = request.args.get('next') # get redirect parameter
            flash(f'Welcome back, {user.username}!', 'success') # display welcome message
            return redirect(next_page) if next_page else redirect(url_for('main.index')) # redirect to target page or home page
        else:
            flash('Login failed. Please check your email and password.', 'danger') # display error message
    return render_template('login.html', title='Login', form=form) # render login page template

@main.route('/logout')
def logout():
    """
    User logout route.
    """
    logout_user() # logout user
    flash('You have been successfully logged out.', 'info') # display logout message
    return redirect(url_for('main.index')) # redirect to home page