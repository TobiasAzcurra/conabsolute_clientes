import * as Yup from "yup";

const validations = (total) =>
	Yup.object({
		phone: Yup.string()
			.required("Telefono obligatorio")
			.min(6, "Debe de tener 6 caracteres o más"),

		// deliveryMethod: Yup.string()
		//   .required('Método de entrega es obligatorio')
		//   .oneOf(['delivery', 'retiro']),

		address: Yup.string().when("deliveryMethod", {
			is: "delivery",
			then: () =>
				Yup.string()
					.test(
						"address-validation",
						"La dirección debe incluir un número de altura",
						(value) => {
							if (!value) return false;

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
									return new Yup.ValidationError(
										"Debe incluir un número de altura",
										value,
										"address"
									);
								}
							} else {
								// Para otras calles, buscamos el número de altura normalmente
								if (!streetNumberPattern.test(value)) {
									return new Yup.ValidationError(
										"Debe incluir un número de altura",
										value,
										"address"
									);
								}
							}

							return true;
						}
					)
					.min(3, "Debe ser una dirección válida")
					.required("Dirección obligatoria"),
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
	});

export default validations;
