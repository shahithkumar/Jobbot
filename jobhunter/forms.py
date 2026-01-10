from django import forms
from .models import Resume, JobPost, Application

class ResumeForm(forms.ModelForm):
    class Meta:
        model = Resume
        fields = ['name', 'file', 'latex_code', 'description', 'keywords']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'latex_code': forms.Textarea(attrs={'rows': 10}),
        }

class JobSearchForm(forms.Form):
    keywords = forms.CharField(max_length=100)
    location = forms.CharField(max_length=100, required=False)

class ManualJobForm(forms.ModelForm):
    class Meta:
        model = JobPost
        fields = ['title', 'company', 'link', 'description']
        widgets = {'description': forms.Textarea(attrs={'rows': 5})}

class GenerateCodeForm(forms.Form):
    prompt = forms.CharField(widget=forms.Textarea(attrs={'rows': 6}))

class EmailForm(forms.ModelForm):
    email_template = forms.CharField(widget=forms.Textarea(attrs={'rows': 6}))
    class Meta:
        model = Application
        fields = ['hr_name', 'hr_email', 'email_template']