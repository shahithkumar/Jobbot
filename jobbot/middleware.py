import time

class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        # Cyan color for Request
        print(f"\033[96m[REQUEST] {request.method} {request.path}\033[0m")
        
        response = self.get_response(request)
        
        duration = time.time() - start_time
        
        # Green for 200s, Red for errors
        color = "\033[92m" if response.status_code < 400 else "\033[91m"
        print(f"{color}[RESPONSE] {response.status_code} ({duration:.2f}s)\033[0m")
        
        return response
