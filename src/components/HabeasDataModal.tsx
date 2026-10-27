// src/components/HabeasDataModal.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Props {
  userUid: string;
  userEmail: string;
}

export const HabeasDataModal: React.FC<Props> = ({ userUid, userEmail }) => {
  const [requiereAceptacion, setRequiereAceptacion] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarConsentimiento = async () => {
      if (!userUid) return;
      const ref = doc(db, 'consentimientos_habeas_data', userUid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setRequiereAceptacion(true);
      }
      setCargando(false);
    };
    verificarConsentimiento();
  }, [userUid]);

  const handleAceptar = async () => {
    const ref = doc(db, 'consentimientos_habeas_data', userUid);
    await setDoc(ref, {
      uid: userUid,
      email: userEmail,
      timestamp: new Date().toISOString(),
      ip: 'captured_client_session',
      leyAplicada: 'Ley 1581 de 2012 - Colombia'
    });
    setRequiereAceptacion(false);
  };

  if (cargando || !requiereAceptacion) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Política de Tratamiento de Datos (Habeas Data)</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          De conformidad con la <strong>Ley 1581 de 2012</strong> de protección de datos personales en Colombia, le informamos que los datos recolectados en esta aplicación académica interna serán tratados exclusivamente para fines de gestión de asistencia y seguimiento de fichas.
        </p>
        <button
          onClick={handleAceptar}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
        >
          Acepto los Términos y Autorizo el Tratamiento
        </button>
      </div>
    </div>
  );
};
