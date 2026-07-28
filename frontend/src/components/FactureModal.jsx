import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const FactureModal = ({ facture: initialFacture, onClose }) => {
  const [facture, setFacture] = useState(initialFacture);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialFacture) return;

    const resolveData = async () => {
      if (initialFacture.lignes && initialFacture.lignes.length > 0) {
        setFacture(initialFacture);
        setLignes(initialFacture.lignes);
        return;
      }

      const targetVenteId = initialFacture.vente_id || initialFacture.vente;

      if (targetVenteId) {
        setLoading(true);
        try {
          const { data } = await api.get(`/api/ventes/${targetVenteId}/`);
          if (data) {
            setLignes(data.lignes || []);
            setFacture(prev => ({ ...prev, ...data }));
          }
        } catch (err) {
          console.error("Erreur de récupération des détails de la vente :", err);
        } finally {
          setLoading(false);
        }
      } else {
        setFacture(initialFacture);
      }
    };

    resolveData();
  }, [initialFacture]);

  if (!facture) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('facture-print').innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=1000');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture #${facture.numero || facture.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #ffffff;
              color: #000;
              padding: 0;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            ${printContent}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        
        {/* En-tête des actions */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium text-sm transition-colors"
          >
            ← Fermer
          </button>
          
          <button
            onClick={handlePrint}
            disabled={loading}
            className="px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium text-sm flex items-center gap-2 shadow transition-colors disabled:opacity-50"
          >
            🖨️ Imprimer / Enregistrer PDF
          </button>
        </div>

        {/* Gabarit de la Facture conforme au modèle souhaité */}
        <div id="facture-print" className="p-4 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold text-orange-600 tracking-wide uppercase">
                QUINCAILLERIE GÉNÉRALE
              </h1>
              <p className="text-xs text-gray-500">Gestion des ventes et stocks en temps réel</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900 uppercase">FACTURE</h2>
              <p className="text-sm font-semibold text-gray-700">
                Numéro : #{facture.numero || facture.id}
              </p>
            </div>
          </div>

          <hr className="border-t-2 border-orange-600 mb-6" />

          <div className="flex justify-between items-start text-sm mb-8">
            <div>
              <p className="font-bold text-gray-900">Émis par :</p>
              <p className="text-gray-800 font-medium">Quincaillerie Moderne</p>
              <p className="text-gray-500 text-xs">Service Comptoir</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">Date de facturation :</p>
              <p className="text-gray-800">
                {facture.date || facture.date_emission || facture.created_at
                  ? new Date(facture.date || facture.date_emission || facture.created_at).toLocaleString('fr-FR')
                  : new Date().toLocaleString('fr-FR')}
              </p>
              <p className="mt-1">
                <span className="text-xs font-bold text-green-700 uppercase">
                  Statut : {facture.statut || 'PAYÉ'}
                </span>
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 font-medium">Chargement des articles...</div>
          ) : (
            <table className="w-full text-left mb-8 border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2 font-bold text-gray-900">Référence / Désignation</th>
                  <th className="py-2 text-center font-bold text-gray-900">Prix Unitaire</th>
                  <th className="py-2 text-center font-bold text-gray-900">Quantité</th>
                  <th className="py-2 text-right font-bold text-gray-900">Montant total</th>
                </tr>
              </thead>
              <tbody>
                {lignes.length > 0 ? (
                  lignes.map((item, idx) => {
                    const pu = item.prix_unitaire || 0;
                    const qte = item.quantite || 1;
                    const st = item.sous_total || (pu * qte);
                    
                    // Construction de "Référence - Nom du produit"
                    const ref = item.reference || item.produit_reference || '';
                    const name = item.designation || item.produit_nom || `Produit #${item.produit_id || item.id}`;
                    const fullName = ref ? `${ref} - ${name}` : name;

                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 font-medium text-gray-800">{fullName}</td>
                        <td className="py-3 text-center">{Number(pu).toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-3 text-center">{qte}</td>
                        <td className="py-3 text-right font-bold text-gray-900">{Number(st).toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-800">Vente #{facture.vente_id || facture.id}</td>
                    <td className="py-3 text-center">{Number(facture.montant_total || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-3 text-center">1</td>
                    <td className="py-3 text-right font-bold text-gray-900">{Number(facture.montant_total || 0).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <div className="flex justify-end mb-12">
            <div className="text-right border-t border-gray-900 pt-2 w-1/2">
              <span className="text-xs font-bold text-gray-600 uppercase">NET À PAYER :</span>
              <p className="text-xl font-extrabold text-orange-600">
                {Number(facture.montant_total || 0).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Merci pour votre confiance et votre fidélité !</p>
            <p className="text-[10px] text-gray-400 mt-1">
              Application Quincaillerie-App — Document généré pour validation de diplôme.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FactureModal;
