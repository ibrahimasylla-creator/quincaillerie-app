from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "phone", "role", "is_active", "date_joined"]
        read_only_fields = ["id", "role", "is_active", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Inscription publique. D'apres le cahier des charges : toute personne qui
    cree un compte en ligne devient automatiquement un Client. Le role n'est
    donc jamais accepte depuis la requete, on le force cote serveur.
    """

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "phone"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(role=User.Role.CLIENT, **validated_data)
        user.set_password(password)
        user.save()
        return user


class GerantCreateSerializer(serializers.ModelSerializer):
    """Creation d'un compte Gerant, reservee a l'Administrateur."""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name", "phone"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(role=User.Role.GERANT, **validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    JWT enrichi : on ajoute le role et l'id utilisateur dans le token lui-meme.
    C'est ce qui permet a l'API Gateway et a chaque microservice de connaitre
    l'identite et les droits de l'appelant SANS avoir a rappeler le service Auth
    a chaque requete (verification stateless de la signature uniquement).
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["user_id"] = user.id
        token["username"] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
