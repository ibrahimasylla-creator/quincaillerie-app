import { useEffect, useState } from "react";
import { Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Printer } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Badge, Button, Card, EmptyState, PageHeader } from "../components/ui";
import { ProduitThumbnail } from "./ProduitsPage";

function imprimerFactureDirecte(factureData) {
  if (!factureData) {
    alert("Données de la facture indisponibles.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres surgissantes pour l'impression.");
    return;
  }

  // Calcul de la date du jour formatée proprement
  const dateFacture = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Construction d'un reçu d'impression épuré
  printWindow.document.write(`
    <html>
      <head>
        <title>Facture #${factureData.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d97a29; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #d97a29; text-transform: uppercase; }
          .title { font-size: 22px; text-align: right; font-weight: 300; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f9f9f9; padding: 15px; border-radius: 4px; }
          .details h4 { margin: 0 0 5px 0; color: #555; }
          .details p { margin: 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { background-color: #f5f5f5; text-align: left; padding: 12px; font-size: 14px; border-bottom: 1px solid #ddd; }
          td { padding: 12px; font-size: 14px; border-bottom: 1px solid #eee; }
          .total-section { display: flex; justify-content: flex-end; font-size: 16px; margin-top: 20px; }
          .total-box { border-top: 2px solid #333; padding-top: 10px; width: 250px; text-align: right; }
          .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          
          @media print {
            .no-print { display: none; }
            body { margin: 30px; }
            /* Supprime l'URL et le titre générés par le navigateur */
            @page { margin: 0; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Quincaillerie Générale</div>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Gestion des ventes et stocks en temps réel</p>
          </div>
          <div class="title">
            <strong>FACTURE</strong><br>
            <span style="font-size: 14px; color: #666;">Numéro : #${factureData.id}</span>
          </div>
        </div>

        <div class="details">
          <div>
            <h4>Émis par :</h4>
            <p><strong>Quincaillerie Moderne</strong></p>
            <p>Service Comptoir</p>
          </div>
          <div style="text-align: right;">
            <h4>Date de facturation :</h4>
            <p>${dateFacture}</p>
            <p><strong>Statut :</strong> <span style="color: green; font-weight: bold;">PAYÉ</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Référence / Désignation</th>
              <th style="text-align: right; white-space: nowrap; padding-right: 15px;">Prix Unitaire</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Montant total</th>
            </tr>
          </thead>
          <tbody>
            ${
              factureData.lignes && factureData.lignes.length > 0 
                ? factureData.lignes.map(l => `
                    <tr>
                      <td>${l.produit_nom || 'Article Quincaillerie'}</td>
                      <td style="text-align: right; padding-right: 15px;">${Number(l.prix_unitaire || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td style="text-align: center;">${l.quantite}</td>
                      <td style="text-align: right; font-weight: bold;">${(Number(l.prix_unitaire || 0) * l.quantite).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  `).join('')
                : `<tr>
                    <td>Achat Quincaillerie Comptoir</td>
                    <td style="text-align: right; padding-right: 15px;">${Number(factureData.montant_total).toLocaleString('fr-FR')} FCFA</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right; font-weight: bold;">${Number(factureData.montant_total).toLocaleString('fr-FR')} FCFA</td>
                   </tr>`
            }
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-box">
            <span style="font-size: 14px; color: #666;">NET À PAYER :</span><br>
            <strong style="font-size: 20px; color: #d97a29;">${Number(factureData.montant_total).toLocaleString("fr-FR")} FCFA</strong>
          </div>
        </div>

        <div class="footer">
          <p>Merci pour votre confiance et votre fidélité !</p>
          <p style="font-size: 10px; color: #999;">Application Quincaillerie-App — Document généré pour validation de diplôme.</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function VentePage() {
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [panier, setPanier] = useState([]); 
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [derniereFacture, setDerniereFacture] = useState(null);

  useEffect(() => {
    api.get("/api/produits/").then((res) => setProduits(res.data)).catch(() => {});
    api.get("/api/clients/").then((res) => setClients(res.data)).catch(() => {});
  }, []);

  const produitsFiltres = produits.filter(
    (p) =>
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase())
  );

  function addToPanier(produit) {
    setPanier((prev) => {
      const existing = prev.find((l) => l.produit_id === produit.id);
      if (existing) {
        return prev.map((l) =>
          l.produit_id === produit.id ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [
        ...prev,
        {
          produit_id: produit.id,
          nom: produit.nom,
          reference: produit.reference,
          prix_vente: Number(produit.prix_vente),
          quantite: 1,
        },
      ];
    });
  }

  function updateQuantite(produit_id, delta) {
    setPanier((prev) =>
      prev
        .map((l) => (l.produit_id === produit_id ? { ...l, quantite: l.quantite + delta } : l))
        .filter((l) => l.quantite > 0)
    );
  }

  function removeLigne(produit_id) {
    setPanier((prev) => prev.filter((l) => l.produit_id !== produit_id));
  }

  const total = panier.reduce((sum, l) => sum + l.prix_vente * l.quantite, 0);

  async function handleValider() {
    if (panier.length === 0) return;
    setSubmitting(true);
    setError("");
    setDerniereFacture(null);
    try {
      // 1. Enregistrement de la vente
      const { data } = await api.post("/api/ventes/", {
        client_id: clientId || null,
        lignes: panier.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })),
      });

      // 2. Préparation des lignes pour l'impression immédiate
      const factureComplete = {
        ...data,
        lignes: panier.map(item => ({
          produit_nom: `${item.reference} - ${item.nom}`,
          prix_unitaire: item.prix_vente,
          quantite: item.quantite
        }))
      };

      setDerniereFacture(factureComplete);
      setPanier([]);
      setClientId("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Vente au comptoir"
        description="Compose le panier, le systeme verifie le stock et genere la facture automatiquement."
      />

      {derniereFacture && (
        <Card className="p-5 mb-6 border-emerald-200 bg-emerald-50/60 rounded-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Vente #{derniereFacture.id} enregistrée — {Number(derniereFacture.montant_total).toLocaleString("fr-FR")} FCFA.
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  La facture a été générée avec succès en arrière-plan.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => imprimerFactureDirecte(derniereFacture)}
                className="inline-flex items-center gap-2 bg-[#d97a29] hover:bg-[#c96f22] text-white px-4 py-2 rounded text-xs font-medium transition-colors shadow-sm"
              >
                <Printer size={14} /> Ouvrir & Imprimer la Facture
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <input
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Rechercher un produit a ajouter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            {produitsFiltres.map((p) => (
              <button
                key={p.id}
                onClick={() => addToPanier(p)}
                className="text-left p-4 rounded-lg border border-border bg-surface hover:border-brand hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <ProduitThumbnail produit={p} size={44} />
                  <div className="min-w-0">
                    <span className="tag-ref">{p.reference}</span>
                    <p className="font-medium text-ink mt-1 truncate">{p.nom}</p>
                    <p className="text-sm text-ink-muted font-mono">
                      {Number(p.prix_vente).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {produitsFiltres.length === 0 && (
              <p className="col-span-2 text-sm text-ink-muted py-8 text-center">
                Aucun produit ne correspond.
              </p>
            )}
          </div>
        </div>

        <div>
          <Card className="p-4 sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={18} className="text-brand" />
              <h2 className="font-display font-semibold">Panier</h2>
            </div>

            {clients.length > 0 && (
              <select
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand/40"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Vente comptoir (sans client)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            )}

            {panier.length === 0 ? (
              <EmptyState title="Panier vide" description="Cliquez sur un produit pour l'ajouter." />
            ) : (
              <div className="space-y-3 mb-4">
                {panier.map((l) => (
                  <div key={l.produit_id} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">{l.nom}</p>
                      <p className="text-xs text-ink-muted font-mono">
                        {l.prix_vente.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                    <button
                      onClick={() => updateQuantite(l.produit_id, -1)}
                      className="p-1 rounded hover:bg-surface-2"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-mono">{l.quantite}</span>
                    <button
                      onClick={() => updateQuantite(l.produit_id, 1)}
                      className="p-1 rounded hover:bg-surface-2"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeLigne(l.produit_id)}
                      className="p-1 rounded hover:bg-danger-soft text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-ink-muted">Total</span>
              <span className="font-display text-lg font-semibold">
                {total.toLocaleString("fr-FR")} FCFA
              </span>
            </div>

            {error && <p className="text-sm text-danger mb-3">{error}</p>}

            <Button
              className="w-full bg-[#d97a29] hover:bg-[#c96f22] text-white"
              disabled={panier.length === 0 || submitting}
              onClick={handleValider}
            >
              {submitting ? "Validation..." : "Valider la vente"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
