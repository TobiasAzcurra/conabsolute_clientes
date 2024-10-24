import {
  getFirestore,
  doc,
  runTransaction,
  collection,
  getDocs,
} from 'firebase/firestore';

export const canjearVoucher = async (codigo) => {
  const firestore = getFirestore();
  const vouchersCollectionRef = collection(firestore, 'vouchers');

  try {
    const success = await runTransaction(firestore, async (transaction) => {
      const querySnapshot = await getDocs(vouchersCollectionRef);
      let voucherEncontrado = false;

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const codigos = data.codigos || [];

        // Encuentra el código en el arreglo de codigos
        const codigoIndex = codigos.findIndex((c) => c.codigo === codigo);

        if (codigoIndex !== -1) {
          // Si el código ya está marcado como "usado"
          if (codigos[codigoIndex].estado === 'usado') {
            console.error('El voucher ya ha sido canjeado');
            return false;
          }

          voucherEncontrado = true;
          break;
        }
      }

      if (!voucherEncontrado) {
        console.error('No se encontró el voucher con el código proporcionado');
        return false;
      }

      return true;
    });

    return success;
  } catch (error) {
    console.error('Error al canjear el voucher:', error);
    throw error;
  }
};

export const canjearVoucherPedir = async (codigo) => {
  const firestore = getFirestore();
  const vouchersCollectionRef = collection(firestore, 'vouchers');

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
          if (codigos[codigoIndex].estado === 'usado') {
            console.error('El voucher ya ha sido canjeado');
            return false;
          }

          // Marca el código como "usado"
          codigos[codigoIndex].estado = 'usado';

          // Actualiza el documento con el nuevo estado del código
          const voucherDocRef = doc(firestore, 'vouchers', docSnapshot.id);
          transaction.update(voucherDocRef, { codigos });

          voucherEncontrado = true;
          break;
        }
      }

      if (!voucherEncontrado) {
        console.error('No se encontró el voucher con el código proporcionado');
        return false;
      }

      return true; // Si se actualizó correctamente
    });

    return success;
  } catch (error) {
    console.error('Error al canjear el voucher:', error);
    throw error;
  }
};
