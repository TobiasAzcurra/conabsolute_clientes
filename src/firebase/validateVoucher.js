import {
	getFirestore,
	doc,
	runTransaction,
	collection,
	getDocs,
} from "firebase/firestore";

export const validarVoucher = async (codigo) => {
	const firestore = getFirestore();
	const vouchersCollectionRef = collection(firestore, "vouchers");
  
	try {
	  const querySnapshot = await getDocs(vouchersCollectionRef);
  
	  for (const docSnapshot of querySnapshot.docs) {
		const data = docSnapshot.data();
		const codigos = data.codigos || [];
  
		const codigoIndex = codigos.findIndex((c) => c.codigo === codigo);
  
		if (codigoIndex !== -1) {
		  const voucher = codigos[codigoIndex];
		  if (voucher.estado === "usado") {
			return { isValid: false, message: "El cupón ya ha sido usado", gratis: false };
		  }
		  return { 
			isValid: true, 
			message: "¡Código válido!", 
			gratis: voucher.gratis || false // Devolvemos el valor de gratis, con false como predeterminado
		  };
		}
	  }
  
	  return { isValid: false, message: "Cupón no encontrado", gratis: false };
	} catch (error) {
	  console.error("Error al validar el voucher:", error);
	  throw error;
	}
  };
export const canjearVouchers = async (codigos) => {
	const firestore = getFirestore();
	const vouchersCollectionRef = collection(firestore, "vouchers");

	try {
		return await runTransaction(firestore, async (transaction) => {
			// Primero obtenemos todos los documentos una sola vez
			const querySnapshot = await getDocs(vouchersCollectionRef);
			const documents = {};
			querySnapshot.docs.forEach((doc) => {
				documents[doc.id] = {
					ref: doc.ref,
					data: doc.data(),
				};
			});

			// Mapeamos cada código a su documento y posición
			const updates = new Map();

			// Verificamos todos los códigos primero
			for (const codigo of codigos) {
				let found = false;

				for (const [docId, doc] of Object.entries(documents)) {
					const codigoIndex = doc.data.codigos?.findIndex(
						(c) => c.codigo === codigo
					);

					if (codigoIndex !== -1) {
						if (doc.data.codigos[codigoIndex].estado === "usado") {
							console.error(`El código ${codigo} ya está usado`);
							return false;
						}

						// Si el documento ya tiene actualizaciones pendientes, las incluimos
						const currentUpdates = updates.get(docId) || {
							ref: doc.ref,
							codigos: [...doc.data.codigos],
						};

						currentUpdates.codigos[codigoIndex].estado = "usado";
						updates.set(docId, currentUpdates);
						found = true;
						break;
					}
				}

				if (!found) {
					console.error(`No se encontró el código ${codigo}`);
					return false;
				}
			}

			// Si llegamos aquí, todos los códigos son válidos
			// Aplicamos todas las actualizaciones en la misma transacción
			for (const update of updates.values()) {
				transaction.update(update.ref, { codigos: update.codigos });
			}

			return true;
		});
	} catch (error) {
		console.error("Error al canjear vouchers:", error);
		throw error;
	}
};

// Función para validar un cupón sin marcarlo como usado
export const canjearVoucher = async (codigo) => {
	const firestore = getFirestore();
	const vouchersCollectionRef = collection(firestore, "vouchers");

	try {
		const success = await runTransaction(firestore, async (transaction) => {
			const querySnapshot = await getDocs(vouchersCollectionRef);
			let voucherEncontrado = false;

			for (const docSnapshot of querySnapshot.docs) {
				const data = docSnapshot.data();
				const codigos = data.codigos || [];

				const codigoIndex = codigos.findIndex((c) => c.codigo === codigo);

				if (codigoIndex !== -1) {
					if (codigos[codigoIndex].estado === "usado") {
						console.error("El voucher ya ha sido canjeado");
						return false;
					}

					voucherEncontrado = true;
					break;
				}
			}

			if (!voucherEncontrado) {
				console.error("No se encontró el voucher con el código proporcionado");
				return false;
			}

			return true;
		});

		return success;
	} catch (error) {
		console.error("Error al validar el voucher:", error);
		throw error;
	}
};

// Función para canjear múltiples cupones en una sola transacción
export const canjearMultiplesVouchers = async (codigos) => {
	const firestore = getFirestore();
	const vouchersCollectionRef = collection(firestore, "vouchers");

	try {
		const success = await runTransaction(firestore, async (transaction) => {
			const querySnapshot = await getDocs(vouchersCollectionRef);
			const actualizaciones = [];

			// Primero validamos todos los códigos
			for (const codigo of codigos) {
				let encontrado = false;

				for (const docSnapshot of querySnapshot.docs) {
					const data = docSnapshot.data();
					const codigosArray = data.codigos || [];
					const codigoIndex = codigosArray.findIndex(
						(c) => c.codigo === codigo
					);

					if (codigoIndex !== -1) {
						if (codigosArray[codigoIndex].estado === "usado") {
							console.error(`El voucher ${codigo} ya ha sido canjeado`);
							return false;
						}

						actualizaciones.push({
							docRef: doc(firestore, "vouchers", docSnapshot.id),
							codigoIndex,
							codigosArray,
							docData: data,
						});
						encontrado = true;
						break;
					}
				}

				if (!encontrado) {
					console.error(`No se encontró el voucher con el código ${codigo}`);
					return false;
				}
			}

			// Si todos los códigos son válidos, procedemos a actualizar
			for (const actualizacion of actualizaciones) {
				const nuevosCodigos = [...actualizacion.codigosArray];
				nuevosCodigos[actualizacion.codigoIndex].estado = "usado";
				transaction.update(actualizacion.docRef, { codigos: nuevosCodigos });
			}

			return true;
		});

		return success;
	} catch (error) {
		console.error("Error al canjear múltiples vouchers:", error);
		throw error;
	}
};

export const canjearVoucherPedir = async (codigo) => {
	const firestore = getFirestore();
	const vouchersCollectionRef = collection(firestore, "vouchers");

	try {
		const success = await runTransaction(firestore, async (transaction) => {
			const querySnapshot = await getDocs(vouchersCollectionRef);
			let voucherEncontrado = false;

			for (const docSnapshot of querySnapshot.docs) {
				const data = docSnapshot.data();
				const codigos = data.codigos || [];

				// Encuentra el código en el arreglo de códigos
				const codigoIndex = codigos.findIndex((c) => c.codigo === codigo);

				if (codigoIndex !== -1) {
					// Si el código ya está marcado como "usado"
					if (codigos[codigoIndex].estado === "usado") {
						console.error("El voucher ya ha sido canjeado");
						return false;
					}

					// Marca el código como "usado"
					codigos[codigoIndex].estado = "usado";

					// Actualiza el documento con el nuevo estado del código
					const voucherDocRef = doc(firestore, "vouchers", docSnapshot.id);
					transaction.update(voucherDocRef, { codigos });

					voucherEncontrado = true;
					break;
				}
			}

			if (!voucherEncontrado) {
				console.error("No se encontró el voucher con el código proporcionado");
				return false;
			}

			return true; // Si se actualizó correctamente
		});

		return success;
	} catch (error) {
		console.error("Error al canjear el voucher:", error);
		throw error;
	}
};
