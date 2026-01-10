from django.core.management.base import BaseCommand
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.utils import timezone
from jobhunter.models import OutreachCampaign, EmailDraft, JobPost, UserProfile, User
from jobhunter.outreach_engine import generate_outreach_drafts
from jobhunter.email_monitor import InboxMonitor
import time
import schedule

class Command(BaseCommand):
    help = 'Runs the Outreach Automation System (Generation -> Approval -> Sending)'

    def add_arguments(self, parser):
        parser.add_argument('--mode', type=str, default='schedule', help='generate | monitor | send | schedule')

    def handle(self, *args, **options):
        mode = options['mode']
        
        if mode == 'generate':
            self.run_generation()
        elif mode == 'monitor':
            self.run_monitor()
        elif mode == 'send':
            self.run_sending()
        elif mode == 'schedule':
            self.run_schedule()

    def run_schedule(self):
        self.stdout.write("Starting Outreach Scheduler...")
        
        # 4:00 PM Daily Generation
        schedule.every().day.at("16:00").do(self.run_generation)
        
        # Monitor every 5 minutes
        schedule.every(5).minutes.do(self.run_monitor)
        
        # Try sending approved every 30 minutes
        schedule.every(30).minutes.do(self.run_sending)
        
        while True:
            schedule.run_pending()
            time.sleep(60)

    def run_generation(self):
        self.stdout.write("Running Generation Pipeline...")
        # Assume single user for MVP
        user = User.objects.first()
        try:
            profile = user.profile
        except:
            self.stdout.write("User has no profile. Stopping.")
            return

        # Check safety: Don't generate if active campaign exists
        if OutreachCampaign.objects.filter(status__in=['gathering', 'waiting_approval']).exists():
             self.stdout.write("Active campaign exists. Skipping generation.")
             return

        email_text, campaign = generate_outreach_drafts(profile)
        
        if not campaign:
            self.stdout.write("No jobs found for outreach.")
            return
            
        # Send Approval Email
        try:
            msg = EmailMessage(
                subject=f"🕓 Approval Needed – {campaign.drafts.count()} Job Outreach Emails Ready",
                body=email_text,
                from_email=settings.EMAIL_HOST_USER,
                to=[user.email]
            )
            msg.send()
            
            campaign.status = 'waiting_approval'
            campaign.save()
            self.stdout.write(f"Approval email sent to {user.email}")
        except Exception as e:
            self.stdout.write(f"Failed to send approval email: {e}")

    def run_monitor(self):
        self.stdout.write("Checking Inbox for Approvals...")
        InboxMonitor.check_inbox()

    def run_sending(self):
        self.stdout.write("Running Sending Pipeline...")
        
        # Get Approved Drafts that haven't been sent
        # Safety Check: Limit to 5 per day
        today = timezone.now().date()
        sent_today = EmailDraft.objects.filter(sent_at__date=today).count()
        limit = 5
        
        if sent_today >= limit:
            self.stdout.write(f"Daily limit ({limit}) reached. Stopping.")
            return

        approved_drafts = EmailDraft.objects.filter(status='approved')
        
        for draft in approved_drafts:
            if sent_today >= limit: break
            
            # FINAL SAFETY CHECK
            if not draft.job.hr_email:
                self.stdout.write(f"Skipping {draft.job.company}: No HR Email")
                continue
            
            if draft.job.email_confidence < 0.0: # Disabled for now, or set threshold
                 pass

            self.stdout.write(f"Sending to {draft.job.hr_email}...")
            
            try:
                email = EmailMessage(
                    subject=draft.proposed_subject,
                    body=draft.proposed_body,
                    from_email=settings.EMAIL_HOST_USER,
                    to=[draft.job.hr_email]
                )
                # Attach Resume (Mocking attachment for now as file generation part of engine was mocked)
                # if draft.tailored_resume:
                #    email.attach_file(draft.tailored_resume.path)
                
                email.send()
                
                draft.status = 'sent'
                draft.sent_at = timezone.now()
                draft.save()
                
                sent_today += 1
                
                # Delay between sends
                time.sleep(120) 
                
            except Exception as e:
                self.stdout.write(f"Error sending to {draft.job.company}: {e}")

        # Update Campaign Status
        # If all drafts are processed (sent or rejected), mark campaign completed
