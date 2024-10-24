import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import classNames from 'classnames';
import { functions } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';
import {
  isWithinClosedDays,
  isWithinOrderTimeRange,
} from '../../helpers/validate-hours';
import { showTimeRestrictionAlert } from '../form/showTImeRestrictionAlert';
import LoadingPoints from '../LoadingPoints';

// Inicializa Mercado Pago con tu clave pública
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PRODUCCION_PUBLIC_KEY, {
  locale: 'es-AR',
});

const Payment = ({
  envio,
  values,
  cart,
  discountedTotal,
  mapUrl,
  couponCodes,
  submitForm,
  isValid,
}) => {
  const [preferenceId, setPreferenceId] = useState(null); // Estado para almacenar el preferenceId
  const [isLoading, setIsLoading] = useState(false); // Estado para el loading del botón
  const [isReady, setIsReady] = useState(false); // Estado para saber si el Wallet está listo

  // Crear preferencia al hacer clic en pagar
  const handlePayClick = async () => {
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
      // Llamar a la función de Firebase
      const createPreference = httpsCallable(functions, 'createPreference');
      const result = await createPreference({
        values,
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
          onClick={handlePayClick}
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
    </div>
  );
};

export default Payment;
