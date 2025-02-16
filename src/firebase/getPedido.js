import {
	getFirestore,
	collection,
	getDocs,
	doc,
	getDoc,
	onSnapshot,
	runTransaction,
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
					(pedido) => pedido.telefono === phoneNumber && !pedido.canceled
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
		await runTransaction(firestore, async (transaction) => {
			// 1. Obtener el documento actual de pedidos
			const docSnapshot = await transaction.get(ordersDocRef);
			if (!docSnapshot.exists()) {
				throw new Error("No existen pedidos para el día actual.");
			}

			const pedidosDelDia = docSnapshot.data()?.pedidos || [];
			const pedidoIndex = pedidosDelDia.findIndex(pedido => pedido.id === orderId);

			if (pedidoIndex === -1) {
				throw new Error("Pedido no encontrado en los pedidos del día.");
			}

			const pedido = pedidosDelDia[pedidoIndex];
			const couponCodes = pedido.couponCodes || [];

			// 2. Procesar los cupones si existen
			if (couponCodes.length > 0) {
				console.log("📝 Procesando cupones del pedido:", couponCodes);

				// Obtener todos los documentos de vouchers una sola vez
				const vouchersSnapshot = await getDocs(collection(firestore, "vouchers"));
				const vouchersMap = new Map();

				// Crear un mapa de documentos y sus actualizaciones
				for (const voucherDoc of vouchersSnapshot.docs) {
					const voucherData = voucherDoc.data();
					const codigosActualizados = [...voucherData.codigos];
					let requiresUpdate = false;

					// Procesar todos los cupones para este documento
					for (const codigo of couponCodes) {
						const codigoIndex = codigosActualizados.findIndex(c => c.codigo === codigo);
						if (codigoIndex !== -1) {
							console.log(`🔄 Actualizando estado del cupón ${codigo} a disponible`);
							codigosActualizados[codigoIndex] = {
								...codigosActualizados[codigoIndex],
								estado: "disponible"
							};
							requiresUpdate = true;
						}
					}

					// Solo agregar al mapa si hay cambios
					if (requiresUpdate) {
						vouchersMap.set(voucherDoc.ref, codigosActualizados);
					}
				}

				// Realizar todas las actualizaciones de vouchers en la misma transacción
				for (const [voucherRef, updatedCodigos] of vouchersMap.entries()) {
					transaction.update(voucherRef, { codigos: updatedCodigos });
					console.log(`✅ Actualizando documento de vouchers con ${updatedCodigos.length} códigos`);
				}
			}

			// 3. Actualizar el estado del pedido
			const now = new Date();
			const cancelTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

			const pedidosActualizados = [...pedidosDelDia];
			pedidosActualizados[pedidoIndex] = {
				...pedidosActualizados[pedidoIndex],
				canceled: cancelTime
			};

			// 4. Actualizar el documento de pedidos en la misma transacción
			transaction.update(ordersDocRef, {
				pedidos: pedidosActualizados
			});

			console.log(`✅ Pedido ID ${orderId} marcado como cancelado a las ${cancelTime}`);
			if (couponCodes.length > 0) {
				console.log(`✅ ${couponCodes.length} cupones restaurados a estado disponible:`, couponCodes);
			}
		});

		return true;
	} catch (error) {
		console.error("❌ Error al cancelar el pedido:", error);
		throw error;
	}
};

/**
 * Busca todos los pedidos asociados a un número de teléfono en la base de datos
 * @param {string} phoneNumber - Número de teléfono para buscar
 * @returns {Promise<Array>} Array de pedidos encontrados
 */


const generateDatePaths = (months = 3) => {
	const paths = [];
	const today = new Date();

	// Go back 3 months and iterate through each day
	for (let i = 0; i < months * 30; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() - i);

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		paths.push({
			path: `pedidos/${year}/${month}/${day}`,
			formattedDate: `${day}/${month}/${year}`
		});
	}

	return paths;
};

export const searchOrdersByPhone = async (phoneNumber) => {
	const firestore = getFirestore();
	const orders = [];

	console.log('🔍 Iniciando búsqueda para el teléfono:', phoneNumber);

	try {
		// Generate paths for the last 3 months
		const datePaths = generateDatePaths(3);
		console.log(`📅 Buscando en ${datePaths.length} días`);

		// Query each date path
		for (const { path, formattedDate } of datePaths) {
			const pedidosRef = doc(firestore, path);
			console.log(`📄 Consultando: ${path}`);

			const pedidosDoc = await getDoc(pedidosRef);

			if (pedidosDoc.exists()) {
				const dayData = pedidosDoc.data();

				if (dayData.pedidos && Array.isArray(dayData.pedidos)) {
					const matchingOrders = dayData.pedidos.filter(
						pedido => pedido.telefono === phoneNumber
					);

					// Add matched orders with their dates
					matchingOrders.forEach(order => {
						orders.push({
							...order,
							fecha: formattedDate
						});
					});

					if (matchingOrders.length > 0) {
						console.log(`✅ Encontrados ${matchingOrders.length} pedidos en ${formattedDate}`);
					}
				}
			}
		}

		console.log('\n📊 Resumen de búsqueda:');
		console.log(`🔍 Total de pedidos encontrados: ${orders.length}`);

		// Sort orders by date (most recent first)
		const sortedOrders = orders.sort((a, b) => {
			const [diaA, mesA, anioA] = a.fecha.split('/');
			const [diaB, mesB, anioB] = b.fecha.split('/');
			const fechaA = new Date(anioA, mesA - 1, diaA);
			const fechaB = new Date(anioB, mesB - 1, diaB);
			return fechaB - fechaA;
		});

		// Log found orders
		console.log('✅ Pedidos encontrados:');
		sortedOrders.forEach(order => {
			console.log(`📝 Pedido ${order.id} - Fecha: ${order.fecha} - Total: $${order.total}`);
		});

		return sortedOrders;

	} catch (error) {
		console.error("❌ Error buscando pedidos:", error);
		throw error;
	}
};