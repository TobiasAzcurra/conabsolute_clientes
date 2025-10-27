// components/ThemeProvider.jsx
import { useEffect } from "react";
import { useClient } from "../contexts/ClientContext";

/**
 * Componente que aplica los colores personalizados como CSS variables
 * Se debe colocar dentro del ClientProvider para tener acceso al contexto
 */
const ThemeProvider = ({ children }) => {
  const { colors, colorsLoading } = useClient();

  useEffect(() => {
    if (!colors || colorsLoading) return;

    // Aplicar colores como CSS variables en el root del documento
    const root = document.documentElement;

    // Colores principales
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-secondary", colors.secondary);

    // Versiones RGB para usar con opacidad (rgba)
    root.style.setProperty("--color-primary-rgb", hexToRgb(colors.primary));
    root.style.setProperty("--color-secondary-rgb", hexToRgb(colors.secondary));

    // Cleanup al desmontar
    return () => {
      root.style.removeProperty("--color-primary");
      root.style.removeProperty("--color-secondary");
      root.style.removeProperty("--color-primary-rgb");
      root.style.removeProperty("--color-secondary-rgb");
    };
  }, [colors, colorsLoading]);

  return children;
};

// Función auxiliar para convertir hex a RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : "0, 0, 0";
};

export default ThemeProvider;
