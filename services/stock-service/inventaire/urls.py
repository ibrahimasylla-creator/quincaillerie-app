from rest_framework.routers import DefaultRouter

from .views import MouvementStockViewSet, StockViewSet

router = DefaultRouter()
router.register("mouvements", MouvementStockViewSet, basename="mouvement")
router.register("", StockViewSet, basename="stock")

urlpatterns = router.urls
