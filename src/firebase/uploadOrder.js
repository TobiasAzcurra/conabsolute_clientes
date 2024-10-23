// uploadOrder.js
import {
	getFirestore,
	collection,
	doc,
	runTransaction,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import { obtenerFechaActual } from "../helpers/currencyFormat";
import { v4 as uuidv4 } from "uuid";

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

export const ReadMateriales = async () => {
	const firestore = getFirestore();

	const collections = ["materiales"];

	const fetchedData = await Promise.all(
		collections.map(async (collectionName) => {
			const collectionRef = collection(firestore, collectionName);
			const snapshot = await getDocs(collectionRef);

			return snapshot.docs.map((doc) => {
				const data = doc.data(); // Datos del documento de Firestore
				// Convertir los datos a un objeto ProductoMaterial
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

	// Hacer un flatten de fetchedData y devolver los datos como un arreglo de ProductoMaterial[]
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

// rating : {
//   tiempo: number,
//   temperatura: number,
//   presentacion: number,
//   pagina: number,
//   [productoNombre: string]: number, // Calificaciones por producto
//   comentario?: string, // Comentario opcional
// }

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
					// Actualizamos el pedido con el nuevo rating
					return {
						...pedido,
						rating: {
							...rating, // Incluye tanto las calificaciones generales como las de productos
							comentario: rating.comentario || "", // Comentario opcional
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

	// Acceder a la colección 'empleados' en Firestore
	const empleadosRef = collection(firestore, "empleados");

	// Crear una consulta para filtrar por categoría 'cadete' y nombre del cadete
	const q = query(
		empleadosRef,
		where("category", "==", "cadete"),
		where("name", "==", nombreCadete)
	);

	console.log("🔍 Buscando cadete con nombre:", nombreCadete);

	// Obtener los documentos que coinciden con la consulta
	const querySnapshot = await getDocs(q);

	// Si encontramos algún documento, retornamos el número de teléfono
	if (!querySnapshot.empty) {
		const empleadoData = querySnapshot.docs[0].data(); // Asumimos que el nombre es único
		console.log("📱 Teléfono del cadete encontrado:", empleadoData.telefono);
		return empleadoData.telefono; // Retornar el número de teléfono del cadete
	} else {
		console.warn("⚠️ Cadete no encontrado");
		return null; // Retornar null si no se encuentra el cadete
	}
};
