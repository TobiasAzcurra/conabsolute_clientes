import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import classNames from 'classnames';
import { functions } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';
import LoadingPoints from '../LoadingPoints';
import { canjearVouchers } from '../../firebase/validateVoucher';
import {
  isWithinClosedDays,
  isWithinOrderTimeRange,
} from '../../helpers/validate-hours';

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
  submitForm,
  isValid,
  altaDemanda,
}) => {
  const [preferenceId, setPreferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const processVouchersAndCreatePreference = async () => {
    if (!altaDemanda?.open) {
      return; // No proceder si es lunes, martes o miércoles
    }
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

    setError(null);

    try {
      // Primero procesamos los vouchers válidos
      const validCoupons = couponCodes.filter((code) => code.trim() !== '');
      if (validCoupons.length > 0) {
        const canjeSuccess = await canjearVouchers(validCoupons);
        if (!canjeSuccess) {
          throw new Error('Error al procesar los cupones');
        }
      }

      // Calculamos los totales correctamente
      const finalTotal = calculateFinalTotal();
      const productsTotal = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      const toppingsTotal = cart.reduce((acc, item) => {
        return (
          acc +
          item.toppings.reduce(
            (tAcc, topping) => tAcc + topping.price * item.quantity,
            0
          )
        );
      }, 0);

      const baseTotal = productsTotal + toppingsTotal;
      const deliveryFee = values.deliveryMethod === 'delivery' ? 0 : 0;
      const expressDeliveryFee = isEnabled ? 2000 : 0;

      // Crear los valores actualizados incluyendo todos los totales correctamente
      const updatedValues = {
        ...values,
        hora: values.hora || '',
        envioExpress: expressDeliveryFee,
        mercadopagoCantidad: finalTotal,
        subTotal: baseTotal, // El total final después de descuentos
        total: finalTotal, // El total original sin descuentos
        envio: deliveryFee,
      };

      const createPreference = httpsCallable(functions, 'createPreference');
      const result = await createPreference({
        updatedValues,
        cart,
        discountedTotal: finalTotal, // Enviamos el total final correcto
        envio: deliveryFee,
        mapUrl,
        couponCodes,
      });

      setPreferenceId(result.data.id);
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setError(error.message || 'Error al procesar el pago');
      // Podríamos implementar aquí lógica para revertir el canje de vouchers si falla la creación de preferencia
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

  if (error) {
    return (
      <div className="text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-500 text-gray-100 rounded-3xl h-[80px] font-bold w-full">
        {error}
      </div>
    );
  }

  return (
    <div>
      {!preferenceId ? (
        <button
          onClick={processVouchersAndCreatePreference}
          disabled={isLoading}
          type="button"
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
              setPreferenceId(null);
              setError('Error en el pago. Por favor intenta nuevamente.');
            }}
            onClose={() => {
              console.log('Modal de pago cerrado');
              setPreferenceId(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Payment;
