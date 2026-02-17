import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

export const getBranches = async (slugEmpresa) => {
  // 1. Obtener ID de la empresa a partir del slug
  const empresasRef = collection(db, "absoluteClientes");
  const empresaQuery = query(
    empresasRef,
    where("slugEmpresa", "==", slugEmpresa),
  );
  const empresaSnapshot = await getDocs(empresaQuery);

  if (empresaSnapshot.empty) {
    console.warn(`Empresa con slug '${slugEmpresa}' no encontrada.`);
    return null;
  }

  const empresaDoc = empresaSnapshot.docs[0];
  const empresaId = empresaDoc.id;
  const empresaData = empresaDoc.data();

  // 2. Obtener sucursales de la empresa
  const sucursalesRef = collection(
    db,
    "absoluteClientes",
    empresaId,
    "sucursales",
  );
  const sucursalesSnapshot = await getDocs(sucursalesRef);

  if (sucursalesSnapshot.empty) {
    console.warn(`La empresa '${slugEmpresa}' no tiene sucursales.`);
    return { empresaId, branches: [] };
  }

  const branches = [];
  sucursalesSnapshot.forEach((doc) => {
    branches.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return {
    empresaId,
    empresaData,
    branches,
  };
  // ↑ Sin try/catch — dejamos que el error suba al caller (BranchSelector)
  // para que el retry con timeout lo maneje correctamente.
};
