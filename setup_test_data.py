import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jobbot.settings')
django.setup()

from django.contrib.auth.models import User
from jobhunter.models import UserProfile, JobPost, OutreachCampaign

def setup():
    print("🚀 Setting up Test Data...")
    
    # 1. Get User
    user = User.objects.first()
    if not user:
        print("❌ No user found! Create a superuser first: python manage.py createsuperuser")
        return

    print(f"👤 Found User: {user.email}")

    # 2. Create/Get Profile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "full_name": "Test User",
            "current_status": "Senior Developer",
            "skills": "Python, Django, React, AWS",
            "base_resume_text": "Experienced Python developer with 5 years in building scalable web apps.",
            "experience": [{"company": "Tech Corp", "role": "Senior Dev", "years": "2020-Present"}]
        }
    )
    if created:
        print("✅ Created UserProfile")
    else:
        print("ℹ️ UserProfile already exists")

    # 3. Create Dummy Job (Safe Mode: HR Email = User Email)
    job, created = JobPost.objects.get_or_create(
        title="Test Software Engineer",
        company="Test Company Inc",
        defaults={
            "job_id": "TEST_001",
            "description": "We are looking for a Python expert to test our email systems.",
            "link": "https://example.com/job/1",
            "hr_email": user.email, # SAFETY: Send to self
            "hr_email_source": "Manual Test",
            "verification_status": "verified"
        }
    )
    
    # Update email just in case it was different
    job.hr_email = user.email
    job.save()
    
    print(f"✅ Created/Updated Test Job: {job.title}")
    print(f"   HR Email set to: {job.hr_email} (So you receive the 'application')")

    # 4. Clear old campaigns to force new generation
    deleted = OutreachCampaign.objects.filter(status__in=['gathering', 'waiting_approval']).delete()
    if deleted[0] > 0:
        print("🧹 Cleared active campaigns to allow fresh generation.")

    print("\n🎉 Setup Complete! You are ready to test.")
    print("Run: python manage.py run_outreach --mode=generate")

if __name__ == "__main__":
    setup()
