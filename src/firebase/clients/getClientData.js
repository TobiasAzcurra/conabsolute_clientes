import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

export const getClientData = async (empresa, sucursal) => {
  const ref = doc(db, "absoluteClientes", empresa, "sucursales", sucursal);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
};
