import { useEffect, useState } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, Check } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Badge, Card, PageHeader } from "../components/ui";

export default function VentesPage() {
  const [produits, setProduits] = useState([]);
  const [panier, setPanier] = useState([]);
  const [search, setSearch] = useState("");
  const [montantVerse, setMontantVerse] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProds, setLoadingProds] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadProduits() {
    try {
      const { data } = await api.get("/api/produits/");
      setProduits(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoadingProds(false);
    }
  }

  useEffect(() => {
    loadProduits();
  }, []);

  const totalGeneral = panier.reduce((acc, item) => acc + item.prix * item.quantite, 0);
  const verseNum = parseFloat(montantVerse) || 0;
  
  // CONDITION DE DÉSACTIVATION : Panier vide OU Montant Versé > Total Général
  const estInvalide = verseNum > totalGeneral || panier.length === 0;

  function ajouterAuPanier(p) {
    setPanier((prev) => {
      const ex = prev.find((item) => item.id === p.id);
      if (ex) {
        return prev.map((item) =>
          item.id === p.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prev, { id: p.id, nom: p.nom, prix: Number(p.prix_vente), quantite: 1, reference: p.reference }];
    });
  }

  function modifierQuantite(id, delta) {
    setPanier((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nq = item.quantite + delta;
            return nq > 0 ? { ...item, quantite: nq } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }

  function supprimerLigne(id) {
    setPanier((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleValider(e) {
    if (e) e.preventDefault();
    const verseCheck = parseFloat(montantVerse) || 0;
    if (panier.length === 0 || verseCheck > totalGeneral) {
      setError("Action impossible : le montant versé dépasse le total du panier.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        montant_verse: verseNum,
        lignes: panier.map((item) => ({
          produit_id: item.id,
          quantite: item.quantite,
          prix_unitaire: item.prix,
        })),
      };
      await api.post("/api/ventes/", payload);
      setSuccessMsg("Vente enregistrée avec succès !");
      setPanier([]);
      setMontantVerse("");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadProduits();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const produitsFiltres = produits.filter(
    (p) =>
      p.nom?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Vente au comptoir"
        description="Compose le panier, le système vérifie le stock et génère la facture automatiquement."
      />

      {successMsg && (
        <div className="mb-4 p-3 rounded-md bg-emerald-100 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <Check size={16} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-800 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des produits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit à ajouter..."
              className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {loadingProds ? (
            <p className="text-sm text-gray-500">Chargement des produits...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {produitsFiltres.map((p) => (
                <div
                  key={p.id}
                  onClick={() => ajouterAuPanier(p)}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 cursor-pointer transition-all flex items-center gap-3 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                    📦
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {p.reference}
                    </span>
                    <h4 className="font-semibold text-sm text-gray-800 truncate mt-0.5">{p.nom}</h4>
                    <p className="text-xs font-bold text-emerald-700">
                      {Number(p.prix_vente).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panier */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
              <ShoppingCart size={18} /> Panier
            </h3>

            {panier.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Le panier est vide.</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto divide-y divide-gray-100">
                {panier.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{item.nom}</p>
                      <p className="text-gray-500">{item.prix.toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => modifierQuantite(item.id, -1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold">{item.quantite}</span>
                      <button
                        onClick={() => modifierQuantite(item.id, 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => supprimerLigne(item.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Total</span>
                <span>{totalGeneral.toLocaleString("fr-FR")} FCFA</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Montant versé (FCFA) :
                </label>
                <input
                  type="number"
                  value={montantVerse}
                  onChange={(e) => setMontantVerse(e.target.value)}
                  placeholder="Mettez 0 ou l'acompte"
                  className={`w-full p-2 border text-sm rounded-md focus:outline-none ${
                    verseNum > totalGeneral ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                />
                {verseNum > totalGeneral && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    ⚠️ Le montant versé ne peut pas être supérieur au total ({totalGeneral.toLocaleString("fr-FR")} FCFA).
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleValider}
                disabled={estInvalide || loading}
                className={`w-full py-2.5 rounded-md font-bold text-sm transition-colors ${
                  estInvalide || loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                    : "bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
                }`}
              >
                {loading ? "Validation..." : "Valider la vente"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
