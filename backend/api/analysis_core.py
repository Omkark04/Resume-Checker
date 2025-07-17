import os
import json
import tempfile
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import ResumeAnalysis
from .serializers import ResumeAnalysisSerializer
from .dummy import JobMatchingSystem  # Import the analysis system
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
        # Get the uploaded file and optional job description
        resume_file = request.FILES.get('resume')
        job_description = request.data.get('job_description', '')
        
        if not resume_file:
            return JsonResponse({'error': 'No resume file provided'}, status=400)
        
        # Save file to temporary location
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            for chunk in resume_file.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name
        
        # Read the file content
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
            
            # Perform analysis
            jms_system = JobMatchingSystem()
            analysis_results = jms_system.analyze_resume_complete(
                resume_text,
                job_description=job_description if job_description.strip() else None
            )
            
            # Calculate ATS score
            parsed_info = analysis_results.get('parsed_resume', {})
            ats_result = calculate_ats_score(parsed_info, job_description, resume_text)
            
            # Save results to database
            resume_analysis = ResumeAnalysis.objects.create(
                user=request.user,
                resume_file=resume_file,
                job_description=job_description if job_description.strip() else None,
                parsed_data=parsed_info,
                analysis_results=analysis_results,
                ats_score=ats_result['score'],
                matched_keywords=ats_result.get('matched_keywords', []),
                missing_keywords=ats_result.get('missing_keywords', []),
                recommendations=ats_result.get('recommendations', [])
            )
            
            os.unlink(tmp_path)
            
            serializer = ResumeAnalysisSerializer(resume_analysis)
            return JsonResponse(serializer.data, status=201)
            
        except Exception as e:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            return JsonResponse({'error': str(e)}, status=500)

def calculate_ats_score(parsed_info, job_description, resume_text):
    score = 0
    breakdown = {}
    recommendations = []
    matched_keywords = []
    missing_keywords = []
    
    # 1. Contact Information (5 points)
    contact_score = 0
    if parsed_info.get('name') not in [None, 'Not Mentioned']: 
        contact_score += 1
    if parsed_info.get('email') not in [None, 'Not Mentioned']: 
        contact_score += 1
    if parsed_info.get('phone') not in [None, 'Not Mentioned']: 
        contact_score += 1
    if parsed_info.get('linkedin') not in [None, 'Not Mentioned']: 
        contact_score += 1
    if contact_score < 3:
        recommendations.append("Add missing contact information (name, email, phone, LinkedIn)")
    if contact_score == 4:
        contact_score += 1  # Bonus point for complete contact info
        
    score += contact_score
    breakdown['Contact Info'] = contact_score
    
    # 2. Experience & Education (20 points)
    exp_edu_score = 0
    experience = parsed_info.get('experience')
    if experience not in [None, 'Not Mentioned']: 
        exp_edu_score += 8
        # Check for quantifiable achievements
        if re.search(r'\d+', str(experience)):  # Check for numbers in experience
            exp_edu_score += 2
        else:
            recommendations.append("Add quantifiable achievements (numbers, percentages) to your experience section")
    else:
        recommendations.append("Add work experience section with specific details")
        
    education = parsed_info.get('education', ['Not Mentioned'])
    if education[0] != 'Not Mentioned': 
        exp_edu_score += 8
        # Check for degree details
        if any(word in education[0].lower() for word in ['bachelor', 'master', 'phd', 'associate', 'diploma']):
            exp_edu_score += 2
    else:
        recommendations.append("Add education details including degree and institution")
        
    score += exp_edu_score
    breakdown['Experience & Education'] = exp_edu_score
    
    # 3. Skills & Keywords (30 points) - Most important section
    skills_score = 0
    skills = parsed_info.get('skills', [])
    if skills:
        skills_score += 10
        
        # Skill count
        if len(skills) >= 10:
            skills_score += 5
        elif len(skills) >= 5:
            skills_score += 3
        else:
            recommendations.append("Add more skills (at least 5-10 relevant ones)")
            
        # Job description keyword matching
        if job_description:
            # Extract keywords from job description
            job_desc = job_description.lower()
            resume = resume_text.lower()
            
            # Find required skills/qualifications section
            required_section = ""
            required_patterns = [
                r'requirements?:?(.*?)(?=desired|preferred|responsibilities|qualifications|$)', 
                r'qualifications?:?(.*?)(?=desired|preferred|responsibilities|requirements|$)',
                r'skills?:?(.*?)(?=desired|preferred|responsibilities|requirements|qualifications|$)'
            ]
            
            for pattern in required_patterns:
                match = re.search(pattern, job_desc, re.IGNORECASE | re.DOTALL)
                if match:
                    required_section = match.group(1)
                    break
            
            # If no specific section found, use entire JD
            if not required_section:
                required_section = job_desc
                
            # Extract keywords from required section
            words = re.findall(r'\b\w{4,}\b', required_section)
            stop_words = set(stopwords.words('english'))
            words = [word for word in words if word not in stop_words]
            freq = Counter(words)
            top_keywords = [word for word, count in freq.most_common(25)]
            
            # Check for matches in skills and experience
            matched_keywords = [kw for kw in top_keywords if kw in resume]
            missing_keywords = [kw for kw in top_keywords if kw not in resume]
            
            # Score based on match percentage
            if top_keywords:
                match_percent = len(matched_keywords) / len(top_keywords)
                skills_score += match_percent * 15
                
                # Add recommendations for missing keywords
                if missing_keywords:
                    recommendations.append(f"Add these keywords to your resume: {', '.join(missing_keywords[:5])}...")
    else:
        recommendations.append("Add a dedicated skills section with relevant technical and soft skills")
        
    score += skills_score
    breakdown['Skills & Keywords'] = skills_score
    
    # 4. Formatting & Structure (20 points)
    format_score = 0
    # Check for section headings
    section_headings = ['experience', 'education', 'skills', 'projects', 'certifications']
    resume_lower = resume_text.lower()
    present_sections = 0
    
    for section in section_headings:
        if section in resume_lower:
            present_sections += 1
            format_score += 2
    
    # Check for professional summary
    if any(word in resume_lower for word in ['summary', 'objective', 'profile']):
        format_score += 2
    else:
        recommendations.append("Add a professional summary section at the top")
    
    # Check length
    word_count = len(resume_text.split())
    if 500 <= word_count <= 800:  # Ideal resume length
        format_score += 4
    elif word_count < 400:
        recommendations.append(f"Resume is too short ({word_count} words), add more details")
    else:
        recommendations.append(f"Resume is too long ({word_count} words), condense to 500-800 words")
    
    # Check bullet points
    bullet_points = resume_text.count('•') + resume_text.count('-') + resume_text.count('*')
    if bullet_points >= 5:
        format_score += 4
    else:
        recommendations.append("Use bullet points for achievements and responsibilities")
        
    # Check readability
    try:
        readability = textstat.flesch_reading_ease(resume_text)
        if readability >= 60:  # Fairly easy to read
            format_score += 2
    except:
        pass
        
    score += format_score
    breakdown['Formatting & Structure'] = format_score
    
    # 5. Achievements & Quantifiable Results (15 points)
    achievements_score = 0
    # Count numbers in resume (indicating quantifiable results)
    numbers = re.findall(r'\b\d+\b', resume_text)
    if len(numbers) >= 3:
        achievements_score += 10
    elif len(numbers) >= 1:
        achievements_score += 5
    else:
        recommendations.append("Add quantifiable achievements (e.g., 'increased sales by 20%')")
    
    # Check for action verbs
    action_verbs = ['achieved', 'managed', 'developed', 'led', 'increased', 'reduced', 
                   'improved', 'created', 'implemented', 'spearheaded']
    action_count = sum(1 for verb in action_verbs if verb in resume_lower)
    if action_count >= 5:
        achievements_score += 5
    elif action_count >= 3:
        achievements_score += 3
        
    score += achievements_score
    breakdown['Achievements'] = achievements_score
    
    # 6. Customization (10 points) - How well resume matches job description
    customization_score = 0
    if job_description:
        # Calculate similarity between resume and job description
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        customization_score = min(similarity * 10, 10)
        
        if customization_score < 7:
            recommendations.append("Customize your resume more specifically for this job")
    else:
        customization_score = 5  # Base score when no JD provided
    
    score += customization_score
    breakdown['Customization'] = customization_score
    
    # Cap score at 100
    score = min(score, 100)
    
    return {
        'score': score,
        'breakdown': breakdown,
        'recommendations': recommendations,
        'matched_keywords': matched_keywords,
        'missing_keywords': missing_keywords
    }


class UserResumeAnalysesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        analyses = ResumeAnalysis.objects.filter(user=request.user).order_by('-analysis_time')
        serializer = ResumeAnalysisSerializer(analyses, many=True)
        return JsonResponse(serializer.data, safe=False)