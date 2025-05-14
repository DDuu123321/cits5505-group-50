from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField, SelectField, DateField, TimeField, SelectMultipleField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, Regexp
from app.models import User, Subject

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=8, message='Password must be at least 8 characters long'),
        Regexp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)',
               message='Password must contain at least one lowercase letter, one uppercase letter, and one number')
    ])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Sign Up')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('This username is already taken. Please choose a different one.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('This email is already registered. Please choose a different one.')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class StudyRecordForm(FlaskForm):
    subject = SelectField('Subject', validators=[DataRequired()])
    date = DateField('Date', format='%Y-%m-%d', validators=[DataRequired()])
    start_time = TimeField('Start Time', format='%H:%M', validators=[DataRequired()])
    end_time = TimeField('End Time', format='%H:%M', validators=[DataRequired()])    
    location = StringField('Location', validators=[DataRequired()])
    efficiency = SelectField('Efficiency Rating', choices=[
        ('5', '5 - Excellent'),
        ('4', '4 - Good'),
        ('3', '3 - Average'),
        ('2', '2 - Below Average'),
        ('1', '1 - Poor')
    ], validators=[DataRequired()])
    notes = TextAreaField('Notes')
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(StudyRecordForm, self).__init__(*args, **kwargs)
        if user:
            self.subject.choices = [(subject.name, subject.name) for subject in Subject.query.filter_by(user_id=user.id).all()]

class SubjectForm(FlaskForm):
    name = StringField('Subject Name', validators=[DataRequired(), Length(max=100)])
    color_code = StringField('Color Code', default='#3498db', validators=[DataRequired()])
    target_hours_per_week = StringField('Target Hours Per Week', default='5.0', validators=[
        DataRequired(),
        Regexp(r'^\d+(\.\d{1,2})?$', message='Please enter a valid number (e.g. 5.0, 7.5)')
    ])
    submit = SubmitField('Save Subject')

class ReportForm(FlaskForm):
    title = StringField('Report Title', validators=[DataRequired(), Length(max=100)])
    description = TextAreaField('Description')

    # Using date_from and date_to field names to match template
    date_from = DateField('Start Date', format='%Y-%m-%d', validators=[DataRequired()])
    date_to = DateField('End Date', format='%Y-%m-%d', validators=[DataRequired()])
    
    subjects = SelectMultipleField('Subjects')
    permission_level = SelectField('Permission Level', choices=[
        ('view', 'View Only'),
        ('comment', 'View and Comment')
    ])
    expiry_date = DateField('Expiration Date (Optional)', format='%Y-%m-%d', validators=[])

    
    # Modified to be a multiple user select field
    share_with_users = SelectMultipleField('Share With Users', coerce=int)
    
    # Keep original field for compatibility
    share_with = StringField('Share With (Email)')
    
    submit = SubmitField('Create Report')
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(ReportForm, self).__init__(*args, **kwargs)
        if user:

            self.subjects.choices = [(subject.name, subject.name) for subject in Subject.query.filter_by(user_id=user.id).all()]
            
            # Add choices for share_with_users - all users except the current user
            users = User.query.filter(User.id != user.id).all()
            self.share_with_users.choices = [(u.id, f"{u.username} ({u.email})") for u in users]
