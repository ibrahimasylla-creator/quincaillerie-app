import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Badge, Button, Card, EmptyState, Input, PageHeader } from "../components/ui";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", telephone: "", email: "", adresse: "", type_client: "PARTICULIER" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/clients/");
      setClients(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/clients/", form);
      setShowForm(false);
      setForm({ nom: "", telephone: "", email: "", adresse: "", type_client: "PARTICULIER" });
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

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Clients inscrits en ligne et clients comptoir."
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Annuler" : "Nouveau client comptoir"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <Input label="Nom" value={form.nom} onChange={set("nom")} required />
            <Input label="Telephone" value={form.telephone} onChange={set("telephone")} />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} />
            <label className="block">
              <span className="block text-sm font-medium text-ink mb-1">Type</span>
              <select
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                value={form.type_client}
                onChange={set("type_client")}
              >
                <option value="PARTICULIER">Particulier</option>
                <option value="PROFESSIONNEL">Professionnel / Chantier</option>
              </select>
            </label>
            <label className="block col-span-2">
              <span className="block text-sm font-medium text-ink mb-1">Adresse</span>
              <input
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                value={form.adresse}
                onChange={set("adresse")}
              />
            </label>
            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
            <div className="col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer le client"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Chargement...</p>
        ) : clients.length === 0 ? (
          <EmptyState title="Aucun client" />
        ) : (
          <div className=\"overflow-x-auto w-full border rounded-lg shadow-sm\"><table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Origine</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-medium text-ink">{c.nom}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.telephone || c.email || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">
                      {c.type_client === "PROFESSIONNEL" ? "Professionnel" : "Particulier"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {c.auth_user_id ? (
                      <Badge tone="steel">Compte en ligne</Badge>
                    ) : (
                      <Badge tone="neutral">Comptoir</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
