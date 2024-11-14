import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import classNames from 'classnames';
import { functions } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';
import {
  isWithinClosedDays,
  isWithinOrderTimeRange,
} from '../../helpers/validate-hours';
import LoadingPoints from '../LoadingPoints';
import AppleModal from '../AppleModal';

// Inicializa Mercado Pago con tu clave pública
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PRODUCCION_PUBLIC_KEY, {
  locale: 'es-AR',
});

const adjustHora = (hora) => {
  const [hours, minutes] = hora.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() - 30);

  // Formatear la nueva hora en "HH:mm"
  const adjustedHours = date.getHours().toString().padStart(2, '0');
  const adjustedMinutes = date.getMinutes().toString().padStart(2, '0');
  const adjustedTime = `${adjustedHours}:${adjustedMinutes}`;
  return adjustedTime;
};

const Payment = ({
  envio,
  values,
  cart,
  discountedTotal,
  mapUrl,
  couponCodes,
  submitForm,
  isValid,
  setPendingValues,
  altaDemanda,
  pendingValues,
}) => {
  const [preferenceId, setPreferenceId] = useState(null); // Estado para almacenar el preferenceId
  const [isLoading, setIsLoading] = useState(false); // Estado para el loading del botón
  const [isReady, setIsReady] = useState(false); // Estado para saber si el Wallet está listo
  const [showHighDemandModal, setShowHighDemandModal] = useState(false);
  const [isModalConfirmLoading, setIsModalConfirmLoading] = useState(false);

  // Crear preferencia al hacer clic en pagar
  const handlePayClick = async (isReserva) => {
    if (!isValid) {
      // Si el formulario no es válido, no ejecutar el proceso de pago
      return;
    }

    if (isWithinClosedDays()) {
      return; // No proceder si es lunes, martes o miércoles
    }

    if (!isWithinOrderTimeRange()) {
      return;
    }

    setIsLoading(true);
    submitForm();
    try {
      let adjustedHora = values.hora;

      // Si es una reserva, ajusta la hora restando 30 minutos
      if (isReserva) {
        adjustedHora = adjustHora(values.hora);
      }

      // Si estamos en alta demanda, ajusta la hora sumando los minutos de demora
      if (altaDemanda?.isHighDemand && pendingValues) {
        const delayMinutes = altaDemanda.delayMinutes || 0;
        const currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + delayMinutes);

        const adjustedHours = currentTime
          .getHours()
          .toString()
          .padStart(2, '0');
        const adjustedMinutes = currentTime
          .getMinutes()
          .toString()
          .padStart(2, '0');
        adjustedHora = `${adjustedHours}:${adjustedMinutes}`;
      }

      const updatedValues = { ...values, hora: adjustedHora };

      console.log(updatedValues);

      // Llamar a la función de Firebase
      const createPreference = httpsCallable(functions, 'createPreference');
      const result = await createPreference({
        updatedValues,
        cart,
        discountedTotal,
        envio,
        mapUrl,
        couponCodes,
      });

      // Asumiendo que el resultado contiene el ID de la preferencia
      setPreferenceId(result.data.id);
    } catch (error) {
      console.error('Error al crear preferencia:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Muestra el botón de pago de Mercado Pago cuando el preferenceId está listo
  const handleOnReady = () => {
    setIsReady(true);
  };

  if (isLoading) {
    return (
      <div className="text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 rounded-3xl h-[80px] font-bold hover:bg-red-600 transition-colors duration-300 w-full">
        <LoadingPoints color="text-gray-100" />
      </div>
    ); // Mostrar mientras se crea la preferencia
  }

  return (
    <div>
      {!preferenceId ? (
        <button
          onClick={async () => {
            const isReserva = values.hora.trim() !== '';

            if (!isReserva && altaDemanda?.isHighDemand) {
              setPendingValues(values);
              setShowHighDemandModal(true);
              return;
            } else {
              await handlePayClick(isReserva);
            }
          }}
          disabled={isLoading}
          className="text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 rounded-3xl h-[80px] font-bold hover:bg-red-600 transition-colors duration-300 w-full"
        >
          {isLoading ? 'Cargando...' : 'Pedir'}
        </button>
      ) : (
        <div
          className={classNames('payment-form', {
            'payment-form--hidden': !isReady,
          })}
        >
          <Wallet
            initialization={{
              preferenceId: preferenceId, // Pasa el preferenceId al Wallet
              redirectMode: 'self',
            }}
            locale="es-AR"
            customization={{
              texts: {
                action: 'pay',
                valueProp: 'security_safety',
              },
              visual: {
                hideValueProp: false,
                buttonBackground: 'default', // Personaliza el botón
                valuePropColor: 'grey',
                buttonHeight: '80px',
                borderRadius: '24px',
                verticalPadding: '16px',
                horizontalPadding: '0px',
              },
              checkout: {
                theme: {
                  elementsColor: '#4287F5',
                  headerColor: '#4287F5',
                },
              },
            }}
            onReady={handleOnReady} // Indica cuándo el Wallet está listo
          />
        </div>
      )}
      <AppleModal
        isOpen={showHighDemandModal}
        onClose={() => setShowHighDemandModal(false)}
        title="Alta Demanda"
        twoOptions={true}
        isLoading={isModalConfirmLoading}
        onConfirm={async () => {
          setIsModalConfirmLoading(true);
          if (pendingValues) {
            const isReserva = pendingValues.hora.trim() !== '';

            await handlePayClick(isReserva); // Activa el pago cuando se confirma "Sí" en el modal
          }
          setIsModalConfirmLoading(false);
          setShowHighDemandModal(false);
        }}
      >
        <p>
          Estamos en alta demanda, tu pedido comenzará a cocinarse dentro de{' '}
          {altaDemanda?.delayMinutes} minutos, ¿lo esperas?
        </p>
      </AppleModal>
    </div>
  );
};

export default Payment;
