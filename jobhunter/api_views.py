from rest_framework import viewsets, status
from django.shortcuts import render
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import Resume, JobPost, Application
from .serializers import ResumeSerializer, JobPostSerializer, ApplicationSerializer
from .utils import scrape_indian_jobs, generate_pdf_from_latex, generate_ai_code, generate_email_body, send_smtp_email, analyze_job_match, get_ai_interview_response, extract_text_from_file, get_answer_analysis, send_approval_request_email
from django.core.files import File
import os

def get_user(request):
    if request.user.is_authenticated:
        return request.user
    # Default to first user (Admin) if anonymous
    return User.objects.first()

class ResumeViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ResumeSerializer

    def get_queryset(self):
        user = get_user(self.request)
        if not user: return Resume.objects.none()
        return Resume.objects.filter(user=user).order_by('-uploaded_at')

    def perform_create(self, serializer):
        print("DEBUG: ResumeViewSet.perform_create called")
        user = get_user(self.request)
        instance = serializer.save(user=user)
        
        print(f"DEBUG: Resume Uploaded. ID: {instance.id}, File: {instance.file}, LatexCodeLen: {len(instance.latex_code)}")

        # Auto-extract text if latex_code is empty and file exists
        # Auto-extract text if latex_code is empty and file exists
        if not instance.latex_code and instance.file:
            try:
                extracted_text = extract_text_from_file(instance.file.path)
                if extracted_text:
                    instance.latex_code = extracted_text
                    instance.save()
                    print(f"DEBUG: Text extracted using robust utils. Length: {len(extracted_text)}")
                else:
                    print("DEBUG: extraction returned empty.")
            except Exception as e:
                print(f"Error reading resume file: {e}")
        else:
             print("DEBUG: instance.latex_code was not empty or no file.")


class JobPostViewSet(viewsets.ModelViewSet):
    # Jobs are public or shared, but for now lets show all
    queryset = JobPost.objects.all().order_by('-scraped_at')
    serializer_class = JobPostSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def search(self, request):
        keywords = request.data.get('keywords')
        location = request.data.get('location', 'India')
        if not keywords:
            return Response({"error": "Keywords required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result_msg = scrape_indian_jobs(keywords, location)
        return Response({"message": result_msg})

    @action(detail=False, methods=['post'])
    def apply_all(self, request):
        """
        One-click: Create applications and optionally FULLY APPLY (Generate + Email).
        Parameters: limit (int), auto_approve (bool)
        """
        print("DEBUG: apply_all Called")
        user = get_user(request)
        if not user: return Response({"error": "No user found"}, status=400)

        # Config
        limit = int(request.data.get('limit', 5) or 5)
        auto_approve = request.data.get('auto_approve', False)
        print(f"DEBUG: AutoApprove={auto_approve}, Limit={limit}")

        # Get latest resume
        resume = Resume.objects.filter(user=user).order_by('-uploaded_at').first()
        if not resume:
            return Response({"error": "Please upload a resume first"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure resume has latex_code
        if not resume.latex_code:
             if resume.file:
                 resume.latex_code = extract_text_from_file(resume.file.path)
                 resume.save()
             else:
                 return Response({"error": "Resume has no content/file"}, status=400)

        # Get jobs that we haven't successfully SENT yet
        sent_job_ids = Application.objects.filter(user=user, status='sent').values_list('job_id', flat=True)
        jobs = JobPost.objects.exclude(id__in=sent_job_ids).order_by('-scraped_at')[:limit]
        
        count = 0
        sent_count = 0
        pending_apps = []
        
        for job in jobs:
            # Get or Create Application
            app, created = Application.objects.get_or_create(
                user=user, 
                job=job, 
                resume=resume, 
                defaults={'status': 'draft'}
            )
            
            if created:
                count += 1
                print(f"DEBUG: Created Draft App {app.tracking_id} for {job.title}")
            else:
                print(f"DEBUG: Found Existing Draft {app.tracking_id} for {job.title}")

            # 2. FULL AUTOMATION OR PREPARATION
            try:
                # Common steps: Code, PDF, Body
                # Only if not already present? For Run Now, we force refresh or check existing.
                if not app.altered_code:
                    app.altered_code = generate_ai_code(job.description, resume.latex_code)
                    app.save()
                
                if not app.final_resume_file:
                    pdf_path = generate_pdf_from_latex(app.altered_code)
                    if pdf_path and os.path.exists(pdf_path):
                        with open(pdf_path, 'rb') as f:
                            app.final_resume_file.save(os.path.basename(pdf_path), File(f))
                    else:
                        print("DEBUG: PDF Failed")
                        continue

                if not app.email_body:
                    app.email_body = generate_email_body(job.title, job.company)
                    app.save()
                    
                # Fix Email
                if not app.hr_email:
                    app.hr_email = "recruiter@example.com"
                    app.save()

                if auto_approve:
                    # SEND NOW
                    send_smtp_email(app)
                    app.status = 'sent'
                    app.save()
                    sent_count += 1
                    print(f"DEBUG: Email Sent for {job.title}")
                else:
                    # ADD TO PENDING LIST
                    if app.status != 'sent':
                        pending_apps.append(app)

            except Exception as e:
                print(f"ERROR processing job {job.id}: {e}")
                # Continue
        
        if not auto_approve and pending_apps:
             # Send ONE email to user
            batch_ids = ",".join([str(a.tracking_id) for a in pending_apps])
            send_approval_request_email(user, pending_apps, batch_ids)
            return Response({"message": f"Sent APPROVAL REQUEST email for {len(pending_apps)} jobs. Check your inbox!"})

        if auto_approve:
            return Response({"message": f"Processed {len(jobs)} jobs. Sent {sent_count} emails."})
        else:
            return Response({"message": f"Verified {len(jobs)} jobs. No pending actions needed."})

    @action(detail=False, methods=['get'])
    def approve_batch(self, request):
        ids = request.query_params.get('ids', "")
        if not ids:
             return Response("No IDs provided", status=400)
        
        id_list = [int(i) for i in ids.split(',') if i.isdigit()]
        apps = Application.objects.filter(tracking_id__in=id_list, user=get_user(request))
        
        count = 0
        for app in apps:
            if app.status == 'sent': continue
            
            # Send Email
            try:
                # Ensure body/resume exist (should have been generated in apply_all)
                if not app.email_body:
                    app.email_body = generate_email_body(app.job.title, app.job.company)
                    app.save()

                if not app.hr_email:
                    app.hr_email = "recruiter@example.com"
                    app.save()

                send_smtp_email(app)
                app.status = 'sent'
                app.save()
                count += 1
            except Exception as e:
                print(f"Error sending app {app.tracking_id}: {e}")

        # Return HTML Page
        return render(request, 'jobhunter/approval_success.html', {'count': count})

class ApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        user = get_user(self.request)
        if not user: return Application.objects.none()
        # Optimize query to fetch related job and resume in one go
        return Application.objects.filter(user=user).select_related('job', 'resume').order_by('-sent_at')

    @action(detail=True, methods=['post'])
    def generate_pdf(self, request, pk=None):
        app = self.get_object()
        latex_code = request.data.get('latex_code') or app.altered_code
        
        if not latex_code:
            return Response({"error": "No LaTeX code found"}, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_path = generate_pdf_from_latex(latex_code)
        
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as f:
                app.final_resume_file.save(os.path.basename(pdf_path), File(f))
            app.altered_code = latex_code
            app.save()
            return Response({"message": "PDF Generated", "pdf_url": app.final_resume_file.url})
        else:
            return Response({"error": "PDF Generation Failed. Check Tectonic installation."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def upload_final(self, request, pk=None):
        app = self.get_object()
        file = request.FILES.get('final_resume')
        if file:
            app.final_resume_file = file
            app.save()
            return Response({"message": "Final Resume Uploaded"})
        return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def analyze_match(self, request, pk=None):
        app = self.get_object()
        
        # Analyze
        analysis = analyze_job_match(app.job.description, app.resume.latex_code)
        
        # We could save the score to the model if we added a field, but for now just return it.
        # Ideally: app.match_score = analysis['score']; app.save()
        
        return Response(analysis)

    @action(detail=True, methods=['post'])
    def generate_code(self, request, pk=None):
        app = self.get_object()
        prompt = request.data.get('prompt')

        # VALIDATION: Check if resume has content
        if not app.resume.latex_code or len(app.resume.latex_code.strip()) < 10:
             # AUTO-FIX STRATEGY 1: RE-EXTRACT FROM FILE
             if app.resume.file and os.path.exists(app.resume.file.path):
                 print(f"DEBUG: Attempting re-extraction for Resume {app.resume.id}...")
                 try:
                     text = extract_text_from_file(app.resume.file.path)
                     if text and len(text) > 50:
                         app.resume.latex_code = text
                         app.resume.save()
                         print(f"DEBUG: Re-extraction successful. Length: {len(text)}")
                 except Exception as e:
                     print(f"DEBUG: Re-extraction failed: {e}")

             # Re-check
             app.resume.refresh_from_db()
             
             if not app.resume.latex_code or len(app.resume.latex_code.strip()) < 10:
                 # AUTO-FIX STRATEGY 2: SWITCH TO NEWEST VALID RESUME
                 latest_resume = Resume.objects.filter(user=app.user).exclude(latex_code__exact='').exclude(latex_code__isnull=True).order_by('-uploaded_at').first()
                 if latest_resume and latest_resume.latex_code and len(latest_resume.latex_code.strip()) > 10:
                     print(f"DEBUG: Switching Application {app.tracking_id} from invalid Resume {app.resume.id} to valid Resume {latest_resume.id}")
                     app.resume = latest_resume
                     app.save()
                 else:
                     return Response(
                         {"error": "The selected resume is empty and re-extraction failed. Please re-upload."},
                         status=status.HTTP_400_BAD_REQUEST
                     )
        
        # Call AI
        new_code = generate_ai_code(app.job.description, app.resume.latex_code, prompt)
        
        app.altered_code = new_code
        app.save()
        return Response({"message": "Code Generated", "code": new_code})

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        app = self.get_object()
        
        # 1. Generate Body if missing
        if not app.email_body:
            app.email_body = generate_email_body(app.job.title, app.job.company)
            app.save()
            
        # 2. Allow override from request
        # 2. Allow override from request
        custom_body = request.data.get('email_body')
        if custom_body:
            app.email_body = custom_body
        
        hr_email_override = request.data.get('hr_email')
        if hr_email_override:
            app.hr_email = hr_email_override
            
        app.save()

        if not app.hr_email:
            return Response({"error": "HR Email is required. Please enter an email address."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Send
        try:
            send_smtp_email(app)
            app.status = 'sent'
            app.save()
            return Response({"message": "Email Sent Successfully!"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def generate_email_draft(self, request, pk=None):
        app = self.get_object()
        
        # Generated body if missing
        if not app.email_body:
            app.email_body = generate_email_body(app.job.title, app.job.company)
            app.save()
            
        return Response({
            "email_body": app.email_body,
            "hr_email": app.hr_email
        })

    def perform_create(self, serializer):
        # The frontend will send job_id and resume_id
        job_id = self.request.data.get('job_id')
        resume_id = self.request.data.get('resume_id')
        try:
            job = JobPost.objects.get(id=job_id)
            resume = Resume.objects.get(id=resume_id)
            user = get_user(self.request)
            if user:
                serializer.save(user=user, job=job, resume=resume, status='draft')
        except Exception as e:
            # Fallback or error handling
            pass

from .models import InterviewSession
from django.shortcuts import get_object_or_404

class InterviewViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        # pk is job_id here
        job = get_object_or_404(JobPost, pk=pk)
        user = get_user(request)
        if not user: return Response({"error": "No user"}, status=400)

        session = InterviewSession.objects.create(
            user=user,
            job=job,
            messages="[]"
        )
        # Initial AI greeting
        greeting = f"Hello! I am the Hiring Manager at {job.company}. Thanks for applying to the {job.title} role. Tell me a bit about yourself?"
        session.add_message("ai", greeting)
        
        return Response({
            "session_id": session.id,
            "messages": session.get_messages()
        })

    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        # pk is session_id here
        # We need to find the session, but we might not have user in request.user
        # So check ownership by user retrieved via get_user
        user = get_user(request)
        session = get_object_or_404(InterviewSession, pk=pk)
        
        # Simple security check: if we have a user, ensure session belongs to them
        if user and session.user != user:
             # In lax mode we might ignore this or return 403. 
             # For now, let's allow it if user matches OR if strictly debugging.
             # Strict:
             return Response({"error": "Not your session"}, status=403)
             
        user_msg = request.data.get('message')
        
        if not user_msg:
            return Response({"error": "Message required"}, status=400)
            
        # 1. Save User Message
        session.add_message("user", user_msg)
        
        # 2. Get AI Response
        history = session.get_messages()
        ai_response = get_ai_interview_response(
            session.job.title, 
            session.job.company, 
            history, 
            user_msg
        )
        
        # 3. Save AI Message
        session.add_message("ai", ai_response)
        
        return Response({
            "messages": session.get_messages()
        })

    @action(detail=True, methods=['post'])
    def analyze_answer(self, request, pk=None):
        """
        Deep analysis of a specific Q&A pair.
        """
        session = get_object_or_404(InterviewSession, pk=pk)
        question = request.data.get('question')
        answer = request.data.get('answer')
        
        if not question or not answer:
            return Response({"error": "Question and Answer required"}, status=400)
            
        analysis = get_answer_analysis(question, answer, session.job.description)
        return Response(analysis)
