
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "../config";

const db = getFirestore(app);

export const getBranches = async (slugEmpresa) => {
  try {
    // 1. Obtener ID de la empresa a partir del slug
    const empresasRef = collection(db, "absoluteClientes");
    const empresaQuery = query(
      empresasRef,
      where("slugEmpresa", "==", slugEmpresa)
    );
    const empresaSnapshot = await getDocs(empresaQuery);

    if (empresaSnapshot.empty) {
      console.warn(`Empresa con slug '${slugEmpresa}' no encontrada.`);
      return null;
    }

    const empresaDoc = empresaSnapshot.docs[0];
    const empresaId = empresaDoc.id;
    const empresaData = empresaDoc.data(); // Datos básicos de la empresa si los hay

    // 2. Obtener sucursales de la empresa
    const sucursalesRef = collection(
      db,
      "absoluteClientes",
      empresaId,
      "sucursales"
    );
    // Podríamos filtrar por 'active' si existe ese campo, por ahora traemos todas
    const sucursalesSnapshot = await getDocs(sucursalesRef);

    if (sucursalesSnapshot.empty) {
      console.warn(`La empresa '${slugEmpresa}' no tiene sucursales.`);
      return { empresaId, branches: [] };
    }

    const branches = [];

    // Recorremos las sucursales para armar el array. 
    // También podríamos intentar leer la config de cada una aquí si estuviera en el documento principal,
    // pero si está en subcolecciones 'config', tendríamos que hacer más llamadas.
    // Asumiremos que datos básicos están en el doc de la sucursal, 
    // y si necesitamos branding completo, quizás tengamos que hacer un fetch extra o confiar en que 
    // 'MenuIntro' o 'BranchSelector' se encarguen de cargar config completa para la elegida.
    
    // Sin embargo, para encontrar una con branding, necesitamos saber si TIENE branding.
    // Vamos a intentar leer la subcolección config si es necesario, 
    // PERO es costoso leer N configs. 
    // Estrategia optimizada: 
    // Devolver las sucursales y dejar que el componente decida.
    // O si los datos de branding básicos están en el documento de la sucursal (a veces se guardan copias), usarlos.
    
    // Revisando useColors/useTypography, leen de:
    // absoluteClientes/{empresaId}/sucursales/{sucursalId}/config/colors (o typography)
    
    // Como esto es un selector, quizás SOLO necesitemos el ID de una sucursal para que el Context 
    // cargue la config de EESA sucursal y pinte la pantalla.
    
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
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return null;
  }
};
