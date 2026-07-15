from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Reserve aux comptes Administrateur (gestion du personnel)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == request.user.Role.ADMIN
        )


class IsAdminOrGerant(BasePermission):
    """Personnel de la quincaillerie (pas les clients)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (request.user.Role.ADMIN, request.user.Role.GERANT)
        )
