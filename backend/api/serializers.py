from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note, ResumeAnalysis, UserRegisterData

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRegisterData
        fields = ['user', 'full_name', 'email', 'mobile', 'dob', 'user_type']
        extra_kwargs = {
            'user': {'write_only': True}
        }
    
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