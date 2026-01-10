from django.db import models
from django.contrib.auth.models import User
import json

class UserProfile(models.Model):
    """
    Source of Truth for the Automated Outreach System.
    Read-only for AI unless explicitly edited by the user.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=200)
    current_status = models.CharField(max_length=100, help_text="e.g. Student, Fresher, Experience + years")
    
    # Text-based storage for simple constraints
    skills = models.TextField(help_text="Comma separated skills")
    portfolio_links = models.TextField(blank=True, help_text="One per line")
    availability = models.CharField(max_length=100, default="Immediate")
    
    # Base Resume (PDF + Text)
    base_resume_file = models.FileField(upload_to='base_resumes/', null=True, blank=True)
    base_resume_text = models.TextField(help_text="Plain text version for AI processing")

    # Structured Data (JSON)
    # [{"name": "Project A", "tech": "Python", "desc": "..."}]
    projects = models.JSONField(default=list, blank=True)
    # [{"company": "Corp A", "role": "Dev", "years": "2020-2022"}]
    experience = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Profile: {self.full_name}"

class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    file = models.FileField(upload_to='resumes/', null=True, blank=True)
    latex_code = models.TextField(blank=True)
    description = models.TextField()
    keywords = models.CharField(max_length=500, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class JobPost(models.Model):
    VERIFICATION_STATUS = [
        ('unverified', 'Unverified'),
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('human_required', 'Requires Human Verification'),
    ]

    job_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True
    )

    # ✅ NO LENGTH LIMIT
    title = models.TextField()
    company = models.TextField()

    description = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    employment_type = models.CharField(max_length=100, null=True, blank=True)

    # 🔥 FIXED HERE
    link = models.URLField(max_length=1000)
    career_page = models.URLField(max_length=1000, null=True, blank=True)

    source = models.CharField(max_length=50, default="Google Jobs")
    scraped_at = models.DateTimeField(auto_now_add=True)
    
    # OUTREACH FIELDS
    hr_email = models.EmailField(blank=True, null=True)
    hr_email_source = models.CharField(max_length=100, blank=True)
    email_confidence = models.FloatField(default=0.0) # 0.0 to 1.0
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS, default='unverified')

    def __str__(self):
        return f"{self.title[:60]} at {self.company[:40]}"


class Application(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE)

    altered_code = models.TextField(blank=True)
    final_resume_file = models.FileField(
        upload_to='final_resumes/',
        null=True,
        blank=True
    )

    hr_name = models.CharField(max_length=100, blank=True)
    hr_email = models.EmailField(blank=True)
    email_body = models.TextField(blank=True)

    status = models.CharField(max_length=20, default='draft')
    sent_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    tracking_id = models.AutoField(primary_key=True)

    def __str__(self):
        return f"Application #{self.tracking_id}"

class InterviewSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE)
    # Store messages as a JSON string or ideally JSONField if using Postgres (TEXT for SQLite/Compatibility)
    # Format: [{"role": "ai", "content": "..."}, {"role": "user", "content": "..."}]
    messages = models.TextField(default="[]") 
    started_at = models.DateTimeField(auto_now_add=True)
    
    def get_messages(self):
        import json
        try:
            return json.loads(self.messages)
        except:
            return []

    def add_message(self, role, content):
        import json
        msgs = self.get_messages()
        msgs.append({"role": role, "content": content})
        self.messages = json.dumps(msgs)
        self.save()

# ==========================================
# AUTOMATED OUTREACH CAMPAIGNS
# ==========================================

class OutreachCampaign(models.Model):
    """
    Represents a daily batch of outreach emails (Max 5).
    """
    CAMPAIGN_STATUS = [
        ('gathering', 'Gathering Jobs'),
        ('waiting_approval', 'Waiting for Human Approval'),
        ('approved', 'Approved'),
        ('completed', 'Sent'),
        ('cancelled', 'Cancelled')
    ]

    date = models.DateField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=CAMPAIGN_STATUS, default='gathering')
    
    # Message-ID of the approval email sent to the user (for threading/tracking)
    approval_email_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Campaign {self.date} - {self.status}"

class EmailDraft(models.Model):
    """
    A specific email proposal for a job within a campaign.
    """
    DRAFT_STATUS = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('sent', 'Sent to HR')
    ]

    campaign = models.ForeignKey(OutreachCampaign, on_delete=models.CASCADE, related_name='drafts')
    job = models.ForeignKey(JobPost, on_delete=models.CASCADE)
    
    # AI Generated Content
    proposed_subject = models.CharField(max_length=255)
    proposed_body = models.TextField()
    
    # Alternative Options (for A/B testing or user choice)
    alt_subject = models.CharField(max_length=255, blank=True)
    alt_body = models.TextField(blank=True)

    # The PDF to be attached
    tailored_resume = models.FileField(upload_to='outreach_resumes/')
    
    status = models.CharField(max_length=20, choices=DRAFT_STATUS, default='pending')
    user_feedback = models.TextField(blank=True, help_text="Edit instructions from email reply")
    
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Draft for {self.job.company} ({self.status})"
