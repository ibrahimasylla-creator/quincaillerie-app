from rest_framework.routers import DefaultRouter

from .views import CategorieViewSet, ProduitViewSet

router = DefaultRouter()
router.register("categories", CategorieViewSet, basename="categorie")
router.register("", ProduitViewSet, basename="produit")

urlpatterns = router.urls
