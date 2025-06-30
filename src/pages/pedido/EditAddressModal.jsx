import React, { useState } from 'react';
import { MapDirection } from '../../components/form/MapDirection';
import {
  doc,
  runTransaction,
  collection,
  getFirestore,
} from 'firebase/firestore';

const EditAddressModal = ({
  isOpen,
  onClose,
  orderId,
  currentAddress,
  onSuccess,
}) => {
  const [newAddress, setNewAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateAddress = async () => {
    if (!newAddress) {
      setError('Por favor selecciona una dirección válida');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const firestore = getFirestore();
      const fechaActual = obtenerFechaActual();
      const [dia, mes, anio] = fechaActual.split('/');
      const pedidosCollectionRef = collection(firestore, 'pedidos', anio, mes);
      const pedidoDocRef = doc(pedidosCollectionRef, dia);

      await runTransaction(firestore, async (transaction) => {
        const docSnapshot = await transaction.get(pedidoDocRef);
        if (!docSnapshot.exists()) {
          throw new Error('El pedido no existe para la fecha especificada.');
        }

        const existingData = docSnapshot.data();
        const pedidosDelDia = existingData.pedidos || [];
        const pedidoIndex = pedidosDelDia.findIndex(
          (pedido) => pedido.id === orderId
        );

        if (pedidoIndex === -1) {
          throw new Error('Pedido no encontrado');
        }

        // Actualizamos la dirección y la URL del mapa
        pedidosDelDia[pedidoIndex].direccion = newAddress;
        pedidosDelDia[pedidoIndex].ubicacion = mapUrl;

        // Si hay coordenadas en la URL del mapa, las extraemos
        const coords = mapUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coords) {
          pedidosDelDia[pedidoIndex].map = [
            parseFloat(coords[1]),
            parseFloat(coords[2]),
          ];
        }

        transaction.set(pedidoDocRef, {
          ...existingData,
          pedidos: pedidosDelDia,
        });
      });

      onSuccess?.(newAddress);
      onClose();
    } catch (error) {
      console.error('Error al actualizar la dirección:', error);
      setError(
        'Hubo un error al actualizar la dirección. Por favor intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Editar dirección</h2>
          <p className="text-gray-600 mb-4">
            Dirección actual: {currentAddress}
          </p>

          {/* MapDirection component */}
          <div className="mb-4">
            <MapDirection
              setUrl={setMapUrl}
              setValidarUbi={() => {}}
              setNoEncontre={() => {}}
              setFieldValue={(field, value) => {
                if (field === 'address') {
                  setNewAddress(value);
                }
              }}
            />
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-black bg-gray-200 rounded-xl hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateAddress}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-black rounded-xl hover:bg-gray-900 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Actualizando...
                </span>
              ) : (
                'Actualizar dirección'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAddressModal;
