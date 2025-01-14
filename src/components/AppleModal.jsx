import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import LoadingPoints from "./LoadingPoints";
import { MapDirection } from "./form/MapDirection";
import { doc, runTransaction, collection, getFirestore } from 'firebase/firestore';
import { obtenerFechaActual } from '../helpers/currencyFormat';
import isologo from '../assets/isologo.png';

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
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [newAddress, setNewAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [aclaraciones, setAclaraciones] = useState('');

  const handleUpdateAddress = async () => {
    if (deliveryMethod === 'takeaway') {
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

          // Actualizamos a retiro en local
          pedidosDelDia[pedidoIndex].direccion = "";
          pedidosDelDia[pedidoIndex].deliveryMethod = "takeaway";
          pedidosDelDia[pedidoIndex].ubicacion = "";
          pedidosDelDia[pedidoIndex].referencias = "";
          pedidosDelDia[pedidoIndex].map = [];

          transaction.set(pedidoDocRef, {
            ...existingData,
            pedidos: pedidosDelDia,
          });
        });

        onAddressSuccess?.("");
        onClose();
      } catch (error) {
        console.error('Error al cambiar a retiro:', error);
        setAddressError('Hubo un error al cambiar a retiro. Por favor intenta nuevamente.');
      } finally {
        setIsUpdatingAddress(false);
      }
      return;
    }

    if (!newAddress && deliveryMethod === 'delivery') {
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
        pedidosDelDia[pedidoIndex].deliveryMethod = "delivery";

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

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-4">
      <div className="bg-gray-100 flex flex-col items-center justify-center rounded-3xl shadow-xl w-full max-w-md font-coolvetica pb-4 pt-2 relative">
        {title && (
          <h2 className="text-2xl font-bold px-4 text-black pt-2 border-b border-black border-opacity-20 w-full text-center pb-4">
            {title}
          </h2>
        )}
        <div className="w-full px-4 max-h-[80vh] pt-4 overflow-y-auto">
          {isEditAddressModal ? (
            <div className="space-y-4">
              {/* Botones de selección */}
              <div className="flex flex-row w-full gap-2 ">
                <button
                  type="button"
                  className={`h-20 flex-1 font-bold items-center flex justify-center gap-2 rounded-lg ${
                    deliveryMethod === 'delivery'
                      ? 'bg-black text-gray-100'
                      : 'bg-gray-300 text-black'
                  }`}
                  onClick={() => setDeliveryMethod('delivery')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 500 500"
                    className="h-8"
                  >
                    <path
                      d="M76.849,210.531C34.406,210.531,0,244.937,0,287.388c0,42.438,34.406,76.847,76.849,76.847 c30.989,0,57.635-18.387,69.789-44.819l18.258,14.078c0,0,134.168,0.958,141.538-3.206c0,0-16.65-45.469,4.484-64.688 c2.225-2.024,5.021-4.332,8.096-6.777c-3.543,8.829-5.534,18.45-5.534,28.558c0,42.446,34.403,76.846,76.846,76.846 c42.443,0,76.843-34.415,76.843-76.846c0-42.451-34.408-76.849-76.843-76.849c-0.697,0-1.362,0.088-2.056,0.102 c5.551-3.603,9.093-5.865,9.093-5.865l-5.763-5.127c0,0,16.651-3.837,12.816-12.167c-3.848-8.33-44.19-58.28-44.19-58.28 s7.146-15.373-7.634-26.261l-7.098,15.371c0,0-18.093-12.489-25.295-10.084c-7.205,2.398-18.005,3.603-21.379,8.884l-3.358,3.124 c0,0-0.95,5.528,4.561,13.693c0,0,55.482,17.05,58.119,29.537c0,0,3.848,7.933-12.728,9.844l-3.354,4.328l-8.896,0.479 l-16.082-36.748c0,0-15.381,4.082-23.299,10.323l1.201,6.24c0,0-64.599-43.943-125.362,21.137c0,0-44.909,12.966-76.37-26.897 c0,0-0.479-12.968-76.367-10.565l5.286,5.524c0,0-5.286,0.479-7.444,3.841c-2.158,3.358,1.2,6.961,18.494,6.961 c0,0,39.153,44.668,69.17,42.032l42.743,20.656l18.975,32.42c0,0,0.034,2.785,0.23,7.045c-4.404,0.938-9.341,1.979-14.579,3.09 C139.605,232.602,110.832,210.531,76.849,210.531z"
                      fill="currentColor"
                    />
                  </svg>
                  Delivery
                </button>
                <button
                  type="button"
                  className={`h-20 flex-1 flex-col font-bold items-center flex justify-center rounded-lg ${
                    deliveryMethod === 'takeaway'
                      ? 'bg-black text-gray-100'
                      : 'bg-gray-300 text-black'
                  }`}
                  onClick={() => setDeliveryMethod('takeaway')}
                >
                  <div className="flex flex-row items-center gap-2">
                    <img
                      src={isologo}
                      className={`h-4 ${
                        deliveryMethod === 'takeaway'
                          ? 'invert brightness-0'
                          : 'brightness-0'
                      }`}
                      alt=""
                    />
                    <p className="font-bold text-">Retiro</p>
                  </div>
                  <p className="font-light text-xs">por Buenos Aires 618</p>
                </button>
              </div>

              {/* Contenido condicional según deliveryMethod */}
              {deliveryMethod === 'delivery' && (
                <div className="w-full items-center rounded-3xl border-2 border-black">
                  <div className="border-b border-black border-opacity-20">
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
              )}

              {addressError && (
                <p className="text-red-500 text-lg font-bold">{addressError}</p>
              )}
            </div>
          ) : (
            children
          )}
        </div>

        {/* Botones de acción */}
        <div className="w-full px-4 mt-8">
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