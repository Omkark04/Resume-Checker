import requests
import os
from typing import List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self):
        self.api_key = os.getenv('NEWS_API_KEY', '5447104d9f464b4fae5de0c60b3ee59a')
        self.base_url = "https://newsapi.org/v2/everything"
    
    def get_tech_job_news(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """
        Fetch technology and job-related news articles
        """
        query = "technology AND (developer OR jobs OR placement OR internship OR upskilling OR hiring OR fresher OR resume)"
        
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size,
            "page": page,
            "apiKey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "ok":
                # Process articles to ensure they have all required fields
                processed_articles = []
                for article in data.get("articles", []):
                    processed_article = {
                        'title': article.get('title', 'No Title'),
                        'description': article.get('description', 'No Description'),
                        'url': article.get('url', ''),
                        'urlToImage': article.get('urlToImage', ''),
                        'publishedAt': article.get('publishedAt', ''),
                        'source': article.get('source', {}).get('name', 'Unknown Source'),
                        'author': article.get('author', 'Unknown Author')
                    }
                    processed_articles.append(processed_article)
                
                return {
                    'success': True,
                    'articles': processed_articles,
                    'totalResults': data.get('totalResults', 0),
                    'error': None
                }
            else:
                error_msg = data.get('message', 'Unknown error from NewsAPI')
                logger.error(f"NewsAPI Error: {error_msg}")
                return {
                    'success': False,
                    'articles': [],
                    'totalResults': 0,
                    'error': error_msg
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            return {
                'success': False,
                'articles': [],
                'totalResults': 0,
                'error': f'Network error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {
                'success': False,
                'articles': [],
                'totalResults': 0,
                'error': f'Unexpected error: {str(e)}'
            }
    
    def get_multiple_pages(self, max_pages: int = 5) -> Dict[str, Any]:
        """
        Fetch news from multiple pages for more comprehensive results
        """
        all_articles = []
        total_results = 0
        errors = []
        
        for page in range(1, max_pages + 1):
            result = self.get_tech_job_news(page=page)
            
            if result['success']:
                all_articles.extend(result['articles'])
                total_results = result['totalResults']
            else:
                errors.append(f"Page {page}: {result['error']}")
                break  # Stop on first error to avoid rate limiting
        
        return {
            'success': len(all_articles) > 0,
            'articles': all_articles,
            'totalResults': total_results,
            'errors': errors if errors else None
        }
    
    def search_specific_topic(self, topic: str, page: int = 1) -> Dict[str, Any]:
        """
        Search for news on a specific topic
        """
        query = f"{topic} AND (technology OR programming OR software OR developer)"
        
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 20,
            "page": page,
            "apiKey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "ok":
                return {
                    'success': True,
                    'articles': data.get("articles", []),
                    'totalResults': data.get('totalResults', 0),
                    'error': None
                }
            else:
                return {
                    'success': False,
                    'articles': [],
                    'totalResults': 0,
                    'error': data.get('message', 'Unknown error')
                }
                
        except Exception as e:
            return {
                'success': False,
                'articles': [],
                'totalResults': 0,
                'error': str(e)
            }