// handleSubmit.js - Sistema fallback con descuentos desde Firebase
import { extractCoordinates } from "../../helpers/currencyFormat";
import { cleanPhoneNumber } from "../../firebase/utils/phoneUtils";
import {
  addTelefonoCliente,
  UploadOrder,
} from "../../firebase/orders/uploadOrder";
import { obtenerFechaActual } from "../../firebase/utils/dateHelpers";
import { db } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";

// Registrar uso del código de descuento
const registerDiscountUsage = async (
  discountId,
  orderId,
  empresaId,
  sucursalId
) => {
  try {
    const discountRef = doc(
      db,
      "absoluteClientes",
      empresaId,
      "sucursales",
      sucursalId,
      "discountCodes",
      discountId
    );

    await updateDoc(discountRef, {
      [`usage.usageTracking.${orderId}`]: new Date().toISOString(),
    });

    console.log(`✅ Uso de descuento registrado para orden ${orderId}`);
  } catch (error) {
    console.error("Error registrando uso de descuento:", error);
    // No lanzar error, el pedido ya se creó
  }
};

const handleSubmit = async (values, cart, config, message = "", clientData) => {
  const { empresaId, sucursalId, mapUrl, isPending, priceFactor } = config;

  const coordinates = extractCoordinates(mapUrl);
  const direccion =
    values.deliveryMethod === "delivery"
      ? values.address
      : clientData?.address || "Sin dirección";

  const phone = String(values.phone) || "";
  const envio = values.deliveryMethod === "takeaway" ? 0 : config.envio || 0;

  // Calcular subtotal
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Usar descuento validado desde appliedDiscount
  let descuento = 0;
  let couponCodes = [];
  let discountMetadata = null;

  if (values.appliedDiscount && values.appliedDiscount.isValid) {
    descuento = values.appliedDiscount.discount;
    couponCodes.push(values.appliedDiscount.discountData.code);
    discountMetadata = {
      discountId: values.appliedDiscount.discountId,
      code: values.appliedDiscount.discountData.code,
      type: values.appliedDiscount.discountData.type,
      value: values.appliedDiscount.discountData.value,
      appliedDiscount: descuento,
    };

    console.log(
      `✅ Descuento aplicado (fallback): ${discountMetadata.code} = $${descuento}`
    );
  }

  const orderDetail = {
    aclaraciones: values.aclaraciones || "",
    cadete: "NO ASIGNADO",
    couponCodes,
    createdAt: new Date().toISOString(),
    deliveryMethod: values.deliveryMethod,
    detallePedido: cart.map((item) => ({
      name: item.name,
      variants: item.variants || [],
      basePrice: item.basePrice ?? item.price,
      finalPrice: item.finalPrice ?? item.price,
      quantity: item.quantity,
      stockUsedFrom: item.stockUsedFrom || [],
    })),
    direccion,
    elaborado: false,
    enCamino: false,
    envio: envio || 0,
    envioExpress: values.envioExpress || 0,
    map: coordinates || [],
    message,
    metodoPago: values.paymentMethod,
    paid: false,
    pendingOfBeingAccepted: isPending,
    referencias: values.references,
    telefono: cleanPhoneNumber(phone),
    total:
      subtotal -
      descuento +
      (values.deliveryMethod === "delivery" ? envio : 0) +
      (values.envioExpress || 0),

    // Metadata del descuento para trazabilidad
    discountMetadata: discountMetadata || null,
  };

  console.log("📦 Order detail (fallback) to upload:", orderDetail);

  try {
    const orderId = await UploadOrder(empresaId, sucursalId, orderDetail);

    // Registrar teléfono
    await addTelefonoCliente(
      empresaId,
      sucursalId,
      phone,
      obtenerFechaActual()
    );
    localStorage.setItem("customerPhone", cleanPhoneNumber(phone));

    // Registrar uso del código de descuento
    if (discountMetadata?.discountId) {
      await registerDiscountUsage(
        discountMetadata.discountId,
        orderId,
        empresaId,
        sucursalId
      );
    }

    console.log("✅ Order uploaded successfully (fallback). orderId:", orderId);

    return orderId;
  } catch (error) {
    console.error("❌ Error al subir la orden (fallback):", error);
    return null;
  }
};

export default handleSubmit;
