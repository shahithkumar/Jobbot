from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([AllowAny])
def debug_log_view(request):
    """
    Endpoint for frontend to send logs to backend console.
    """
    message = request.data.get('msg', '')
    context = request.data.get('context', 'FRONTEND')
    
    # Yellow for Frontend logs to distinguish them
    print(f"\033[93m[{context}] {message}\033[0m")
    
    return Response({"status": "logged"})
