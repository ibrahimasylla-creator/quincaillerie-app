# Generated manually to align schema with Vente and LigneVente models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventes', '0001_initial'),
    ]

    operations = [
        # Ajout des nouveaux champs sur Vente
        migrations.AddField(
            model_name='vente',
            name='client_nom',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='vente',
            name='montant_verse',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='vente',
            name='statut_paiement',
            field=models.CharField(
                choices=[('PAYE', 'Payé'), ('PARTIEL', 'Acompte / Partiel'), ('NON_PAYE', 'Non payé')],
                default='PAYE',
                max_length=20
            ),
        ),
        # Suppression des anciens champs obsolètes
        migrations.RemoveField(
            model_name='vente',
            name='gerant_id',
        ),
        migrations.RemoveField(
            model_name='vente',
            name='statut',
        ),
        # Modifications du champ client_id (PositiveIntegerField -> IntegerField)
        migrations.AlterField(
            model_name='vente',
            name='client_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        # Ajout du sous_total sur LigneVente
        migrations.AddField(
            model_name='lignevente',
            name='sous_total',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=12, null=True),
        ),
        # Adjustements LigneVente
        migrations.AlterField(
            model_name='lignevente',
            name='produit_id',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='lignevente',
            name='quantite',
            field=models.IntegerField(),
        ),
    ]
