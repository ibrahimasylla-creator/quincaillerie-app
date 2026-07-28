import re

target = "/home/cheikh/quincaillerie-app/frontend/src/pages/VentesPage.jsx"

with open(target, "r", encoding="utf-8") as f:
    code = f.read()

# Injection de la validation dans la fonction de soumission
if "montantVerse >" not in code and "Number(montantVerse) >" not in code:
    code = code.replace(
        "async function handleValider() {",
        """async function handleValider() {
    const total = panier.reduce((acc, item) => acc + item.prix * item.quantite, 0);
    if (Number(montantVerse) > total) {
      alert(`Erreur : Le montant versé (${Number(montantVerse).toLocaleString("fr-FR")} FCFA) ne peut pas être supérieur au total de la commande (${total.toLocaleString("fr-FR")} FCFA).`);
      return;
    }"""
    )

with open(target, "w", encoding="utf-8") as f:
    f.write(code)

print(" Validation du montant versé appliquée dans VentesPage.jsx !")
