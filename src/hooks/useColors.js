// hooks/useColors.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const useColors = (empresaId, sucursalId) => {
  const [colors, setColors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!empresaId || !sucursalId) {
      setLoading(false);
      return;
    }

    const fetchColors = async () => {
      try {
        setLoading(true);
        const colorsRef = doc(
          db,
          "absoluteClientes",
          empresaId,
          "sucursales",
          sucursalId,
          "config",
          "colors"
        );
        const snap = await getDoc(colorsRef);

        if (snap.exists()) {
          setColors(snap.data());
        } else {
          setColors({ primary: "#3B82F6", secondary: "#6B7280" });
        }
      } catch (err) {
        console.error("Error al cargar colores:", err);
        setColors({ primary: "#3B82F6", secondary: "#6B7280" });
      } finally {
        setLoading(false);
      }
    };

    fetchColors();
  }, [empresaId, sucursalId]);

  return { colors, loading, error };
};
