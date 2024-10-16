import {
  ReadData,
  ReadMateriales,
  UploadOrder,
} from "../../firebase/uploadOrder";
import {
  calcularCostoHamburguesa,
  extractCoordinates,
  obtenerFechaActual,
  obtenerHoraActual,
} from "../../helpers/currencyFormat";

const handleSubmit = async (
  values,
  cart,
  total,
  envio,
  mapUrl,
  couponCodes,
) => {
  const coordinates = extractCoordinates(mapUrl);
  const materialesData = await ReadMateriales();
  const productsData = await ReadData();

  const formattedData = productsData.map(({ data }) => ({
    description: data.description || "",
    img: data.img,
    name: data.name,
    price: data.price,
    type: data.type,
    ingredients: data.ingredients,
    costo: calcularCostoHamburguesa(materialesData, data.ingredients),
  }));
  const orderDetail = {
    envio,
    detallePedido: cart.map((item) => {
      const quantity = item.quantity !== undefined ? item.quantity : 0;

      const productoSeleccionado = formattedData.find(
        (producto) => producto.name === item.name,
      );

      const toppingsSeleccionados = item.toppings || [];
      let costoToppings = 0;

      toppingsSeleccionados.forEach((topping) => {
        const materialTopping = materialesData.find(
          (material) =>
            material.nombre.toLowerCase() === topping.name.toLowerCase(),
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
          0,
        ),
        subTotal: item.price * item.quantity, // Precio total de la hamburguesa * cantidad
        costoBurger, // Costo de la hamburguesa incluyendo toppings y cantidad
      };
    }),
    subTotal: values.subTotal,
    total: total + envio,
    fecha: obtenerFechaActual(), // Asegúrate de que esta función devuelva la fecha en el formato deseado
    aclaraciones: values.references || "",
    metodoPago: values.paymentMethod,
    direccion: values.address,
    telefono: String(values.phone) || "", // Convierte a string
    hora: values.hora || obtenerHoraActual(),
    cerca: false, // Puedes ajustar esto según tus necesidades
    cadete: "NO ASIGNADO",
    referencias: values.references,
    map: coordinates || [0, 0],
    elaborado: false,
    couponCodes,
  };

  try {
    const orderId = await UploadOrder(orderDetail); // Captura el ID de la orden

    return orderId; // Retorna el ID de la orden
  } catch (error) {
    console.error("Error al subir la orden: ", error);
    return null;
  }
};

export default handleSubmit;
