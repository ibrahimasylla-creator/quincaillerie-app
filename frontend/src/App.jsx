import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProduitsPage from "./pages/ProduitsPage";
import StockPage from "./pages/StockPage";
import VentePage from "./pages/VentePage";
import ClientsPage from "./pages/ClientsPage";
import GerantsPage from "./pages/GerantsPage";
import ParametresPage from "./pages/ParametresPage";
import FacturesPage from "./pages/FacturesPage";
import CategoriesPage from "./pages/CategoriesPage";

function Home() {
  const { user } = useAuth();
  // Le Client n'a qu'un catalogue en lecture seule ; Admin/Gerant ont un tableau de bord.
  return user.role === "CLIENT" ? <ProduitsPage /> : <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/produits" element={<ProduitsPage />} />
            <Route
              path="/stock"
              element={
                <ProtectedRoute roles={["ADMIN", "GERANT"]}>
                  <StockPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventes"
              element={
                <ProtectedRoute roles={["ADMIN", "GERANT"]}>
                  <VentePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute roles={["ADMIN", "GERANT"]}>
                  <ClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gerants"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <GerantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <ProtectedRoute roles={["ADMIN", "GERANT"]}>
                  <FacturesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute roles={["ADMIN", "GERANT"]}>
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <ParametresPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
