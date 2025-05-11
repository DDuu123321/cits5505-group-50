
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
        db.session.add(new_session) #把这个新对象添加到 Flask 的数据库操作队列中。
        db.session.commit() #提交所有的操作到数据库中，保存数据
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

@main.route('/api/analytics-data', methods=['POST'])  #定义一个新的路由/api/analytics-data，作用是接收前端POST的过滤要求请求，过滤时间返回一个符合时间范围json数据
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
            "start_time": s.start_time.strftime('%H:%M'),
            "subject": s.subject,
            "duration": f"{duration.seconds // 3600}h {duration.seconds % 3600 // 60}m",
            "efficiency": s.efficiency,
            "location": s.location,
            "interruptions": s.interruptions
        })

    return jsonify({"sessions": result})

# 添加到文件末尾

import os
import json
import requests

@main.route('/api/ai-recommendations', methods=['POST'])
def ai_recommendations():
    """使用 Gemini API 生成基于学习数据的智能推荐"""
    # 获取前端发送的数据
    data = request.get_json()
    subject_distribution = data.get('subjectDistribution', {})
    time_location_data = data.get('timeLocationData', {})
    
    if not subject_distribution or not time_location_data:
        return jsonify({
            "error": "Insufficient data provided"
        }), 400
    
    try:
        # 获取 API 密钥
        
        api_key = "AIzaSyC9XgtjAb_dx2ORw78gjSMuu8CkTrx14cM"  # 直接设置 API 密钥
            
        # 准备发送给 Gemini 的提示
        prompt = f"""
        As an AI study coach, analyze this data and provide 3-4 specific, actionable recommendations to improve study efficiency.
        
        Study subject distribution (in minutes):
        {json.dumps(subject_distribution)}
        
        Study time-location efficiency data:
        Time slots: {time_location_data['timeSlots']}
        Locations: {time_location_data['locations']}
        Data points (sample of up to 10):
        {json.dumps(time_location_data['dataPoints'][:10])}
        
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
        
        # 调用 Gemini API
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
        
        response.raise_for_status()
        response_data = response.json()
        
        # 解析 API 返回的建议
        response_text = response_data['candidates'][0]['content']['parts'][0]['text']
        
        # 提取 JSON 部分
        import re
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            recommendations = json.loads(json_match.group())
            if recommendations and isinstance(recommendations, list):
                return jsonify({
                    "recommendations": recommendations
                })
                
        # 如果无法解析 JSON，返回错误
        return jsonify({
            "error": "Could not parse AI response",
            "raw_response": response_text
        }), 500
            
    except Exception as e:
        print(f"Error generating AI recommendations: {str(e)}")
        return jsonify({
            "error": "Failed to generate recommendations",
            "message": str(e)
        }), 500

