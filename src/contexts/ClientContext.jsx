import React, { createContext, useState, useContext, useMemo } from 'react';

const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [clientAssets, setClientAssets] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [categories, setCategories] = useState([]);

  const value = useMemo(
    () => ({
      isLoaded,
      setIsLoaded,
      clientData,
      setClientData,
      clientAssets,
      setClientAssets,
      products,
      setProducts,
      productsByCategory,
      setProductsByCategory,
      categories,
      setCategories,
    }),
    [
      isLoaded,
      clientData,
      clientAssets,
      products,
      productsByCategory,
      categories,
    ]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
};

export const useClient = () => useContext(ClientContext);
