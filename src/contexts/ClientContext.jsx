import React, { createContext, useState, useContext } from 'react';

const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [clientConfig, setClientConfig] = useState(null);

  return (
    <ClientContext.Provider
      value={{ isLoaded, setIsLoaded, clientConfig, setClientConfig }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => useContext(ClientContext);
