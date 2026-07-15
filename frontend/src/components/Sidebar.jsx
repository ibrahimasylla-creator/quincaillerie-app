import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShieldAlert, ShoppingCart, Users, Settings, Wrench, LogOut } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Tableau de bord", path: "/", icon: LayoutDashboard },
    { name: "Produits", path: "/produits", icon: Package },
    { name: "Stock", path: "/stock", icon: ShieldAlert },
    { name: "Ventes", path: "/ventes", icon: ShoppingCart },
    { name: "Clients", path: "/clients", icon: Users },
    { name: "Personnel", path: "/gerants", icon: Users },
    { name: "Paramètres", path: "/parametres", icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#1e1e1e] text-white h-screen fixed left-0 top-0 flex flex-col border-r border-neutral-800">
      {/* En-tête de la Sidebar */}
      <div className="p-5 border-b border-neutral-800 flex items-center gap-2">
        <Wrench className="text-[#d97a29]" size={22} />
        <span className="font-bold text-lg tracking-wide font-display">Quincaillerie</span>
      </div>

      {/* Navigation Principale */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#d97a29] text-white shadow-md font-semibold"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Pied de page de la Sidebar avec Infos Utilisateur et Déconnexion */}
      <div className="p-4 border-t border-neutral-800 text-xs text-neutral-500 space-y-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-white text-sm">admin</span>
          <span className="text-neutral-400">Administrateur</span>
        </div>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="flex items-center gap-2 text-neutral-400 hover:text-red-400 transition-colors pt-2.5 w-full border-t border-neutral-800/60"
        >
          <LogOut size={14} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
