import { extractCoordinates } from "../../helpers/currencyFormat";
import { cleanPhoneNumber } from "../../firebase/utils/phoneUtils";
import {
  addTelefonoCliente,
  UploadOrder,
} from "../../firebase/orders/uploadOrder";
import { obtenerFechaActual } from "../../firebase/utils/dateHelpers";

const VALID_COUPONS = [
  "APMCONKINGCAKES",
  "APMCONANHELO",
  "APMCONPROVIMARK",
  "APMCONLATABLITA",
];

const handleSubmit = async (values, cart, config, message = "", clientData) => {
  const { empresaId, sucursalId, mapUrl, isPending, priceFactor } = config;

  const coordinates = extractCoordinates(mapUrl);
  const direccion =
    values.deliveryMethod === "delivery"
      ? values.address
      : clientData?.address || "Sin dirección";

  const phone = String(values.phone) || "";
  const envio = values.deliveryMethod === "takeaway" ? 0 : config.envio || 0;

  const hasYerbas = cart.some(
    (item) => item.category?.toLowerCase() === "yerba"
  );

  let descuento = 0;
  let couponCodes = [];

  if (VALID_COUPONS.includes(values.couponCode)) {
    if (!hasYerbas) {
      // Aplicar 30% de descuento al subtotal del carrito
      const subtotal = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      descuento = subtotal * 0.3;
      couponCodes.push(values.couponCode);
      console.log(
        `✅ Cupón ${values.couponCode} aplicado con 30% de descuento`
      );
    } else {
      console.log(
        `❌ Cupón ${values.couponCode} no válido porque hay productos de yerbas`
      );
    }
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
      cart.reduce((total, item) => total + item.price * item.quantity, 0) -
      descuento +
      (values.deliveryMethod === "delivery" ? envio : 0) +
      (values.envioExpress || 0),
  };

  console.log("orderDetail to upload:", orderDetail);

  try {
    const orderId = await UploadOrder(empresaId, sucursalId, orderDetail);
    await addTelefonoCliente(
      empresaId,
      sucursalId,
      phone,
      obtenerFechaActual()
    );
    localStorage.setItem("customerPhone", cleanPhoneNumber(phone));

    console.log("Order uploaded successfully. orderId:", orderId);
    // console.log('Order uploaded successfully. orderDetail:', orderDetail);

    return orderId;
    // return orderDetail; // Return the order detail instead of orderId
  } catch (error) {
    console.error("Error al subir la orden: ", error);
    return null;
  }
};

export default handleSubmit;
