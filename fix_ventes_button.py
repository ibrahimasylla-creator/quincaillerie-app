import re

file_path = "/home/cheikh/quincaillerie-app/frontend/src/pages/VentesPage.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. On injecte le calcul et le contrôle d'invalidation dans le composant
# On cherche le bouton "Valider la vente" et on modifie sa propriété `disabled`
old_button_pattern = r'(<button\b[^>]*>[\s\S]*?Valider la vente[\s\S]*?</button>)'

# Script autonome d'écriture propre
python_installer = """import { useEffect, useState } from "react";
"""

