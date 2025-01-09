// getPedido.js

import {
	getFirestore,
	collection,
	getDocs,
	doc,
	getDoc,
	onSnapshot,
	updateDoc,
	arrayRemove,
} from "firebase/firestore";

/**
 * Función para obtener la fecha actual formateada como "DD/MM/AAAA"
 * @returns {string} Fecha actual en formato "DD/MM/AAAA"
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
 * Función para obtener un pedido específico por ID y fecha
 * @param {string} orderId - ID del pedido a obtener
 * @param {string} fecha - Fecha del pedido en formato "DD/MM/AAAA"
 * @returns {Promise<Object|null>} Pedido encontrado o null si no existe
 */
export const getOrderById = async (orderId, fecha) => {
	const firestore = getFirestore();
	let day, month, year;

	if (fecha) {
		[day, month, year] = fecha.split("/");
	} else {
		console.error("❌ Fecha no proporcionada para obtener el pedido por ID.");
		return null;
	}

	const ordersDocRef = doc(firestore, "pedidos", year, month, day);

	console.log(
		`🔍 Buscando el pedido ID ${orderId} en la fecha ${day}/${month}/${year}`
	);

	try {
		const docSnapshot = await getDoc(ordersDocRef);
		if (docSnapshot.exists()) {
			const pedidosDelDia = docSnapshot.data()?.pedidos || [];

			// Buscar el pedido por ID
			const pedidoEncontrado = pedidosDelDia.find(
				(pedido) => pedido.id === orderId
			);

			if (pedidoEncontrado) {
				console.log(
					`✅ Pedido encontrado en ${day}/${month}/${year}:`,
					pedidoEncontrado
				);
				return pedidoEncontrado;
			} else {
				console.warn(
					`⚠️ Pedido con ID ${orderId} no encontrado en pedidos del día.`
				);
				return null;
			}
		} else {
			console.warn(
				`⚠️ No existen pedidos para la fecha ${day}/${month}/${year}.`
			);
			return null;
		}
	} catch (error) {
		console.error("❌ Error al obtener el pedido:", error);
		throw error;
	}
};

/**
 * Escucha en tiempo real un pedido específico por ID
 * @param {string} orderId - ID del pedido a escuchar
 * @param {function} callback - Función de devolución de llamada que recibe el pedido
 * @returns {function} Función para desuscribirse del listener
 */
export const ReadOrdersForTodayById = (orderId, callback) => {
	const firestore = getFirestore();
	const todayDateString = obtenerFechaActual();

	// Obtener el año, mes y día actual
	const [day, month, year] = todayDateString.split("/");

	// Referencia al documento del día actual dentro de la colección del mes actual
	const ordersDocRef = doc(firestore, "pedidos", year, month, day);

	console.log(
		`📡 Escuchando cambios en el pedido ID ${orderId} para la fecha ${day}/${month}/${year}`
	);

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
					console.log("📦 Pedido actualizado recibido:", pedidoFiltrado);
					callback(pedidoFiltrado);
				} else {
					console.warn(
						`⚠️ Pedido con ID ${orderId} no encontrado en los pedidos del día.`
					);
					callback(null); // Si no se encuentra el pedido, devolver null
				}
			} else {
				// Si el documento no existe, no hay pedidos para el día actual
				console.warn(
					`⚠️ No existen pedidos para la fecha ${day}/${month}/${year}.`
				);
				callback(null); // Llamar a la función de devolución de llamada con null
			}
		},
		(error) => {
			console.error(
				"❌ Error al obtener los pedidos para el día actual:",
				error
			);
		}
	);
};

/**
 * Escucha en tiempo real los pedidos asociados a un número de teléfono específico
 * @param {string} phoneNumber - Número de teléfono para filtrar los pedidos
 * @param {function} callback - Función de devolución de llamada que recibe un array de pedidos
 * @returns {function} Función para desuscribirse del listener
 */
export const ListenOrdersForTodayByPhoneNumber = (phoneNumber, callback) => {
	const firestore = getFirestore();
	const todayDateString = obtenerFechaActual();

	// Obtener el año, mes y día actual
	const [day, month, year] = todayDateString.split("/");

	// Referencia al documento del día actual dentro de la colección del mes actual
	const ordersDocRef = doc(firestore, "pedidos", year, month, day);

	console.log(
		`📡 Escuchando pedidos para el número de teléfono ${phoneNumber} en la fecha ${day}/${month}/${year}`
	);

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

				console.log(
					`📦 Pedidos filtrados para el número ${phoneNumber}:`,
					pedidosFiltrados
				);

				callback(pedidosFiltrados); // Devuelve un array de pedidos filtrados
			} else {
				// Si el documento no existe, no hay pedidos para el día actual
				console.warn(
					`⚠️ No existen pedidos para la fecha ${day}/${month}/${year}.`
				);
				callback([]); // Devuelve un array vacío
			}
		},
		(error) => {
			console.error(
				"❌ Error al escuchar los pedidos para el día actual:",
				error
			);
			callback([]); // Devuelve un array vacío en caso de error
		}
	);
};

/**
 * Función para marcar un pedido como cancelado
 * @param {string} orderId - ID del pedido a cancelar
 * @returns {Promise<void>}
 */
export const cancelOrder = async (orderId) => {
	const firestore = getFirestore();
	const todayDateString = obtenerFechaActual();
	const [day, month, year] = todayDateString.split("/");
  
	// Referencia al documento del día actual
	const ordersDocRef = doc(firestore, "pedidos", year, month, day);
  
	console.log(`🚫 Iniciando cancelación del pedido ID ${orderId} en la fecha ${day}/${month}/${year}`);
  
	try {
	  // Obtener el documento actual
	  const docSnapshot = await getDoc(ordersDocRef);
	  if (!docSnapshot.exists()) {
		throw new Error("No existen pedidos para el día actual.");
	  }
  
	  const pedidosDelDia = docSnapshot.data()?.pedidos || [];
	  
	  // Encontrar el pedido a cancelar
	  const pedidoIndex = pedidosDelDia.findIndex(pedido => pedido.id === orderId);
	  if (pedidoIndex === -1) {
		throw new Error("Pedido no encontrado en los pedidos del día.");
	  }
  
	  // Crear copia del array de pedidos
	  const pedidosActualizados = [...pedidosDelDia];
	  
	  // Obtener timestamp actual en formato HH:mm
	  const now = new Date();
	  const hours = String(now.getHours()).padStart(2, '0');
	  const minutes = String(now.getMinutes()).padStart(2, '0');
	  const cancelTime = `${hours}:${minutes}`;
  
	  // Actualizar el pedido con la marca de cancelado
	  pedidosActualizados[pedidoIndex] = {
		...pedidosActualizados[pedidoIndex],
		canceled: cancelTime
	  };
  
	  // Actualizar el documento con el array modificado
	  await updateDoc(ordersDocRef, {
		pedidos: pedidosActualizados
	  });
  
	  console.log(`✅ Pedido ID ${orderId} marcado como cancelado a las ${cancelTime}`);
	} catch (error) {
	  console.error("❌ Error al cancelar el pedido:", error);
	  throw error;
	}
  };
