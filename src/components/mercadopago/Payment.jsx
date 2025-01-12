import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import classNames from 'classnames';
import { functions } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';
import LoadingPoints from '../LoadingPoints';

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
  calculateFinalTotal,
  isEnabled,
}) => {
  const [preferenceId, setPreferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const createPreferenceAndPay = async () => {
    setIsLoading(true);
    try {
      const finalTotal = calculateFinalTotal();
      // aca sera q se resta
      const adjustedSubTotal =
        values.deliveryMethod === 'delivery'
          ? discountedTotal
          : discountedTotal - envio;

      console.log('Calling createPreference with data:', {
        updatedValues: {
          ...values,
          subTotal: adjustedSubTotal,
          hora: values.hora || '',
          envioExpress: isEnabled ? 2000 : 0,
          mercadopagoCantidad: finalTotal,
        },
        cart,
        discountedTotal: adjustedSubTotal,
        envio,
        mapUrl,
        couponCodes,
      });

      const createPreference = httpsCallable(functions, 'createPreference');
      const result = await createPreference({
        updatedValues: {
          ...values,
          subTotal: adjustedSubTotal,
          hora: values.hora || '',
          envioExpress: isEnabled ? 2000 : 0,
          mercadopagoCantidad: finalTotal,
        },
        cart,
        discountedTotal: adjustedSubTotal,
        envio,
        mapUrl,
        couponCodes,
      });

      setPreferenceId(result.data.id);
    } catch (error) {
      console.error('Error al crear preferencia:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleOnReady = () => {
    setIsReady(true);
  };

  if (isLoading) {
    return (
      <div className="text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 rounded-3xl h-[80px] font-bold hover:bg-red-600 transition-colors duration-300 w-full">
        <LoadingPoints color="text-gray-100" />
      </div>
    );
  }

  return (
    <div>
      {!preferenceId ? (
        <button
          onClick={createPreferenceAndPay}
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
              preferenceId: preferenceId,
              redirectMode: 'modal',
            }}
            locale="es-AR"
            customization={{
              texts: {
                action: 'pay',
                valueProp: 'security_safety',
              },
              visual: {
                hideValueProp: false,
                buttonBackground: 'default',
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
            onReady={handleOnReady}
            onError={(error) => {
              console.error('Error en el pago:', error);
              setPreferenceId(null); // Resetear para permitir nuevo intento
            }}
            onClose={() => {
              console.log('Modal de pago cerrado');
              setPreferenceId(null); // Resetear para permitir nuevo intento
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Payment;
