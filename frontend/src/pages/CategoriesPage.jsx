import { useEffect, useState } from "react";
import { Plus, X, Pencil, Trash2, Tag } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Button, Card, EmptyState, Input, PageHeader } from "../components/ui";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null); // "edit" | "delete"
  const [editNom, setEditNom] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/api/produits/categories/"),
        api.get("/api/produits/"),
      ]);
      setCategories(catRes.data);
      setProduits(prodRes.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function countProduits(catId) {
    return produits.filter((p) => p.categorie === catId).length;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!nom.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/api/produits/categories/", { nom: nom.trim() });
      setNom("");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/api/produits/categories/${selected.id}/`, { nom: editNom.trim() });
      setSelected(null);
      setMode(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError("");
    try {
      await api.delete(`/api/produits/categories/${selected.id}/`);
      setSelected(null);
      setMode(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Catégories"
        description="Organisez votre catalogue par famille de produits."
      />

      {/* Formulaire création */}
      <Card className="p-5 mb-6">
        <h2 className="font-display font-semibold text-ink mb-4 flex items-center gap-2">
          <Plus size={17} className="text-brand" /> Nouvelle catégorie
        </h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Visserie, Peintures, Electricité..."
            required
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <Button type="submit" disabled={saving || !nom.trim()}>
            {saving ? "..." : "Créer"}
          </Button>
        </form>
        {error && <p className="text-sm text-danger mt-2">{error}</p>}
      </Card>

      {/* Liste des catégories */}
      <Card>
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Chargement...</p>
        ) : categories.length === 0 ? (
          <EmptyState title="Aucune catégorie" description="Créez votre première catégorie ci-dessus." />
        ) : (
          <div className="overflow-x-auto w-full border rounded-lg shadow-sm"><table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium text-center">Produits</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const count = countProduits(c.id);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                          <Tag size={14} className="text-brand" />
                        </div>
                        <span className="font-medium text-ink">{c.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        count > 0 ? "bg-brand-soft text-brand-hover" : "bg-surface-2 text-ink-muted"
                      }`}>
                        {count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelected(c); setEditNom(c.nom); setMode("edit"); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-brand-soft text-brand-hover hover:opacity-80"
                        >
                          <Pencil size={12} /> Modifier
                        </button>
                        <button
                          onClick={() => { setSelected(c); setMode("delete"); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-danger-soft text-danger hover:opacity-80"
                          disabled={count > 0}
                          title={count > 0 ? "Impossible : cette catégorie contient des produits" : "Supprimer"}
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </Card>

      {/* Modale Modifier */}
      {mode === "edit" && selected && (
        <Modal title={`Modifier — ${selected.nom}`} onClose={() => { setSelected(null); setMode(null); }}>
          <form onSubmit={handleEdit} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-ink mb-1">Nom de la catégorie</span>
              <input
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => { setSelected(null); setMode(null); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving || !editNom.trim()}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modale Supprimer */}
      {mode === "delete" && selected && (
        <Modal title="Confirmer la suppression" onClose={() => { setSelected(null); setMode(null); }}>
          <p className="text-sm text-ink mb-2">
            Voulez-vous vraiment supprimer la catégorie <strong>{selected.nom}</strong> ?
          </p>
          <p className="text-sm text-danger mb-6">
            Cette action est irréversible. Les produits associés perdront leur catégorie.
          </p>
          {error && <p className="text-sm text-danger mb-3">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setSelected(null); setMode(null); }}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
