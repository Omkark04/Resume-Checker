from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User

class UserRegisterData(models.Model):
    class UserType(models.TextChoices):
        HR = 'HR', 'HR Professional'
        INDIVIDUAL = 'Individual', 'Individual User'
    
    # Link to Django's built-in User model (recommended)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # User details
    full_name = models.CharField(max_length=40)
    email = models.EmailField(max_length=50, unique=True)  # Better than CharField
    mobile = models.CharField(max_length=16)  # Use CharField for phone numbers
    dob = models.DateField()
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.INDIVIDUAL
    )
    
    # Timestamps
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
