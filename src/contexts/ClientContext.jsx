import React, { createContext, useState, useContext, useMemo } from "react";

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

  // ✅ Nuevo: Estado de filtros y ordenamiento
  const [activeFilters, setActiveFilters] = useState([]); // ['hombre', 'mujer']
  const [activeSortOption, setActiveSortOption] = useState(null); // 'price-asc' o null

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
      activeFilters, // ✅
      setActiveFilters, // ✅
      activeSortOption, // ✅
      setActiveSortOption, // ✅
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
      activeFilters, // ✅
      activeSortOption, // ✅
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
