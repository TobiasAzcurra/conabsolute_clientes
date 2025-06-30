import {
  addTelefonoCliente,
  UploadOrder,
} from '../../firebase/orders/uploadOrder';
import {
  extractCoordinates,
  obtenerHoraActual,
} from '../../helpers/currencyFormat';
import { obtenerFechaActual } from '../../firebase/utils/dateHelpers';
import { cleanPhoneNumber } from '../../firebase/utils/phoneUtils';

const handleSubmit = async (
  values,
  cart,
  discountedTotal,
  envio,
  mapUrl,
  couponCodes,
  descuento,
  isPending,
  message = '',
  priceFactor = 1,
  empresaId,
  sucursalId
) => {
  const coordinates = extractCoordinates(mapUrl);
  const direccion =
    values.deliveryMethod === 'delivery'
      ? values.address
      : 'Retiro en sucursal';

  const phone = String(values.phone) || '';

  const orderDetail = {
    pendingOfBeingAccepted: isPending,
    envio: envio || 0,
    envioExpress: values.envioExpress || 0,
    message: message,
    ...(priceFactor > 1 && { priceFactor }), // Solo incluir si es mayor a 1
    detallePedido: cart.map((item) => {
      const quantity = item.quantity !== undefined ? item.quantity : 0;
      return {
        name: item.name,
        quantity,
        price: item.price,
        subTotal: item.price * item.quantity,
      };
    }),
    subTotal: cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ),
    total:
      cart.reduce((total, item) => total + item.price * item.quantity, 0) -
      descuento +
      (values.deliveryMethod === 'delivery' ? envio : 0) +
      (values.envioExpress || 0),
    fecha: obtenerFechaActual(),
    aclaraciones: values.aclaraciones || '',
    metodoPago: values.paymentMethod,
    direccion: direccion,
    telefono: cleanPhoneNumber(phone),
    hora: values.hora || obtenerHoraActual(),
    cerca: false,
    cadete: 'NO ASIGNADO',
    referencias: values.references,
    map: coordinates || [0, 0],
    elaborado: false,
    couponCodes,
    ubicacion: mapUrl,
    paid: true,
    deliveryMethod: values.deliveryMethod,
  };

  console.log('orderDetail to upload:', orderDetail);

  try {
    const orderId = await UploadOrder(orderDetail, empresaId, sucursalId);
    await addTelefonoCliente(
      phone,
      obtenerFechaActual(),
      empresaId,
      sucursalId
    );
    localStorage.setItem('customerPhone', cleanPhoneNumber(phone));

    console.log('Order uploaded successfully. orderId:', orderId);

    return orderId;
  } catch (error) {
    console.error('Error al subir la orden: ', error);
    return null;
  }
};

export default handleSubmit;
