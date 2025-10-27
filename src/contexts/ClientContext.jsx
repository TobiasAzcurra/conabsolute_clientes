// contexts/ClientContext.jsx
import React, { createContext, useState, useContext, useMemo } from "react";
import { useTypography } from "../hooks/useTypography";
import { useColors } from "../hooks/useColors";
import { groupByCategory } from "../utils/productSorters";

export const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [clientAssets, setClientAssets] = useState(null);
  const [clientConfig, setClientConfig] = useState(null);

  // ✅ CAMBIO: Solo guardamos productos "crudos" sin procesar
  const [rawProducts, setRawProducts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [productTags, setProductTags] = useState([]);
  const [slugEmpresa, setSlugEmpresa] = useState(null);
  const [slugSucursal, setSlugSucursal] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [sucursalId, setSucursalId] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeSortOption, setActiveSortOption] = useState(null);

  // ✅ NUEVO: Memoizaciones derivadas (computed values)
  const productsByCategory = useMemo(
    () => groupByCategory(rawProducts),
    [rawProducts]
  );

  // Cargar tipografía y colores cuando tenemos los IDs
  const { typography, loading: typographyLoading } = useTypography(
    empresaId,
    sucursalId
  );

  const { colors, loading: colorsLoading } = useColors(empresaId, sucursalId);

  const value = useMemo(
    () => ({
      isLoaded,
      setIsLoaded,
      clientData,
      setClientData,
      clientAssets,
      setClientAssets,
      clientConfig,
      setClientConfig,

      // ✅ CAMBIO: Exponemos rawProducts y productos derivados
      rawProducts,
      setRawProducts,
      productsByCategory, // Computed

      categories,
      setCategories,
      productTags,
      setProductTags,
      slugEmpresa,
      setSlugEmpresa,
      slugSucursal,
      setSlugSucursal,
      empresaId,
      setEmpresaId,
      sucursalId,
      setSucursalId,
      activeFilters,
      setActiveFilters,
      activeSortOption,
      setActiveSortOption,
      typography,
      typographyLoading,
      colors,
      colorsLoading,
    }),
    [
      isLoaded,
      clientData,
      clientAssets,
      clientConfig,
      rawProducts,
      productsByCategory,
      categories,
      productTags,
      slugEmpresa,
      slugSucursal,
      empresaId,
      sucursalId,
      activeFilters,
      activeSortOption,
      typography,
      typographyLoading,
      colors,
      colorsLoading,
    ]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient debe usarse dentro de un ClientProvider");
  }
  return context;
};
