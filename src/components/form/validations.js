import * as Yup from "yup";

const validations = (total, cart = []) =>
  Yup.object({
    phone: Yup.string()
      .required("Telefono obligatorio")
      .min(6, "Debe de tener 6 caracteres o más"),

    address: Yup.string().when("deliveryMethod", {
      is: "delivery",
      then: () =>
        Yup.string()
          .required("Falta indicar la dirección")
          .min(3, "Debe ser una dirección válida")
          .test(
            "address-validation",
            "La dirección debe incluir un número de altura",
            (value) => {
              if (!value) return true;

              const streetNamesStartingWithNumbers = [
                "9 de julio",
                "25 de mayo",
                "20 de junio",
              ];

              const streetNumberPattern = /\b\d+(?:[-\/]\d+)?\b/;
              const words = value.toLowerCase().split(/\s+/);

              const startsWithNumberedStreet =
                streetNamesStartingWithNumbers.some((street) =>
                  value.toLowerCase().startsWith(street)
                );

              if (startsWithNumberedStreet) {
                const remainingAddress = words.slice(3).join(" ");
                if (!streetNumberPattern.test(remainingAddress)) {
                  return false;
                }
              } else {
                if (!streetNumberPattern.test(value)) {
                  return false;
                }
              }

              return true;
            }
          ),
    }),

    paymentMethod: Yup.string()
      .required("Método de pago es obligatorio")
      .oneOf(["mercadopago", "cash", "ambos"]),

    cashCantidad: Yup.number().when("paymentMethod", {
      is: "ambos",
      then: () =>
        Yup.number()
          .min(0, "El monto debe ser mayor o igual a 0")
          .test(
            "cash-max",
            `El monto en cash no puede exceder el total (${total})`,
            (value) => !value || value <= total
          ),
    }),

    mercadopagoCantidad: Yup.number().when("paymentMethod", {
      is: "ambos",
      then: () =>
        Yup.number()
          .min(0, "El monto debe ser mayor o igual a 0")
          .test(
            "mercadopago-max",
            `El monto con MercadoPago no puede exceder el total (${total})`,
            (value) => !value || value <= total
          ),
    }),

    // ✅ ELIMINADA: validación obsoleta de couponCode
    // La validación completa ahora se hace en tiempo real con useDiscountCode
  });

export default validations;
