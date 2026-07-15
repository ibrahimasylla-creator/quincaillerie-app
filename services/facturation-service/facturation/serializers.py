from rest_framework import serializers
from .models import Facture, ParametresQuincaillerie

class ParametresSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametresQuincaillerie
        fields = '__all__'

class FactureSerializer(serializers.ModelSerializer):
    # On mock le champ 'format' demandé par le système pour éviter l'erreur
    format = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [f.name for f in Facture._meta.fields] + ['format']

    def get_format(self, obj):
        return 'A4'
