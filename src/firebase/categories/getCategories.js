import { getFirestore, getDocs, collection } from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

export const getCategoriesByClient = async (empresa, sucursal) => {
  const ref = collection(
    db,
    "absoluteClientes",
    empresa,
    "sucursales",
    sucursal,
    "categorias"
  );
  const snapshot = await getDocs(ref);
  const categories = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((cat) => cat.active && cat.name)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  return categories;
};
