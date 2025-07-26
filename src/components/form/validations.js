import * as Yup from "yup";

const validations = (total, cart = []) =>
  Yup.object({
    phone: Yup.string()
      .required("Telefono obligatorio")
      .min(6, "Debe de tener 6 caracteres o más"),

    postalCode: Yup.string()
      .required("Código postal obligatorio")
      .matches(/^[0-9]{4,5}$/, "Debe ser un código postal válido"),

    // deliveryMethod: Yup.string()
    //   .required('Método de entrega es obligatorio')
    //   .oneOf(['delivery', 'retiro']),

    address: Yup.string().when("deliveryMethod", {
      is: "delivery",
      then: () =>
        Yup.string()
          .required("Falta indicar la dirección") // ← Primer mensaje: campo vacío
          .min(3, "Debe ser una dirección válida")
          .test(
            "address-validation",
            "La dirección debe incluir un número de altura", // ← Segundo mensaje: falta altura
            (value) => {
              if (!value) return true; // Si no hay valor, el required se encarga

              // Lista de calles que comienzan con números
              const streetNamesStartingWithNumbers = [
                "9 de julio",
                "25 de mayo",
                "20 de junio",
              ];

              // Expresión regular para buscar un número de altura
              const streetNumberPattern = /\b\d+(?:[-\/]\d+)?\b/;

              // Dividimos la dirección en palabras
              const words = value.toLowerCase().split(/\s+/);

              // Verificamos si la dirección comienza con una calle que empieza con número
              const startsWithNumberedStreet =
                streetNamesStartingWithNumbers.some((street) =>
                  value.toLowerCase().startsWith(street)
                );

              if (startsWithNumberedStreet) {
                // Si la calle comienza con número, buscamos otro número más adelante en la dirección
                const remainingAddress = words.slice(3).join(" ");
                if (!streetNumberPattern.test(remainingAddress)) {
                  return false; // Simplificado: solo retorna false
                }
              } else {
                // Para otras calles, buscamos el número de altura normalmente
                if (!streetNumberPattern.test(value)) {
                  return false; // Simplificado: solo retorna false
                }
              }

              return true;
            }
          ),
    }),

    paymentMethod: Yup.string()
      .required("Método de pago es obligatorio")
      .oneOf(["mercadopago", "efectivo", "ambos"]),

    // money: Yup.number().when('paymentMethod', {
    //   is: 'efectivo',
    //   then: () =>
    //     Yup.number()
    //       .min(total, `El monto debe ser mayor o igual a ${total}`)
    //       .required('El monto es obligatorio'),
    // }),

    efectivoCantidad: Yup.number().when("paymentMethod", {
      is: "ambos",
      then: () =>
        Yup.number()
          .min(0, "El monto debe ser mayor o igual a 0")
          .test(
            "efectivo-max",
            `El monto en efectivo no puede exceder el total (${total})`,
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

    couponCode: Yup.string()
      .trim()
      .test(
        "coupon-yerba-check",
        "El cupón no se puede usar porque tenés productos de la categoría yerba en tu carrito.",
        function (value) {
          if (!value) return true; // Si no hay cupón, pasa
          const activeCoupons = [
            "APMCONKINGCAKES",
            "APMCONANHELO",
            "APMCONPROVIMARK",
            "APMCONLATABLITA",
          ];
          const couponCode = value.trim().toUpperCase();
          const hasYerba = cart.some(
            (item) => item.category?.toLowerCase() === "yerba"
          );

          if (activeCoupons.includes(couponCode) && hasYerba) {
            return false; // Retorna false para invalidar el campo
          }
          return true;
        }
      ),
  });

export default validations;
