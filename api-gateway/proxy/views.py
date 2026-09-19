import requests
import jwt
import os
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

# SERVICES_URLS = {
#     'auth': 'http://auth-service:8000',
#     'produits': 'http://produits-service:8000',
#     'stock': 'http://stock-service:8000',
#     'client': 'http://client-service:8000',
#     'clients': 'http://client-service:8000',
#     'ventes': 'http://ventes-service:8000',
#     'facturation': 'http://facturation-service:8000',
#     'achats': 'http://achats-service:8000',
# }
SERVICES_URLS = {
    'auth': os.getenv('AUTH_SERVICE_URL', 'https://quincaillerie-auth-service.onrender.com'),
    'produits': os.getenv('PRODUITS_SERVICE_URL', 'https://quincaillerie-produits-service.onrender.com'),
    'stock': os.getenv('STOCK_SERVICE_URL', 'https://quincaillerie-stock-service.onrender.com'),
    'client': os.getenv('CLIENT_SERVICE_URL', 'https://quincaillerie-client-service.onrender.com'),
    'clients': os.getenv('CLIENT_SERVICE_URL', 'https://quincaillerie-client-service.onrender.com'),
    'ventes': os.getenv('VENTES_SERVICE_URL', 'https://quincaillerie-ventes-service.onrender.com'),
    'facturation': os.getenv('FACTURATION_SERVICE_URL', 'https://quincaillerie-facturation-service.onrender.com'),
    'achats': os.getenv('ACHATS_SERVICE_URL', 'https://quincaillerie-achats-service.onrender.com'),
}
JWT_SECRET = os.environ.get('JWT_SHARED_SECRET', 'shared-jwt-secret')
JWT_ALGORITHM = 'HS256'

@csrf_exempt
def proxy_view(request, service_name, path):
    base_url = SERVICES_URLS.get(service_name)
    if not base_url:
        return JsonResponse({'detail': 'Service introuvable'}, status=404)

    is_public = (request.path.startswith('/api/auth/') and not '/gerants' in request.path) or '/media/' in request.path
    is_pdf = 'pdf' in path

    headers = {'Content-Type': request.headers.get('Content-Type', 'application/json')}

    if not is_public and not is_pdf:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({'detail': 'Authentification requise.'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            headers['X-User-Id'] = str(payload.get('user_id', ''))
            headers['X-User-Role'] = str(payload.get('role', ''))
            headers['X-Username'] = str(payload.get('username', ''))
            headers['Authorization'] = auth_header
        except jwt.ExpiredSignatureError:
            return JsonResponse({'detail': 'Token expire.'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'detail': 'Token invalide.'}, status=401)

    target_url = f"{base_url}/api/{service_name}/{path}"
    if request.GET:
        target_url += f"?{request.GET.urlencode()}"

    try:
        response = requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            data=request.body,
            timeout=10
        )
        django_response = HttpResponse(
            response.content,
            status=response.status_code,
            content_type=response.headers.get('Content-Type')
        )
        if 'Content-Disposition' in response.headers:
            django_response['Content-Disposition'] = response.headers['Content-Disposition']
        return django_response
    except requests.exceptions.RequestException as e:
        return JsonResponse({'detail': f'Erreur de passerelle: {str(e)}'}, status=502)
