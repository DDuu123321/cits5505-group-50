# cits5505-group-50
# Study Time Tracker and Analyzer
A web application for tracking, analyzing, and sharing study time data to improve study habits and productivity.

## Project Description
Study Time Tracker helps students record and analyze their study sessions. The application allows users to:
- Record study sessions with subject, duration, and efficiency ratings
- Visualize study patterns and productivity through interactive charts
- Set study goals and track progress
- Selectively share study statistics with instructors or study groups

This project is developed as part of the CITS3403 Agile Web Development course.

## Team Members
| UWA ID   | Name | GitHub Username |
|----------|------|-----------------|
| 23951946 | [Bowen Dai] | [goodlearner233] |
| 24074639 | [David Du] | [DDuu123321] |
| 24318358 | [Srinath Rajan] | [GitHub Username] |
| 24076678 | [Wei Dai] | [WTTheCoder] |

## Installation and Setup
### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation Steps
1. Clone the repository:
git clone https://github.com/[your-username]/study-time-tracker.git
cd study-time-tracker
2. Create and activate a virtual environment:
python -m venv venv
On Windows
venv\Scripts\activate
On macOS/Linux
source venv/bin/activate
3. Install required packages:
pip install -r requirements.txt
4. Set up the database:
flask db init
flask db migrate
flask db upgrade
5. Run the application:
flask run
6. Access the application at http://localhost:5000

## Running Tests
To run tests for the application:
python -m pytest

## Project Structure
study-time-tracker/
├── app/                 # Main application package
│   ├── init.py      # Application initialization
│   ├── models.py        # Database models
│   ├── routes.py        # Application routes
│   ├── forms.py         # Form definitions
│   ├── templates/       # HTML templates
│   │   ├── index.html   # Home page template
│   │   ├── upload.html  # Data upload interface
│   │   ├── visualize.html# Data visualization page
│   │   └── share.html   # Data sharing options
│   └── static/          # Static files
│       ├── css/         # CSS stylesheets
│       │   └── style.css# Main stylesheet
│       ├── js/          # JavaScript files
│       │   └── main.js  # Main JavaScript file
│       └── img/         # Image assets
├── migrations/          # Database migration files
├── tests/               # Test files
│   ├── init.py
│   ├── test_models.py   # Tests for database models
│   ├── test_routes.py   # Tests for application routes
│   └── test_forms.py    # Tests for forms
├── config.py            # Configuration settings
├── requirements.txt     # Project dependencies
├── run.py               # Application entry point
└── README.md            # Project documentation
