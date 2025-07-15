from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import requests
from django.core.cache import cache
from datetime import datetime, timedelta

# News API configuration
NEWS_API_KEY = "5447104d9f464b4fae5de0c60b3ee59a"  # Move to environment variables

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tech_news(request):
    """
    API endpoint to fetch technology and job-related news
    """
    try:
        # Check cache first (cache for 30 minutes)
        cache_key = 'tech_news_articles'
        cached_articles = cache.get(cache_key)
        
        if cached_articles:
            return Response({
                'success': True,
                'articles': cached_articles,
                'cached': True
            })
        
        # Fetch fresh news
        url = "https://newsapi.org/v2/everything"
        query = "technology AND (developer OR jobs OR placement OR internship OR upskilling OR hiring OR fresher OR resume)"
        articles = []
        
        # Fetch multiple pages
        for page in range(1, 6):
            params = {
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 20,
                "page": page,
                "apiKey": NEWS_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get("status") == "ok":
                # Filter and clean articles
                page_articles = []
                for article in data["articles"]:
                    if article.get("title") and article.get("description"):
                        page_articles.append({
                            'title': article.get("title"),
                            'description': article.get("description"),
                            'url': article.get("url"),
                            'urlToImage': article.get("urlToImage"),
                            'publishedAt': article.get("publishedAt"),
                            'source': article.get("source", {}).get("name", "Unknown")
                        })
                
                articles.extend(page_articles)
            else:
                break
        
        # Cache the results for 30 minutes
        cache.set(cache_key, articles, 1800)
        
        return Response({
            'success': True,
            'articles': articles,
            'total': len(articles),
            'cached': False
        })
        
    except requests.RequestException as e:
        return Response(
            {'error': f'Network error: {str(e)}'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except Exception as e:
        return Response(
            {'error': f'Error fetching news: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_news_categories(request):
    """
    Get available news categories
    """
    categories = [
        {'id': 'tech_jobs', 'name': 'Tech Jobs', 'query': 'technology AND jobs'},
        {'id': 'internships', 'name': 'Internships', 'query': 'internship AND technology'},
        {'id': 'upskilling', 'name': 'Upskilling', 'query': 'upskilling AND programming'},
        {'id': 'hiring', 'name': 'Hiring News', 'query': 'hiring AND developer'},
    ]
    
    return Response({
        'success': True,
        'categories': categories
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_category_news(request, category):
    """
    Get news for specific category
    """
    try:
        category_queries = {
            'tech_jobs': 'technology AND jobs',
            'internships': 'internship AND technology',
            'upskilling': 'upskilling AND programming',
            'hiring': 'hiring AND developer'
        }
        
        if category not in category_queries:
            return Response(
                {'error': 'Invalid category'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f'news_{category}'
        cached_articles = cache.get(cache_key)
        
        if cached_articles:
            return Response({
                'success': True,
                'articles': cached_articles,
                'category': category,
                'cached': True
            })
        
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": category_queries[category],
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 50,
            "apiKey": NEWS_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data.get("status") == "ok":
            articles = []
            for article in data["articles"]:
                if article.get("title") and article.get("description"):
                    articles.append({
                        'title': article.get("title"),
                        'description': article.get("description"),
                        'url': article.get("url"),
                        'urlToImage': article.get("urlToImage"),
                        'publishedAt': article.get("publishedAt"),
                        'source': article.get("source", {}).get("name", "Unknown")
                    })
            
            cache.set(cache_key, articles, 1800)  # Cache for 30 minutes
            
            return Response({
                'success': True,
                'articles': articles,
                'category': category,
                'total': len(articles),
                'cached': False
            })
        else:
            return Response(
                {'error': data.get('message', 'Failed to fetch news')}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
            
    except Exception as e:
        return Response(
            {'error': f'Error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )