import React, { createContext, useState, useContext, useMemo } from "react";
import { useTypography } from "../hooks/useTypography"; // ← NUEVO

export const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [clientAssets, setClientAssets] = useState(null);
  const [clientConfig, setClientConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [categories, setCategories] = useState([]);
  const [productTags, setProductTags] = useState([]);
  const [productsSorted, setProductsSorted] = useState([]);
  const [slugEmpresa, setSlugEmpresa] = useState(null);
  const [slugSucursal, setSlugSucursal] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [sucursalId, setSucursalId] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeSortOption, setActiveSortOption] = useState(null);

  // ← NUEVO: Cargar tipografía cuando tenemos los IDs
  const { typography, loading: typographyLoading } = useTypography(
    empresaId,
    sucursalId
  );

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
      products,
      setProducts,
      productsByCategory,
      setProductsByCategory,
      categories,
      setCategories,
      productTags,
      setProductTags,
      productsSorted,
      setProductsSorted,
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
      typography, // ← NUEVO
      typographyLoading, // ← NUEVO
    }),
    [
      isLoaded,
      clientData,
      clientAssets,
      clientConfig,
      products,
      productsByCategory,
      categories,
      productTags,
      productsSorted,
      slugEmpresa,
      slugSucursal,
      empresaId,
      sucursalId,
      activeFilters,
      activeSortOption,
      typography, // ← NUEVO
      typographyLoading, // ← NUEVO
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
