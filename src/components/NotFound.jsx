import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-6">Página no encontrada</p>
      <button
        className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
        onClick={() => navigate(-1)}
      >
        Volver atrás
      </button>
    </div>
  );
};

export default NotFound;
