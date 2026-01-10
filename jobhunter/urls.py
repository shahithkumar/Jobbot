from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('upload-resume/', views.upload_resume, name='upload_resume'),
    path('search-jobs/', views.search_jobs, name='search_jobs'),
    path('add-manual-job/', views.add_manual_job, name='add_manual_job'),
    path('job/<int:job_id>/pick-resume/', views.pick_resume, name='pick_resume'),
    path('app/<int:app_id>/generate-code/', views.generate_code, name='generate_code'),
    path('app/<int:app_id>/upload-final/', views.upload_final_resume, name='upload_final_resume'),
    path('app/<int:app_id>/send-email/', views.send_email, name='send_email'),
    path('apply-all/', views.apply_all, name='apply_all'),
]

