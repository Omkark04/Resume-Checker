from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, NoteSerializer, NewsQuerySerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .news_service import NewsService
import logging
from .resume_service import ResumeAssistantService
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token

logger = logging.getLogger(__name__)

# Authentication Views
@api_view(['GET'])
def get_csrf_token(request):
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            'detail': 'Login successful',
            'username': user.username
        })
    return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'detail': 'Logout successful'})

@api_view(['GET'])
def check_session(request):
    if request.user.is_authenticated:
        return Response({
            'isAuthenticated': True,
            'username': request.user.username
        })
    return Response({'isAuthenticated': False})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    return Response({
        'username': request.user.username,
        'email': request.user.email
    })

# Notes Views
class NoteListCreate(generics.ListCreateAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)

# User Registration
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# News Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tech_news(request):
    """
    Fetch technology and job-related news
    """
    page = request.GET.get('page', 1)
    topic = request.GET.get('topic', '')
    
    try:
        page = int(page)
    except ValueError:
        page = 1
    
    try:
        news_service = NewsService()
        
        if topic:
            result = news_service.search_specific_topic(topic, page)
        else:
            result = news_service.get_tech_job_news(page)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"News fetch error: {str(e)}")
        return Response({
            'success': False,
            'articles': [],
            'error': 'Failed to fetch news'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_comprehensive_news(request):
    """
    Fetch news from multiple pages for comprehensive results
    """
    try:
        news_service = NewsService()
        result = news_service.get_multiple_pages(max_pages=5)
        return Response(result)
        
    except Exception as e:
        logger.error(f"Comprehensive news fetch error: {str(e)}")
        return Response({
            'success': False,
            'articles': [],
            'error': 'Failed to fetch comprehensive news'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)