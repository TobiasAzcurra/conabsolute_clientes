// getPedido.js

import { getFirestore, doc, onSnapshot } from "firebase/firestore";

/**
 * Función para obtener la fecha actual formateada como "DD/MM/AAAA"
 */
export const obtenerFechaActual = () => {
	const fechaActual = new Date();
	const dia = String(fechaActual.getDate()).padStart(2, "0");
	const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
	const anio = fechaActual.getFullYear();

	// Formatea la fecha como "DD/MM/AAAA"
	const fechaFormateada = `${dia}/${mes}/${anio}`;

	return fechaFormateada;
};

/**
 * Escucha en tiempo real un pedido específico por ID
 */
export const ReadOrdersForTodayById = (orderId, callback) => {
	const firestore = getFirestore();
	const todayDateString = obtenerFechaActual();

	// Obtener el año, mes y día actual
	const [day, month, year] = todayDateString.split("/");

	// Referencia al documento del día actual dentro de la colección del mes actual
	const ordersDocRef = doc(firestore, "pedidos", year, month, day);

	// Escuchar cambios en el documento del día actual
	return onSnapshot(
		ordersDocRef,
		(docSnapshot) => {
			if (docSnapshot.exists()) {
				// Si el documento existe, obtener el arreglo de pedidos
				const pedidosDelDia = docSnapshot.data()?.pedidos || [];

				// Filtrar los pedidos por el ID
				const pedidoFiltrado = pedidosDelDia.find(
					(pedido) => pedido.id === orderId
				);

				// Llamar a la función de devolución de llamada con el pedido filtrado, si se encuentra
				if (pedidoFiltrado) {
					callback(pedidoFiltrado);
				} else {
					callback(null); // Si no se encuentra el pedido, devolver null
				}
			} else {
				// Si el documento no existe, no hay pedidos para el día actual
				callback(null); // Llamar a la función de devolución de llamada con null
			}
		},
		(error) => {
			console.error("Error al obtener los pedidos para el día actual:", error);
		}
	);
};

/**
 * **Modificación: Nueva función para escuchar pedidos por número de teléfono en tiempo real y devolver un array**
 */
export const ListenOrdersForTodayByPhoneNumber = (phoneNumber, callback) => {
	const firestore = getFirestore();
	const todayDateString = obtenerFechaActual();

	// Obtener el año, mes y día actual
	const [day, month, year] = todayDateString.split("/");

	// Referencia al documento del día actual dentro de la colección del mes actual
	const ordersDocRef = doc(firestore, "pedidos", year, month, day);

	// Escuchar cambios en el documento del día actual
	return onSnapshot(
		ordersDocRef,
		(docSnapshot) => {
			if (docSnapshot.exists()) {
				const pedidosDelDia = docSnapshot.data()?.pedidos || [];

				// Filtrar los pedidos por el número de teléfono
				const pedidosFiltrados = pedidosDelDia.filter(
					(pedido) => pedido.telefono === phoneNumber
				);

				callback(pedidosFiltrados); // Devuelve un array de pedidos filtrados
			} else {
				// Si el documento no existe, no hay pedidos para el día actual
				callback([]); // Devuelve un array vacío
			}
		},
		(error) => {
			console.error("Error al escuchar los pedidos para el día actual:", error);
			callback([]); // Devuelve un array vacío en caso de error
		}
	);
};
