import React, { useState } from 'react';
import { StarRating } from './StarRating';

const RatingModal = ({ isOpen, onClose, onSubmitRating, currentOrder }) => {
  const [rating, setRating] = useState({
    tiempo: 0,
    temperatura: 0,
    presentacion: 0,
    pagina: 0,
    burgers: 0,
    papas: 0,
    comentario: '',
  });

  const handleRatingChange = (category, value) => {
    setRating((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRating((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmitRating(currentOrder.fecha, currentOrder.id, rating);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Calificar Pedido</h2>

        {/* Rating por Tiempo */}
        <div className="mb-4">
          <label className="block mb-2">Tiempo:</label>
          <StarRating
            rating={rating.tiempo}
            onRatingChange={(value) => handleRatingChange('tiempo', value)}
          />
        </div>

        {/* Rating por Temperatura */}
        <div className="mb-4">
          <label className="block mb-2">Temperatura:</label>
          <StarRating
            rating={rating.temperatura}
            onRatingChange={(value) => handleRatingChange('temperatura', value)}
          />
        </div>

        {/* Rating por Presentación */}
        <div className="mb-4">
          <label className="block mb-2">Presentación:</label>
          <StarRating
            rating={rating.presentacion}
            onRatingChange={(value) =>
              handleRatingChange('presentacion', value)
            }
          />
        </div>

        {/* Rating por Página */}
        <div className="mb-4">
          <label className="block mb-2">Página:</label>
          <StarRating
            rating={rating.pagina}
            onRatingChange={(value) => handleRatingChange('pagina', value)}
          />
        </div>

        {/* Rating por Burgers */}
        <div className="mb-4">
          <label className="block mb-2">Burgers:</label>
          <StarRating
            rating={rating.burgers}
            onRatingChange={(value) => handleRatingChange('burgers', value)}
          />
        </div>

        {/* Rating por Papas */}
        <div className="mb-4">
          <label className="block mb-2">Papas:</label>
          <StarRating
            rating={rating.papas}
            onRatingChange={(value) => handleRatingChange('papas', value)}
          />
        </div>

        {/* Comentario */}
        <div className="mb-4">
          <label htmlFor="comentario" className="block mb-2">
            Comentario:
          </label>
          <textarea
            name="comentario"
            value={rating.comentario}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-black py-2 px-4 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Enviar Calificación
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
