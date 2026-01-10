from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views   # ← THIS LINE WAS MISSING!
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('jobhunter.api_urls')),  # New API Routes
    path('', include('jobhunter.urls')),

    # Login / Logout
    path('login/', auth_views.LoginView.as_view(template_name='jobhunter/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)