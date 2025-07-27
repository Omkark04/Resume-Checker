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
    parsed_data = models.JSONField()
    analysis_results = models.JSONField()
    ats_score = models.FloatField()
    matched_keywords = models.JSONField(default=list)
    missing_keywords = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    education = models.JSONField(default=list)

    def __str__(self):
        return f"Resume Analysis for {self.user.username} on {self.analysis_time}"

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

# NEW MODELS FOR GENERATED RESUMES

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