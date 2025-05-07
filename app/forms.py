from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectField, DateField, TimeField, SubmitField
from wtforms.validators import DataRequired

class StudyRecordForm(FlaskForm):   # create a form class for study records
    subject = SelectField('Subject', choices=[
        ('Mathematics', 'Mathematics'),
        ('Computer Science', 'Computer Science'),
        ('Physics', 'Physics'),
        ('Literature', 'Literature'),
        ('History', 'History')
    ], validators=[DataRequired()])

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
    submit = SubmitField('Save Study Session')
