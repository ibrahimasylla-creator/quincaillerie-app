import { useEffect, useState } from "react";
import { AlertTriangle, Plus, X, History } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Badge, Button, Card, EmptyState, PageHeader } from "../components/ui";
import { ProduitThumbnail } from "./ProduitsPage";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function StockPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [selected, setSelected] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [motif, setMotif] = useState("Reception fournisseur");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [historique, setHistorique] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loadingMvt, setLoadingMvt] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [stockRes, produitsRes] = await Promise.all([
        api.get("/api/stock/"),
        api.get("/api/produits/"),
      ]);
      const produitsById = Object.fromEntries(produitsRes.data.map((p) => [p.id, p]));
      const enriched = stockRes.data.map((s) => ({
        ...s,
        produit: produitsById[s.produit_id],
      }));
      enriched.sort((a, b) => {
        if (a.en_alerte && !b.en_alerte) return -1;
        if (!a.en_alerte && b.en_alerte) return 1;
        return 0;
      });
      setRows(enriched);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleReappro(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await api.post("/api/stock/mouvements/", {
        produit_id: selected.produit_id,
        type: "ENTREE",
        quantite: Number(quantite),
        motif: motif || "Reapprovisionnement",
      });
      setSelected(null);
      setQuantite(1);
      setMotif("Reception fournisseur");
      await load();
    } catch (err) {
      setSaveError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function openHistorique(row) {
    setHistorique(row);
    setLoadingMvt(true);
    try {
      const { data } = await api.get("/api/stock/mouvements/", {
        params: { produit_id: row.produit_id },
      });
      setMouvements(data);
    } catch {
      setMouvements([]);
    } finally {
      setLoadingMvt(false);
    }
  }

  const enAlerte = rows.filter((r) => r.en_alerte);

  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  const indexDebut = (currentPage - 1) * itemsPerPage;
  const rowsAffiches = rows.slice(indexDebut, indexDebut + itemsPerPage);

  return (
    <div>
      <PageHeader
        title="Gestion des Stocks"
        description="Surveillance en temps réel des quantités disponibles en quincaillerie."
      />

      {enAlerte.length > 0 && (
        <Card className="p-4 mb-6 border-danger/40 bg-danger-soft/40">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-danger">Attention requise</p>
              <p className="text-sm text-danger">
                {enAlerte.length} produit{enAlerte.length > 1 ? "s" : ""} en dessous du seuil critique.
                Un réapprovisionnement est conseillé.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Chargement...</p>
        ) : error ? (
          <p className="p-6 text-sm text-danger">{error}</p>
        ) : rows.length === 0 ? (
          <EmptyState title="Aucun stock enregistré" />
        ) : (
          <>
            <div className="overflow-x-auto w-full border rounded-lg shadow-sm"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-ink-muted text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Article</th>
                  <th className="px-4 py-3 font-medium text-right">Quantité actuelle</th>
                  <th className="px-4 py-3 font-medium text-right">Seuil d'alerte</th>
                  <th className="px-4 py-3 font-medium">État du stock</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rowsAffiches.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.produit
                          ? <ProduitThumbnail produit={r.produit} size={36} />
                          : <div className="w-9 h-9 rounded-md bg-surface-2 border border-border" />}
                        <div>
                          <p className="font-medium text-ink">{r.produit?.nom ?? `Produit #${r.produit_id}`}</p>
                          <span className="tag-ref text-xs">{r.produit?.reference ?? ""}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-bold text-base ${r.en_alerte ? "text-danger" : "text-ink"}`}>
                        {r.quantite}
                      </span>
                      <span className="text-ink-muted text-xs ml-1">
                        {r.produit?.unite?.toLowerCase() ?? ""}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-ink-muted">{r.seuil_alerte}</td>

                    <td className="px-4 py-3">
                      {r.en_alerte ? (
                        <Badge tone="danger">↘ Stock critique</Badge>
                      ) : (
                        <Badge tone="success">⊙ Optimal</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openHistorique(r)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-steel-soft text-steel hover:opacity-80"
                        >
                          <History size={12} /> Historique
                        </button>
                        <button
                          onClick={() => { setSelected(r); setQuantite(1); setSaveError(""); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-brand-soft text-brand-hover hover:opacity-80"
                        >
                          <Plus size={12} /> Réapprovisionner
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-border bg-surface-2/30">
                <span className="text-xs text-ink-muted font-medium">
                  Page {currentPage} sur {totalPages} ({rows.length} articles)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    ◀ Précédent
                  </Button>
                  <Button
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Suivant ▶
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {selected && (
        <Modal
          title={`Réapprovisionner — ${selected.produit?.nom ?? `Produit #${selected.produit_id}`}`}
          onClose={() => setSelected(null)}
        >
          <div className="bg-surface-2 rounded-lg p-3 mb-5 flex items-center justify-between">
            <span className="text-sm text-ink-muted">Stock actuel</span>
            <span className={`font-mono font-bold ${selected.en_alerte ? "text-danger" : "text-ink"}`}>
              {selected.quantite} {selected.produit?.unite?.toLowerCase() ?? ""}
            </span>
          </div>
          <form onSubmit={handleReappro} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-ink mb-1">
                Quantité à ajouter *
              </span>
              <input
                type="number"
                min={1}
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              {Number(quantite) > 0 && (
                <p className="text-xs text-brand mt-1">
                  Nouveau stock après entrée : {selected.quantite + Number(quantite)} {selected.produit?.unite?.toLowerCase() ?? ""}
                </p>
              )}
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-ink mb-1">Motif</span>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option>Reception fournisseur</option>
                <option>Retour client</option>
                <option>Regularisation inventaire</option>
                <option>Don / Cadeau</option>
                <option>Autre</option>
              </select>
            </label>
            {saveError && <p className="text-sm text-danger">{saveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setSelected(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving || !quantite || Number(quantite) < 1}>
                {saving ? "Enregistrement..." : `Ajouter ${quantite || 0} en stock`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {historique && (
        <Modal
          title={`Historique — ${historique.produit?.nom ?? `Produit #${historique.produit_id}`}`}
          onClose={() => { setHistorique(null); setMouvements([]); }}
        >
          {loadingMvt ? (
            <p className="text-sm text-ink-muted">Chargement...</p>
          ) : mouvements.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">Aucun mouvement enregistré.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {mouvements.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${
                      m.type === "ENTREE" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                    }`}>
                      {m.type === "ENTREE" ? "↑ Entrée" : "↓ Sortie"}
                    </span>
                    <span className="text-xs text-ink-muted">{m.motif || "—"}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold text-sm ${m.type === "ENTREE" ? "text-success" : "text-danger"}`}>
                      {m.type === "ENTREE" ? "+" : "-"}{m.quantite}
                    </span>
                    <p className="text-xs text-ink-muted">
                      {new Date(m.date).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
