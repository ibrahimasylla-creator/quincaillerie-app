import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function FacturePrint({ vente }) {
  const [parametres, setParametres] = useState(null);

  useEffect(() => {
    api.get("/api/parametres/").then((res) => {
      setParametres(Array.isArray(res.data) ? res.data[0] : res.data);
    }).catch((err) => console.error("Erreur chargement paramètres:", err));
  }, []);

  if (!parametres) return <p className="text-sm text-gray-500">Chargement des données de la quincaillerie...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black">
      {/* HEADER DE LA FACTURE */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        
        {/* LOGO & INFOS BOUTIQUE */}
        <div className="flex items-center gap-4">
          {parametres.logo ? (
            <img 
              src={parametres.logo} 
              alt="Logo boutique" 
              className="h-16 w-auto object-contain" 
            />
          ) : (
            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center font-bold text-2xl text-green-700 rounded">
              {parametres.nom_quincaillerie?.charAt(0) || "Q"}
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-gray-900">{parametres.nom_quincaillerie}</h1>
            {parametres.slogan && (
              <p className="text-sm italic text-gray-600">{parametres.slogan}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{parametres.adresse_complete}</p>
            <p className="text-xs text-gray-500">
              Tél: {parametres.telephone} {parametres.email && `| Email: ${parametres.email}`}
            </p>
          </div>
        </div>

        {/* INFOS LÉGALES & FACTURE */}
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800">FACTURE</h2>
          <p className="text-sm text-gray-600">N° : {vente?.reference || "FAC-0001"}</p>
          <p className="text-sm text-gray-600">Date : {new Date().toLocaleDateString("fr-FR")}</p>
          
          <div className="mt-2 text-xs text-gray-500">
            {parametres.ninea && <p>NINEA : {parametres.ninea}</p>}
            {parametres.registre_commerce && <p>RC : {parametres.registre_commerce}</p>}
          </div>
        </div>

      </div>

      {parametres.appliquer_tva && (
        <div className="flex justify-end text-sm mt-4">
          <p className="font-semibold text-gray-700">TVA (18%) applicable</p>
        </div>
      )}
    </div>
  );
}
