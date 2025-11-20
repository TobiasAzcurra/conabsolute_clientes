// firebase/clients/getAIBotConfig.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config";

/**
 * Obtiene la configuración del bot AI para una sucursal
 * @param {string} empresaId - ID de la empresa
 * @param {string} sucursalId - ID de la sucursal
 * @returns {Promise<Object|null>} Configuración del bot o null si no existe
 */
export const getAIBotConfig = async (empresaId, sucursalId) => {
  try {
    console.log(`📥 Obteniendo config AI Bot: ${empresaId}/${sucursalId}`);

    const configRef = doc(
      db,
      "absoluteClientes",
      empresaId,
      "sucursales",
      sucursalId,
      "config",
      "aiBot"
    );

    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      const data = configDoc.data();
      console.log(`✅ Config AI Bot obtenida:`, {
        enabled: data.enabled,
        hasInstructions: !!data.customInstructions,
        includeProducts: data.includeProducts,
      });
      return data;
    }

    console.warn(`⚠️ No existe config AI Bot para esta sucursal`);
    return null;
  } catch (error) {
    console.error(`❌ Error obteniendo config AI Bot:`, error);
    return null;
  }
};
