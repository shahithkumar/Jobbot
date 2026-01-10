import requests
import openai
from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone
from .models import JobPost
import os
import json
import tempfile
import subprocess
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from jinja2 import Environment, FileSystemLoader

# GROQ CLIENT (FREE)
client = openai.OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url=settings.GROQ_BASE_URL
)

FREE_MODEL = "llama-3.1-8b-instant"

def debug_print(msg):
    print("\n" + "=" * 80)
    print("JOBHUNTER →", msg)
    print("=" * 80 + "\n")

# ==========================================
# 1. OCR & TEXT EXTRACTION
# ==========================================

# Configure Tesseract Path for Windows (Common Default)
# Users must install Tesseract-OCR to C:\Program Files\Tesseract-OCR\
TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

def extract_text_from_file(file_path):
    """
    Robust extraction:
    1. Try simple PDF text extraction (pdfplumber).
    2. If text length < 50 chars, assume Image/Scan.
    3. Use OCR (pdf2image + pytesseract) to read images.
    """
    debug_print(f"Extracting text from: {file_path}")
    ext = os.path.splitext(file_path)[1].lower()
    text = ""

    try:
        if ext == '.pdf':
            # STRATEGY 1: NATIVE TEXT
            with pdfplumber.open(file_path) as pdf:
                text = "\n".join([page.extract_text() or "" for page in pdf.pages])
            
            # CHECK: Is it a scan?
            if len(text.strip()) < 50:
                debug_print("Low text count detected (<50 triggers OCR). Attempting OCR...")
                try:
                    # STRATEGY 2: OCR
                    images = convert_from_path(file_path) # Requires poppler installed
                    ocr_text = ""
                    for img in images:
                        ocr_text += pytesseract.image_to_string(img)
                    
                    if len(ocr_text.strip()) > len(text.strip()):
                        text = ocr_text
                        debug_print("OCR Success! Found text.")
                except Exception as e:
                    debug_print(f"OCR Failed (Check Poppler/Tesseract): {e}")
        
        elif ext in ['.txt', '.md', '.tex', '.json']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        
        return text

    except Exception as e:
        debug_print(f"Extraction Error: {e}")
        return ""

# ==========================================
# 2. AI PIPELINE: PARSE -> TAILOR -> RENDER
# ==========================================

def parse_resume_to_json(resume_text):
    """
    Step 1: Convert raw resume text into a structured consistency format.
    """
    debug_print("AI STEP 1: Parsing Raw Resume to JSON...")
    
    system_prompt = """
    You are a Data Parser. Convert the Resume Text into this strict JSON structure.
    CRITICAL: 
    1. Do NOT summarize or shorten the content. Keep ALL original details, metrics, and bullet points.
    2. If 'skills' is a list, join it into a single comma-separated string.
    3. Ensure 'experience' bullets are detailed (at least 2-3 per role if available).
    4. IF A SECTION (e.g. Education, Projects) IS NOT IN THE TEXT, RETURN AN EMPTY LIST []. DO NOT INVENT DATA.
    
    JSON STRUCTURE:
    {
        "name": "Name",
        "email": "Email",
        "phone": "Phone",
        "links": "LinkedIn | Github",
        "summary": "Professional Summary...",
        "experience": [
            { "company": "Name", "role": "Title", "dates": "2020-Present", "location": "City", "bullets": ["...", "..."] }
        ],
        "education": [
            { "school": "Name", "degree": "Degree", "dates": "Year" }
        ],
        "skills": "Skill1, Skill2, Skill3",
        "projects": [
             { "name": "Project Name", "tech": "Stack used", "bullets": ["Describe what you did...", "Result..."] }
        ],
        "certifications": ["Cert Name - Issuer", "Cert Name 2"]
    }
    """
    
    try:
        response = client.chat.completions.create(
            model=FREE_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": resume_text[:6000]} # Limit payload
            ],
            response_format={"type": "json_object"},
            max_tokens=2000
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        debug_print(f"Parsing Failed: {e}")
        return {}

def tailor_resume_json(base_json, job_description, user_prompt=""):
    """
    Step 2: Modify the JSON to better match the Job Description.
    """
    debug_print("AI STEP 2: Tailoring JSON to Job Description...")
    
    system_prompt = f"""
    You are a Resume Editor.
    
    STRICT RULES (VERY IMPORTANT):
    1. Modify ONLY these two sections: 'summary' and 'skills'.
    2. Do NOT change 'experience', 'education', 'projects', or 'certifications'. Keep them BIT-FOR-BIT identical to the input.
    3. Do NOT invent new facts or metrics in the preserved sections.
    
    INSTRUCTIONS FOR 'SUMMARY':
    - Rewrite to be clearer, more natural, and professional.
    - Integrate relevant keywords from the Job Description ("Key Wordish").
    - Make it realistic and human, not corporate fluff.
    
    INSTRUCTIONS FOR 'SKILLS':
    - Clean and reorganize logically.
    - ADD relevant technical skills/keywords from the Job Description if they fit the candidate's profile.
    - Remove duplicate or weak wording.
    
    5. {user_prompt}
    
    Goal: Targeted optimization of Summary and Skills only. Perfect preservation of other sections.
    Return the SAME JSON structure.
    """
    
    user_msg = f"""
    JOB DESCRIPTION:
    {job_description[:3000]}
    
    CANDIDATE PROFILE (JSON):
    {json.dumps(base_json)}
    """
    
    try:
        response = client.chat.completions.create(
            model=FREE_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg}
            ],
            response_format={"type": "json_object"},
            max_tokens=2000
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        debug_print(f"Tailoring Failed: {e}")
        return base_json # Fallback to original

def generate_latex_via_jinja(resume_json):
    """
    Step 3: Render LaTeX using Jinja2 Template.
    """
    debug_print("RENDERING: Jinja2 -> LaTeX...")
    
    # Setup Jinja2 for LaTeX (Change delimiters to avoid conflict)
    template_dir = os.path.join(settings.BASE_DIR, 'jobhunter', 'templates', 'latex')
    env = Environment(
        loader=FileSystemLoader(template_dir),
        block_start_string=r'\BLOCK{',
        block_end_string=r'}',
        variable_start_string=r'\VAR{',
        variable_end_string=r'}',
        comment_start_string=r'\#{',
        comment_end_string=r'}',
        line_statement_prefix='%%',
        line_comment_prefix='%#',
        trim_blocks=True,
        autoescape=False,
    )
    
    # Helper to escape LaTeX special chars
    def escape_tex(value):
        if not isinstance(value, str): return value
        chars = {
            "&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#", "_": "\\_",
            "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}",
            "\\": "\\textbackslash{}",
            "–": "--", "—": "---", "‘": "'", "’": "'", "“": "\"", "”": "\"", "…": "..."
        }
        return "".join(chars.get(c, c) for c in value)

    # Pre-process JSON to escape all strings
    def escape_recursive(data):
        if isinstance(data, dict):
            # Special handling for skills: Flatten list to string
            if 'skills' in data and isinstance(data['skills'], list):
                data['skills'] = ", ".join(data['skills'])
            
            return {k: escape_recursive(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [escape_recursive(i) for i in data]
        elif isinstance(data, str):
            return escape_tex(data)
        return data

    safe_json = escape_recursive(resume_json)
    
    try:
        template = env.get_template('resume_master.tex')
        return template.render(**safe_json)
    except Exception as e:
        debug_print(f"Jinja2 Render Error: {e}")
        return "% Error rendering template"

# ==========================================
# WRAPPER FOR BACKWARD COMPATIBILITY
# ==========================================

def generate_ai_code(job_desc, resume_text, user_prompt=""):
    """
    The main entry point called by views.
    Flow: 
    1. Parse Text (if not already JSON) -> JSON
    2. Tailor JSON
    3. Render LaTeX
    """
    # 1. Parse
    debug_print(f"Input Resume Text Length: {len(resume_text)} chars")
    original_json = parse_resume_to_json(resume_text)
    debug_print(f"Step 1 Complete. Found keys: {list(original_json.keys())}")
    
    # 2. Tailor
    tailored_json = tailor_resume_json(original_json, job_desc, user_prompt)
    debug_print(f"Step 2 Complete. Tailored JSON keys: {list(tailored_json.keys())}")
    
    # 3. Render
    latex_code = generate_latex_via_jinja(tailored_json)
    debug_print(f"Step 3 Complete. Generated LaTeX size: {len(latex_code)} chars")
    
    return latex_code

# ==========================================
# UNCHANGED UTILITIES
# ==========================================

# JSEARCH SCRAPER
def fetch_job_details(job_id):
    url = "https://api.openwebninja.com/jsearch/job-details"
    params = {"job_id": job_id, "country": "in", "language": "en"}
    headers = {"x-api-key": settings.JSEARCH_API_KEY}
    try:
        res = requests.get(url, headers=headers, params=params, timeout=15)
        res.raise_for_status()
        data = res.json().get("data", [])
        return data[0] if data else {}
    except:
        return {}

def scrape_indian_jobs(keywords, location="India"):
    debug_print(f"Fetching jobs: {keywords} in {location}")
    search_url = "https://api.openwebninja.com/jsearch/search"
    params = {
        "query": f"{keywords} {location}",
        "page": 1,
        "num_pages": 2,
        "country": "in",
        "language": "en"
    }
    headers = {"x-api-key": settings.JSEARCH_API_KEY}
    count = 0
    try:
        res = requests.get(search_url, headers=headers, params=params, timeout=20)
        res.raise_for_status()
        jobs = res.json().get("data", [])
        for job in jobs:
            job_id = job.get("job_id")
            title = job.get("job_title")
            company = job.get("employer_name")
            link = job.get("job_apply_link") or job.get("job_google_link")
            if not job_id or not title or not company or not link:
                continue
            details = fetch_job_details(job_id)
            _, created = JobPost.objects.get_or_create(
                job_id=job_id,
                defaults={
                    "title": title,
                    "company": company,
                    "link": link,
                    "source": "OpenWebNinja JSearch",
                    "description": details.get("job_description"),
                    "location": details.get("job_location"),
                    "employment_type": details.get("job_employment_type"),
                }
            )
            if created:
                count += 1
        debug_print(f"{count} NEW jobs saved")
        return f"{count} jobs fetched"
    except Exception as e:
        debug_print(f"JSearch ERROR: {e}")
        return "Job fetch failed"

def generate_email_body(job_title, company_name):
    debug_print("Generating short human email...")
    
    prompt = f"""
Write a short (5-7 lines), confident, human-sounding job application email.

Job: {job_title}
Company: {company_name}

Rules:
- No long introduction
- No dumping job description
- Be direct: mention experience, excitement, resume attached
- Use Indian style (polite but confident)
- End with "Best regards, Shahith Kumar"

Example:
Subject: {job_title} Application

Hi Hiring Team,

I have 8+ years in Python backend development with FastAPI, MLOps, and LLM experience.

I'm excited about your {job_title} role at {company_name} and believe my skills would be a great fit.

Resume attached for your review.

Best regards,
Shahith Kumar
"""

    try:
        response = client.chat.completions.create(
            model=FREE_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.6
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        debug_print(f"EMAIL AI ERROR: {e}")
        return f"""Subject: {job_title} Application

Hi Team,

8+ years in Python, FastAPI, MLOps, LLM.

Excited about the role — resume attached.

Best regards,
Shahith Kumar"""

def send_smtp_email(app):
    email = EmailMessage(
        subject=f"Application: {app.job.title}",
        body=app.email_body,
        from_email=settings.EMAIL_HOST_USER,
        to=[app.hr_email],
    )
    if app.final_resume_file:
        email.attach_file(app.final_resume_file.path)
    email.send()
    app.sent_at = timezone.now()
    app.save()

def generate_pdf_from_latex(latex_code):
    """
    Compiles LaTeX code to PDF using Tectonic (embedded TeX engine).
    Returns the path to the generated PDF.
    """
    debug_print("Compiling PDF with Tectonic...")
    
    # Check for local binary first
    # User placed it in jobbot/jobbot/tectonic.exe
    paths_to_check = [
        os.path.join(settings.BASE_DIR, 'tectonic.exe'),
        os.path.join(settings.BASE_DIR, 'jobbot', 'tectonic.exe'),
    ]
    
    executable = 'tectonic'
    for path in paths_to_check:
        if os.path.exists(path):
            executable = path
            debug_print(f"Found local Tectonic at: {executable}")
            break

    with tempfile.TemporaryDirectory() as temp_dir:
        tex_file = os.path.join(temp_dir, 'resume.tex')
        pdf_file = os.path.join(temp_dir, 'resume.pdf')
        
        debug_print(f"LaTeX Source Preview (First 200 chars):\n{latex_code[:200]}...")

        with open(tex_file, 'w', encoding='utf-8') as f:
            f.write(latex_code)
            
        try:
            # Run Tectonic
            cmd = [executable, tex_file]
            debug_print(f"Running command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                cwd=temp_dir
            )
            
            if result.returncode != 0:
                # FAILURE: Save Source for debugging
                dump_path = os.path.join(settings.BASE_DIR, 'failed_resume_source.tex')
                with open(dump_path, 'w', encoding='utf-8') as f:
                    f.write(latex_code)
                
                error_msg = f"Tectonic Error (Exit {result.returncode}):\n{result.stderr}\n\nSTDOUT:\n{result.stdout}"
                debug_print(error_msg)
                debug_print(f"Saved failed LaTeX to: {dump_path}")
                raise Exception(f"Tectonic Compilation Failed. Check server logs for details. (Saved dump to {dump_path})")

            if os.path.exists(pdf_file):
                # Save to Media Root
                final_filename = f'resume_{int(timezone.now().timestamp())}.pdf'
                final_path = os.path.join(settings.MEDIA_ROOT, 'generated_resumes', final_filename)
                os.makedirs(os.path.dirname(final_path), exist_ok=True)
                
                with open(pdf_file, 'rb') as src, open(final_path, 'wb') as dst:
                    dst.write(src.read())
                
                return final_path
            else:
                debug_print("PDF file was not created by Tectonic (but no error code).")
                return None

        except Exception as e:
            debug_print(f"PDF GENERATION FAILED: {e}")
            # We want to bubble this up if possible, or return None. 
            # api_views.py currently expects string path or None.
            # Let code failing usually return None, but printing is key.
            return None

def analyze_job_match(job_desc, resume_text):
    """
    Analyzes the match between a job description and a resume.
    Returns a JSON-like dict with score and feedback.
    """
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) and Hiring Manager.
    Compare the Resume against the Job Description.

    JOB DESCRIPTION:
    {(job_desc or "No description provided.")[:2000]}

    RESUME CONTENT (Latex/Text):
    {(resume_text or "No resume content.")[:2000]}

    TASK:
    1. Assign a Match Score from 0 to 100.
    2. List 3-5 critical Missing Keywords or Skills that are in the Job but not the Resume.
    3. Provide a 1-sentence quick tip to improve.

    OUTPUT FORMAT (JSON ONLY):
    {{
      "score": 75,
      "missing_keywords": ["skill1", "skill2"],
      "tip": "Add more details about..."
    }}
    """
    try:
        response = client.chat.completions.create(
            model=FREE_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=500
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        debug_print(f"MATCH ANALYSIS FAILED: {e}")
        return {"score": 0, "missing_keywords": ["Error analyzing"], "tip": "AI Service Unavailable"}

def get_ai_interview_response(job_title, company, history, user_msg):
    """
    Simulates a Hiring Manager interview.
    History: List of {"role": "ai"/"user", "content": "..."}
    """
    system_prompt = f"""
    You are a Professional Interviewer at {company} hiring for a {job_title}.
    
    INTERVIEW RULES:
    1. Ask questions ONLY based on the Job Description and common requirements for this role.
    2. Ask ONE question at a time. Wait for the answer.
    3. Do NOT assume experience not mentioned.
    4. Difficulty: Start easy, increase gradually.
    5. FEEDBACK: If an answer is weak/wrong, briefly point it out before moving on.
    
    STRUCTURE (Follow this order, moving to next round after 2-3 questions):
    - Round 1: Resume & Basics (Introduction, background)
    - Round 2: Core Technical Skills (Deep dive into JD skills)
    - Round 3: Practical / Scenario (How would you solve X?)
    - Round 4: Behavioral (Describe a time when...)
    - Round 5: Final / Feedback.
    
    FINAL EVALUATION:
    If the user says "End Interview" or you have asked ~10 questions, provide:
    - Overall Rating (Weak/Average/Strong)
    - Key Strengths
    - Critical Weaknesses
    - What to revise.
    
    Act like a real interviewer. Be concise. Do NOT teach/tutor unless asked.
    """
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history (limit last 10 turns to save tokens)
    for msg in history[-10:]:
        role = "assistant" if msg['role'] == 'ai' else "user"
        messages.append({"role": role, "content": msg['content']})
        
    messages.append({"role": "user", "content": user_msg})

    try:
        response = client.chat.completions.create(
            model=FREE_MODEL,
            messages=messages,
            max_tokens=200,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[AI ERROR: {str(e)}]"

def get_answer_analysis(question, answer, job_desc):
    """
    Provides deep 7-point analysis of a candidate's answer.
    """
    system_prompt = f"""
    You are an Expert Interview Coach. Analyze the candidate's answer based on the Job Description.
    
    JOB DESCRIPTION:
    {job_desc[:2000]}
    
    QUESTION ASKED: "{question}"
    CANDIDATE ANSWER: "{answer}"
    
    Provide a JSON response with this EXACT structure:
    {{
        "rating": "Weak" | "Average" | "Strong",
        "feedback_summary": "1-sentence summary",
        "jd_alignment": {{
            "addressed": ["..."],
            "missed": ["..."]
        }},
        "communication": {{
            "clarity": "Clear" | "Unclear",
            "tone": "Confident" | "Hesitant"
        }},
        "red_flags": ["..."],
        "improvements": ["..."],
        "improved_version": "Rewrite using ONLY their facts (No new hallucinations)"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model=FREE_MODEL,
            messages=[{"role": "user", "content": system_prompt}],
            response_format={"type": "json_object"},
            max_tokens=600
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        debug_print(f"ANALYSIS FAILED: {e}")
        return {"error": str(e)}

def send_approval_request_email(user, pending_apps, batch_id):
    """
    Sends a detailed summary email to the user with a link to approve the batch.
    """
    debug_print(f"Sending Verification Email for {len(pending_apps)} apps to {user.email}")
    
    host = "http://127.0.0.1:8000" 
    
    # Detailed Cards
    cards_html = ""
    for app in pending_apps:
        # Resolve PDF URL
        pdf_link = "#"
        if app.final_resume_file:
            # Assuming standard media setup
            pdf_link = f"{host}{app.final_resume_file.url}"
            
        cards_html += f"""
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background-color: #ffffff;">
            <h3 style="margin-top: 0; color: #2c3e50;">{app.job.title} <span style="font-weight: normal; color: #7f8c8d;">at {app.job.company}</span></h3>
            
            <div style="margin-bottom: 15px;">
                <strong>To:</strong> <span style="background-color: #f1f1f1; padding: 2px 6px; border-radius: 4px;">{app.hr_email}</span>
            </div>
            
            <div style="margin-bottom: 15px; border-left: 3px solid #3498db; padding-left: 10px;">
                <strong>Email Body Preview:</strong><br>
                <em style="color: #555;">{app.email_body.replace('\n', '<br>')[:500]}...</em>
            </div>
            
            <div style="margin-bottom: 0;">
                <strong>Attachment:</strong> 
                <a href="{pdf_link}" style="color: #e74c3c; text-decoration: none; font-weight: bold;">
                   📄 View Tailored Resume (PDF)
                </a>
            </div>
        </div>
        """
        
    approval_link = f"{host}/api/jobs/approve_batch/?ids={batch_id}"
    
    html_content = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 15px;">Action Required: Review {len(pending_apps)} Applications</h2>
            <p style="font-size: 16px; line-height: 1.5;">
                JobBot has prepared the following applications for you. Please review the drafts below. 
                They have <strong>NOT</strong> been sent yet.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
            
            {cards_html}
            
            <div style="margin-top: 40px; text-align: center; padding: 20px; background-color: #e8f8f5; border-radius: 8px;">
                <p style="font-weight: bold; margin-bottom: 20px; color: #16a085;">Looks good? Send them all with one click:</p>
                <a href="{approval_link}" 
                   style="background-color: #27ae60; color: white; padding: 18px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; display: inline-block;">
                   🚀 APPROVE & SEND ALL ({len(pending_apps)})
                </a>
                <p style="margin-top: 15px; font-size: 13px; color: #7f8c8d;">
                    Note: Clicking this will immediately send emails to the recruiters.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    email = EmailMessage(
        subject=f"Review Required: {len(pending_apps)} Pending Applications",
        body=html_content,
        from_email=settings.EMAIL_HOST_USER,
        to=[user.email],
    )
    email.content_subtype = "html" # Main content is text/html
    try:
        email.send()
        debug_print("Verification Email Sent Successfully.")
        return True
    except Exception as e:
        debug_print(f"Failed to send confirmation email: {e}")
        return False
