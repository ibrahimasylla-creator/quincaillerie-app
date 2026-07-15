from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "auth_user_id", "nom", "telephone", "email", "adresse", "type_client", "date_creation"]
        read_only_fields = ["id", "date_creation"]
