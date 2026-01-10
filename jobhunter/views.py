# jobhunter/views.py — FINAL 2025 INDIAN JOB BOT (JOBSPY + GROQ)

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Resume, JobPost, Application
from .forms import ResumeForm, JobSearchForm, ManualJobForm, GenerateCodeForm, EmailForm
from .utils import scrape_indian_jobs, generate_ai_code, generate_email_body, send_smtp_email

@login_required
def dashboard(request):
    resumes = Resume.objects.filter(user=request.user).order_by('-uploaded_at')[:10]
    jobs = JobPost.objects.all().order_by('-scraped_at')[:30]
    apps = Application.objects.filter(user=request.user).order_by('-sent_at')
    return render(request, 'jobhunter/dashboard.html', {
        'resumes': resumes,
        'jobs': jobs,
        'apps': apps
    })

@login_required
def upload_resume(request):
    resumes = Resume.objects.filter(user=request.user).order_by('-uploaded_at')
    if request.method == 'POST':
        form = ResumeForm(request.POST, request.FILES)
        if form.is_valid():
            resume = form.save(commit=False)
            resume.user = request.user
            resume.save()
            messages.success(request, f"Resume '{resume.name}' uploaded!")
            return redirect('upload_resume')
    else:
        form = ResumeForm()
    return render(request, 'jobhunter/upload_resume.html', {'form': form, 'resumes': resumes})

@login_required
def search_jobs(request):
    if request.method == 'POST':
        form = JobSearchForm(request.POST)
        if form.is_valid():
            keywords = form.cleaned_data['keywords']
            location = form.cleaned_data['location'] or "India"
            
            # CALL THE NEW INDIAN MULTI-SITE SCRAPER
            result = scrape_indian_jobs(keywords, location)
            messages.success(request, result)
            return redirect('dashboard')
    else:
        form = JobSearchForm()
    return render(request, 'jobhunter/search_jobs.html', {'form': form})

@login_required
def add_manual_job(request):
    if request.method == 'POST':
        form = ManualJobForm(request.POST)
        if form.is_valid():
            job = form.save(commit=False)
            job.source = 'Manual India'
            job.save()
            messages.success(request, f"Job '{job.title}' added!")
            return redirect('dashboard')
    else:
        form = ManualJobForm()
    return render(request, 'jobhunter/add_manual_job.html', {'form': form})

@login_required
def pick_resume(request, job_id):
    job = get_object_or_404(JobPost, id=job_id)
    resumes = Resume.objects.filter(user=request.user).order_by('-uploaded_at')
    if request.method == 'POST':
        resume_id = request.POST['resume_id']
        resume = get_object_or_404(Resume, id=resume_id, user=request.user)
        app, created = Application.objects.get_or_create(
            user=request.user,
            job=job,
            resume=resume,
            defaults={'status': 'draft'}
        )
        return redirect('generate_code', app.tracking_id)
    return render(request, 'jobhunter/pick_resume.html', {'job': job, 'resumes': resumes})

@login_required
def generate_code(request, app_id):
    app = get_object_or_404(Application, tracking_id=app_id, user=request.user)
    if request.method == 'POST':
        form = GenerateCodeForm(request.POST)
        if form.is_valid():
            prompt = form.cleaned_data['prompt']
            app.altered_code = generate_ai_code(app.job.description, app.resume.latex_code or "", prompt)
            app.save()
            messages.success(request, "LaTeX code generated with Groq AI!")
            return redirect('generate_code', app.tracking_id)  # stay here to show code
    else:
        form = GenerateCodeForm()
    return render(request, 'jobhunter/generate_code.html', {'form': form, 'app': app})

@login_required
def upload_final_resume(request, app_id):
    app = get_object_or_404(Application, tracking_id=app_id, user=request.user)
    if request.method == 'POST' and request.FILES.get('final_resume'):
        app.final_resume_file = request.FILES['final_resume']
        app.save()
        messages.success(request, "Final PDF uploaded!")
        return redirect('send_email', app.tracking_id)
    return render(request, 'jobhunter/upload_final.html', {'app': app})

@login_required
def send_email(request, app_id):
    app = get_object_or_404(Application, tracking_id=app_id, user=request.user)
    if request.method == 'POST':
        form = EmailForm(request.POST, instance=app)
        if form.is_valid():
            form.save()
            app.email_body = generate_email_body(app.job.title, app.job.company)
            send_smtp_email(app)
            app.status = 'sent'
            app.save()
            messages.success(request, "APPLICATION SENT SUCCESSFULLY!")
            return redirect('dashboard')
    else:
        form = EmailForm(instance=app)
    return render(request, 'jobhunter/send_email.html', {'form': form, 'app': app})

@login_required
def apply_all(request):
    jobs = JobPost.objects.all()[:100]
    resumes = Resume.objects.filter(user=request.user)
    if not resumes.exists():
        messages.error(request, "Upload a resume first!")
        return redirect('dashboard')
    
    resume = resumes.first()
    count = 0
    for job in jobs:
        app, created = Application.objects.get_or_create(
            user=request.user,
            job=job,
            resume=resume,
            defaults={'status': 'draft'}
        )
        if created:
            count += 1
    messages.success(request, f"ONE-CLICK APPLY: {count} JOBS ADDED!")
    return redirect('dashboard')