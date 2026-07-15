import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Boxes, ShoppingCart,
  Users, UserCog, LogOut, Wrench, Settings,
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "../auth/AuthContext";

const NAV_BY_ROLE = {
  ADMIN: [
    { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
    { to: "/produits", label: "Produits", icon: Package },
    { to: "/stock", label: "Stock", icon: Boxes },
    { to: "/ventes", label: "Ventes", icon: ShoppingCart },
    { to: "/clients", label: "Clients", icon: Users },
    { to: "/gerants", label: "Personnel", icon: UserCog },
    { to: "/parametres", label: "Parametres", icon: Settings },
  ],
  GERANT: [
    { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
    { to: "/produits", label: "Produits", icon: Package },
    { to: "/stock", label: "Stock", icon: Boxes },
    { to: "/ventes", label: "Ventes", icon: ShoppingCart },
    { to: "/clients", label: "Clients", icon: Users },
  ],
  CLIENT: [
    { to: "/", label: "Catalogue", icon: Package, end: true },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV_BY_ROLE[user.role] || [];

  function handleLogout() {
    logout();
    navigate("/connexion");
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-60 shrink-0 bg-sidebar text-sidebar-ink flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <Wrench size={20} className="text-brand" />
          <span className="font-display font-semibold tracking-tight">Quincaillerie</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-brand text-white"
                    : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-ink"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-white/10 pt-4 mx-3">
          <p className="text-sm font-medium truncate">{user.username}</p>
          <p className="text-xs text-sidebar-muted mb-3">{ROLE_LABELS[user.role]}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-sidebar-muted hover:text-sidebar-ink transition-colors"
          >
            <LogOut size={15} /> Deconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
