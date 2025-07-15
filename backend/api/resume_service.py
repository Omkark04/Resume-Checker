import google.generativeai as genai
import os
from typing import Dict, Any

class ResumeAssistantService:
    def __init__(self):
        # Configure Gemini API - use environment variable in production
        self.api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyD4mMoSdA2KHjBH0O2-3uL3zJ4t2_R7fS0')
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def get_response(self, prompt: str) -> Dict[str, Any]:
        """
        Get response from Gemini API for any prompt
        """
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"temperature": 0.3}
            )
            
            return {
                'success': True,
                'response': response.text
            }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }