import {
    addTelefonoFirebase,
    ReadData,
    ReadMateriales,
    UploadOrder,
} from "../../firebase/uploadOrder";
import { canjearVoucherPedir } from "../../firebase/validateVoucher";
import {
    calcularCostoHamburguesa,
    extractCoordinates,
    obtenerFechaActual,
    obtenerHoraActual,
} from "../../helpers/currencyFormat";
import { cleanPhoneNumber } from "../../helpers/validate-hours";

const handleSubmit = async (
    values,
    cart,
    discountedTotal,
    envio,
    mapUrl,
    couponCodes,
    descuento,
    isPending = false 
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

    const phone = String(values.phone) || "";

    const validacionCupones = await Promise.all(
        couponCodes.map(async (cupon) => {
            return await canjearVoucherPedir(cupon);
        })
    );

    console.log(validacionCupones);

    const orderDetail = {
        pendingOfBeingAccepted: isPending,
        envio: values.deliveryMethod === "delivery" ? envio : 0,
        envioExpress: values.envioExpress || 0,
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
                burger: item.name,
                toppings: item.toppings.map((topping) => topping.name),
                quantity: item.quantity,
                priceBurger: item.price,
                priceToppings: item.toppings.reduce(
                    (total, topping) => total + (topping.price || 0),
                    0
                ),
                subTotal: item.price * item.quantity,
                costoBurger,
            };
        }),
        subTotal: cart.reduce((total, item) => 
            total + (item.price * item.quantity) + 
            item.toppings.reduce((toppingTotal, topping) => toppingTotal + (topping.price || 0), 0) * item.quantity
        , 0),
        total: cart.reduce((total, item) => 
            total + (item.price * item.quantity) + 
            item.toppings.reduce((toppingTotal, topping) => 
                toppingTotal + (topping.price || 0), 0
            ) * item.quantity, 0) - descuento +  // Subtotal menos descuentos
            (values.deliveryMethod === "delivery" ? envio : 0) +  // Envío si aplica
            (values.envioExpress || 0),  // Envío express si aplica
        fecha: obtenerFechaActual(),
        aclaraciones: values.aclaraciones || "",
        metodoPago: values.paymentMethod,
        direccion: values.address,
        telefono: cleanPhoneNumber(phone),
        hora: values.hora || obtenerHoraActual(),
        cerca: false,
        cadete: "NO ASIGNADO",
        referencias: values.references,
        map: coordinates || [0, 0],
        elaborado: false,
        couponCodes,
        ubicacion: mapUrl,
        paid: true,
        deliveryMethod: values.deliveryMethod,
    };

    try {
        const orderId = await UploadOrder(orderDetail);
        await addTelefonoFirebase(phone, obtenerFechaActual());
        localStorage.setItem('customerPhone', cleanPhoneNumber(phone));
        
        return orderId;
    } catch (error) {
        console.error("Error al subir la orden: ", error);
        return null;
    }
};

export default handleSubmit;