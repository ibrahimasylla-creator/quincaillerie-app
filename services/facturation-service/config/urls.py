from django.urls import path, include
from facturation.views import telecharger_pdf_direct

urlpatterns = [
    # Notre route native qui court-circuite le framework REST et ses blocages 401
    path('api/facturation/factures/<int:pk>/pdf/', telecharger_pdf_direct, name='pdf_direct'),
    path('api/facturation/', include('facturation.urls')),
]
