import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import LoadingPoints from "./LoadingPoints";
import { MapDirection } from "./form/MapDirection";
import { doc, runTransaction, collection, getFirestore } from 'firebase/firestore';
import { obtenerFechaActual } from '../helpers/currencyFormat';

const AppleModal = ({
  isOpen,
  onClose,
  title,
  children,
  twoOptions,
  onConfirm,
  isLoading,
  isRatingModal,
  isEditAddressModal,
  orderId,
  currentAddress,
  onAddressSuccess,
  orderProducts,
  additionalProducts,
}) => {
  const [ratings, setRatings] = useState({
    tiempo: 0,
    temperatura: 0,
    presentacion: 0,
    pagina: 0,
    comentario: "",
  });

  // Estados para la edición de dirección
  const [newAddress, setNewAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [aclaraciones, setAclaraciones] = useState('');

  useEffect(() => {
    if (isOpen && isRatingModal) {
      const initialOrderRatings = orderProducts.reduce((acc, product) => {
        acc[product.burger] = 0;
        return acc;
      }, {});

      const initialAdditionalRatings = additionalProducts.reduce((acc, product) => {
        acc[product] = 0;
        return acc;
      }, {});

      setRatings({
        tiempo: 0,
        temperatura: 0,
        presentacion: 0,
        pagina: 0,
        comentario: "",
        ...initialOrderRatings,
        ...initialAdditionalRatings,
      });
    }
  }, [isOpen, orderProducts, additionalProducts]);

  const handleUpdateAddress = async () => {
    if (!newAddress) {
      setAddressError('Por favor selecciona una dirección válida');
      return;
    }

    setIsUpdatingAddress(true);
    setAddressError('');

    try {
      const firestore = getFirestore();
      const fechaActual = obtenerFechaActual();
      const [dia, mes, anio] = fechaActual.split("/");
      const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
      const pedidoDocRef = doc(pedidosCollectionRef, dia);

      await runTransaction(firestore, async (transaction) => {
        const docSnapshot = await transaction.get(pedidoDocRef);
        if (!docSnapshot.exists()) {
          throw new Error("El pedido no existe para la fecha especificada.");
        }

        const existingData = docSnapshot.data();
        const pedidosDelDia = existingData.pedidos || [];
        const pedidoIndex = pedidosDelDia.findIndex(
          (pedido) => pedido.id === orderId
        );

        if (pedidoIndex === -1) {
          throw new Error("Pedido no encontrado");
        }

        pedidosDelDia[pedidoIndex].direccion = newAddress;
        pedidosDelDia[pedidoIndex].ubicacion = mapUrl;
        pedidosDelDia[pedidoIndex].referencias = aclaraciones;

        const coords = mapUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coords) {
          pedidosDelDia[pedidoIndex].map = [
            parseFloat(coords[1]),
            parseFloat(coords[2])
          ];
        }

        transaction.set(pedidoDocRef, {
          ...existingData,
          pedidos: pedidosDelDia,
        });
      });

      onAddressSuccess?.(newAddress);
      onClose();
    } catch (error) {
      console.error('Error al actualizar la dirección:', error);
      setAddressError('Hubo un error al actualizar la dirección. Por favor intenta nuevamente.');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const StarRating = ({ rating, onRatingChange }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 cursor-pointer ${
              star <= rating ? "text-black" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
            stroke="currentColor"
            onClick={() => onRatingChange(star)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
    );
  };

  const RatingSection = ({ label, category }) => (
    <div className="flex flex-row justify-center items-center gap-2">
      <label className="font-bold">{label}:</label>
      <StarRating
        rating={ratings[category]}
        onRatingChange={(value) =>
          setRatings((prev) => ({ ...prev, [category]: value }))
        }
      />
    </div>
  );

  const ProductRatingSection = ({ productName }) => (
    <div className="flex flex-row justify-center items-center gap-2">
      <label className="block font-bold">{productName}:</label>
      <StarRating
        rating={ratings[productName]}
        onRatingChange={(value) =>
          setRatings((prev) => ({ ...prev, [productName]: value }))
        }
      />
    </div>
  );

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-4">
      <div className="bg-gray-100 flex flex-col items-center justify-center rounded-3xl shadow-xl w-full max-w-md font-coolvetica pb-4 pt-2 relative">
        {title && (
          <h2 className="text-2xl font-bold px-4 text-black pt-2 border-b border-black border-opacity-20 w-full text-center pb-4">
            {title}
          </h2>
        )}
        <div className="w-full px-4 max-h-[80vh] overflow-y-auto">
          <div className="text-black mt-4 text-center">
            {isEditAddressModal ? (
              <div className="space-y-4">
                <div className="w-full items-center rounded-3xl border-2 border-black">
                  <div className=" border-b border-black border-opacity-20">
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
                  
                  <div className="flex flex-row px-3 h-10 items-center">
                    <div className="flex flex-row w-full items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6"
                      >
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                      </svg>
                      <input
                        type="text"
                        value={aclaraciones}
                        onChange={(e) => setAclaraciones(e.target.value)}
                        placeholder="¿Referencias? Ej: Casa con portón"
                        className="bg-transparent px-0 h-10 text-opacity-20 outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
                
                {addressError && (
                  <p className="text-red-500 text-lg font-bold">{addressError}</p>
                )}
              </div>
            ) : (
              children
            )}
          </div>

          {isRatingModal && (
            <div className="mt-8 space-y-2">
              <RatingSection category="tiempo" label="Tiempo" />
              <RatingSection category="temperatura" label="Temperatura" />
              <RatingSection category="presentacion" label="Presentación" />
              <RatingSection category="pagina" label="Página" />

              {orderProducts.map((product, index) => (
                <ProductRatingSection
                  key={index}
                  productName={product.burger}
                />
              ))}

              {additionalProducts.map((product, index) => (
                <ProductRatingSection
                  key={`additional-${index}`}
                  productName={product}
                />
              ))}

              <div className="w-full">
                <p className="flex w-full mb-2 items-center justify-center text-center font-bold">
                  ¿Algún comentario?
                </p>
                <textarea
                  value={ratings.comentario}
                  onChange={(e) =>
                    setRatings((prev) => ({
                      ...prev,
                      comentario: e.target.value,
                    }))
                  }
                  className="w-full px-4 h-10 flex items-center bg-white border-2 border-black rounded-xl"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-full px-4 mt-6">
          {isEditAddressModal ? (
            <div className="flex justify-center gap-2">
              <button
                onClick={handleUpdateAddress}
                disabled={isUpdatingAddress}
                className="w-1/2 h-20 text-2xl flex items-center justify-center bg-black text-gray-100 rounded-3xl font-bold hover:bg-opacity-90 transition-all"
              >
                {isUpdatingAddress ? (
                  <LoadingPoints color="text-gray-100" />
                ) : (
                  "Confirmar"
                )}
              </button>
              <button
                onClick={onClose}
                className="w-1/2 h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold cursor-pointer hover:bg-opacity-90 transition-all"
              >
                Cancelar
              </button>
            </div>
          ) : twoOptions ? (
            <div className="flex justify-center gap-2">
              <button
                onClick={onConfirm}
                className={`w-1/2 h-20 text-2xl flex items-center justify-center bg-black text-gray-100 rounded-3xl font-bold hover:bg-opacity-90 transition-all ${
                  isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
                disabled={isLoading}
              >
                {isLoading ? <LoadingPoints color="text-gray-100" /> : "Sí"}
              </button>
              <button
                onClick={onClose}
                className="w-1/2 h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold cursor-pointer hover:bg-opacity-90 transition-all"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (isRatingModal) {
                  onConfirm(ratings);
                } else {
                  onClose();
                }
              }}
              className="w-full h-20 text-2xl bg-black text-gray-100 rounded-3xl font-bold cursor-pointer hover:bg-opacity-90 transition-all flex items-center justify-center"
              disabled={
                isRatingModal &&
                Object.entries(ratings)
                  .filter(([key]) => key !== "comentario")
                  .some(([_, value]) => value === 0)
              }
            >
              {isRatingModal ? (
                isLoading ? (
                  <LoadingPoints color="text-gray-100" />
                ) : (
                  "Enviar"
                )
              ) : (
                "Entendido"
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

AppleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  twoOptions: PropTypes.bool,
  onConfirm: PropTypes.func,
  isLoading: PropTypes.bool,
  isRatingModal: PropTypes.bool,
  isEditAddressModal: PropTypes.bool,
  orderId: PropTypes.string,
  currentAddress: PropTypes.string,
  onAddressSuccess: PropTypes.func,
  orderProducts: PropTypes.array,
  additionalProducts: PropTypes.array,
};

AppleModal.defaultProps = {
  title: "",
  twoOptions: false,
  onConfirm: () => {},
  isLoading: false,
  isRatingModal: false,
  isEditAddressModal: false,
  orderId: "",
  currentAddress: "",
  onAddressSuccess: () => {},
  children: null,
  orderProducts: [],
  additionalProducts: [],
};

export default AppleModal;