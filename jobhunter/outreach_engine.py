import json
from django.conf import settings
from django.utils import timezone
from .models import JobPost, EmailDraft, OutreachCampaign, UserProfile, Resume
from .utils import client, FREE_MODEL, generate_pdf_from_latex

class SafeResumeTailor:
    """
    Enforces strict rules:
    - Reorder skills
    - Rewrite summary
    - NO adding experience
    - NO changing dates
    """
    
    @staticmethod
    def tailor_resume(profile: UserProfile, job: JobPost) -> str:
        system_prompt = """
        You are a Safe Mode Resume Tailor.
        
        INPUTS:
        1. Base Resume (JSON format)
        2. Job Description
        
        STRICT RULES:
        - You may REORDER items in "skills" to prioritize relevance.
        - You may REWRITE the "summary" to focus on relevant keywords.
        - You may SELECT relevant "projects" from the list (if too many).
        - You MUST NOT change "experience" details (companies, dates, roles).
        - You MUST NOT add false skills.
        
        OUTPUT:
        - Return the Modified JSON.
        """
        
        # Construct Base JSON from Profile
        base_json = {
            "name": profile.full_name,
            "status": profile.current_status,
            "skills": profile.skills,
            "experience": profile.experience,
            "projects": profile.projects
        }
        
        user_msg = f"""
        JOB: {job.title} at {job.company}
        DESCRIPTION: {job.description[:3000]}
        
        BASE RESUME JSON:
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
            print(f"Tailoring Error: {e}")
            return base_json # Fallback

    @staticmethod
    def json_to_latex(resume_json):
        # reuse logic or simplified template
        # For prototype, we will return a simple string representation or reuse utils logic if adaptable
        # Let's assume we map back to the standard keys expected by `utils.generate_latex_via_jinja`
        # We need to ensure the profile JSON structure matches what utils expects
        return resume_json # Placeholder, integration with utils.generate_latex_via_jinja needed


class ApprovalEmailGenerator:
    """
    Generates the Single Daily Email for User Approval
    """
    
    @staticmethod
    def generate_email_content(campaign: OutreachCampaign, drafts: list[EmailDraft]) -> str:
        lines = []
        lines.append(f"Subject: 🕓 Approval Needed – {len(drafts)} Job Outreach Emails Ready\n")
        lines.append("Here are your daily drafted emails for approval.\n")
        lines.append("-" * 30)
        
        for i, draft in enumerate(drafts, 1):
            lines.append(f"\nEMAIL #{i}")
            lines.append(f"Company: {draft.job.company}")
            lines.append(f"Role: {draft.job.title}")
            lines.append(f"HR Email: {draft.job.hr_email} ({draft.job.verification_status})")
            lines.append(f"Job Link: {draft.job.link}")
            lines.append(f"Subject: {draft.proposed_subject}")
            lines.append("\n--- DRAFT BODY ---")
            lines.append(draft.proposed_body)
            lines.append("------------------")
            lines.append(f"\nREPLY TO APPROVE:  APPROVE {i}")
            lines.append(f"REPLY TO REJECT:   REJECT {i}")
            lines.append(f"REPLY TO EDIT:     EDIT {i}: <instructions>")
            lines.append("\n" + "="*30)
            
        return "\n".join(lines)


def generate_outreach_drafts(user_profile: UserProfile, job_limit=5):
    """
    Main Pipeline:
    1. Select Jobs
    2. Tailor Resume
    3. Draft Email
    4. Create Campaign
    """
    
    # 1. Select Jobs (Unverified or Verified, ignoring confidence for now)
    # Filter logic: Not applied yet, has HR email
    candidates = JobPost.objects.exclude(
        hr_email__isnull=True
    ).exclude(
        hr_email=''
    )[:job_limit] # simplistic selection
    
    if not candidates:
        return None
        
    campaign = OutreachCampaign.objects.create(user=user_profile.user, status='gathering')
    
    drafts = []
    
    for job in candidates:
        # A. Tailor Resume JSON
        tailored_json = SafeResumeTailor.tailor_resume(user_profile, job)
        
        # B. Generate Email Draft
        # We invoke the AI to write the email
        email_prompt = f"Write a cold email for {job.title} at {job.company}. Keep it under 100 words."
        try:
             res = client.chat.completions.create(
                model=FREE_MODEL,
                messages=[{"role": "user", "content": email_prompt}],
                max_tokens=300
             )
             body = res.choices[0].message.content.strip()
             subject = f"Application for {job.title}"
        except:
            body = "Error generating draft."
            subject = "Application"

        # C. Save Draft
        draft = EmailDraft.objects.create(
            campaign=campaign,
            job=job,
            proposed_subject=subject,
            proposed_body=body,
            status='pending',
            # tailored_resume=... # Need to generate PDF here
        )
        drafts.append(draft)
        
    # Generate content
    email_text = ApprovalEmailGenerator.generate_email_content(campaign, drafts)
    
    return email_text, campaign
