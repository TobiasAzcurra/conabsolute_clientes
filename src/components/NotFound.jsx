import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../contexts/ClientContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { slugEmpresa, slugSucursal, categories } = useClient();

  const handleGoHome = () => {
    const firstCategory = categories?.[0]?.id || 'default';
    navigate(`/${slugEmpresa}/${slugSucursal}/menu/${firstCategory}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-6">Página no encontrada</p>
      <button
        className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
        onClick={handleGoHome}
      >
        Ir al inicio
      </button>
    </div>
  );
};

export default NotFound;
