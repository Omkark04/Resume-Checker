from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import (
    UserSerializer, NoteSerializer, NewsQuerySerializer, 
    UserRegisterSerializer, ResumeSerializer, ResumeAnalysisSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note, UserRegisterData, Resume, ResumeAnalysis, GeneratedResumeSet, GeneratedResume
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .news_service import NewsService
import logging
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .resume_generator import ResumeGenerator
from django.http import FileResponse, HttpResponse
import tempfile
import os
import base64
from io import BytesIO
from django.db import transaction

logger = logging.getLogger(__name__)

# Authentication Views
class UserRegisterApi(APIView):
    permission_classes=[AllowAny]
    
    def post(self, request):
        user_serializer = UserSerializer(data={
            'username': request.data.get('username'),
            'password': request.data.get('password')
        })
        
        if not user_serializer.is_valid():
            return Response({
                "status": False,
                "errors": user_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = user_serializer.save()
        
        profile_data = {
            'user': user.id,
            'full_name': request.data.get('full_name'),
            'email': request.data.get('email'),
            'mobile': request.data.get('mobile'),
            'dob': request.data.get('dob'),
            'user_type': request.data.get('user_type')
        }
        
        profile_serializer = UserRegisterSerializer(data=profile_data)
        if profile_serializer.is_valid():
            profile_serializer.save()
            return Response({
                "status": True,
                "message": "User registered successfully",
                "user": user_serializer.data,
                "profile": profile_serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            user.delete()
            return Response({
                "status": False,
                "errors": profile_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

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
        return Note.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(author=self.request.user)

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# News Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tech_news(request):
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
    
# Profile Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_details(request):
    try:
        user = request.user
        profile = UserRegisterData.objects.get(user=user)
        
        return Response({
            'username': user.username,
            'email': user.email,
            'full_name': profile.full_name,
            'mobile': profile.mobile,
            'dob': profile.dob,
            'user_type': profile.user_type,
            'created_at': profile.created_at
        })
        
    except UserRegisterData.DoesNotExist:
        return Response({
            'username': user.username,
            'email': user.email,
            'detail': 'Extended profile not found'
        }, status=200)

# Resume Builder Views
class ResumeListCreateView(generics.ListCreateAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ResumeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

# NEW: Enhanced Resume Generation with Database Storage

def _prepare_resume_data_for_generator(resume_data):
    """Convert resume data from frontend format to generator format"""
    # Handle nested personal details
    personal_details = resume_data.get('personalDetails', {})
    
    processed_data = {
        'full_name': personal_details.get('fullName', '') or resume_data.get('full_name', ''),
        'email': personal_details.get('email', '') or resume_data.get('email', ''),
        'phone': personal_details.get('phone', '') or resume_data.get('phone', ''),
        'location': personal_details.get('location', '') or resume_data.get('location', ''),
        'linkedin_url': personal_details.get('linkedIn', '') or resume_data.get('linkedin_url', ''),
        'github_url': personal_details.get('github', '') or resume_data.get('github_url', ''),
        'portfolio_url': personal_details.get('portfolio', '') or resume_data.get('portfolio_url', ''),
        'summary': resume_data.get('summary', ''),
        'profile_pic': resume_data.get('profile_pic', ''),
        'skills': resume_data.get('skills', []),
        'experiences': resume_data.get('experience', []) or resume_data.get('experiences', []),
        'educations': resume_data.get('education', []) or resume_data.get('educations', []),
        'projects': resume_data.get('projects', []),
        'languages': resume_data.get('languages', []),
        'interests': resume_data.get('interests', [])
    }
    
    return processed_data

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_and_store_resumes(request):
    """Generate resumes and store them in database with thumbnails"""
    try:
        resume_data = request.data
        user = request.user
        
        # Get or create Resume record
        resume_id = resume_data.get('resume_id')
        if resume_id:
            try:
                resume = Resume.objects.get(id=resume_id, user=user)
            except Resume.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Resume not found'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # Create a new resume record if needed
            resume_serializer = ResumeSerializer(data={
                'full_name': resume_data.get('personalDetails', {}).get('fullName', ''),
                'email': resume_data.get('personalDetails', {}).get('email', ''),
                'phone': resume_data.get('personalDetails', {}).get('phone', ''),
                'location': resume_data.get('personalDetails', {}).get('location', ''),
                'linkedin_url': resume_data.get('personalDetails', {}).get('linkedIn', ''),
                'github_url': resume_data.get('personalDetails', {}).get('github', ''),
                'portfolio_url': resume_data.get('personalDetails', {}).get('portfolio', ''),
                'summary': resume_data.get('summary', ''),
                'skills': resume_data.get('skills', []),
                'experiences': resume_data.get('experience', []),
                'educations': resume_data.get('education', []),
                'projects': resume_data.get('projects', []),
                'languages': resume_data.get('languages', []),
                'interests': resume_data.get('interests', [])
            })
            
            if resume_serializer.is_valid():
                resume = resume_serializer.save(user=user)
            else:
                return Response({
                    'success': False,
                    'error': 'Invalid resume data',
                    'details': resume_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare data for generator
        processed_data = _prepare_resume_data_for_generator(resume_data)
        
        # Generate resumes
        generator = ResumeGenerator(processed_data)
        templates_data = generator.generate_all_templates()
        
        if not templates_data:
            return Response({
                'success': False,
                'error': 'Failed to generate any resume templates'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Store in database
        with transaction.atomic():
            # Create new resume set
            resume_set = GeneratedResumeSet.objects.create(
                resume=resume,
                user=user
            )
            
            # Store each template
            generated_resumes = []
            for template_data in templates_data:
                generated_resume = GeneratedResume.objects.create(
                    resume_set=resume_set,
                    template_name=template_data['template_name'],
                    pdf_file=template_data['pdf_data'],
                    pdf_filename=template_data['pdf_filename'],
                    pdf_size=len(template_data['pdf_data']),
                    thumbnail_image=template_data['thumbnail_data'],
                    thumbnail_filename=template_data['thumbnail_filename'],
                    thumbnail_size=len(template_data['thumbnail_data'])
                )
                
                # Convert thumbnail to base64 for frontend
                thumbnail_base64 = base64.b64encode(template_data['thumbnail_data']).decode('utf-8')
                
                generated_resumes.append({
                    'id': str(generated_resume.id),
                    'template_name': generated_resume.template_name,
                    'template_info': generated_resume.template_display_info,
                    'thumbnail': f"data:image/png;base64,{thumbnail_base64}",
                    'download_url': f"/api/resumes/download/{generated_resume.id}/",
                    'created_at': generated_resume.created_at.isoformat(),
                    'download_count': generated_resume.download_count
                })
        
        return Response({
            'success': True,
            'resume_set_id': str(resume_set.id),
            'templates': generated_resumes,
            'message': f'Successfully generated {len(generated_resumes)} resume templates'
        })
        
    except Exception as e:
        logger.error(f"Resume generation error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_generated_resumes(request):
    """Get all generated resume templates for the user"""
    try:
        user = request.user
        resume_sets = GeneratedResumeSet.objects.filter(
            user=user, 
            is_active=True
        ).prefetch_related('templates')
        
        all_templates = []
        for resume_set in resume_sets:
            for template in resume_set.templates.all():
                # Convert thumbnail to base64
                thumbnail_base64 = base64.b64encode(template.thumbnail_image).decode('utf-8')
                
                all_templates.append({
                    'id': str(template.id),
                    'resume_set_id': str(resume_set.id),
                    'template_name': template.template_name,
                    'template_info': template.template_display_info,
                    'thumbnail': f"data:image/png;base64,{thumbnail_base64}",
                    'download_url': f"/api/resumes/download/{template.id}/",
                    'created_at': template.created_at.isoformat(),
                    'download_count': template.download_count,
                    'resume_name': resume_set.resume.full_name
                })
        
        return Response({
            'success': True,
            'templates': all_templates
        })
        
    except Exception as e:
        logger.error(f"Error fetching generated resumes: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_generated_resume(request, resume_id):
    """Download a specific generated resume PDF"""
    try:
        # Get the generated resume
        generated_resume = get_object_or_404(
            GeneratedResume, 
            id=resume_id, 
            resume_set__user=request.user
        )
        
        # Increment download count
        generated_resume.increment_download_count()
        
        # Create file response
        response = HttpResponse(
            generated_resume.pdf_file,
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="{generated_resume.pdf_filename}"'
        
        return response
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_resume_thumbnail(request, resume_id):
    """Get thumbnail image for a specific resume"""
    try:
        generated_resume = get_object_or_404(
            GeneratedResume, 
            id=resume_id, 
            resume_set__user=request.user
        )
        
        response = HttpResponse(
            generated_resume.thumbnail_image,
            content_type='image/png'
        )
        response['Content-Disposition'] = f'inline; filename="{generated_resume.thumbnail_filename}"'
        
        return response
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_resume_set(request, resume_set_id):
    """Delete a resume set and all its templates"""
    try:
        resume_set = get_object_or_404(
            GeneratedResumeSet,
            id=resume_set_id,
            user=request.user
        )
        
        resume_set.delete()
        
        return Response({
            'success': True,
            'message': 'Resume set deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Legacy endpoints (for backwards compatibility)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_resumes(request):
    """Legacy endpoint - redirects to new generate_and_store_resumes"""
    return generate_and_store_resumes(request)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def download_resume(request, template_name):
    """Legacy download endpoint - for backwards compatibility"""
    try:
        if request.method == 'POST':
            resume_data = request.data
        else:
            # Handle GET with query params (legacy support)
            resume_data = dict(request.GET.items())
        
        processed_data = _prepare_resume_data_for_generator(resume_data)
        generator = ResumeGenerator(processed_data)
        
        if template_name == 'modern':
            template = generator.generate_template1()
        elif template_name == 'classic':
            template = generator.generate_template2()
        elif template_name == 'minimalist':
            template = generator.generate_template3()
        else:
            return Response({'error': 'Invalid template name'}, status=400)

        response = HttpResponse(template['pdf'].getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{template_name}_resume.pdf"'
        return response
        
    except Exception as e:
        logger.error(f"Legacy download error: {str(e)}")
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated]) 
def download_resume_post(request, template_name):
    """Legacy POST download endpoint"""
    return download_resume(request, template_name)