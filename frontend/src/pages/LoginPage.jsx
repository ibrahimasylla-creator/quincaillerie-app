import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, User, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await login(form.username, form.password);
    if (result.ok) {
      navigate("/");
    } else {
      setError(result.message || "Identifiant ou mot de passe incorrect.");
    }
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative px-4 font-sans antialiased"
      style={{ 
        // URL directe de l'image du panneau d'outillage de quincaillerie
        backgroundImage: `url('https://media.gettyimages.com/id/1341046864/fr/photo/panneau-perfor%C3%A9-avec-diff%C3%A9rents-outils-accroch%C3%A9s-au-mur-dans-un-atelier-de-bricolage.jpg?s=2048x2048&w=gi&k=20&c=6k5Iq4Fm9YwZ7R6B3g-2TqgGj46aI4M38N1fW6S3Xv8=')`
      }}
    >
      {/* Overlay sombre et flouté pour faire ressortir la carte et assurer une parfaite lisibilité */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[4px]"></div>

      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Logo & Titre - Design Épuré Vert et Blanc */}
        <div className="flex flex-col items-center justify-center mb-8 select-none text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/30 shadow-md">
            <Wrench size={30} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider uppercase">
            Quincaillerie Générale
          </h1>
          <p className="text-emerald-300 font-medium text-sm mt-1">
            Système de gestion distribué
          </p>
        </div>

        {/* Formulaire de connexion Translucide (Glassmorphism) */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/25 rounded-2xl p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]">
          <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Connexion</h2>
          <p className="text-sm text-white/75 mb-6">Accédez à votre espace.</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Champ Identifiant */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-white/90">
                Identifiant
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  autoFocus
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Ex: abdou"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                />
              </div>
            </div>
            
            {/* Champ Mot de passe */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-white/90">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/40">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-200 bg-red-500/20 p-2.5 rounded-lg border border-red-500/40 text-center">
                {error}
              </p>
            )}

            {/* Bouton Connexion Vert & Blanc */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/20 transition-all mt-2 transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Lien d'inscription sous la carte */}
        <p className="text-center text-sm text-white/75 mt-6">
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="text-emerald-400 font-semibold hover:underline ml-0.5">
            Créer un compte client
          </Link>
        </p>

      </div>
    </div>
  );
}