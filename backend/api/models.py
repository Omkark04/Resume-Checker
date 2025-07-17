from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

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

    def __str__(self):
        return f"Resume Analysis for {self.user.username} on {self.analysis_time}"
