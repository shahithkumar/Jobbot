from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import ResumeViewSet, JobPostViewSet, ApplicationViewSet, InterviewViewSet

router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'jobs', JobPostViewSet, basename='job')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'interview', InterviewViewSet, basename='interview')

from .auth_views import api_login, api_logout, get_csrf_token
from .debug_views import debug_log_view

urlpatterns = [
    path('', include(router.urls)),
    path('login/', api_login, name='api_login'),
    path('logout/', api_logout, name='api_logout'),
    path('csrf/', get_csrf_token, name='get_csrf_token'),
    path('debug_log/', debug_log_view, name='debug_log'),
]
