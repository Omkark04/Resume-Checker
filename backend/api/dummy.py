import re
import pickle
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import urllib.parse

class JobMatchingSystem:
    def __init__(self):
        print("CONSOLE: Initializing Enhanced ML-only Job Matching System...")
        
        # Load ML models with error handling
        try:
            self.clf_model = self._load_model(r"C:\Users\omkar\OneDrive\Desktop\InnoHack 2.0\Resume-Checker\backend\api\clf.pkl")
            print("CONSOLE: Classifier model loaded")
        except:
            print("CONSOLE: Classifier model not found, using fallback")
            self.clf_model = None
            
        try:
            self.tfidf = self._load_model(r"C:\Users\omkar\OneDrive\Desktop\InnoHack 2.0\Resume-Checker\backend\api\tfidf.pkl")
            print("CONSOLE: TF-IDF vectorizer loaded")
        except:
            print("CONSOLE: TF-IDF vectorizer not found")
            self.tfidf = None
            
        try:
            self.encoder = self._load_model(r"C:\Users\omkar\OneDrive\Desktop\InnoHack 2.0\Resume-Checker\backend\api\encoder.pkl")
            print("CONSOLE: Label encoder loaded")
        except:
            print("CONSOLE: Label encoder not found")
            self.encoder = None
        
        self.job_roles = [
            "Data Analyst", "Software Engineer", "Frontend Developer", 
            "Backend Developer", "Full Stack Developer", "Machine Learning Engineer", 
            "DevOps Engineer", "Business Analyst", "Product Manager", 
            "UI/UX Designer", "Data Scientist", "Cybersecurity Analyst",
            "Mobile Developer", "Cloud Engineer", "System Administrator"
        ]
        
        self.skills_database = {
            "Programming": ["Python", "Java", "JavaScript", "C++", "C#", "R", "Go", "Rust", "PHP", "Ruby", "C", "Swift", "Kotlin"],
            "Web Development": ["HTML", "CSS", "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "Flask", "Bootstrap", "Tailwind"],
            "Data Science": ["Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Matplotlib", "Seaborn", "Jupyter", "Analytics"],
            "Databases": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "Oracle", "SQLite"],
            "Cloud": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Jenkins"],
            "Tools": ["Git", "JIRA", "Slack", "Tableau", "Power BI", "Excel", "Figma", "Photoshop"],
            "Mobile": ["Android", "iOS", "React Native", "Flutter", "Xamarin"],
            "Other": ["Machine Learning", "Artificial Intelligence", "IoT", "Blockchain", "AR/VR"]
        }
        
        print("CONSOLE: Enhanced Job Matching System initialized successfully!")

    def _load_model(self, filename):
        with open(filename, 'rb') as f:
            return pickle.load(f)

    def clean_resume(self, text):
        text = re.sub(r'http\S+\s', ' ', text)
        text = re.sub(r'@\S+', ' ', text)
        text = re.sub(r'#\S+\s', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.lower().strip()

    def parse_resume(self, resume_text: str) -> Dict:
        parsed_data = {}
        parsed_data['name'] = self._extract_name(resume_text)
        parsed_data['email'] = self._extract_email(resume_text)
        parsed_data['phone'] = self._extract_phone(resume_text)
        parsed_data['location'] = self._extract_location(resume_text)
        parsed_data['linkedin'] = self._extract_linkedin(resume_text)
        parsed_data['github'] = self._extract_github(resume_text)
        parsed_data['skills'] = self._extract_skills(resume_text)
        parsed_data['experience_level'] = self._extract_experience_level(resume_text)
        parsed_data['experience_details'] = self._extract_experience_details(resume_text)
        parsed_data['education'] = self._extract_education_detailed(resume_text)
        parsed_data['projects'] = self._extract_projects(resume_text)
        parsed_data['summary'] = self._extract_summary(resume_text)
        parsed_data['languages'] = self._extract_languages(resume_text)
        parsed_data['achievements'] = self._extract_achievements(resume_text)
        parsed_data['hobbies'] = self._extract_hobbies(resume_text)
        parsed_data['certifications'] = self._extract_certifications(resume_text)
        return parsed_data

    def _extract_name(self, text: str) -> str:
        lines = text.strip().split('\n')
        for line in lines[:8]:
            line = line.strip()
            if line and len(line.split()) <= 4 and '@' not in line and not any(char.isdigit() for char in line) and len(line) > 3:
                excluded_words = ['SKILLS', 'EDUCATION', 'EXPERIENCE', 'PROJECTS', 'SUMMARY', 'OBJECTIVE', 'CONTACT', 'RESUME', 'CV', 'PROFILE']
                if line.upper() not in excluded_words and not any(word in line.upper() for word in ['DEVELOPER', 'ENGINEER', 'ANALYST', 'MANAGER']):
                    return line
        return "Not found"

    def _extract_email(self, text: str) -> str:
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return emails[0] if emails else "Not found"

    def _extract_phone(self, text: str) -> str:
        phone_patterns = [
            r'\+91[-.\s]?\d{10}',
            r'\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\(\d{3}\)\s*\d{3}[-.]?\d{4}'
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                return phones[0]
        return "Not found"

    def _extract_location(self, text: str) -> str:
        location_patterns = [
            r'([A-Za-z\s]+),\s*([A-Za-z\s]+)[-\s]*\d{6}',
            r'([A-Za-z\s]+),\s*([A-Za-z\s]+),\s*([A-Za-z\s]+)',
            r'([A-Za-z\s]+),\s*([A-Za-z\s]+)'
        ]
        
        for pattern in location_patterns:
            matches = re.findall(pattern, text)
            if matches:
                location = ', '.join(matches[0])
                if len(location) > 5 and location.lower() not in ['not found', 'email', 'phone']:
                    return location
        return "Not found"

    def _extract_linkedin(self, text: str) -> str:
        linkedin_patterns = [
            r'linkedin\.com/in/[\w-]+',
            r'linkedin\.com/[\w-]+',
            r'linkedin:\s*([\w.-]+)',
            r'🔗\s*(https?://[^\s]+linkedin[^\s]*)'
        ]
        
        for pattern in linkedin_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                link = matches[0]
                if not link.startswith('http'):
                    link = f"https://{link}"
                return link
        return "Not found"

    def _extract_github(self, text: str) -> str:
        github_patterns = [
            r'github\.com/[\w-]+',
            r'github:\s*([\w.-]+)',
            r'💻\s*(https?://[^\s]+github[^\s]*)',
            r'https?://github\.com/[\w-]+'
        ]
        
        for pattern in github_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                link = matches[0]
                if not link.startswith('http'):
                    link = f"https://{link}"
                return link
        return "Not found"

    def _extract_skills(self, text: str) -> List[str]:
        skills_found = []
        text_lower = text.lower()
        
        for category, skills_list in self.skills_database.items():
            for skill in skills_list:
                if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
                    skills_found.append(skill)
                    
        # Additional skill extraction from common patterns
        skill_section_match = re.search(r'(?:skills?|technical\s+skills?|competencies)[:]*\s*(.+?)(?=\n\s*[A-Z][^:]*:|$)', text, re.IGNORECASE | re.DOTALL)
        if skill_section_match:
            skills_text = skill_section_match.group(1)
            additional_skills = re.findall(r'\b[A-Za-z][A-Za-z0-9+#.]{2,15}\b', skills_text)
            skills_found.extend([skill for skill in additional_skills if len(skill) > 2])
                    
        return list(set(skills_found))

    def _extract_experience_level(self, text: str) -> str:
        text_lower = text.lower()
        
        # Check for fresher indicators
        fresher_keywords = ['fresher', 'recent graduate', 'new graduate', 'entry level', 'seeking opportunities', 'student']
        if any(keyword in text_lower for keyword in fresher_keywords):
            return "Fresher"
            
        # Extract years of experience
        experience_patterns = [
            r'(\d+\.?\d*|\d+)[\+\-\s]*years?\s*(?:of\s*)?experience',
            r'experience[\s:]?\s*(\d+\.?\d*|\d+)[\+\-\s]*years?',
            r'(\d+)[\s]*to[\s]*(\d+)[\s]*years?'
        ]
        
        for pattern in experience_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                if isinstance(matches[0], tuple):
                    years = max([float(x) for x in matches[0] if x.replace('.', '').isdigit()])
                else:
                    years = float(matches[0])
                return f"Experienced ({years} years)"
                
        return "Not specified"

    def _extract_experience_details(self, text: str) -> List[Dict]:
        experiences = []
        
        # Look for work experience section
        exp_section_patterns = [
            r'(?:work\s+experience|experience|professional\s+experience)[:]*\s*(.+?)(?=\n\s*(?:education|projects|skills|certifications|[A-Z][^:]*:)|$)',
            r'(?:employment|career)[:]*\s*(.+?)(?=\n\s*(?:education|projects|skills|[A-Z][^:]*:)|$)'
        ]
        
        exp_text = ""
        for pattern in exp_section_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                exp_text = match.group(1)
                break
        
        if not exp_text:
            exp_text = text  # Use full text if no specific section found
            
        # Extract individual experiences
        job_patterns = [
            r'([A-Za-z\s&]+(?:Developer|Engineer|Analyst|Manager|Specialist|Intern|Executive))\s*\n?([A-Za-z\s&.,]+(?:Company|Corp|Ltd|Inc|Solutions|Technologies))\s*\n?([A-Za-z\s,]+)?\s*\n?(\d{4}\s*[-–]\s*(?:\d{4}|Present))',
            r'(\d{4}\s*[-–]\s*(?:\d{4}|Present))\s*\n?([A-Za-z\s&]+(?:Developer|Engineer|Analyst|Manager|Specialist|Intern))\s*\n?([A-Za-z\s&.,]+(?:Company|Corp|Ltd|Inc|Solutions|Technologies))'
        ]
        
        for pattern in job_patterns:
            matches = re.findall(pattern, exp_text, re.IGNORECASE)
            for match in matches:
                if len(match) >= 3:
                    exp_dict = {
                        'job_title': match[0].strip() if match[0] else "Not specified",
                        'company': match[1].strip() if match[1] else "Not specified", 
                        'location': match[2].strip() if len(match) > 2 and match[2] else "Not specified",
                        'duration': match[3].strip() if len(match) > 3 and match[3] else "Not specified",
                        'responsibilities': self._extract_responsibilities(exp_text, match[0] if match[0] else match[1])
                    }
                    experiences.append(exp_dict)
                    
        return experiences

    def _extract_responsibilities(self, text: str, job_context: str) -> List[str]:
        responsibilities = []
        
        # Look for bullet points or numbered lists near the job context
        context_index = text.lower().find(job_context.lower())
        if context_index != -1:
            context_text = text[context_index:context_index + 500]  # Next 500 chars
            
            # Extract bullet points
            bullet_patterns = [
                r'[•·▪▫◦‣⁃]\s*(.+?)(?=\n|$)',
                r'[-*]\s*(.+?)(?=\n|$)',
                r'\d+\.\s*(.+?)(?=\n|$)'
            ]
            
            for pattern in bullet_patterns:
                matches = re.findall(pattern, context_text)
                responsibilities.extend([match.strip() for match in matches if len(match.strip()) > 10])
                
        return responsibilities[:5]  # Limit to 5 responsibilities

    def _extract_education_detailed(self, text: str) -> List[Dict]:
        education_list = []
        
        # Look for education section
        edu_patterns = [
            r'(?:education|academic\s+background|qualifications)[:]*\s*(.+?)(?=\n\s*(?:experience|projects|skills|[A-Z][^:]*:)|$)'
        ]
        
        edu_text = ""
        for pattern in edu_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                edu_text = match.group(1)
                break
                
        if not edu_text:
            edu_text = text  # Use full text if no specific section found
            
        # Extract education details
        edu_entries = []
        
        # Pattern for structured education entries
        degree_patterns = [
            r'([A-Za-z.\s]+(?:B\.?Tech|M\.?Tech|Bachelor|Master|PhD|Diploma|Certificate)[\w\s&]+)\s*\n?([A-Za-z\s,.-]+(?:College|University|Institute|School)[\w\s,.-]*)\s*\n?(\d{4}[\s-]*(?:\d{4}|Present)?)\s*\n?(?:(?:GPA|CGPA|Score|Percentage)[:]*\s*([\d.]+))?',
            r'(\d{4}[\s-]*(?:\d{4}|Present)?)\s*\n?([A-Za-z.\s]+(?:B\.?Tech|M\.?Tech|Bachelor|Master|PhD)[\w\s&]+)\s*\n?([A-Za-z\s,.-]+(?:College|University|Institute)[\w\s,.-]*)'
        ]
        
        for pattern in degree_patterns:
            matches = re.findall(pattern, edu_text, re.IGNORECASE)
            for match in matches:
                edu_dict = {
                    'degree': match[0].strip() if match[0] else "Not specified",
                    'institution': match[1].strip() if match[1] else "Not specified",
                    'year': match[2].strip() if match[2] else "Not specified",
                    'gpa_score': match[3].strip() if len(match) > 3 and match[3] else "Not specified"
                }
                edu_entries.append(edu_dict)
                
        return edu_entries

    def _extract_projects(self, text: str) -> List[Dict]:
        projects = []
        
        # Look for projects section
        project_patterns = [
            r'(?:projects?|portfolio)[:]*\s*(.+?)(?=\n\s*(?:experience|education|skills|[A-Z][^:]*:)|$)'
        ]
        
        project_text = ""
        for pattern in project_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                project_text = match.group(1)
                break
                
        if not project_text:
            # Look for project indicators in full text
            project_indicators = ['developed', 'built', 'created', 'implemented', 'designed']
            lines = text.split('\n')
            project_lines = [line for line in lines if any(indicator in line.lower() for indicator in project_indicators)]
            project_text = '\n'.join(project_lines)
            
        # Extract project details
        project_entries = []
        
        # Look for project titles and descriptions
        project_sections = re.split(r'\n(?=\w)', project_text)
        
        for section in project_sections:
            if len(section.strip()) > 20:  # Minimum length for a project description
                lines = section.strip().split('\n')
                if lines:
                    title = lines[0].strip()
                    
                    # Extract GitHub/project links
                    links = re.findall(r'https?://[^\s]+', section)
                    github_link = next((link for link in links if 'github' in link.lower()), 
                                     links[0] if links else "Not found")
                    
                    # Extract technologies
                    tech_patterns = [
                        r'(?:technologies?|tech\s+stack|built\s+using|tools?)[:]*\s*([^.\n]+)',
                        r'using\s+([A-Za-z0-9+#.\s,]+)'
                    ]
                    
                    technologies = []
                    for pattern in tech_patterns:
                        matches = re.findall(pattern, section, re.IGNORECASE)
                        for match in matches:
                            tech_list = re.findall(r'\b[A-Za-z][A-Za-z0-9+#.]{1,15}\b', match)
                            technologies.extend(tech_list)
                    
                    project_dict = {
                        'title': title,
                        'description': section.strip(),
                        'technologies': list(set(technologies)) if technologies else ["Not specified"],
                        'project_link': github_link
                    }
                    project_entries.append(project_dict)
                    
        return project_entries[:5]  # Limit to 5 projects

    def _extract_summary(self, text: str) -> str:
        summary_patterns = [
            r'(?:summary|profile|objective|about\s+me)[:]*\s*(.+?)(?=\n\s*(?:experience|education|skills|[A-Z][^:]*:)|$)',
            r'(?:professional\s+summary|career\s+objective)[:]*\s*(.+?)(?=\n\s*[A-Z]|$)'
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                summary = match.group(1).strip()
                if len(summary) > 50:  # Minimum length for meaningful summary
                    return summary
                    
        # If no explicit summary, extract first meaningful paragraph
        paragraphs = text.split('\n\n')
        for para in paragraphs:
            if len(para.strip()) > 100 and not any(keyword in para.lower() for keyword in ['education', 'experience', 'skills', 'projects']):
                return para.strip()
                
        return "Not found"

    def _extract_languages(self, text: str) -> List[str]:
        languages = []
        
        # Look for language section
        lang_patterns = [
            r'(?:languages?|linguistic\s+skills?)[:]*\s*(.+?)(?=\n\s*[A-Z]|$)'
        ]
        
        for pattern in lang_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                lang_text = match.group(1)
                common_languages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']
                for lang in common_languages:
                    if lang.lower() in lang_text.lower():
                        languages.append(lang)
                        
        return languages

    def _extract_achievements(self, text: str) -> List[str]:
        achievements = []
        
        achievement_keywords = ['winner', 'won', 'achieved', 'awarded', 'recognized', 'certified', 'hackathon', 'competition', 'champion', 'medal', 'prize']
        
        lines = text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in achievement_keywords) and len(line.strip()) > 20:
                achievements.append(line.strip())
                
        return achievements[:5]  # Limit to 5 achievements

    def _extract_hobbies(self, text: str) -> List[str]:
        hobbies = []
        
        hobby_patterns = [
            r'(?:hobbies|interests|personal\s+interests)[:]*\s*(.+?)(?=\n\s*[A-Z]|$)'
        ]
        
        for pattern in hobby_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                hobby_text = match.group(1)
                hobby_list = re.findall(r'\b[A-Za-z\s]{3,20}\b', hobby_text)
                hobbies.extend([hobby.strip() for hobby in hobby_list if len(hobby.strip()) > 2])
                
        return hobbies[:5]  # Limit to 5 hobbies

    def _extract_certifications(self, text: str) -> List[str]:
        certifications = []
        
        cert_patterns = [
            r'(?:certifications?|certificates?)[:]*\s*(.+?)(?=\n\s*[A-Z]|$)'
        ]
        
        for pattern in cert_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                cert_text = match.group(1)
                # Look for certification names and links
                cert_lines = cert_text.split('\n')
                for line in cert_lines:
                    if len(line.strip()) > 10:
                        certifications.append(line.strip())
                        
        return certifications

    def calculate_similarity_scores(self, resume_text: str, job_description: str) -> Dict:
        scores = {}
        if not resume_text or not job_description:
            scores['tfidf_similarity'] = 0.0
            scores['keyword_similarity'] = 0.0
            scores['combined_score'] = 0.0
            return scores

        scores['tfidf_similarity'] = self._tfidf_similarity(resume_text, job_description)
        scores['keyword_similarity'] = self._keyword_similarity(resume_text, job_description)
        scores['combined_score'] = round((
            scores['tfidf_similarity'] * 0.6 + 
            scores['keyword_similarity'] * 0.4
        ), 2)
        return scores

    def _tfidf_similarity(self, text1: str, text2: str) -> float:
        try:
            vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
            tfidf_matrix = vectorizer.fit_transform([self.clean_resume(text1), self.clean_resume(text2)])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return round(similarity * 100, 2)
        except:
            return 0.0

    def _keyword_similarity(self, resume_text: str, job_description: str) -> float:
        try:
            resume_keywords = set(re.findall(r'\b\w+\b', self.clean_resume(resume_text).lower()))
            job_keywords = set(re.findall(r'\b\w+\b', self.clean_resume(job_description).lower()))
            
            if not resume_keywords or not job_keywords:
                return 0.0

            common_keywords = resume_keywords.intersection(job_keywords)
            total_unique_keywords = resume_keywords.union(job_keywords)
            
            if not total_unique_keywords:
                return 0.0
                
            return round((len(common_keywords) / len(total_unique_keywords)) * 100, 2)
        except:
            return 0.0

    def predict_job_roles(self, resume_text: str) -> Dict:
        if self.clf_model and self.tfidf and self.encoder:
            try:
                cleaned_text = self.clean_resume(resume_text)
                vectorized_text = self.tfidf.transform([cleaned_text])
                prediction = self.clf_model.predict(vectorized_text)
                probabilities = self.clf_model.predict_proba(vectorized_text)[0]
                
                top_indices = np.argsort(probabilities)[::-1][:5]
                roles = self.encoder.inverse_transform(top_indices)
                scores = [round(probabilities[i] * 100, 2) for i in top_indices]
                
                return {"roles": roles.tolist(), "scores": scores}
            except:
                print("CONSOLE: ML prediction failed, using fallback")
        
        return self._fallback_role_prediction(resume_text)

    def _fallback_role_prediction(self, resume_text: str) -> Dict:
        role_keywords = {
            "Data Analyst": ["data", "analyst", "sql", "excel", "tableau", "power bi", "analysis", "reporting"],
            "Software Engineer": ["software", "engineer", "developer", "programming", "code", "agile", "java", "python", "c++"],
            "Frontend Developer": ["frontend", "ui", "ux", "html", "css", "javascript", "react", "angular", "vue"],
            "Backend Developer": ["backend", "api", "server", "database", "node.js", "python", "java", "microservices"],
            "Full Stack Developer": ["full stack", "fullstack", "frontend", "backend", "react", "node.js", "database"],
            "Machine Learning Engineer": ["machine learning", "ml", "ai", "tensorflow", "pytorch", "scikit-learn", "deep learning"],
            "DevOps Engineer": ["devops", "ci/cd", "docker", "kubernetes", "aws", "azure", "automation", "jenkins"],
            "Business Analyst": ["business analyst", "requirements", "stakeholder", "process improvement", "erp", "crm"],
            "Product Manager": ["product manager", "product owner", "roadmap", "user stories", "agile", "market research"],
            "UI/UX Designer": ["ui/ux", "designer", "figma", "sketch", "adobe xd", "user interface", "user experience"],
            "Data Scientist": ["data scientist", "statistics", "python", "r", "machine learning", "algorithms", "modeling"],
            "Cybersecurity Analyst": ["cybersecurity", "security analyst", "infosec", "siem", "firewall", "penetration"],
        }

        text_lower = self.clean_resume(resume_text).lower()
        role_scores = {}
        
        for role_name, keywords in role_keywords.items():
            score = 0
            for keyword in keywords:
                if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                    score += 1
            role_scores[role_name] = score
        
        sorted_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)
        filtered_roles = [item for item in sorted_roles if item[1] > 0][:5]
        
        if not filtered_roles:
            return {"roles": ["General Application"], "scores": [20]}
            
        roles = [role for role, _ in filtered_roles]
        scores = [min(score * 20, 100) for _, score in filtered_roles]
        
        return {"roles": roles, "scores": scores}

    def extract_keywords_analysis(self, resume_text: str, job_description: str) -> Dict:
        if not job_description:
            return {"present_keywords": [], "missing_keywords": []}
            
        # Extract keywords from job description
        job_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', job_description.lower()))
        resume_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', resume_text.lower()))
        
        # Filter out common stop words
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
        
        job_keywords = job_words - stop_words
        resume_keywords = resume_words - stop_words
        
        present_keywords = list(job_keywords.intersection(resume_keywords))
        missing_keywords = list(job_keywords - resume_keywords)
        
        return {
            "present_keywords": present_keywords[:20],  # Limit to top 20
            "missing_keywords": missing_keywords[:20]   # Limit to top 20
        }

    def generate_detailed_role_analysis(self, resume_text: str, role_predictions: Dict) -> List[Dict]:
        detailed_analysis = []
        
        role_requirements = {
            "Data Analyst": {
                "key_skills": ["SQL", "Excel", "Python", "Tableau", "Statistics"],
                "description": "Analyzes data to help businesses make informed decisions",
                "growth_prospects": "High demand with 25% job growth expected",
                "avg_salary": "$65,000 - $90,000"
            },
            "Software Engineer": {
                "key_skills": ["Programming", "Algorithms", "System Design", "Testing"],
                "description": "Designs and develops software applications and systems",
                "growth_prospects": "Excellent with 22% job growth expected",
                "avg_salary": "$80,000 - $130,000"
            },
            "Frontend Developer": {
                "key_skills": ["HTML/CSS", "JavaScript", "React/Angular", "UI/UX"],
                "description": "Creates user-facing web applications and interfaces",
                "growth_prospects": "Strong demand with modern web technologies",
                "avg_salary": "$70,000 - $110,000"
            },
            "Backend Developer": {
                "key_skills": ["Server Languages", "Databases", "APIs", "Architecture"],
                "description": "Builds server-side logic and database management",
                "growth_prospects": "High demand for scalable systems",
                "avg_salary": "$75,000 - $120,000"
            },
            "Machine Learning Engineer": {
                "key_skills": ["Python", "TensorFlow", "Statistics", "Data Processing"],
                "description": "Develops AI/ML models and systems",
                "growth_prospects": "Explosive growth in AI sector",
                "avg_salary": "$95,000 - $160,000"
            }
        }
        
        for i, role in enumerate(role_predictions.get("roles", [])[:5]):
            score = role_predictions.get("scores", [0])[i]
            requirements = role_requirements.get(role, {
                "key_skills": ["Domain Knowledge", "Problem Solving"],
                "description": "Professional role in technology sector",
                "growth_prospects": "Stable career path",
                "avg_salary": "$60,000 - $100,000"
            })
            
            detailed_analysis.append({
                "role": role,
                "match_score": score,
                "key_skills": requirements["key_skills"],
                "description": requirements["description"],
                "growth_prospects": requirements["growth_prospects"],
                "avg_salary": requirements["avg_salary"]
            })
            
        return detailed_analysis

    def generate_optimization_tips(self, parsed_data: Dict, job_description: str = None) -> List[str]:
        tips = []
        
        # Check basic information completeness
        if parsed_data.get('phone') == "Not found":
            tips.append("Add your phone number for better contact accessibility")
            
        if parsed_data.get('linkedin') == "Not found":
            tips.append("Include your LinkedIn profile to show professional networking")
            
        if parsed_data.get('github') == "Not found":
            tips.append("Add your GitHub profile to showcase your coding projects")
            
        # Skills analysis
        skills = parsed_data.get('skills', [])
        if len(skills) < 8:
            tips.append("Add more relevant technical skills to strengthen your profile")
            
        # Experience analysis
        experience_details = parsed_data.get('experience_details', [])
        if not experience_details:
            tips.append("Add detailed work experience with specific achievements")
        else:
            for exp in experience_details:
                if not exp.get('responsibilities'):
                    tips.append("Include specific responsibilities and achievements for each role")
                    
        # Projects analysis
        projects = parsed_data.get('projects', [])
        if len(projects) < 2:
            tips.append("Add more projects to demonstrate practical skills application")
            
        # Summary check
        if parsed_data.get('summary') == "Not found":
            tips.append("Write a compelling professional summary highlighting your key strengths")
            
        # Job-specific tips
        if job_description:
            keywords_analysis = self.extract_keywords_analysis(str(parsed_data), job_description)
            missing_keywords = keywords_analysis.get('missing_keywords', [])
            if missing_keywords:
                tips.append(f"Consider incorporating these job-relevant keywords: {', '.join(missing_keywords[:5])}")
                
        return tips[:8]  # Limit to 8 tips

    def analyze_resume_complete(self, resume_text: str, job_description: str = None, 
                              preferences: Dict = None) -> Dict:
        if not resume_text or not resume_text.strip():
            return {
                "timestamp": datetime.now().isoformat(),
                "error": "Resume text is empty. Please provide resume content.",
                "parsed_resume": {},
                "similarity_scores": {},
                "role_predictions": {"roles": [], "scores": []},
                "keywords_analysis": {"present_keywords": [], "missing_keywords": []},
                "detailed_role_analysis": [],
                "optimization_tips": [],
                "analysis_summary": "Analysis failed due to empty resume."
            }
        
        # Parse resume data
        parsed_data = self.parse_resume(resume_text)
        parsed_data['full_text'] = resume_text
        
        # Calculate similarity scores
        similarity_scores = {}
        if job_description and job_description.strip():
            similarity_scores = self.calculate_similarity_scores(resume_text, job_description)
        
        # Predict job roles
        role_predictions = self.predict_job_roles(resume_text)
        
        # Extract keywords analysis
        keywords_analysis = self.extract_keywords_analysis(resume_text, job_description) if job_description else {"present_keywords": [], "missing_keywords": []}
        
        # Generate detailed role analysis
        detailed_role_analysis = self.generate_detailed_role_analysis(resume_text, role_predictions)
        
        # Generate optimization tips
        optimization_tips = self.generate_optimization_tips(parsed_data, job_description)
        
        # Create analysis summary
        name = parsed_data.get('name', 'Candidate')
        if name == "Not found":
            name = "Candidate"
            
        top_role = role_predictions.get('roles', ['General'])[0]
        num_skills = len(parsed_data.get('skills', []))
        
        analysis_summary = f"Analysis completed for {name}. Top predicted role: {top_role}. Found {num_skills} relevant skills."
        
        complete_analysis = {
            "timestamp": datetime.now().isoformat(),
            "parsed_resume": parsed_data,
            "similarity_scores": similarity_scores,
            "role_predictions": role_predictions,
            "keywords_analysis": keywords_analysis,
            "detailed_role_analysis": detailed_role_analysis,
            "optimization_tips": optimization_tips,
            "analysis_summary": analysis_summary
        }
        
        return complete_analysis