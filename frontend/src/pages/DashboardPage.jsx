import { useEffect, useState } from "react";
import { Package, Boxes, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import { api } from "../api/client";
import { Badge, Card, PageHeader } from "../components/ui";
import { useAuth } from "../auth/AuthContext";

function StatCard({ icon: Icon, label, value, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-soft text-brand-hover",
    danger: "bg-danger-soft text-danger",
    steel: "bg-steel-soft text-steel",
  };
  return (
    <Card className="p-4 sm:p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl sm:text-2xl font-semibold text-ink leading-none truncate">{value}</p>
        <p className="text-xs sm:text-sm text-ink-muted mt-1 truncate">{label}</p>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ produits: 0, alertes: 0, ventesJour: 0, caJour: 0 });
  const [alertes, setAlertes] = useState([]);
  const [dernieresVentes, setDernieresVentes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [produitsRes, stockAlertesRes, stockToutRes, ventesRes] = await Promise.all([
          api.get("/api/produits/"),
          api.get("/api/stock/alertes/"),
          api.get("/api/stock/"),
          api.get("/api/ventes/"),
        ]);

        const today = new Date().toISOString().slice(0, 10);
        const ventesJour = ventesRes.data.filter((v) => v.date?.startsWith(today));
        const produitsById = Object.fromEntries(produitsRes.data.map((p) => [p.id, p]));

        const alertesEnrichies = stockAlertesRes.data.map((s) => ({
          ...s,
          nom: produitsById[s.produit_id]?.nom || `Produit #${s.produit_id}`,
          reference: produitsById[s.produit_id]?.reference || "",
        }));

        const compteur = {};
        ventesRes.data.forEach((v) => {
          (v.lignes || []).forEach((l) => {
            compteur[l.produit_id] = (compteur[l.produit_id] || 0) + l.quantite;
          });
        });
        const top5 = Object.entries(compteur)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, qte]) => ({
            nom: produitsById[id]?.nom || `Produit #${id}`,
            reference: produitsById[id]?.reference || "",
            qte,
          }));

        setStats({
          produits: produitsRes.data.length,
          alertes: stockAlertesRes.data.length,
          ventesJour: ventesJour.length,
          caJour: ventesJour.reduce((s, v) => s + Number(v.montant_total), 0),
        });
        setAlertes(alertesEnrichies);
        setDernieresVentes(ventesRes.data.slice(0, 5));
        setProduits(top5);
      } catch {
        // best-effort
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour, ${user?.username}`}
        description="Vue d ensemble de l activite de la quincaillerie."
      />

      {/* Stats Cards: 1 colonne sur mobile, 2 sur tablette, 4 sur desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Produits au catalogue" value={stats.produits} />
        <StatCard icon={AlertTriangle} label="Alertes de stock" value={stats.alertes} tone="danger" />
        <StatCard icon={ShoppingCart} label="Ventes aujourd hui" value={stats.ventesJour} tone="steel" />
        <StatCard
          icon={Boxes}
          label="Chiffre d affaires du jour"
          value={`${stats.caJour.toLocaleString("fr-FR")} FCFA`}
          tone="steel"
        />
      </div>

      {/* Section Cartes d Informations: 1 colonne sur mobile, 3 sur desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Alertes de stock */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={17} className="text-danger" />
            <h2 className="font-display font-semibold text-ink">Alertes de stock</h2>
          </div>
          {loading ? (
            <p className="text-sm text-ink-muted">Chargement...</p>
          ) : alertes.length === 0 ? (
            <p className="text-sm text-ink-muted py-4 text-center">Aucune alerte</p>
          ) : (
            <div className="space-y-3">
              {alertes.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{a.nom}</p>
                    <p className="text-xs text-ink-muted truncate">{a.reference}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge tone="danger">{a.quantite} restants</Badge>
                    <p className="text-xs text-ink-muted mt-1">seuil : {a.seuil_alerte}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Dernières ventes */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={17} className="text-brand" />
            <h2 className="font-display font-semibold text-ink">Dernières ventes</h2>
          </div>
          {loading ? (
            <p className="text-sm text-ink-muted">Chargement...</p>
          ) : dernieresVentes.length === 0 ? (
            <p className="text-sm text-ink-muted py-4 text-center">Aucune vente enregistrée</p>
          ) : (
            <div className="space-y-3">
              {dernieresVentes.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-ink">Vente #{v.id}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(v.date).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-brand shrink-0">
                    {Number(v.montant_total).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top produits vendus */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={17} className="text-brand" />
            <h2 className="font-display font-semibold text-ink">Produits les plus vendus</h2>
          </div>
          {loading ? (
            <p className="text-sm text-ink-muted">Chargement...</p>
          ) : produits.length === 0 ? (
            <p className="text-sm text-ink-muted py-4 text-center">Aucune vente encore</p>
          ) : (
            <div className="space-y-3">
              {produits.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-soft text-brand-hover text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{p.nom}</p>
                    <p className="text-xs text-ink-muted truncate">{p.reference}</p>
                  </div>
                  <Badge tone="brand" className="shrink-0">{p.qte} vendus</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
