from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Note, ResumeAnalysis, UserRegisterData, Resume, Skill, Experience, 
    Responsibility, Education, Project, Language, Interest, 
    GeneratedResumeSet, GeneratedResume, KeywordAnalysis, 
    RoleAnalysisDetail, ATSScoreBreakdown, AnalysisHistory
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

# Enhanced Serializers for Resume Analysis
class KeywordAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeywordAnalysis
        fields = [
            'technical_keywords_found', 'technical_keywords_missing', 'technical_match_score',
            'soft_skills_found', 'soft_skills_missing', 'soft_skills_match_score',
            'industry_keywords_found', 'industry_keywords_missing', 'industry_match_score',
            'action_verbs_found', 'action_verbs_score'
        ]

class RoleAnalysisDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleAnalysisDetail
        fields = [
            'role_name', 'match_percentage', 'matching_skills', 'missing_skills',
            'skill_gap_score', 'experience_relevance_score', 'experience_feedback',
            'education_relevance_score', 'education_feedback', 'market_demand',
            'salary_range', 'growth_prospects', 'role_specific_tips'
        ]

class ATSScoreBreakdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = ATSScoreBreakdown
        fields = [
            'personal_info_score', 'summary_score', 'skills_score', 'experience_score',
            'education_score', 'projects_score', 'formatting_score', 'keywords_score',
            'personal_info_feedback', 'summary_feedback', 'skills_feedback',
            'experience_feedback', 'education_feedback', 'projects_feedback',
            'formatting_feedback', 'keywords_feedback', 'total_score', 'grade',
            'top_improvement_areas', 'estimated_improvement_time'
        ]

class EnhancedResumeAnalysisSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    keyword_analysis_detail = KeywordAnalysisSerializer(read_only=True)
    role_analysis_details = RoleAnalysisDetailSerializer(many=True, read_only=True)
    ats_breakdown_detail = ATSScoreBreakdownSerializer(read_only=True)
    
    # Computed fields
    top_role = serializers.ReadOnlyField()
    skills_count = serializers.ReadOnlyField()
    jd_match_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ResumeAnalysis
        fields = [
            'id', 'username', 'resume_file', 'job_description', 'analysis_time',
            'parsed_data', 'analysis_results', 'ats_score', 'ats_breakdown',
            'matched_keywords', 'missing_keywords', 'keywords_analysis',
            'role_predictions', 'detailed_role_analysis', 'recommendations',
            'optimization_tips', 'similarity_scores', 'education', 'analysis_summary',
            'processing_time', 'model_version', 'top_role', 'skills_count', 
            'jd_match_percentage', 'keyword_analysis_detail', 'role_analysis_details',
            'ats_breakdown_detail'
        ]
        read_only_fields = [
            'analysis_time', 'parsed_data', 'analysis_results', 'ats_score',
            'ats_breakdown', 'matched_keywords', 'missing_keywords', 'keywords_analysis',
            'role_predictions', 'detailed_role_analysis', 'recommendations',
            'optimization_tips', 'similarity_scores', 'analysis_summary',
            'processing_time'
        ]

# Backward compatibility - keep the original serializer
class ResumeAnalysisSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ResumeAnalysis
        fields = [
            'id', 'username', 'resume_file', 'job_description', 'analysis_time',
            'parsed_data', 'analysis_results', 'ats_score', 'matched_keywords',
            'missing_keywords', 'recommendations', 'education'
        ]
        read_only_fields = [
            'analysis_time', 'parsed_data', 'analysis_results', 'ats_score',
            'matched_keywords', 'missing_keywords', 'recommendations'
        ]

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

# Generated Resume Serializers
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

# Analysis History Serializer
class AnalysisHistorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AnalysisHistory
        fields = [
            'id', 'username', 'previous_ats_score', 'current_ats_score',
            'score_improvement', 'changes_made', 'improvements_noted',
            'recommendations_implemented', 'pending_recommendations', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

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

# Analysis Comparison Serializer
class AnalysisComparisonSerializer(serializers.Serializer):
    """Serializer for comparing multiple resume analyses"""
    analysis_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=2,
        max_length=5
    )
    
    def validate_analysis_ids(self, value):
        """Validate that all analyses exist and belong to the user"""
        user = self.context['request'].user
        existing_analyses = ResumeAnalysis.objects.filter(
            id__in=value,
            user=user
        ).values_list('id', flat=True)
        
        if len(existing_analyses) != len(value):
            missing_ids = set(value) - set(existing_analyses)
            raise serializers.ValidationError(
                f"Analyses not found or not owned by user: {missing_ids}"
            )
        return value

# Enhanced API Response Serializers
class AnalysisSummarySerializer(serializers.Serializer):
    """Serializer for analysis summary statistics"""
    total_analyses = serializers.IntegerField()
    average_ats_score = serializers.FloatField()
    highest_ats_score = serializers.FloatField()
    lowest_ats_score = serializers.FloatField()
    most_common_top_role = serializers.CharField()
    improvement_trend = serializers.CharField()
    last_analysis_date = serializers.DateTimeField()

class RecommendationStatusSerializer(serializers.Serializer):
    """Serializer for tracking recommendation implementation status"""
    recommendation_id = serializers.CharField()
    recommendation_text = serializers.CharField()
    status = serializers.ChoiceField(choices=[
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dismissed', 'Dismissed')
    ])
    implemented_date = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)