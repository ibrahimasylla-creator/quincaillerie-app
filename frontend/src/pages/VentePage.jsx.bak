import { useEffect, useState } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle2, Printer } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Badge, Card, PageHeader, Button } from "../components/ui";

function imprimerFactureImpressionImmediate(factureData) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres surgissantes pour l'impression.");
    return;
  }

  const mTotal = Number(factureData.montant_total || 0);
  const mVerse = factureData.montant_verse !== undefined ? Number(factureData.montant_verse) : mTotal;
  const mReste = mTotal - mVerse;

  let statutHtml = '<span style="color: green; font-weight: bold;">RÉGLÉ (PAYÉ)</span>';
  if (mReste > 0 && mVerse > 0) {
    statutHtml = '<span style="color: orange; font-weight: bold;">ACOMPTE (PARTIEL)</span>';
  } else if (mReste > 0 && mVerse === 0) {
    statutHtml = '<span style="color: red; font-weight: bold;">CRÉANCE (NON PAYÉ)</span>';
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Facture #${factureData.id}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .total { text-align: right; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>QUINCAILLERIE</h2>
          <p>Facture N° ${factureData.id}</p>
        </div>
        <p><strong>Statut:</strong> ${statutHtml}</p>
        <table class="table">
          <thead>
            <tr><th>Produit</th><th>Qté</th><th>Prix U.</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${(factureData.lignes || []).map(l => `
              <tr>
                <td>${l.produit_nom || l.nom || 'Produit'}</td>
                <td>${l.quantite}</td>
                <td>${Number(l.prix_unitaire || 0).toLocaleString("fr-FR")} FCFA</td>
                <td>${(Number(l.prix_unitaire || 0) * l.quantite).toLocaleString("fr-FR")} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>Total: <strong>${mTotal.toLocaleString("fr-FR")} FCFA</strong></p>
          <p>Versé: ${mVerse.toLocaleString("fr-FR")} FCFA</p>
          <p>Reste: ${mReste.toLocaleString("fr-FR")} FCFA</p>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export default function VentePage() {
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [panier, setPanier] = useState([]);
  const [montantVerse, setMontantVerse] = useState("");
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [derniereFacture, setDerniereFacture] = useState(null);

  useEffect(() => {
    api.get("/api/produits/").then((res) => setProduits(res.data)).catch(() => {});
    api.get("/api/clients/").then((res) => setClients(res.data)).catch(() => {});
  }, []);

  const produitsFiltres = produits.filter(
    (p) =>
      p.nom?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  function ajouterAuPanier(produit) {
    setPanier((prev) => {
      const existing = prev.find((l) => l.produit_id === produit.id || l.id === produit.id);
      if (existing) {
        return prev.map((l) =>
          (l.produit_id === produit.id || l.id === produit.id)
            ? { ...l, quantite: l.quantite + 1 }
            : l
        );
      }
      return [
        ...prev,
        {
          id: produit.id,
          produit_id: produit.id,
          nom: produit.nom,
          reference: produit.reference,
          prix_vente: Number(produit.prix_vente),
          quantite: 1,
        },
      ];
    });
  }

  function modifierQuantite(produit_id, delta) {
    setPanier((prev) =>
      prev
        .map((l) => {
          if (l.produit_id === produit_id || l.id === produit_id) {
            const nq = l.quantite + delta;
            return nq > 0 ? { ...l, quantite: nq } : null;
          }
          return l;
        })
        .filter(Boolean)
    );
  }

  function supprimerLigne(produit_id) {
    setPanier((prev) => prev.filter((l) => (l.produit_id || l.id) !== produit_id));
  }

  const total = panier.reduce((sum, l) => sum + l.prix_vente * l.quantite, 0);
  const verseNum = parseFloat(String(montantVerse).replace(",", ".")) || 0;
  const montantTropEleve = montantVerse !== "" && verseNum > total;
  const estInvalide = panier.length === 0 || submitting || montantTropEleve;

  async function handleValider() {
    if (estInvalide) return;
    setSubmitting(true);
    setError("");
    setDerniereFacture(null);

    let finalVerse = total;
    if (montantVerse !== "") {
      finalVerse = verseNum;
    }

    try {
      const { data } = await api.post("/api/ventes/", {
        client_id: clientId || null,
        montant_verse: finalVerse,
        lignes: panier.map((l) => ({
          produit_id: l.produit_id || l.id,
          quantite: l.quantite,
        })),
      });

      const factureComplete = {
        ...data,
        montant_verse: finalVerse,
        lignes: panier.map((item) => ({
          produit_nom: `${item.reference} - ${item.nom}`,
          prix_unitaire: item.prix_vente,
          quantite: item.quantite,
        })),
      };

      setDerniereFacture(factureComplete);
      setPanier([]);
      setMontantVerse("");
      setClientId("");

      api.get("/api/produits/").then((res) => setProduits(res.data)).catch(() => {});
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Pagination : 18 produits par page (3 colonnes x 6 lignes)
  const itemsPerPage = 18;
  const totalPages = Math.ceil(produitsFiltres.length / itemsPerPage) || 1;
  const indexDebut = (currentPage - 1) * itemsPerPage;
  const produitsAffiches = produitsFiltres.slice(indexDebut, indexDebut + itemsPerPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vente au comptoir"
        description="Compose le panier, le systeme verifie le stock et genere la facture automatiquement."
      />

      {error && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {derniereFacture && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Vente #{derniereFacture.id} enregistrée — {Number(derniereFacture.montant_total).toLocaleString("fr-FR")} FCFA.
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  La facture a été générée avec succès.
                </p>
              </div>
            </div>
            <button
              onClick={() => imprimerFactureImpressionImmediate(derniereFacture)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold flex items-center gap-2"
            >
              <Printer size={14} /> Imprimer la Facture
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Liste produits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher un produit à ajouter..."
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* Grille des produits : 3 colonnes x 6 lignes = 18 max */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {produitsAffiches.map((p) => (
              <div
                key={p.id}
                onClick={() => ajouterAuPanier(p)}
                className="p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-600 hover:shadow-md cursor-pointer transition-all flex items-center gap-3 shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                  {(p.image || p.photo || p.photo_url || p.image_url) ? (
                    <img
                      src={p.image || p.photo || p.photo_url || p.image_url}
                      alt={p.nom}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    style={{ display: (p.image || p.photo || p.photo_url || p.image_url) ? 'none' : 'flex' }}
                    className="text-lg"
                  >
                    📦
                  </span>
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {p.reference}
                  </span>
                  <h4 className="font-semibold text-sm text-gray-800 truncate mt-0.5">{p.nom}</h4>
                  <p className="text-xs font-bold text-emerald-800">
                    {Number(p.prix_vente).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-4">
              <span className="text-xs text-gray-600 font-medium">
                Page {currentPage} sur {totalPages} ({produitsFiltres.length} produits)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm"
                  }`}
                >
                  ◀ Précédent
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                      : "bg-emerald-800 text-white hover:bg-emerald-900 border-emerald-800 shadow-sm"
                  }`}
                >
                  Suivant ▶
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panier */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart size={18} /> Panier
            </h3>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Client :</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full p-2 border rounded-md text-xs outline-none focus:ring-1 focus:ring-emerald-700"
              >
                <option value="">Vente comptoir (sans client)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.telephone ? `(${c.telephone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {panier.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Panier vide<br />Cliquez sur un produit pour l'ajouter.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-gray-100">
                {panier.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{item.nom}</p>
                      <p className="text-gray-500">{item.prix_vente.toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => modifierQuantite(item.id, -1)} className="p-1 hover:bg-gray-100 rounded">
                        <Minus size={12} />
                      </button>
                      <span className="font-bold px-1">{item.quantite}</span>
                      <button onClick={() => modifierQuantite(item.id, 1)} className="p-1 hover:bg-gray-100 rounded">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => supprimerLigne(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 flex justify-between items-center text-sm font-bold">
              <span>Total</span>
              <span>{total.toLocaleString("fr-FR")} FCFA</span>
            </div>

            <div className="space-y-1 my-3">
              <label className="text-sm font-medium text-gray-700">Montant versé (FCFA) :</label>
              <input
                type="number"
                placeholder="Ex: Laisser vide si total payé"
                value={montantVerse}
                onChange={(e) => setMontantVerse(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 ${
                  montantTropEleve ? "border-red-500 bg-red-50 text-red-900 focus:ring-red-500" : "focus:ring-emerald-700"
                }`}
              />
              {montantTropEleve ? (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  ⚠️ Le montant versé ne peut pas dépasser le total ({total.toLocaleString("fr-FR")} FCFA).
                </p>
              ) : (
                <p className="text-xs text-gray-500">Mettez 0 ou l'acompte pour une vente à crédit.</p>
              )}
            </div>

            <Button
              className={`w-full transition-all ${
                estInvalide
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                  : "bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
              }`}
              disabled={estInvalide}
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
