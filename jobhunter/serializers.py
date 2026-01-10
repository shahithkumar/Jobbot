from rest_framework import serializers
from .models import Resume, JobPost, Application

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'name', 'file', 'description', 'keywords', 'uploaded_at', 'latex_code']
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True}
        }

class JobPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPost
        fields = '__all__'

class ApplicationSerializer(serializers.ModelSerializer):
    job = JobPostSerializer(read_only=True)
    resume = ResumeSerializer(read_only=True)

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['user', 'job', 'resume', 'status', 'sent_at']
