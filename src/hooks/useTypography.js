import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const useTypography = (empresaId, sucursalId) => {
  const [typography, setTypography] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTypography = async () => {
      if (!empresaId || !sucursalId) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔤 Cargando tipografía personalizada...");

        const typographyRef = doc(
          db,
          "absoluteClientes",
          empresaId,
          "sucursales",
          sucursalId,
          "config",
          "typography"
        );

        const snap = await getDoc(typographyRef);

        if (snap.exists()) {
          const data = snap.data();
          console.log("✅ Tipografía cargada:", data);
          setTypography(data);
          injectFonts(data);
        } else {
          console.log(
            "ℹ️ No hay tipografía personalizada, usando fuentes por defecto"
          );
          setTypography(null);
        }
      } catch (err) {
        console.error("❌ Error cargando tipografía:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTypography();
  }, [empresaId, sucursalId]);

  return { typography, loading, error };
};

const injectFonts = (typography) => {
  if (!typography?.primary?.files) {
    console.warn("⚠️ No hay archivos de fuente para inyectar");
    return;
  }

  // Generar CSS @font-face
  const fontFaceCSS = generateFontFaceCSS(typography);

  // Inyectar o actualizar el <style> en el <head>
  const styleId = "custom-typography";
  let styleEl = document.getElementById(styleId);

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = fontFaceCSS;

  // Aplicar CSS variables en :root
  const root = document.documentElement;
  const primaryFontFamily = `'${typography.primary.name}', ${typography.primary.fallback}`;
  const secondaryFontFamily = typography.secondary?.name
    ? `'${typography.secondary.name}', ${typography.secondary.fallback}`
    : "system-ui, sans-serif";

  root.style.setProperty("--font-primary", primaryFontFamily);
  root.style.setProperty("--font-secondary", secondaryFontFamily);

  console.log("✅ Fuentes inyectadas:", {
    primary: primaryFontFamily,
    secondary: secondaryFontFamily,
  });
};

const generateFontFaceCSS = (typography) => {
  let css = "";

  // Primary font
  if (typography.primary?.files) {
    Object.entries(typography.primary.files).forEach(([weightId, fileData]) => {
      css += `
        @font-face {
          font-family: '${typography.primary.name}';
          src: url('${fileData.url}') format('${getFormat(fileData.format)}');
          font-weight: ${fileData.weight};
          font-style: normal;
          font-display: swap;
        }
      `;
    });
  }

  // Secondary font (opcional)
  if (typography.secondary?.files && typography.secondary.name) {
    Object.entries(typography.secondary.files).forEach(
      ([weightId, fileData]) => {
        css += `
        @font-face {
          font-family: '${typography.secondary.name}';
          src: url('${fileData.url}') format('${getFormat(fileData.format)}');
          font-weight: ${fileData.weight};
          font-style: normal;
          font-display: swap;
        }
      `;
      }
    );
  }

  return css;
};

const getFormat = (format) => {
  const formatMap = {
    woff2: "woff2",
    woff: "woff",
    ttf: "truetype",
    otf: "opentype",
  };
  return formatMap[format] || "truetype";
};
