from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class UserRegisterData(models.Model):
    class UserType(models.TextChoices):
        HR = 'HR', 'HR Professional'
        INDIVIDUAL = 'Individual', 'Individual User'
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=40)
    email = models.EmailField(max_length=50, unique=True)
    mobile = models.CharField(max_length=16)
    dob = models.DateField()
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.INDIVIDUAL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"

class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

    def __str__(self):
        return self.title

class ResumeAnalysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resume_analyses')
    resume_file = models.FileField(upload_to='resumes/')
    job_description = models.TextField(blank=True, null=True)
    analysis_time = models.DateTimeField(auto_now_add=True)
    
    # Enhanced parsed data fields
    parsed_data = models.JSONField(default=dict)  # Contains all extracted information
    analysis_results = models.JSONField(default=dict)  # Complete analysis results
    
    # ATS scoring
    ats_score = models.FloatField(default=0)
    ats_breakdown = models.JSONField(default=dict)  # Detailed ATS score breakdown
    
    # Keywords analysis
    matched_keywords = models.JSONField(default=list)
    missing_keywords = models.JSONField(default=list)
    keywords_analysis = models.JSONField(default=dict)  # Enhanced keyword analysis
    
    # Role predictions and analysis
    role_predictions = models.JSONField(default=dict)
    detailed_role_analysis = models.JSONField(default=list)
    
    # Recommendations and optimization
    recommendations = models.JSONField(default=list)
    optimization_tips = models.JSONField(default=list)
    
    # Similarity scores (for JD matching)
    similarity_scores = models.JSONField(default=dict)
    
    # Legacy field - keeping for backward compatibility
    education = models.JSONField(default=list)
    
    # Analysis summary
    analysis_summary = models.TextField(blank=True, null=True)
    
    # Processing metadata
    processing_time = models.FloatField(default=0)  # Time taken for analysis in seconds
    model_version = models.CharField(max_length=50, default='v1.0')

    class Meta:
        ordering = ['-analysis_time']
        indexes = [
            models.Index(fields=['user', '-analysis_time']),
            models.Index(fields=['ats_score']),
        ]

    def __str__(self):
        return f"Resume Analysis for {self.user.username} on {self.analysis_time.strftime('%Y-%m-%d %H:%M')}"

    @property
    def top_role(self):
        """Returns the top predicted role"""
        roles = self.role_predictions.get('roles', [])
        return roles[0] if roles else 'Not determined'
    
    @property
    def skills_count(self):
        """Returns the number of skills found"""
        skills = self.parsed_data.get('skills', [])
        return len(skills) if skills else 0
    
    @property
    def jd_match_percentage(self):
        """Returns the job description match percentage"""
        return self.similarity_scores.get('combined_score', 0)

class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=100)
    linkedin_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    portfolio_url = models.URLField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    profile_pic = models.TextField(blank=True, null=True)  # Base64 image data

    def __str__(self):
        return f"Resume: {self.full_name} ({self.user.username})"

class Skill(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=50, choices=[
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
        ('Expert', 'Expert')
    ], blank=True, null=True)

class Experience(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='experiences')
    job_title = models.CharField(max_length=100)
    company = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True, null=True)

class Responsibility(models.Model):
    experience = models.ForeignKey(Experience, on_delete=models.CASCADE, related_name='responsibilities')
    description = models.TextField()

class Education(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='educations')
    institution = models.CharField(max_length=200)
    degree = models.CharField(max_length=100)
    year = models.CharField(max_length=50)
    grade = models.CharField(max_length=50, blank=True, null=True)

class Project(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    tech_stack = models.CharField(max_length=200, blank=True, null=True)
    github_link = models.URLField(blank=True, null=True)

class Language(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='languages')
    name = models.CharField(max_length=50)

class Interest(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='interests')
    name = models.CharField(max_length=100)

# Generated Resume Models
class GeneratedResumeSet(models.Model):
    """Represents a set of generated resumes for a specific resume data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='generated_sets')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_resume_sets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Generated Resume Set for {self.resume.full_name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class GeneratedResume(models.Model):
    """Individual generated resume template with PDF and thumbnail"""
    TEMPLATE_CHOICES = [
        ('modern', 'Modern'),
        ('classic', 'Classic'),
        ('minimalist', 'Minimalist'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume_set = models.ForeignKey(GeneratedResumeSet, on_delete=models.CASCADE, related_name='templates')
    template_name = models.CharField(max_length=20, choices=TEMPLATE_CHOICES)
    
    # PDF file stored in database
    pdf_file = models.BinaryField()
    pdf_filename = models.CharField(max_length=255)
    pdf_size = models.PositiveIntegerField()  # Size in bytes
    
    # Thumbnail image stored in database
    thumbnail_image = models.BinaryField()
    thumbnail_filename = models.CharField(max_length=255)
    thumbnail_size = models.PositiveIntegerField()  # Size in bytes
    
    created_at = models.DateTimeField(auto_now_add=True)
    download_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['resume_set', 'template_name']
        ordering = ['template_name']

    def __str__(self):
        return f"{self.template_name.title()} Resume - {self.resume_set.resume.full_name}"

    @property
    def template_display_info(self):
        """Returns display information for the template"""
        info_map = {
            'modern': {
                'title': 'Modern Design',
                'description': 'Clean layout with sidebar and circular profile picture'
            },
            'classic': {
                'title': 'Classic Design', 
                'description': 'Traditional format with profile picture at top'
            },
            'minimalist': {
                'title': 'Minimalist Design',
                'description': 'Simple and compact layout without profile picture'
            }
        }
        return info_map.get(self.template_name, {'title': self.template_name, 'description': ''})

    def increment_download_count(self):
        """Increment download counter"""
        self.download_count += 1
        self.save(update_fields=['download_count'])

# Enhanced Analysis Models for advanced features
class KeywordAnalysis(models.Model):
    """Detailed keyword analysis for each resume analysis"""
    resume_analysis = models.OneToOneField(ResumeAnalysis, on_delete=models.CASCADE, related_name='keyword_analysis_detail')
    
    # Technical keywords
    technical_keywords_found = models.JSONField(default=list)
    technical_keywords_missing = models.JSONField(default=list)
    technical_match_score = models.FloatField(default=0)
    
    # Soft skills keywords
    soft_skills_found = models.JSONField(default=list)
    soft_skills_missing = models.JSONField(default=list)
    soft_skills_match_score = models.FloatField(default=0)
    
    # Industry-specific keywords
    industry_keywords_found = models.JSONField(default=list)
    industry_keywords_missing = models.JSONField(default=list)
    industry_match_score = models.FloatField(default=0)
    
    # Action verbs analysis
    action_verbs_found = models.JSONField(default=list)
    action_verbs_score = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Keyword Analysis for {self.resume_analysis.user.username}"

class RoleAnalysisDetail(models.Model):
    """Detailed analysis for each predicted role"""
    resume_analysis = models.ForeignKey(ResumeAnalysis, on_delete=models.CASCADE, related_name='role_analysis_details')
    
    role_name = models.CharField(max_length=100)
    match_percentage = models.FloatField()
    
    # Skill alignment
    matching_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    skill_gap_score = models.FloatField(default=0)
    
    # Experience alignment
    experience_relevance_score = models.FloatField(default=0)
    experience_feedback = models.TextField(blank=True)
    
    # Education alignment
    education_relevance_score = models.FloatField(default=0)
    education_feedback = models.TextField(blank=True)
    
    # Market insights
    market_demand = models.CharField(max_length=50, choices=[
        ('Very High', 'Very High'),
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low')
    ], default='Medium')
    
    salary_range = models.CharField(max_length=100, blank=True)
    growth_prospects = models.TextField(blank=True)
    
    # Recommendations specific to this role
    role_specific_tips = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['resume_analysis', 'role_name']
        ordering = ['-match_percentage']

    def __str__(self):
        return f"{self.role_name} Analysis - {self.match_percentage}%"

class ATSScoreBreakdown(models.Model):
    """Detailed ATS score breakdown"""
    resume_analysis = models.OneToOneField(ResumeAnalysis, on_delete=models.CASCADE, related_name='ats_breakdown_detail')
    
    # Individual component scores
    personal_info_score = models.FloatField(default=0)
    summary_score = models.FloatField(default=0)
    skills_score = models.FloatField(default=0)
    experience_score = models.FloatField(default=0)
    education_score = models.FloatField(default=0)
    projects_score = models.FloatField(default=0)
    formatting_score = models.FloatField(default=0)
    keywords_score = models.FloatField(default=0)
    
    # Detailed feedback for each component
    personal_info_feedback = models.TextField(blank=True)
    summary_feedback = models.TextField(blank=True)
    skills_feedback = models.TextField(blank=True)
    experience_feedback = models.TextField(blank=True)
    education_feedback = models.TextField(blank=True)
    projects_feedback = models.TextField(blank=True)
    formatting_feedback = models.TextField(blank=True)
    keywords_feedback = models.TextField(blank=True)
    
    # Overall metrics
    total_score = models.FloatField(default=0)
    grade = models.CharField(max_length=2, choices=[
        ('A+', 'Excellent (90-100)'),
        ('A', 'Very Good (80-89)'),
        ('B', 'Good (70-79)'),
        ('C', 'Fair (60-69)'),
        ('D', 'Poor (Below 60)')
    ], blank=True)
    
    # Improvement priorities
    top_improvement_areas = models.JSONField(default=list)
    estimated_improvement_time = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ATS Breakdown - {self.total_score}/100 ({self.grade})"

class AnalysisHistory(models.Model):
    """Track analysis history and improvements over time"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analysis_history')
    resume_analysis = models.ForeignKey(ResumeAnalysis, on_delete=models.CASCADE, related_name='history_entries')
    
    # Previous scores for comparison
    previous_ats_score = models.FloatField(null=True, blank=True)
    current_ats_score = models.FloatField()
    score_improvement = models.FloatField(default=0)
    
    # Key changes made
    changes_made = models.JSONField(default=list)
    improvements_noted = models.JSONField(default=list)
    
    # Recommendations followed
    recommendations_implemented = models.JSONField(default=list)
    pending_recommendations = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Analysis History - {self.user.username} - {self.created_at.strftime('%Y-%m-%d')}"