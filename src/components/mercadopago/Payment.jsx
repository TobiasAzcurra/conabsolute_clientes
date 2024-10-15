import React, { useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import classNames from "classnames";
import { functions } from "../../firebase/config";
import { httpsCallable } from "firebase/functions";

// Inicializa Mercado Pago con tu clave pública
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PRODUCCION_PUBLIC_KEY);

const Payment = ({
  envio,
  values,
  cart,
  discountedTotal,
  mapUrl,
  couponCodes,
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentPending,
}) => {
  const [preferenceId, setPreferenceId] = useState(null); // Estado para almacenar el preferenceId
  const [isLoading, setIsLoading] = useState(false); // Estado para el loading del botón
  const [isReady, setIsReady] = useState(false); // Estado para saber si el Wallet está listo

  // Crear preferencia al hacer clic en pagar
  // const handlePayClick = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch("http://localhost:8080/create_preference", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         values,
  //         cart,
  //         discountedTotal,
  //         envio,
  //         mapUrl,
  //         couponCodes,
  //       }),
  //     });
  //     const preference = await response.json();
  //     setPreferenceId(preference.id); // Almacena el preferenceId obtenido del backend
  //   } catch (error) {
  //     console.error("Error al crear preferencia:", error);
  //   } finally {
  //     setIsLoading(false); // Finaliza el loading
  //   }
  // };

  // Crear preferencia al hacer clic en pagar
  const handlePayClick = async () => {
    setIsLoading(true);
    try {
      // Llamar a la función de Firebase
      const createPreference = httpsCallable(functions, "createPreference");
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
      console.error("Error al crear preferencia:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Muestra el botón de pago de Mercado Pago cuando el preferenceId está listo
  const handleOnReady = () => {
    setIsReady(true);
  };

  if (isLoading) {
    return <div>Generando tu preferencia de pago...</div>; // Mostrar mientras se crea la preferencia
  }

  return (
    <div>
      {!preferenceId ? (
        <button
          onClick={handlePayClick}
          disabled={isLoading}
          btn
          btn-primary
          btn-lg
          btn-block
        >
          {isLoading ? "Cargando..." : "Pagar con Mercado Pago"}
        </button>
      ) : (
        <div
          className={classNames("payment-form", {
            "payment-form--hidden": !isReady,
          })}
        >
          <Wallet
            initialization={{
              preferenceId: preferenceId, // Pasa el preferenceId al Wallet
              redirectMode: "self",
            }}
            locale="es-AR"
            customization={{
              texts: {
                action: "pay",
                valueProp: "security_safety",
              },
              visual: {
                hideValueProp: false,
                buttonBackground: "default", // Personaliza el botón
                valuePropColor: "grey",
                buttonHeight: "48px",
                borderRadius: "6px",
                verticalPadding: "16px",
                horizontalPadding: "0px",
              },
              checkout: {
                theme: {
                  elementsColor: "#4287F5",
                  headerColor: "#4287F5",
                },
              },
            }}
            onReady={handleOnReady} // Indica cuándo el Wallet está listo
            callbacks={{
              onPaymentApproved: (payment) => {
                console.log("Pago aprobado:", payment);
                onPaymentSuccess(payment); // Llamamos a la prop para manejar el éxito del pago
              },
              onPaymentInProcess: (payment) => {
                console.log("Pago en proceso:", payment);
                onPaymentPending(payment); // Llamamos a la prop para manejar los pagos pendientes
              },
              onPaymentRejected: (payment) => {
                console.log("Pago rechazado:", payment);
                onPaymentFailure(payment); // Llamamos a la prop para manejar el error del pago
              },
              onError: (error) => {
                console.error("Error en el pago:", error);
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Payment;
