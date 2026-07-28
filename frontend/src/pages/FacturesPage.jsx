import FacturePrint from "../components/FacturePrint";
import { useEffect, useState } from "react";
import { FileText, Search, X, Printer, ChevronLeft, ChevronRight, CircleCheck, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Badge, Card, EmptyState, PageHeader } from "../components/ui";

const PAR_PAGE = 10;

function openPdf(vente) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres surgissantes pour l'impression.");
    return;
  }
  const mTotal = Number(vente.montant_total || 0);
  const mVerse = Number(vente.montant_verse || 0);
  const mReste = mTotal - mVerse;
  
  let statutLabel = "PAYÉ";
  let statutColor = "#16a34a";
  if (mReste > 0 && mVerse > 0) {
    statutLabel = "ACOMPTE (PARTIEL)";
    statutColor = "#d97a29";
  } else if (mReste > 0 && mVerse === 0) {
    statutLabel = "NON PAYÉ";
    statutColor = "#dc2626";
  }

  const lignesHtml = (vente.lignes || []).map(l => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">PROD-${l.produit_id}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${Number(l.prix_unitaire).toLocaleString("fr-FR")} FCFA</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${l.quantite}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${Number(l.sous_total).toLocaleString("fr-FR")} FCFA</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facture #${vente.id}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
        .top-bar { display: flex; justify-content: space-between; border-bottom: 2px solid #d97a29; padding-bottom: 15px; margin-bottom: 20px; }
        .company { font-size: 18px; font-weight: bold; color: #d97a29; }
        .sub { font-size: 12px; color: #64748b; }
        .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
        th { text-align: left; padding: 8px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #475569; }
        .totals { float: right; width: 280px; font-size: 13px; }
        .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
        .footer { margin-top: 100px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; clear: both; }
      </style>
    </head>
    <body>
      <div class="top-bar">
        <div>
          <div class="company">QUINCAILLERIE GÉNÉRALE</div>
          <div class="sub">Gestion des ventes et stocks en temps réel</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 16px; font-weight: bold;">FACTURE</div>
          <div class="sub">Numéro : #VTE-00${vente.id}</div>
        </div>
      </div>

      <div class="details">
        <div>
          <strong>Émis par :</strong><br/>
          Quincaillerie Moderne<br/>
          <span class="sub">Service Comptoir</span>
        </div>
        <div style="text-align: right;">
          <strong>Date de facturation :</strong><br/>
          ${new Date(vente.date).toLocaleDateString("fr-FR")} à ${new Date(vente.date).toLocaleTimeString("fr-FR", {hour: "2-digit", minute:"2-digit"})}<br/>
          <strong>STATUT :</strong> <span style="color: ${statutColor}; font-weight: bold;">${statutLabel}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>RÉFÉRENCE / DÉSIGNATION</th>
            <th>PRIX UNITAIRE</th>
            <th style="text-align: center;">QUANTITÉ</th>
            <th style="text-align: right;">MONTANT TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${lignesHtml}
        </tbody>
      </table>

      <div class="totals">
        <div><span>Total Commande :</span> <strong>${mTotal.toLocaleString("fr-FR")} FCFA</strong></div>
        <div style="color: #16a34a;"><span>Montant Versé / Acompte :</span> <strong>${mVerse.toLocaleString("fr-FR")} FCFA</strong></div>
        <div style="color: #dc2626; font-size: 15px; border-top: 1px solid #ddd; padding-top: 6px; margin-top: 4px;">
          <span>RESTE À PAYER :</span> <strong>${mReste.toLocaleString("fr-FR")} FCFA</strong>
        </div>
      </div>

      <div class="footer">
        Merci pour votre confiance et votre fidélité !<br/>
        Application Quincaillerie-App — Document officiel de vente.
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function FacturesPage() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [soldering, setSoldering] = useState(null);
  const [deleting, setDeleting] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/ventes/");
      setVentes(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  async function handleSolder(vente) {
    setSoldering(vente.id);
    try {
      await api.post(`/api/ventes/${vente.id}/solder/`);
      await load();
    } catch (err) {
      alert(apiErrorMessage(err));
    } finally {
      setSoldering(null);
    }
  }

  async function handleDelete(vente) {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la facture VTE-${String(vente.id).padStart(5, "0")} ?`)) {
      return;
    }
    setDeleting(vente.id);
    try {
      await api.delete(`/api/ventes/${vente.id}/`);
      await load();
    } catch (err) {
      alert(apiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  const filtrees = ventes.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(v.id).padStart(5, "0").includes(q) ||
      String(v.montant_total).includes(q) ||
      v.statut_paiement?.toLowerCase().includes(q) ||
      v.date?.includes(q)
    );
  });

  const totalPages = Math.ceil(filtrees.length / PAR_PAGE);
  const paginees = filtrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  function statutBadge(v) {
    const total = Number(v.montant_total ?? 0);
    const verse = Number(v.montant_verse ?? total);
    const reste = total - verse;
    const s = v.statut_paiement;

    if (s === "PAYE" && reste <= 0) return <Badge tone="success">✓ Payé</Badge>;
    if (s === "PARTIEL" || s === "ACOMPTE" || reste > 0) return <Badge tone="warning">⊙ Acompte</Badge>;
    return <Badge tone="danger">✗ Non payé</Badge>;
  }

  return (
    <div>
      <PageHeader
        title="Factures"
        description="Historique des ventes. Gérez les acomptes, créances, l'impression et la suppression des factures."
      />

      <div className="relative max-w-sm mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par numéro, montant, date..."
          className="w-full rounded-md border border-border bg-surface pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
            <X size={14} />
          </button>
        )}
      </div>

      <Card>
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Chargement...</p>
        ) : error ? (
          <p className="p-6 text-sm text-danger">{error}</p>
        ) : paginees.length === 0 ? (
          <EmptyState title="Aucune facture" description={search ? "Aucun résultat." : "Aucune vente."} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Numéro</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Statut paiement</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Versé</th>
                <th className="px-4 py-3 font-medium text-right">Reste</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginees.map((v) => {
                const total = Number(v.montant_total ?? 0);
                const verse = Number(v.montant_verse ?? total);
                const reste = Math.max(0, total - verse);
                const nonSolde = reste > 0;

                return (
                  <tr key={v.id}
                    className={`border-b border-border last:border-0 hover:bg-surface-2/50 ${nonSolde ? "bg-danger-soft/10" : ""}`}>

                    {/* Numéro */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${nonSolde ? "bg-danger-soft" : "bg-brand-soft"}`}>
                          <FileText size={14} className={nonSolde ? "text-danger" : "text-brand"} />
                        </div>
                        <span className="font-mono font-semibold text-ink text-xs">
                          VTE-{String(v.id).padStart(5, "0")}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-ink-muted text-xs">
                      {v.date
                        ? new Date(v.date).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">{statutBadge(v)}</td>

                    {/* Total */}
                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                      {total.toLocaleString("fr-FR")} FCFA
                    </td>

                    {/* Versé */}
                    <td className="px-4 py-3 text-right font-mono text-success font-semibold">
                      {verse.toLocaleString("fr-FR")} FCFA
                    </td>

                    {/* Reste */}
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span className={nonSolde ? "text-danger" : "text-ink-muted"}>
                        {reste.toLocaleString("fr-FR")} FCFA
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {nonSolde && (
                          <button
                            onClick={() => handleSolder(v)}
                            disabled={soldering === v.id || deleting === v.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-success-soft text-success hover:opacity-80 disabled:opacity-50"
                          >
                            <CircleCheck size={12} />
                            {soldering === v.id ? "..." : "Solder"}
                          </button>
                        )}
                        <button
                          onClick={() => openPdf(v)}
                          disabled={deleting === v.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-brand-soft text-brand-hover hover:opacity-80 disabled:opacity-50"
                        >
                          <Printer size={12} /> Imprimer
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          disabled={deleting === v.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-danger-soft text-danger hover:opacity-80 disabled:opacity-50"
                          title="Supprimer la facture"
                        >
                          <Trash2 size={12} />
                          {deleting === v.id ? "..." : "Supprimer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            Page {page} sur {totalPages} — {filtrees.length} facture{filtrees.length > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-border bg-surface hover:bg-surface-2 disabled:opacity-40">
              <ChevronLeft size={15} /> Précédent
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`d-${idx}`} className="px-2 py-1 text-sm text-ink-muted">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${page === p ? "bg-brand text-white" : "border border-border bg-surface hover:bg-surface-2 text-ink"}`}>
                      {p}
                    </button>
                  )
                )}
            </div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-border bg-surface hover:bg-surface-2 disabled:opacity-40">
              Suivant <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Résumé */}
      {!loading && filtrees.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
          <span className="text-danger font-medium">
            {filtrees.filter(v => (Number(v.montant_total) - Number(v.montant_verse)) > 0).length} vente(s) avec reste à payer
          </span>
          <span className="font-mono font-semibold text-ink">
            Total : {filtrees.reduce((s, v) => s + Number(v.montant_total), 0).toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      )}
    </div>
  );
}
