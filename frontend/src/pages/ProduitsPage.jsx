import { useEffect, useState } from "react";
import { Plus, Search, X, Package, Pencil, Trash2, Eye } from "lucide-react";
import { api, apiErrorMessage, API_BASE_URL } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { resolveImageUrl } from "../lib/images";
import { Badge, Button, Card, EmptyState, Input, PageHeader } from "../components/ui";

const UNITES = [
  { value: "PIECE", label: "Piece" },
  { value: "METRE", label: "Metre" },
  { value: "KG", label: "Kilogramme" },
  { value: "LITRE", label: "Litre" },
  { value: "SAC", label: "Sac" },
];

function EmptyForm(categories) {
  return {
    reference: "", nom: "", description: "", unite: "PIECE",
    prix_achat: "", prix_vente: "", seuil_alerte: 5,
    quantite_initiale: 0, image: null, categorie: "",
  };
}

export function ProduitThumbnail({ produit, size = 40 }) {
  const url = resolveImageUrl(produit.image_url);
  if (url) {
    return (
      <img src={url} alt={produit.nom} width={size} height={size}
        className="rounded-md border border-border object-cover shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-md border border-border bg-surface-2 flex items-center justify-center text-ink-muted shrink-0"
      style={{ width: size, height: size }}>
      <Package size={size * 0.5} />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ProduitsPage() {
  const { user } = useAuth();
  const canWrite = user.role === "ADMIN" || user.role === "GERANT";
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catActive, setCatActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);

  const [form, setForm] = useState(EmptyForm());
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(q = "") {
    setLoading(true);
    try {
      const { data } = await api.get("/api/produits/", { params: q ? { search: q } : {} });
      setProduits(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get("/api/produits/categories/").then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setCurrentPage(1);
    load(search);
  }

  function openEdit(p) {
    setSelected(p);
    setForm({
      reference: p.reference, nom: p.nom, description: p.description || "",
      unite: p.unite, prix_achat: p.prix_achat || "", prix_vente: p.prix_vente,
      seuil_alerte: p.seuil_alerte, quantite_initiale: 0,
      image: null, categorie: p.categorie || "",
    });
    setImagePreview(resolveImageUrl(p.image_url));
    setMode("edit");
  }

  function closeModal() {
    setSelected(null);
    setMode(null);
    setError("");
    setImagePreview(null);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setForm({ ...form, image: file });
    setImagePreview(file ? URL.createObjectURL(file) : imagePreview);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== "") payload.append(k, v);
      });
      await api.post("/api/produits/", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setShowCreate(false);
      setForm(EmptyForm());
      setImagePreview(null);
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
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "image" && v !== null && v !== "") payload.append(k, v);
      });
      if (form.image) payload.append("image", form.image);
      await api.patch(`/api/produits/${selected.id}/`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      closeModal();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.delete(`/api/produits/${selected.id}/`);
      closeModal();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  const produitsFiltres = catActive
    ? produits.filter((p) => p.categorie === catActive)
    : produits;

  const itemsPerPage = 10;
  const totalPages = Math.ceil(produitsFiltres.length / itemsPerPage) || 1;
  const indexDebut = (currentPage - 1) * itemsPerPage;
  const produitsAffiches = produitsFiltres.slice(indexDebut, indexDebut + itemsPerPage);

  const FormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 flex items-center gap-4">
        <div className="w-20 h-20 rounded-md border border-dashed border-border bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
          {imagePreview
            ? <img src={imagePreview} alt="Apercu" className="w-full h-full object-cover" />
            : <Package size={28} className="text-ink-muted" />}
        </div>
        <label className="block">
          <span className="block text-sm font-medium text-ink mb-1">Photo</span>
          <input type="file" accept="image/*" onChange={handleImageChange}
            className="text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-hover" />
        </label>
      </div>
      <Input label="Reference *" value={form.reference} onChange={set("reference")} required />
      <Input label="Nom *" value={form.nom} onChange={set("nom")} required />
      <label className="block col-span-2">
        <span className="block text-sm font-medium text-ink mb-1">Description</span>
        <textarea className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          rows={2} value={form.description} onChange={set("description")} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-ink mb-1">Categorie</span>
        <select className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          value={form.categorie} onChange={set("categorie")}>
          <option value="">-- Categorie --</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-ink mb-1">Unite</span>
        <select className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          value={form.unite} onChange={set("unite")}>
          {UNITES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
      </label>
      <Input label="Prix d'achat (FCFA)" type="number" step="1" value={form.prix_achat} onChange={set("prix_achat")} />
      <Input label="Prix de vente (FCFA) *" type="number" step="1" value={form.prix_vente} onChange={set("prix_vente")} required />
      <Input label="Seuil d'alerte" type="number" min={0} value={form.seuil_alerte} onChange={set("seuil_alerte")} />
      {!selected && (
        <Input label="Quantite initiale" type="number" min={0} value={form.quantite_initiale} onChange={set("quantite_initiale")} />
      )}
      {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Produits"
        description={`${produitsFiltres.length} produits au catalogue`}
        action={canWrite && (
          <Button onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? <X size={16} /> : <Plus size={16} />}
            {showCreate ? "Annuler" : "Nouveau produit"}
          </Button>
        )}
      />

      {showCreate && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate}>
            <FormFields />
            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => { setCatActive(null); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catActive === null ? "bg-brand text-white" : "bg-surface-2 text-ink-muted hover:bg-brand-soft hover:text-brand"}`}>
            Tous ({produits.length})
          </button>
          {categories.map((c) => {
            const count = produits.filter((p) => p.categorie === c.id).length;
            return (
              <button key={c.id} onClick={() => { setCatActive(catActive === c.id ? null : c.id); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catActive === c.id ? "bg-brand text-white" : "bg-surface-2 text-ink-muted hover:bg-brand-soft hover:text-brand"}`}>
                {c.nom} ({count})
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-4 max-w-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Rechercher..." value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); if (!e.target.value) { setCatActive(null); load(); } }} />
        </div>
      </form>

      {/* Grille : l'image prend la majorité de l'espace (h-44), le texte est très réduit */}
      {loading ? (
        <p className="text-sm text-ink-muted">Chargement...</p>
      ) : produitsAffiches.length === 0 ? (
        <EmptyState title="Aucun produit" description="Aucun produit dans cette categorie." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-start">
          {produitsAffiches.map((p) => {
            const imgUrl = resolveImageUrl(p.image_url);
            return (
              <Card key={p.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {/* L'image prend désormais 176px de hauteur (h-44) */}
                <div className="h-44 bg-surface-2 flex items-center justify-center overflow-hidden shrink-0 border-b border-border/40">
                  {imgUrl
                    ? <img src={imgUrl} alt={p.nom} className="w-full h-full object-cover" />
                    : <Package size={40} className="text-ink-muted/40" />}
                </div>

                {/* Bloc texte minimaliste et collé au bas */}
                <div className="p-2.5 flex flex-col justify-between flex-1 gap-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="tag-ref text-[10px] uppercase font-mono tracking-wider">{p.reference}</span>
                      {p.categorie_nom && <span className="text-[10px] text-ink-muted truncate max-w-[80px]">{p.categorie_nom}</span>}
                    </div>
                    <p className="font-semibold text-ink text-xs line-clamp-1 leading-tight" title={p.nom}>{p.nom}</p>
                  </div>
                  <p className="font-mono font-bold text-brand text-xs">
                    {Number(p.prix_vente).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>

                {/* Boutons en bas */}
                <div className="p-1.5 pt-0 grid grid-cols-3 gap-1 border-t border-border/30">
                  <button onClick={() => { setSelected(p); setMode("details"); }}
                    title="Details"
                    className="flex items-center justify-center gap-0.5 rounded py-1 text-[10px] font-medium bg-steel-soft text-steel hover:opacity-80 transition-opacity">
                    <Eye size={11} />
                    <span>Détails</span>
                  </button>
                  {canWrite && (
                    <>
                      <button onClick={() => openEdit(p)}
                        title="Modifier"
                        className="flex items-center justify-center gap-0.5 rounded py-1 text-[10px] font-medium bg-brand-soft text-brand-hover hover:opacity-80 transition-opacity">
                        <Pencil size={11} />
                        <span>Modif</span>
                      </button>
                      <button onClick={() => { setSelected(p); setMode("delete"); }}
                        title="Supprimer"
                        className="flex items-center justify-center gap-0.5 rounded py-1 text-[10px] font-medium bg-danger-soft text-danger hover:opacity-80 transition-opacity">
                        <Trash2 size={11} />
                        <span>Supp.</span>
                      </button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border mt-5">
          <span className="text-xs text-ink-muted font-medium">
            Page {currentPage} sur {totalPages} ({produitsFiltres.length} produits)
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

      {/* Modales */}
      {mode === "details" && selected && (
        <Modal title={selected.nom} onClose={closeModal}>
          <div className="flex gap-4 mb-4">
            <div className="w-24 h-24 rounded-lg bg-surface-2 border border-border overflow-hidden shrink-0 flex items-center justify-center">
              {resolveImageUrl(selected.image_url)
                ? <img src={resolveImageUrl(selected.image_url)} alt={selected.nom} className="w-full h-full object-cover" />
                : <Package size={32} className="text-ink-muted" />}
            </div>
            <div>
              <span className="tag-ref">{selected.reference}</span>
              <p className="font-display font-semibold text-ink mt-1">{selected.nom}</p>
              {selected.categorie_nom && <p className="text-sm text-ink-muted">{selected.categorie_nom}</p>}
              {selected.description && <p className="text-sm text-ink mt-2">{selected.description}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-ink-muted text-xs mb-1">Prix de vente</p>
              <p className="font-mono font-semibold text-brand">{Number(selected.prix_vente).toLocaleString("fr-FR")} FCFA</p>
            </div>
            {selected.prix_achat && Number(selected.prix_achat) > 0 && (
              <div className="bg-surface-2 rounded-lg p-3">
                <p className="text-ink-muted text-xs mb-1">Prix d'achat</p>
                <p className="font-mono font-semibold text-ink">{Number(selected.prix_achat).toLocaleString("fr-FR")} FCFA</p>
              </div>
            )}
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-ink-muted text-xs mb-1">Unite</p>
              <p className="font-medium text-ink">{selected.unite}</p>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-ink-muted text-xs mb-1">Seuil d'alerte</p>
              <p className="font-medium text-ink">{selected.seuil_alerte}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {canWrite && (
              <>
                <Button variant="ghost" onClick={() => openEdit(selected)}>
                  <Pencil size={14} /> Modifier
                </Button>
                <Button variant="danger" onClick={() => setMode("delete")}>
                  <Trash2 size={14} /> Supprimer
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}

      {mode === "edit" && selected && (
        <Modal title={`Modifier — ${selected.nom}`} onClose={closeModal}>
          <form onSubmit={handleEdit}>
            <FormFields />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" type="button" onClick={closeModal}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {mode === "delete" && selected && (
        <Modal title="Confirmer la suppression" onClose={closeModal}>
          <p className="text-sm text-ink mb-2">
            Voulez-vous vraiment supprimer <strong>{selected.nom}</strong> ?
          </p>
          <p className="text-sm text-danger mb-6">
            Cette action est irreversible. Le stock associe sera egalement supprime.
          </p>
          {error && <p className="text-sm text-danger mb-3">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeModal}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? "Suppression..." : "Supprimer definitivement"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
