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
  const [aiBotConfig, setAiBotConfig] = useState(null); // ✅ NUEVO

  // ✅ Sólo guardamos productos "crudos"
  const [rawProducts, setRawProducts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [productTags, setProductTags] = useState([]);
  const [slugEmpresa, setSlugEmpresa] = useState(null);
  const [slugSucursal, setSlugSucursal] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [sucursalId, setSucursalId] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeSortOption, setActiveSortOption] = useState(null);

  // ✅ Coordenadas de la sucursal en contexto
  const [branchCoordinates, setBranchCoordinates] = useState(null);

  // ✅ Derivados
  const productsByCategory = useMemo(
    () => groupByCategory(rawProducts),
    [rawProducts]
  );

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
      aiBotConfig, // ✅ NUEVO
      setAiBotConfig, // ✅ NUEVO

      // Productos
      rawProducts,
      setRawProducts,
      productsByCategory,

      // Cat/Tags
      categories,
      setCategories,
      productTags,
      setProductTags,

      // Slugs/IDs
      slugEmpresa,
      setSlugEmpresa,
      slugSucursal,
      setSlugSucursal,
      empresaId,
      setEmpresaId,
      sucursalId,
      setSucursalId,

      // Filtros/UI
      activeFilters,
      setActiveFilters,
      activeSortOption,
      setActiveSortOption,

      // Theming
      typography,
      typographyLoading,
      colors,
      colorsLoading,

      // Coordenadas
      branchCoordinates,
      setBranchCoordinates,
    }),
    [
      isLoaded,
      clientData,
      clientAssets,
      clientConfig,
      aiBotConfig, // ✅ NUEVO
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
      branchCoordinates,
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
