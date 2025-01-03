import {
	getFirestore,
	collection,
	doc,
	runTransaction,
	getDocs,
	query,
	where,
	updateDoc,
	addDoc,
} from "firebase/firestore";
import { obtenerFechaActual } from "../helpers/currencyFormat";
import { v4 as uuidv4 } from "uuid";
import { cleanPhoneNumber } from "../helpers/validate-hours";

export const UploadOrder = async (orderDetail) => {
	const firestore = getFirestore();
	const pedidoId = uuidv4();
	const fechaFormateada = obtenerFechaActual();
	const [dia, mes, anio] = fechaFormateada.split("/");
	const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
	const pedidoDocRef = doc(pedidosCollectionRef, dia);

	try {
		await runTransaction(firestore, async (transaction) => {
			const docSnapshot = await transaction.get(pedidoDocRef);
			const existingData = docSnapshot.exists() ? docSnapshot.data() : {};
			const pedidosDelDia = existingData.pedidos || [];
			pedidosDelDia.push({ ...orderDetail, id: pedidoId, cerca: false });
			transaction.set(pedidoDocRef, {
				...existingData,
				pedidos: pedidosDelDia,
			});
		});
		console.log("✅ Pedido subido exitosamente con ID:", pedidoId);
		return pedidoId;
	} catch (error) {
		console.error("❌ Error al subir el pedido:", error);
		throw error;
	}
};

export const addProductToOrder = async (orderId, product, quantity) => {
	const firestore = getFirestore();
	const fechaActual = obtenerFechaActual();
	const [dia, mes, anio] = fechaActual.split("/");

	console.log("🔍 Iniciando addProductToOrder con:", {
		orderId,
		product,
		quantity,
		fecha: fechaActual,
	});

	const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
	const pedidoDocRef = doc(pedidosCollectionRef, dia);

	try {
		await runTransaction(firestore, async (transaction) => {
			console.log("📝 Iniciando transacción");

			const docSnapshot = await transaction.get(pedidoDocRef);
			if (!docSnapshot.exists()) {
				console.error("❌ Documento no encontrado para la fecha:", fechaActual);
				throw new Error("El pedido no existe para la fecha especificada.");
			}

			const existingData = docSnapshot.data();
			console.log("📄 Datos existentes:", existingData);

			const pedidosDelDia = existingData.pedidos || [];
			const pedidoIndex = pedidosDelDia.findIndex(
				(pedido) => pedido.id === orderId
			);

			console.log("🔎 Buscando pedido con ID:", orderId);
			console.log("📍 Índice encontrado:", pedidoIndex);

			if (pedidoIndex === -1) {
				console.error("❌ Pedido no encontrado con ID:", orderId);
				throw new Error("Pedido no encontrado");
			}

			const pedido = pedidosDelDia[pedidoIndex];
			console.log("🧾 Pedido encontrado:", pedido);

			// Crear nuevo item para el pedido con la prop extra e isConfirmed
			const newOrderItem = {
				burger: product.name,
				priceBurger: product.price,
				quantity: quantity,
				toppings: product.toppings || [],
				subTotal: product.price * quantity,
				costoBurger: product.costoBurger || 0,
				extra: true,
				isConfirmed: false, // Nuevo producto, aún no confirmado
			};

			console.log("🆕 Nuevo item a agregar:", newOrderItem);

			// Agregar el nuevo item al detallePedido
			pedido.detallePedido.push(newOrderItem);

			// Marcar el pedido como editado por el usuario
			pedido.onEditByUser = true;

			// Recalcular totales del pedido
			pedido.subTotal = pedido.detallePedido.reduce(
				(sum, item) => sum + item.subTotal,
				0
			);
			pedido.total = pedido.subTotal + (pedido.envio || 0);

			console.log("💰 Nuevos totales:", {
				subTotal: pedido.subTotal,
				total: pedido.total,
			});

			// Actualizar el pedido en el array
			pedidosDelDia[pedidoIndex] = pedido;

			// Actualizar el documento
			const updateData = {
				...existingData,
				pedidos: pedidosDelDia,
			};

			console.log("📤 Datos a actualizar:", updateData);

			transaction.set(pedidoDocRef, updateData);
			console.log("✅ Transacción completada");
		});

		console.log("✅ Producto agregado al pedido exitosamente");
		return true;
	} catch (error) {
		console.error("❌ Error al agregar producto al pedido:", error);
		throw error;
	}
};

export const updateOrderItemQuantity = async (
	pedidoId,
	fechaPedido,
	itemIndex,
	newQuantity
) => {
	const firestore = getFirestore();
	const [dia, mes, anio] = fechaPedido.split("/");
	const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
	const pedidoDocRef = doc(pedidosCollectionRef, dia);

	try {
		await runTransaction(firestore, async (transaction) => {
			const docSnapshot = await transaction.get(pedidoDocRef);
			if (!docSnapshot.exists()) {
				throw new Error("El pedido no existe para la fecha especificada.");
			}

			const existingData = docSnapshot.data();
			const pedidosDelDia = existingData.pedidos || [];
			const pedidoIndex = pedidosDelDia.findIndex(
				(pedido) => pedido.id === pedidoId
			);

			if (pedidoIndex === -1) {
				throw new Error("Pedido no encontrado");
			}

			const pedido = pedidosDelDia[pedidoIndex];
			if (!pedido.detallePedido[itemIndex]) {
				throw new Error("Item no encontrado en el pedido");
			}

			if (newQuantity === 0) {
				// Eliminamos el item del detallePedido
				pedido.detallePedido.splice(itemIndex, 1);

				// Si no quedan items en el pedido, eliminamos el pedido completo
				if (pedido.detallePedido.length === 0) {
					pedidosDelDia.splice(pedidoIndex, 1);

					// Si no quedan pedidos en el día, eliminamos el documento del día
					if (pedidosDelDia.length === 0) {
						transaction.delete(pedidoDocRef);
						console.log("🗑️ Documento del día eliminado por no tener pedidos");
						return;
					} else {
						transaction.set(pedidoDocRef, {
							...existingData,
							pedidos: pedidosDelDia,
						});
					}
					console.log("🗑️ Pedido eliminado por no tener items:", pedidoId);
					return;
				}

				// Si aún quedan items, recalculamos los totales
				pedido.subTotal = pedido.detallePedido.reduce(
					(sum, item) => sum + item.subTotal,
					0
				);
				pedido.total = pedido.subTotal + (pedido.envio || 0);
			} else {
				// Si no es 0, actualizamos la cantidad y recalculamos subtotal
				const item = pedido.detallePedido[itemIndex];
				const oldSubTotal = item.subTotal;
				const pricePerUnit = item.priceBurger;

				item.quantity = newQuantity;
				item.subTotal = pricePerUnit * newQuantity;
				item.extra = true;

				// Marcar el pedido como editado por el usuario
				pedido.onEditByUser = true;

				// Recalcular totales del pedido
				const subTotalDifference = item.subTotal - oldSubTotal;
				pedido.subTotal = (pedido.subTotal || 0) + subTotalDifference;
				pedido.total = pedido.subTotal + (pedido.envio || 0);
			}

			// Solo actualizamos si no hemos eliminado el documento
			if (pedido.detallePedido.length > 0) {
				pedidosDelDia[pedidoIndex] = pedido;
				transaction.set(pedidoDocRef, {
					...existingData,
					pedidos: pedidosDelDia,
				});
			}
		});

		console.log(
			"✅ Cantidad actualizada exitosamente para el pedido:",
			pedidoId
		);
		return true;
	} catch (error) {
		console.error("❌ Error al actualizar la cantidad:", error);
		throw error;
	}
};

export const ReadMateriales = async () => {
	const firestore = getFirestore();
	const collections = ["materiales"];
	const fetchedData = await Promise.all(
		collections.map(async (collectionName) => {
			const collectionRef = collection(firestore, collectionName);
			const snapshot = await getDocs(collectionRef);

			return snapshot.docs.map((doc) => {
				const data = doc.data();
				const productoMaterial = {
					id: doc.id,
					nombre: data.nombre,
					categoria: data.categoria,
					costo: data.costo,
					unit: data.unit,
					unidadPorPrecio: data.unidadPorPrecio,
					stock: data.stock,
				};
				return productoMaterial;
			});
		})
	);
	return fetchedData.flat();
};

export const ReadData = async () => {
	const firestore = getFirestore();
	const collections = ["burgers", "drinks", "fries", "toppings"];
	const fetchedData = await Promise.all(
		collections.map(async (collectionName) => {
			const collectionRef = collection(firestore, collectionName);
			const snapshot = await getDocs(collectionRef);

			const dataWithIds = snapshot.docs.map((doc) => ({
				id: doc.id,
				data: doc.data(),
				collectionName: collectionName,
			}));

			return dataWithIds;
		})
	);
	return fetchedData.flat();
};

export const updateRatingForOrder = (fechaPedido, pedidoId, rating) => {
	const firestore = getFirestore();

	return new Promise((resolve, reject) => {
		const [dia, mes, anio] = fechaPedido.split("/");
		const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
		const pedidoDocRef = doc(pedidosCollectionRef, dia);

		console.log("🔄 updateRatingForOrder llamado con:", {
			fechaPedido,
			pedidoId,
			rating,
		});

		runTransaction(firestore, async (transaction) => {
			const pedidoDocSnapshot = await transaction.get(pedidoDocRef);
			if (!pedidoDocSnapshot.exists()) {
				console.error("❌ El pedido no existe para la fecha especificada.");
				throw new Error("El pedido no existe para la fecha especificada.");
			}

			const existingData = pedidoDocSnapshot.data();
			const pedidosDelDia = existingData.pedidos || [];

			const pedidosActualizados = pedidosDelDia.map((pedido) => {
				if (pedido.id === pedidoId) {
					return {
						...pedido,
						rating: {
							...rating,
							comentario: rating.comentario || "",
						},
					};
				} else {
					return pedido;
				}
			});

			transaction.set(pedidoDocRef, {
				...existingData,
				pedidos: pedidosActualizados,
			});
			console.log("✅ Pedido actualizado con la calificación:", pedidoId);
		})
			.then(() => {
				console.log(
					"✅ Transacción completada exitosamente para el pedido:",
					pedidoId
				);
				resolve();
			})
			.catch((error) => {
				console.error(
					"❌ Error actualizando el rating para el pedido:",
					pedidoId,
					error
				);
				reject(error);
			});
	});
};

export const getCadetePhone = async (nombreCadete) => {
	const firestore = getFirestore();
	const empleadosRef = collection(firestore, "empleados");
	const q = query(
		empleadosRef,
		where("category", "==", "cadete"),
		where("name", "==", nombreCadete)
	);

	console.log("🔍 Buscando cadete con nombre:", nombreCadete);
	const querySnapshot = await getDocs(q);

	if (!querySnapshot.empty) {
		const empleadoData = querySnapshot.docs[0].data();
		console.log("📱 Teléfono del cadete encontrado:", empleadoData.telefono);
		return empleadoData.telefono;
	} else {
		console.warn("⚠️ Cadete no encontrado");
		return null;
	}
};

export const addTelefonoFirebase = async (phoneNumber, fecha) => {
	const cleanPhone = cleanPhoneNumber(phoneNumber);
	const firestore = getFirestore();
	const collectionRef = collection(firestore, "telefonos");
	const q = query(collectionRef, where("telefono", "==", cleanPhone));
	const querySnapshot = await getDocs(q);

	if (querySnapshot.empty) {
		try {
			const docRef = await addDoc(collectionRef, {
				telefono: cleanPhone,
				fecha: fecha,
				lastOrder: fecha,
			});
			console.log(
				`Se agregó el número de teléfono ${cleanPhone} a Firebase con el ID: ${docRef.id}. Fecha: ${fecha}`
			);
		} catch (e) {
			console.error("Error al agregar el número de teléfono a Firebase:", e);
		}
	} else {
		querySnapshot.forEach(async (documento) => {
			try {
				const docRef = doc(firestore, "telefonos", documento.id);
				await updateDoc(docRef, {
					lastOrder: fecha,
				});
				console.log(
					`El número de teléfono ${cleanPhone} ya existe en la base de datos. Actualizado lastOrder a: ${fecha}`
				);
			} catch (e) {
				console.error("Error al actualizar el campo lastOrder en Firebase:", e);
			}
		});
	}
};

export const handleConfirmChanges = async (orderId) => {
	const firestore = getFirestore();
	const fechaActual = obtenerFechaActual();
	const [dia, mes, anio] = fechaActual.split("/");
	const pedidosCollectionRef = collection(firestore, "pedidos", anio, mes);
	const pedidoDocRef = doc(pedidosCollectionRef, dia);

	try {
		await runTransaction(firestore, async (transaction) => {
			const docSnapshot = await transaction.get(pedidoDocRef);
			if (!docSnapshot.exists()) {
				throw new Error("El pedido no existe para la fecha especificada.");
			}

			const existingData = docSnapshot.data();
			const pedidosDelDia = existingData.pedidos || [];
			const pedidoIndex = pedidosDelDia.findIndex(
				(pedido) => pedido.id === orderId
			);

			if (pedidoIndex === -1) {
				throw new Error("Pedido no encontrado");
			}

			// Marcar todos los productos extra como confirmados
			pedidosDelDia[pedidoIndex].detallePedido = pedidosDelDia[
				pedidoIndex
			].detallePedido.map((item) => {
				if (item.extra && !item.isConfirmed) {
					return {
						...item,
						isConfirmed: true,
					};
				}
				return item;
			});

			// Reset the onEditByUser flag
			pedidosDelDia[pedidoIndex].onEditByUser = false;

			// Update the document
			transaction.set(pedidoDocRef, {
				...existingData,
				pedidos: pedidosDelDia,
			});
		});

		console.log("✅ Cambios confirmados exitosamente");
		return true;
	} catch (error) {
		console.error("❌ Error al confirmar los cambios:", error);
		throw error;
	}
};
