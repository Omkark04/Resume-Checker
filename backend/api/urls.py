from django.urls import path
from . import views
from .news_views import get_tech_news, get_news_categories, get_category_news
from .resume_views import gemini_chat
from .analysis_core import ResumeAnalysisView, UserResumeAnalysesView

urlpatterns = [
    # Authentication endpoints
    path("csrf/", views.get_csrf_token, name="get-csrf"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("check-session/", views.check_session, name="check-session"),
    path("register/", views.UserRegisterApi.as_view(), name="register"),
    
    # Notes endpoints
    path("notes/", views.NoteListCreate.as_view(), name="note-list"),
    path("notes/delete/<int:pk>/", views.NoteDelete.as_view(), name="delete-note"),
    
    # User endpoints
    path("user/profile/", views.user_profile, name="user-profile"),
    path("user/profile-details/", views.user_profile_details, name="user-profile-details"),
    
    # News endpoints
    path("news/", get_tech_news, name="tech-news"),
    path("news/categories/", get_news_categories, name="news-categories"),
    path("news/category/<str:category>/", get_category_news, name="category-news"),
    
    # Chatbot endpoints
    path('chat/', gemini_chat, name='gemini-chat'),
    
    # Resume Analysis endpoints
    path('resume/analyze/', ResumeAnalysisView.as_view(), name='resume_analyze'),
    path('resume/analyses/', UserResumeAnalysesView.as_view(), name='user_resume_analyses'),
    
    # Resume Builder endpoints
    path('resumes/', views.ResumeListCreateView.as_view(), name='resume-list-create'),
    path('resumes/<int:pk>/', views.ResumeRetrieveUpdateDestroyView.as_view(), name='resume-detail'),
    
    # NEW: Enhanced Resume Generation endpoints
    path('resumes/generate-and-store/', views.generate_and_store_resumes, name='generate-and-store-resumes'),
    path('resumes/generated/', views.get_generated_resumes, name='get-generated-resumes'),
    path('resumes/download/<uuid:resume_id>/', views.download_generated_resume, name='download-generated-resume'),
    path('resumes/thumbnail/<uuid:resume_id>/', views.get_resume_thumbnail, name='get-resume-thumbnail'),
    path('resumes/delete-set/<uuid:resume_set_id>/', views.delete_resume_set, name='delete-resume-set'),
    
    # Legacy endpoints (for backwards compatibility)
    path('resumes/generate/', views.generate_resumes, name='generate-resumes'),
    path('resumes/download/<str:template_name>/', views.download_resume, name='download-resume'),
    path('resumes/download-post/<str:template_name>/', views.download_resume_post, name='download-resume-post'),
]