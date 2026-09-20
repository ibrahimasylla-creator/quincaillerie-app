import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Boxes, ShoppingCart,
  Users, UserCog, LogOut, Wrench, Settings, Tag, FileText, Menu, X,
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "../auth/AuthContext";

const NAV_BY_ROLE = {
  ADMIN: [
    { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
    { to: "/produits", label: "Produits", icon: Package },
    { to: "/stock", label: "Stock", icon: Boxes },
    { to: "/ventes", label: "Ventes", icon: ShoppingCart },
    { to: "/factures", label: "Factures", icon: FileText },
    { to: "/clients", label: "Clients", icon: Users },
    { to: "/categories", label: "Catégories", icon: Tag },
    { to: "/gerants", label: "Personnel", icon: UserCog },
    { to: "/parametres", label: "Paramètres", icon: Settings },
  ],
  GERANT: [
    { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
    { to: "/produits", label: "Produits", icon: Package },
    { to: "/stock", label: "Stock", icon: Boxes },
    { to: "/ventes", label: "Ventes", icon: ShoppingCart },
    { to: "/categories", label: "Catégories", icon: Tag },
    { to: "/clients", label: "Clients", icon: Users },
  ],
  CLIENT: [
    { to: "/", label: "Catalogue", icon: Package, end: true },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = NAV_BY_ROLE[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/connexion");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg">
      {/* En-tête Mobile */}
      <header className="md:hidden bg-sidebar text-sidebar-ink flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Wrench size={20} className="text-brand" />
          <span className="font-display font-semibold tracking-tight">Quincaillerie</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-md hover:bg-white/10 text-sidebar-ink focus:outline-none"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Backdrop Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Responsive */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 shrink-0 bg-sidebar text-sidebar-ink flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="hidden md:flex items-center gap-2 px-5 py-5">
          <Wrench size={20} className="text-brand" />
          <span className="font-display font-semibold tracking-tight">Quincaillerie</span>
        </div>

        <nav className="flex-1 px-3 py-4 md:py-0 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 md:py-2 text-sm transition-colors ${
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

        <div className="px-3 pb-4 border-t border-white/10 pt-4 mx-3 mt-auto">
          <p className="text-sm font-medium truncate">{user?.username}</p>
          <p className="text-xs text-sidebar-muted mb-3">{ROLE_LABELS[user?.role]}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-sidebar-muted hover:text-sidebar-ink transition-colors"
          >
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
