#!/bin/bash

OUTPUT="AUDIT_ARCHITECTURE.txt"
echo "==================================================" > $OUTPUT
echo "      AUDIT DÉTAILLÉ DU PROJET QUINCAILLERIE      " >> $OUTPUT
echo "==================================================" >> $OUTPUT
echo "Généré le : $(date)" >> $OUTPUT
echo "" >> $OUTPUT

echo "=== 1. STRUCTURE DES DOSSIERS SERVICES ===" >> $OUTPUT
tree -I "venv|__pycache__|*.pyc|node_modules|.git|migrations" services/ >> $OUTPUT 2>/dev/null || find services/ -maxdepth 3 -not -path '*/.*' >> $OUTPUT
echo "" >> $OUTPUT

echo "==================================================" >> $OUTPUT
echo "=== 2. ANALYSE DES SERVICES DJANGO (PYTHON) ======" >> $OUTPUT
echo "==================================================" >> $OUTPUT

for service_dir in services/*/; do
    if [ -d "$service_dir" ]; then
        SERVICE_NAME=$(basename "$service_dir")
        echo "" >> $OUTPUT
        echo "--------------------------------------------------" >> $OUTPUT
        echo "   SERVICE : $SERVICE_NAME" >> $OUTPUT
        echo "--------------------------------------------------" >> $OUTPUT
        
        # 1. Models
        echo "--- [MODÈLES BDD (models.py)] ---" >> $OUTPUT
        find "$service_dir" -name "models.py" -exec echo "Fichier: {}" \; -exec cat {} \; >> $OUTPUT
        echo "" >> $OUTPUT

        # 2. Serializers
        echo "--- [SERIALIZERS (serializers.py)] ---" >> $OUTPUT
        find "$service_dir" -name "serializers.py" -exec echo "Fichier: {}" \; -exec cat {} \; >> $OUTPUT
        echo "" >> $OUTPUT

        # 3. Views
        echo "--- [VUES & VUE-SET (views.py)] ---" >> $OUTPUT
        find "$service_dir" -name "views.py" -exec echo "Fichier: {}" \; -exec cat {} \; >> $OUTPUT
        echo "" >> $OUTPUT

        # 4. URLs / Routes API
        echo "--- [ROUTES API (urls.py)] ---" >> $OUTPUT
        find "$service_dir" -name "urls.py" -exec echo "Fichier: {}" \; -exec cat {} \; >> $OUTPUT
        echo "" >> $OUTPUT
    fi
done

echo "==================================================" >> $OUTPUT
echo "=== 3. FRONTEND (SERVICES ET COMPOSANTS) =========" >> $OUTPUT
echo "==================================================" >> $OUTPUT

if [ -d "frontend" ]; then
    echo "--- [ROUTES REACT / CONFIG API] ---" >> $OUTPUT
    find frontend/src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -exec grep -Hn "api" {} + >> $OUTPUT 2>/dev/null
    
    echo "" >> $OUTPUT
    echo "--- [COMPOSANTS FACTURES / VENTES] ---" >> $OUTPUT
    find frontend/src -type f \( -name "*Vente*.js" -o -name "*Facture*.js" -o -name "*Vente*.jsx" -o -name "*Facture*.jsx" \) -exec echo "Fichier: {}" \; -exec cat {} \; >> $OUTPUT
fi

echo "✅ Audit terminé ! Le fichier '$OUTPUT' a été généré."
