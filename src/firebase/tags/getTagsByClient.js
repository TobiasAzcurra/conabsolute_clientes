import { getFirestore, getDocs, collection } from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

export const getProductTagsByClient = async (empresa, sucursal) => {
  const ref = collection(
    db,
    "absoluteClientes",
    empresa,
    "sucursales",
    sucursal,
    "productTags"
  );
  const snapshot = await getDocs(ref);
  const tags = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((tag) => tag.active)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  return tags;
};
