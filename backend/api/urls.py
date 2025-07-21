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
    
    # Notes endpoints
    path("notes/", views.NoteListCreate.as_view(), name="note-list"),
    path("notes/delete/<int:pk>/", views.NoteDelete.as_view(), name="delete-note"),
    
    # User endpoints
    path("user/profile/", views.user_profile, name="user-profile"),  # Updated to use function-based view
    
    # News endpoints
    path("news/", get_tech_news, name="tech-news"),
    path("news/categories/", get_news_categories, name="news-categories"),
    path("news/category/<str:category>/", get_category_news, name="category-news"),

    # Chatbot endpoints
    path('chat/', gemini_chat, name='gemini-chat'),

    # Resume Analysis endpoints
    path('resume/analyze/', ResumeAnalysisView.as_view(), name='resume_analyze'),
    path('resume/analyses/', UserResumeAnalysesView.as_view(), name='user_resume_analyses'),
    
    # User registration
    path('register/', views.CreateUserView.as_view(), name='register'),
]