from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Note, ResumeAnalysis, UserRegisterData, Resume, Skill, Experience, 
    Responsibility, Education, Project, Language, Interest, 
    GeneratedResumeSet, GeneratedResume
)
import base64

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRegisterData
        fields = ['user', 'full_name', 'email', 'mobile', 'dob', 'user_type']
        extra_kwargs = {'user': {'write_only': True}}
    
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = "__all__"
        extra_kwargs = {"author": {"read_only": True}}

class NewsQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(default=1, min_value=1)
    topic = serializers.CharField(required=False, allow_blank=True)

class ResumeAnalysisSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ResumeAnalysis
        fields = ['id', 'username', 'resume_file', 'job_description', 
                 'analysis_time', 'parsed_data', 'analysis_results',
                 'ats_score', 'matched_keywords', 'missing_keywords',
                 'recommendations','education']
        read_only_fields = ['analysis_time', 'parsed_data', 'analysis_results',
                          'ats_score', 'matched_keywords', 'missing_keywords',
                          'recommendations']

class ResponsibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsibility
        fields = ['id', 'description']

class ExperienceSerializer(serializers.ModelSerializer):
    responsibilities = ResponsibilitySerializer(many=True)
    
    class Meta:
        model = Experience
        fields = ['id', 'job_title', 'company', 'location', 'duration', 'responsibilities']

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'level']

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'institution', 'degree', 'year', 'grade']

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'tech_stack', 'github_link']

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'name']

class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ['id', 'name']

class ResumeSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, required=False)
    experiences = ExperienceSerializer(many=True, required=False)
    educations = EducationSerializer(many=True, required=False)
    projects = ProjectSerializer(many=True, required=False)
    languages = LanguageSerializer(many=True, required=False)
    interests = InterestSerializer(many=True, required=False)
    
    class Meta:
        model = Resume
        fields = [
            'id', 'full_name', 'email', 'phone', 'location', 
            'linkedin_url', 'github_url', 'portfolio_url', 'summary', 'profile_pic',
            'skills', 'experiences', 'educations', 'projects', 
            'languages', 'interests', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        experiences_data = validated_data.pop('experiences', [])
        educations_data = validated_data.pop('educations', [])
        projects_data = validated_data.pop('projects', [])
        languages_data = validated_data.pop('languages', [])
        interests_data = validated_data.pop('interests', [])
        
        resume = Resume.objects.create(**validated_data)
        
        for skill_data in skills_data:
            Skill.objects.create(resume=resume, **skill_data)
            
        for exp_data in experiences_data:
            responsibilities_data = exp_data.pop('responsibilities', [])
            experience = Experience.objects.create(resume=resume, **exp_data)
            for resp_data in responsibilities_data:
                Responsibility.objects.create(experience=experience, **resp_data)
                
        for edu_data in educations_data:
            Education.objects.create(resume=resume, **edu_data)
            
        for proj_data in projects_data:
            Project.objects.create(resume=resume, **proj_data)
            
        for lang_data in languages_data:
            Language.objects.create(resume=resume, **lang_data)
            
        for interest_data in interests_data:
            Interest.objects.create(resume=resume, **interest_data)
            
        return resume

# NEW: Generated Resume Serializers

class GeneratedResumeSerializer(serializers.ModelSerializer):
    template_info = serializers.ReadOnlyField(source='template_display_info')
    thumbnail_base64 = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedResume
        fields = [
            'id', 'template_name', 'template_info', 'created_at', 
            'download_count', 'pdf_filename', 'pdf_size',
            'thumbnail_base64', 'download_url'
        ]
        read_only_fields = ['id', 'created_at', 'download_count', 'pdf_size']
    
    def get_thumbnail_base64(self, obj):
        """Convert thumbnail binary data to base64 string"""
        if obj.thumbnail_image:
            thumbnail_base64 = base64.b64encode(obj.thumbnail_image).decode('utf-8')
            return f"data:image/png;base64,{thumbnail_base64}"
        return None
    
    def get_download_url(self, obj):
        """Generate download URL for the resume"""
        return f"/api/resumes/download/{obj.id}/"

class GeneratedResumeSetSerializer(serializers.ModelSerializer):
    templates = GeneratedResumeSerializer(many=True, read_only=True)
    resume_name = serializers.CharField(source='resume.full_name', read_only=True)
    resume_email = serializers.CharField(source='resume.email', read_only=True)
    
    class Meta:
        model = GeneratedResumeSet
        fields = [
            'id', 'created_at', 'updated_at', 'is_active',
            'resume_name', 'resume_email', 'templates'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

# Serializer for resume generation request
class ResumeGenerationRequestSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField(required=False)
    personalDetails = serializers.DictField(required=False)
    summary = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.ListField(required=False)
    experience = serializers.ListField(required=False)
    education = serializers.ListField(required=False)
    projects = serializers.ListField(required=False)
    languages = serializers.ListField(required=False)
    interests = serializers.ListField(required=False)
    profile_pic = serializers.CharField(required=False, allow_blank=True)
    
    def validate_personalDetails(self, value):
        """Validate personal details structure"""
        if value:
            required_fields = ['fullName', 'email', 'phone']
            for field in required_fields:
                if not value.get(field):
                    raise serializers.ValidationError(f"{field} is required in personalDetails")
        return value

# Bulk operations serializer
class BulkResumeDeleteSerializer(serializers.Serializer):
    resume_set_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    
    def validate_resume_set_ids(self, value):
        """Validate that all resume sets exist and belong to the user"""
        user = self.context['request'].user
        existing_sets = GeneratedResumeSet.objects.filter(
            id__in=value,
            user=user
        ).values_list('id', flat=True)
        
        if len(existing_sets) != len(value):
            missing_ids = set(value) - set(existing_sets)
            raise serializers.ValidationError(
                f"Resume sets not found or not owned by user: {missing_ids}"
            )
        return value