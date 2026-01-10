# 🤖 JobBot: Your AI-Powered Job Search Companion

JobBot is an all-in-one platform designed to automate and optimize the modern job hunt. From scraping high-quality job listings to tailoring resumes and practicing interviews with AI, JobBot streamlines every step of your career journey.

![JobBot Dashboard](https://img.shields.io/badge/Status-Project_Live-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-Django_|_React_|_PostgreSQL-blue)

---

## 🌟 Key Features

### 🔍 Smart Job Scraping
Automatically find the best opportunities across various job boards using integrated scraping tools and the JSearch API.

### 📄 AI Resume Tailoring
Upload your resume and a job description to get a perfectly optimized version targeted at bypassing ATS systems and impressing recruiters.

### 📋 Interactive Kanban Board
Track your applications through every stage: *Interested, Applied, Interviewing, Offer, and Rejected*. Stay organized effortlessly.

### 🎙️ AI Interview Coach
Practice your skills with a real-time AI interviewer. Get feedback on your responses and improve your confidence.

### 📧 Outreach Automation
Monitor your inbox and automate follow-ups with recruiters using built-in outreach modules.

### 📊 Analytics Dashboard
Visualize your progress with data-driven insights on application rates, response times, and interview success.

---

## 🛠️ Tech Stack

- **Backend:** Django (Python), Django REST Framework
- **Frontend:** React, Vite, Framer Motion (Animations), Tailwind CSS
- **Database:** PostgreSQL
- **AI/ML:** OpenAI, Groq, OpenRouter
- **Static Assets:** WhiteNoise

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js & npm
- PostgreSQL

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/shahithkumar/Jobbot.git
   cd Jobbot
   ```

2. **Backend Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Setup Environment Variables
   # Create a .env file based on the provided template
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🛡️ Security
This project uses `.env` files for secret management. **Never** commit your `.env` file to version control.

---

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests to improve JobBot.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

Developed with ❤️ by [Shahith Kumar](https://github.com/shahithkumar)
