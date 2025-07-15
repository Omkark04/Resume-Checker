from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .resume_service import ResumeAssistantService
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Remove if authentication not needed
def gemini_chat(request):
    """
    Handle chat messages with Gemini API (no database interactions)
    """
    prompt = request.data.get('prompt', '').strip()
    
    if not prompt:
        return Response(
            {'error': 'Prompt is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        service = ResumeAssistantService()
        result = service.get_response(prompt)
        
        if result['success']:
            return Response({
                'success': True,
                'response': result['response']
            })
        
        return Response(
            {'error': result.get('error', 'Failed to generate response')},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
            
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )