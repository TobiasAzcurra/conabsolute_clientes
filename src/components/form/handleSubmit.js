import {
  ReadData,
  ReadMateriales,
  UploadOrder,
} from '../../firebase/uploadOrder';
import { canjearVoucherPedir } from '../../firebase/validateVoucher';
import {
  calcularCostoHamburguesa,
  extractCoordinates,
  obtenerFechaActual,
  obtenerHoraActual,
} from '../../helpers/currencyFormat';
import { cleanPhoneNumber } from '../../helpers/validate-hours';

const handleSubmit = async (
  values,
  cart,
  discountedTotal,
  envio,
  mapUrl,
  couponCodes
) => {
  const coordinates = extractCoordinates(mapUrl);
  const materialesData = await ReadMateriales();
  const productsData = await ReadData();

  const formattedData = productsData.map(({ data }) => ({
    description: data.description || '',
    img: data.img,
    name: data.name,
    price: data.price,
    type: data.type,
    ingredients: data.ingredients,
    costo: calcularCostoHamburguesa(materialesData, data.ingredients),
  }));

  const phone = String(values.phone) || '';

  const validacionCupones = await Promise.all(
    couponCodes.map(async (cupon) => {
      return await canjearVoucherPedir(cupon); // canjearVoucher devuelve true o false
    })
  );

  console.log(validacionCupones);

  const orderDetail = {
    envio,
    detallePedido: cart.map((item) => {
      const quantity = item.quantity !== undefined ? item.quantity : 0;

      const productoSeleccionado = formattedData.find(
        (producto) => producto.name === item.name
      );

      const toppingsSeleccionados = item.toppings || [];
      let costoToppings = 0;

      toppingsSeleccionados.forEach((topping) => {
        const materialTopping = materialesData.find(
          (material) =>
            material.nombre.toLowerCase() === topping.name.toLowerCase()
        );

        if (materialTopping) {
          costoToppings += materialTopping.costo;
        }
      });

      const costoBurger = productoSeleccionado
        ? (productoSeleccionado.costo + costoToppings) * quantity
        : 0;

      return {
        burger: item.name, // Nombre de la hamburguesa
        toppings: item.toppings.map((topping) => topping.name), // Nombres de los toppings
        quantity: item.quantity, // Cantidad del ítem
        priceBurger: item.price, // Precio de la hamburguesa
        priceToppings: item.toppings.reduce(
          (total, topping) => total + (topping.price || 0), // Precio total de los toppings seleccionados
          0
        ),
        subTotal: item.price * item.quantity, // Precio total de la hamburguesa * cantidad
        costoBurger, // Costo de la hamburguesa incluyendo toppings y cantidad
      };
    }),
    subTotal: values.subTotal,
    total: discountedTotal + envio,
    fecha: obtenerFechaActual(), // Asegúrate de que esta función devuelva la fecha en el formato deseado
    aclaraciones: values.aclaraciones || '',
    metodoPago: values.paymentMethod,
    direccion: values.address,
    telefono: cleanPhoneNumber(phone), // Convierte a string
    hora: values.hora || obtenerHoraActual(),
    cerca: false, // Puedes ajustar esto según tus necesidades
    cadete: 'NO ASIGNADO',
    referencias: values.references,
    map: coordinates || [0, 0],
    elaborado: false,
    couponCodes,
    ubicacion: mapUrl,
    paid: true,
  };

  try {
    const orderId = await UploadOrder(orderDetail); // Captura el ID de la orden

    return orderId; // Retorna el ID de la orden
  } catch (error) {
    console.error('Error al subir la orden: ', error);
    return null;
  }
};

export default handleSubmit;
