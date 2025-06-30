import React, { createContext, useState, useContext, useMemo } from 'react';

export const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false); // Indica si los datos están cargados
  const [clientData, setClientData] = useState(null); // Info general del cliente
  const [clientAssets, setClientAssets] = useState(null); // Recursos gráficos
  const [clientConfig, setClientConfig] = useState(null);
  const [products, setProducts] = useState([]); // Todos los productos
  const [productsByCategory, setProductsByCategory] = useState({}); // Productos por categoría
  const [categories, setCategories] = useState([]); // Categorías
  const [productsSorted, setProductsSorted] = useState([]); // Productos ordenados
  const [slugEmpresa, setSlugEmpresa] = useState(null); // Slug de la empresa
  const [slugSucursal, setSlugSucursal] = useState(null); // Slug de la sucursal
  const [empresaId, setEmpresaId] = useState(null); // ID de la empresa
  const [sucursalId, setSucursalId] = useState(null); // ID de la sucursal

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
    }),
    [
      isLoaded,
      clientData,
      clientAssets,
      clientConfig,
      products,
      productsByCategory,
      categories,
      productsSorted,
      slugEmpresa,
      slugSucursal,
      empresaId,
      sucursalId,
    ]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient debe usarse dentro de un ClientProvider');
  }
  return context;
};
