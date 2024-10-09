import { initMercadoPago, StatusScreen } from "@mercadopago/sdk-react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY);

const Feedback = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const payment_id = queryParams.get("payment_id");
  const orderId = queryParams.get("preference_id");
  const status = queryParams.get("status");

  useEffect(() => {
    if (status === "success") {
      // Llama al endpoint para verificar el pago
      fetch(`http://localhost:8080/verify_payment/${payment_id}/${orderId}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("Estado del pago:", data.status);
          // Aquí podrías manejar la lógica para mostrar al usuario que el pago fue exitoso
        })
        .catch((error) => {
          console.error("Error al verificar el pago:", error);
        });
    }
  }, [status, payment_id]);

  if (!payment_id) {
    return <h1>Error: No se encontró el ID del pago.</h1>; // Mensaje de error si no se encuentra el ID
  }

  return (
    <div>
      {/* Aquí pasamos el ID de pago correctamente */}
      <p>
        Tu ID de pago es: <strong>{payment_id}</strong>
      </p>
      <StatusScreen
        initialization={{
          paymentId: payment_id, // Debe ser un objeto con la propiedad paymentId
        }}
        customization={{
          visual: {
            hideStatusDetails: false, // Muestra detalles del estado si lo deseas
            hideTransactionDate: true, // Oculte la fecha de la transacción
            style: {
              theme: "default", // Puedes elegir el tema que desees
            },
          },
          backUrls: {
            error: "http://localhost:3000/error",
            return: "http://localhost:5173",
          },
        }}
        callbacks={{
          onReady: () => {
            console.log("StatusScreen Brick listo");
          },
          onError: (error) => {
            console.error("Error en el StatusScreen Brick:", error);
          },
        }}
      />
    </div>
  );
};

export default Feedback;
