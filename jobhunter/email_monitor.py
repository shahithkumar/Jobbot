import imaplib
import email
import re
from django.conf import settings
from .models import OutreachCampaign, EmailDraft

class InboxMonitor:
    """
    Connects to IMAP to check for APPROVE/REJECT commands from the user.
    """
    
    IMAP_SERVER = 'imap.gmail.com'
    
    @staticmethod
    def parse_command(body_text):
        """
        Extracts commands like: "APPROVE 1", "REJECT 2", "EDIT 1: Make it shorter"
        Returns list of (action, draft_index, instruction)
        """
        commands = []
        # Regex for APPROVE/REJECT N or EDIT N: content
        # Case insensitive
        pattern = re.compile(r'(APPROVE|REJECT|EDIT)\s+(\d+)(?::\s*(.*))?', re.IGNORECASE)
        
        for line in body_text.splitlines():
            match = pattern.match(line.strip())
            if match:
                action = match.group(1).upper()
                index = int(match.group(2))
                instruction = match.group(3) or ""
                commands.append((action, index, instruction))
                
        return commands

    @staticmethod
    def check_inbox():
        try:
            mail = imaplib.IMAP4_SSL(InboxMonitor.IMAP_SERVER)
            mail.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            mail.select('inbox')
            
            # Search for replies (Unseen)
            # ideally we search by subject "Re: 🕓 Approval Needed" 
            # OR we just check all unseen from our user (if self-sending)
            # For this MVP, let's search UNSEEN messages
            
            status, messages = mail.search(None, '(UNSEEN)')
            
            for num in messages[0].split():
                status, data = mail.fetch(num, '(RFC822)')
                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                subject = msg["Subject"]
                
                # Verify it is a reply to our campaign
                if "Approval Needed" not in subject:
                    continue
                    
                # Get Body
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode()
                            break
                else:
                    body = msg.get_payload(decode=True).decode()
                
                # Parse Commands
                commands = InboxMonitor.parse_command(body)
                print(f"Found commands in email {num}: {commands}")
                
                # Execute Commands
                if commands:
                    InboxMonitor.execute_commands(commands)
                    
            mail.close()
            mail.logout()
            
        except Exception as e:
            print(f"IMAP Error: {e}")

    @staticmethod
    def execute_commands(commands):
        for action, index, instruction in commands:
            # We need to map Index 1..N to specific drafts.
            # This requires knowing WHICH campaign this reply belongs to.
            # Realistically we need the In-Reply-To header or search active campaigns.
            # For MVP, let's assume we find the LATEST 'waiting_approval' campaign.
            
            campaign = OutreachCampaign.objects.filter(status='waiting_approval').last()
            if not campaign:
                print("No active campaign found for this reply.")
                continue
            
            # Get draft by 'index' (Assuming drafts are ordered by ID or creation)
            # The email generator did: enumerate(drafts, 1)
            drafts = list(campaign.drafts.all().order_by('id'))
            
            if 1 <= index <= len(drafts):
                draft = drafts[index-1]
                
                if action == 'APPROVE':
                    draft.status = 'approved'
                    print(f"Draft {draft.id} APPROVED")
                elif action == 'REJECT':
                    draft.status = 'rejected'
                    print(f"Draft {draft.id} REJECTED")
                elif action == 'EDIT':
                    draft.user_feedback = instruction
                    draft.status = 'pending' # Remains pending until regeneration
                    print(f"Draft {draft.id} needs edit: {instruction}")
                
                draft.save()
            else:
                print(f"Index {index} out of range for campaign {campaign.id}")
