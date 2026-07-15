import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Input } from "../components/ui";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await register(form);
    if (result.ok) navigate("/");
    else setError(result.message);
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wrench size={22} className="text-brand" />
          <span className="font-display text-xl font-semibold text-ink">Quincaillerie</span>
        </div>
        <Card className="p-6">
          <h1 className="font-display text-lg font-semibold text-ink mb-1">Creer un compte</h1>
          <p className="text-sm text-ink-muted mb-6">
            Consultez le catalogue et suivez vos achats.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom complet" value={form.first_name} onChange={set("first_name")} required />
            <Input label="Identifiant" value={form.username} onChange={set("username")} required />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
            <Input label="Telephone" value={form.phone} onChange={set("phone")} />
            <Input
              label="Mot de passe"
              type="password"
              minLength={6}
              value={form.password}
              onChange={set("password")}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creation..." : "Creer mon compte"}
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-ink-muted mt-4">
          Deja un compte ?{" "}
          <Link to="/connexion" className="text-brand font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
