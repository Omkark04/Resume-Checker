import os
import json
import tempfile
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import ResumeAnalysis
from .serializers import ResumeAnalysisSerializer
from .dummy import JobMatchingSystem
import re
import textstat
from nltk.corpus import stopwords
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        resume_file = request.FILES.get('resume')
        job_description = request.data.get('job_description', '')
        
        if not resume_file:
            return JsonResponse({'error': 'No resume file provided'}, status=400)
        
        # Save file to temporary location
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            for chunk in resume_file.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name
        
        try:
            resume_text = ""
            if resume_file.name.endswith('.pdf'):
                import PyPDF2
                pdf_reader = PyPDF2.PdfReader(tmp_path)
                for page in pdf_reader.pages:
                    resume_text += page.extract_text() or ''
            elif resume_file.name.endswith('.docx'):
                import docx
                doc = docx.Document(tmp_path)
                resume_text = "\n".join([para.text for para in doc.paragraphs])
            elif resume_file.name.endswith('.txt'):
                with open(tmp_path, 'r', encoding='utf-8') as f:
                    resume_text = f.read()
            else:
                os.unlink(tmp_path)
                return JsonResponse({'error': 'Unsupported file type'}, status=400)
            
            if not resume_text.strip():
                os.unlink(tmp_path)
                return JsonResponse({'error': 'Could not extract text from resume'}, status=400)
            
            # Perform enhanced analysis
            jms_system = JobMatchingSystem()
            analysis_results = jms_system.analyze_resume_complete(
                resume_text,
                job_description=job_description if job_description.strip() else None
            )
            
            # Calculate enhanced ATS score
            parsed_info = analysis_results.get('parsed_resume', {})
            ats_result = calculate_enhanced_ats_score(parsed_info, job_description, resume_text)
            
            # Prepare additional data for storage
            keywords_analysis = analysis_results.get('keywords_analysis', {})
            detailed_role_analysis = analysis_results.get('detailed_role_analysis', [])
            optimization_tips = analysis_results.get('optimization_tips', [])
            
            # Save results to database
            resume_analysis = ResumeAnalysis.objects.create(
                user=request.user,
                resume_file=resume_file,
                job_description=job_description if job_description.strip() else None,
                parsed_data=parsed_info,
                analysis_results=analysis_results,
                ats_score=ats_result['score'],
                matched_keywords=keywords_analysis.get('present_keywords', []),
                missing_keywords=keywords_analysis.get('missing_keywords', []),
                recommendations=optimization_tips,
                education=json.dumps(parsed_info.get('education', []))
            )
            
            os.unlink(tmp_path)
            
            # Prepare enhanced response
            response_data = ResumeAnalysisSerializer(resume_analysis).data
            response_data.update({
                'ats_breakdown': ats_result.get('breakdown', {}),
                'keywords_analysis': keywords_analysis,
                'detailed_role_analysis': detailed_role_analysis,
                'optimization_tips': optimization_tips,
                'similarity_scores': analysis_results.get('similarity_scores', {}),
                'role_predictions': analysis_results.get('role_predictions', {}),
                'analysis_summary': analysis_results.get('analysis_summary', '')
            })
            
            return JsonResponse(response_data, status=201)
            
        except Exception as e:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            return JsonResponse({'error': str(e)}, status=500)


def calculate_enhanced_ats_score(parsed_info, job_description, resume_text):
    score = 0
    breakdown = {}
    recommendations = []
    
    # 1. Personal Information Completeness (15 points)
    personal_score = 0
    required_fields = ['name', 'email', 'phone', 'location']
    optional_fields = ['linkedin', 'github']
    
    for field in required_fields:
        if parsed_info.get(field) not in [None, 'Not found', '']:
            personal_score += 3
        else:
            recommendations.append(f"Add missing {field.replace('_', ' ')} information")
    
    for field in optional_fields:
        if parsed_info.get(field) not in [None, 'Not found', '']:
            personal_score += 1.5
    
    score += personal_score
    breakdown['Personal Information'] = personal_score
    
    # 2. Professional Summary (10 points)
    summary_score = 0
    summary = parsed_info.get('summary', 'Not found')
    if summary != 'Not found' and len(summary) > 50:
        summary_score = 10
        if len(summary) > 200:
            summary_score = 8  # Penalize if too long
    else:
        recommendations.append("Add a concise professional summary (50-200 words)")
    
    score += summary_score
    breakdown['Professional Summary'] = summary_score
    
    # 3. Skills Assessment (20 points)
    skills_score = 0
    skills = parsed_info.get('skills', [])
    
    if skills:
        skills_count = len(skills)
        if skills_count >= 15:
            skills_score = 20
        elif skills_count >= 10:
            skills_score = 16
        elif skills_count >= 5:
            skills_score = 12
        else:
            skills_score = 8
            recommendations.append("Add more relevant technical skills (aim for 10-15)")
    else:
        recommendations.append("Add a comprehensive skills section")
    
    score += skills_score
    breakdown['Skills'] = skills_score
    
    # 4. Experience Analysis (25 points)
    experience_score = 0
    experience_details = parsed_info.get('experience_details', [])
    experience_level = parsed_info.get('experience_level', 'Not specified')
    
    if experience_details:
        experience_score += 15  # Has structured experience
        
        # Check for detailed responsibilities
        has_responsibilities = any(exp.get('responsibilities') for exp in experience_details)
        if has_responsibilities:
            experience_score += 5
        else:
            recommendations.append("Add specific responsibilities and achievements for each role")
            
        # Check for quantifiable results
        exp_text = str(experience_details)
        if re.search(r'\d+%|\d+\s*(?:percent|million|thousand|k\b)', exp_text, re.IGNORECASE):
            experience_score += 5
        else:
            recommendations.append("Include quantifiable achievements (percentages, numbers)")
    else:
        if 'fresher' not in experience_level.lower():
            recommendations.append("Add detailed work experience section")
    
    score += experience_score
    breakdown['Experience'] = experience_score
    
    # 5. Education (10 points)
    education_score = 0
    education = parsed_info.get('education', [])
    
    if education:
        education_score = 8
        # Check for GPA/scores
        if any(edu.get('gpa_score', 'Not specified') != 'Not specified' for edu in education):
            education_score += 2
    else:
        recommendations.append("Add education details with institution and degree")
    
    score += education_score
    breakdown['Education'] = education_score
    
    # 6. Projects (10 points)
    projects_score = 0
    projects = parsed_info.get('projects', [])
    
    if projects:
        project_count = len(projects)
        if project_count >= 3:
            projects_score = 10
        elif project_count >= 2:
            projects_score = 8
        else:
            projects_score = 5
            
        # Check for project links
        has_links = any(proj.get('project_link', 'Not found') != 'Not found' for proj in projects)
        if not has_links:
            recommendations.append("Add project links (GitHub, live demos) to showcase work")
    else:
        recommendations.append("Add relevant projects to demonstrate practical skills")
    
    score += projects_score
    breakdown['Projects'] = projects_score
    
    # 7. Job Description Matching (10 points) - if JD provided
    jd_matching_score = 0
    if job_description:
        try:
            vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
            tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            jd_matching_score = min(similarity * 10, 10)
            
            if jd_matching_score < 5:
                recommendations.append("Tailor your resume more closely to the job requirements")
        except:
            jd_matching_score = 5
    else:
        jd_matching_score = 5  # Neutral score when no JD provided
    
    score += jd_matching_score
    breakdown['Job Matching'] = jd_matching_score
    
    # Cap score at 100
    score = min(score, 100)
    
    # Add general recommendations based on score
    if score < 60:
        recommendations.insert(0, "Resume needs significant improvement to pass ATS systems")
    elif score < 80:
        recommendations.insert(0, "Good foundation, but several areas need enhancement")
    else:
        recommendations.insert(0, "Strong resume with good ATS compatibility")
    
    return {
        'score': round(score, 1),
        'breakdown': breakdown,
        'recommendations': recommendations[:10]  # Limit recommendations
    }


class UserResumeAnalysesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        analyses = ResumeAnalysis.objects.filter(user=request.user).order_by('-analysis_time')
        
        # Enhance each analysis with additional computed data
        enhanced_analyses = []
        for analysis in analyses:
            serialized_data = ResumeAnalysisSerializer(analysis).data
            
            # Add computed fields
            analysis_results = analysis.analysis_results or {}
            serialized_data.update({
                'similarity_scores': analysis_results.get('similarity_scores', {}),
                'role_predictions': analysis_results.get('role_predictions', {}),
                'keywords_analysis': {
                    'present_keywords': analysis.matched_keywords,
                    'missing_keywords': analysis.missing_keywords
                },
                'optimization_tips': analysis.recommendations,
                'analysis_summary': analysis_results.get('analysis_summary', '')
            })
            
            enhanced_analyses.append(serialized_data)
        
        return JsonResponse(enhanced_analyses, safe=False)