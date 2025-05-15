Study Time Tracker and Analyzer
CITS5505 - Group 50
A web application for tracking, analyzing, and sharing study time data to improve study habits and productivity.
📚 Project Description
Study Time Tracker helps students record and analyze their study sessions. The application provides a comprehensive platform for academic time management and performance analysis.
Key Features

📝 Record Study Sessions: Track study time with subject categorization, duration, and efficiency ratings
📊 Visualize Study Patterns: Interactive charts and analytics to identify productivity trends
🎯 Goal Setting: Set and monitor study goals with progress tracking
🤖 AI Recommendations: Get personalized study suggestions based on your patterns
🔗 Share Statistics: Selectively share study data with instructors or study groups
📱 Responsive Design: Fully functional on desktop and mobile devices

This project is developed as part of the CITS5505 Agile Web Development course at UWA.
👥 Team Members
UWA IDNameGitHub Username23951946Bowen Daigoodlearner23324074639David DuDDuu12332124318358Srinath Rajansrinath-rajan24076678Wei DaiWTTheCoder
🚀 Getting Started
Prerequisites

Python 3.8 or higher
pip (Python package installer)

Installation

Clone the repository
bashgit clone https://github.com/[your-github-username]/cits5505-group-50.git
cd cits5505-group-50-main

Create and activate a virtual environment
bash# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

Install required packages
bashpip install -r requirements.txt

Set up the database
bash# Initialize database migrations (if migrations folder doesn't exist)
flask db init

# Create migration files
flask db migrate -m "Initial migration"

# Apply migrations to database
flask db upgrade

Create environment configuration (optional)
bash# Create .env file in the project root
echo "FLASK_APP=run.py" > .env
echo "FLASK_ENV=development" >> .env
echo "SECRET_KEY=your-secret-key-here" >> .env

Run the application
bashpython run.py
# or
flask run

Access the application
Open your web browser and navigate to: http://localhost:5000

🧪 Running Tests
bash# Run all tests
python -m pytest

# Run with coverage report
python -m pytest --cov=app

# Run specific test file
python -m pytest tests/test_models.py
📁 Project Structure
cits5505-group-50-main/
├── app/
│   ├── __pycache__/        # Python cache files
│   ├── static/
│   │   ├── css/           # Stylesheets
│   │   │   ├── charts.css
│   │   │   ├── recommendations.css
│   │   │   ├── style.css
│   │   │   └── subject-form.css
│   │   └── js/            # JavaScript files
│   │       ├── ai-recommendations.js
│   │       ├── charts.js
│   │       ├── main.js
│   │       └── typewriter.js
│   ├── templates/         # HTML templates
│   │   ├── create_report.html
│   │   ├── dashboard.html
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── profile.html
│   │   ├── register.html
│   │   ├── shared.html
│   │   ├── subject_form.html
│   │   ├── upload_form.html
│   │   └── visualize.html
│   ├── __init__.py        # Application factory
│   ├── create_shared_table.py
│   ├── forms.py           # WTForms definitions
│   ├── models.py          # Database models
│   └── routes.py          # URL routes
├── instance/
│   └── site.db           # SQLite database
├── venv/                 # Virtual environment
├── .env                  # Environment variables
├── .gitignore           # Git ignore file
├── README.md            # This file
├── requirements.txt     # Python dependencies
└── run.py              # Application entry point
🛠️ Technologies Used

Backend: Flask 2.3.3, SQLAlchemy 2.0.27
Database: SQLite with Flask-Migrate
Authentication: Flask-Login, Flask-Bcrypt
Forms: Flask-WTF, WTForms
Frontend: HTML5, CSS3, JavaScript, Bootstrap
Visualization: Chart.js
Testing: pytest, pytest-flask
HTTP Client: requests

🎯 Main Features
User Management

Secure user registration and authentication
Profile management and customization
Session-based access control

Study Tracking

Record study sessions with detailed metadata
Subject categorization and management
Efficiency rating system
Duration tracking with visual timers

Analytics & Visualization

Interactive charts showing study patterns
Weekly, monthly, and yearly analytics
Subject-wise performance breakdown
Productivity trends analysis

AI Integration

Personalized study recommendations
Pattern-based insights
Efficiency improvement suggestions

Data Sharing

Selective data sharing with permissions
Export study reports
Collaborative study group features

🔧 Development
Running in Development Mode
bash# Set development environment
export FLASK_ENV=development  # macOS/Linux
set FLASK_ENV=development     # Windows

# Run with debug mode
flask run --debug
Database Operations
bash# Create new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Downgrade database
flask db downgrade
🤝 Contributing
We welcome contributions to improve the Study Time Tracker!

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

Coding Standards

Follow PEP 8 for Python code
Use meaningful variable and function names
Add docstrings to functions and classes
Write tests for new features

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

CITS5505 Course Staff at The University of Western Australia
Flask and its amazing community
Bootstrap for responsive design components
Chart.js for beautiful data visualizations

Made with ❤️ by Group 50 for CITS5505
