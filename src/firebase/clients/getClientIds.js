import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { app } from '../config/firebaseConfig';

const db = getFirestore(app);

export const getClientIds = async (slugEmpresa, slugSucursal) => {
  try {
    const empresasRef = collection(db, 'absoluteClientes');
    const empresaQuery = query(
      empresasRef,
      where('slugEmpresa', '==', slugEmpresa)
    );
    const empresaSnapshot = await getDocs(empresaQuery);

    if (empresaSnapshot.empty) return null;

    const empresaDoc = empresaSnapshot.docs[0];
    const empresaId = empresaDoc.id;

    const sucursalesRef = collection(
      db,
      'absoluteClientes',
      empresaId,
      'sucursales'
    );
    const sucursalQuery = query(
      sucursalesRef,
      where('slugSucursal', '==', slugSucursal)
    );
    const sucursalSnapshot = await getDocs(sucursalQuery);

    if (sucursalSnapshot.empty) return null;

    const sucursalDoc = sucursalSnapshot.docs[0];
    const sucursalId = sucursalDoc.id;

    return {
      empresaId,
      sucursalId,
    };
  } catch (error) {
    console.error('Error getting client IDs:', error);
    return null;
  }
};
