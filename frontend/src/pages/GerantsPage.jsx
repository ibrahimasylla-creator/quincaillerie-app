import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, apiErrorMessage } from "../api/client";
import { Badge, Button, Card, EmptyState, Input, PageHeader } from "../components/ui";

export default function GerantsPage() {
  const [gerants, setGerants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", first_name: "", phone: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/auth/gerants/");
      setGerants(data);
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
      await api.post("/api/auth/gerants/", form);
      setShowForm(false);
      setForm({ username: "", email: "", password: "", first_name: "", phone: "" });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(gerant) {
    try {
      await api.patch(`/api/auth/gerants/${gerant.id}/activate/`, { is_active: !gerant.is_active });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  return (
    <div>
      <PageHeader
        title="Personnel"
        description="Comptes Gerant pouvant vendre, gerer le stock et facturer."
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Annuler" : "Nouveau Gerant"}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <Input label="Nom complet" value={form.first_name} onChange={set("first_name")} required />
            <Input label="Identifiant" value={form.username} onChange={set("username")} required />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
            <Input label="Telephone" value={form.phone} onChange={set("phone")} />
            <Input
              label="Mot de passe initial"
              type="password"
              minLength={6}
              value={form.password}
              onChange={set("password")}
              required
            />
            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
            <div className="col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Creation..." : "Creer le compte"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Chargement...</p>
        ) : gerants.length === 0 ? (
          <EmptyState title="Aucun Gerant" description="Creez le premier compte employe." />
        ) : (
          <div className=\"overflow-x-auto w-full border rounded-lg shadow-sm\"><table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Identifiant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {gerants.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-medium text-ink">
                    {g.first_name || "—"} {g.last_name}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{g.username}</td>
                  <td className="px-4 py-3">
                    {g.is_active ? (
                      <Badge tone="success">Actif</Badge>
                    ) : (
                      <Badge tone="danger">Desactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" className="text-xs px-3 py-1" onClick={() => toggleActive(g)}>
                      {g.is_active ? "Desactiver" : "Reactiver"}
                    </Button>
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
