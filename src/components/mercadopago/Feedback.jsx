import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Importa useNavigate
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Hook para redirigir
  const queryParams = new URLSearchParams(location.search);

  const payment_id = queryParams.get('payment_id');
  const orderId = queryParams.get('preference_id');
  const status = queryParams.get('status');

  // useEffect(() => {
  // 	if (status === "success") {
  // 		// Llama a la función de Firebase para verificar el pago
  // 		const verifyPayment = httpsCallable(functions, "verifyPayment");

  // 		verifyPayment({ paymentId: payment_id, orderId })
  // 			.then((result) => {
  // 				if (result.data.status === "success") {
  // 					// Redirige a la página success/:orderId
  // 					navigate(`/success/${orderId}`);
  // 				} else {
  // 				}
  // 			})
  // 			.catch((error) => {
  // 				console.error("Error al verificar el pago:", error);
  // 			});
  // 	}
  // }, [status, payment_id, orderId, navigate]);
  if (!payment_id) {
    return <h1>Error: No se encontró el ID del pago.</h1>; // Mensaje de error si no se encuentra el ID
  }

  return <div>{/* Aquí pasamos el ID de pago correctamente */}</div>;
};

export default Feedback;
