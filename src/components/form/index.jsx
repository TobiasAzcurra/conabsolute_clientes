// src/components/FormCustom.jsx
import { ErrorMessage, Field, Form, Formik } from "formik";
import MyTextInput from "./MyTextInput";
import validations from "./validations";
import handleSubmit from "./handleSubmit";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addLastCart } from "../../redux/cart/cartSlice";
import { useEffect, useState, useMemo } from "react";
import { MapDirection } from "./MapDirection";
import { canjearVoucher } from "../../firebase/validateVoucher";
import Payment from "../mercadopago/Payment";
import currencyFormat from "../../helpers/currencyFormat";
import { calculateDiscountedTotal } from "../../helpers/currencyFormat";
import isologo from "../../assets/isologo.png";
import {
	isWithinClosedDays,
	isWithinOrderTimeRange,
} from "../../helpers/validate-hours";
import LoadingPoints from "../LoadingPoints";
import AppleModal from "../AppleModal";
import { listenToAltaDemanda } from "../../firebase/readConstants";

const envio = parseInt(import.meta.env.VITE_ENVIO) || 2000; // valor por defecto de 2000

const FormCustom = ({ cart, total }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const formValidations = validations(total + envio);
	const [mapUrl, setUrl] = useState("");
	const [validarUbi, setValidarUbi] = useState(false);
	const [noEncontre, setNoEncontre] = useState(false);

	// Estados para alta demanda
	const [altaDemanda, setAltaDemanda] = useState(null);
	const [showHighDemandModal, setShowHighDemandModal] = useState(false);
	const [pendingValues, setPendingValues] = useState(null);

	const [discountedTotal, setDiscountedTotal] = useState(total);
	const [couponCodes, setCouponCodes] = useState([""]); // Inicializado con un campo vacío
	const [descuento, setDescuento] = useState(0);
	const [descuentoForOneUnit, setDescuentoForOneUnit] = useState(0);
	// En FormCustom.jsx, agregar estado de loading
	const [isModalConfirmLoading, setIsModalConfirmLoading] = useState(false);

	const [voucherStatus, setVoucherStatus] = useState([""]);
	const [showCouponInput, setShowCouponInput] = useState(false);
	const [showReservaInput, setShowReservaInput] = useState(false);

	// Agregar estados necesarios para MercadoPago
	const [preferenceId, setPreferenceId] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	// Estados para manejar la validación de cupones
	const [isValidating, setIsValidating] = useState([false]);

	// Estado para controlar el modal de restricción de tiempo
	const [isTimeRestrictedModalOpen, setIsTimeRestrictedModalOpen] =
		useState(false);

	const [isCloseRestrictedModalOpen, setIsCloseRestrictedModalOpen] =
		useState(false);

	// Escucha de alta demanda
	useEffect(() => {
		let unsubscribeAltaDemanda = null;

		const iniciarEscuchaAltaDemanda = async () => {
			try {
				unsubscribeAltaDemanda = listenToAltaDemanda((altaDemandaData) => {
					console.log(
						"✨ Datos de Alta Demanda recibidos en Form:",
						altaDemandaData
					);
					setAltaDemanda(altaDemandaData);
				});
			} catch (error) {
				console.error("❌ Error al conectar con Alta Demanda:", error);
			}
		};

		iniciarEscuchaAltaDemanda();

		return () => {
			if (unsubscribeAltaDemanda) {
				unsubscribeAltaDemanda();
			}
		};
	}, []);

	// Función para procesar el pedido
	const processPedido = async (values, isReserva) => {
		let adjustedHora = values.hora;

		// Si es una reserva, ajusta la hora restando 30 minutos
		if (isReserva) {
			adjustedHora = adjustHora(values.hora);
		}

		// Si estamos en alta demanda, ajusta la hora sumando los minutos de demora
		if (altaDemanda?.isHighDemand && pendingValues) {
			const delayMinutes = altaDemanda.delayMinutes || 0;
			const currentTime = new Date();
			currentTime.setMinutes(currentTime.getMinutes() + delayMinutes);

			const adjustedHours = currentTime.getHours().toString().padStart(2, "0");
			const adjustedMinutes = currentTime
				.getMinutes()
				.toString()
				.padStart(2, "0");
			adjustedHora = `${adjustedHours}:${adjustedMinutes}`;
		}

		const updatedValues = { ...values, hora: adjustedHora };

		const orderId = await handleSubmit(
			updatedValues,
			cart,
			discountedTotal,
			envio,
			mapUrl,
			couponCodes
		);

		if (orderId) {
			navigate(`/success/${orderId}`);
			dispatch(addLastCart());
		} else {
			console.error("Error al procesar la orden");
		}
	};

	// Función para abrir el modal de restricción de tiempo
	const openTimeRestrictedModal = () => {
		setIsTimeRestrictedModalOpen(true);
	};

	// Función para cerrar el modal de restricción de tiempo
	const closeTimeRestrictedModal = () => {
		setIsTimeRestrictedModalOpen(false);
	};

	// Función para abrir el modal de restricción de tiempo
	const openCloseModal = () => {
		setIsCloseRestrictedModalOpen(true);
	};

	const closeCloseRestrictedModal = () => {
		setIsCloseRestrictedModalOpen(false);
	};

	// Nueva función para obtener la cantidad total de hamburguesas
	const getTotalBurgers = (cartToCheck = cart) => {
		if (!Array.isArray(cartToCheck)) {
			console.error("Invalid cart passed to getTotalBurgers", cartToCheck);
			return 0;
		}

		let totalBurgers = 0;
		for (const item of cartToCheck) {
			if (item.category === "burger" || item.category === "burgers") {
				if (item.name.includes("2x1")) {
					totalBurgers += item.quantity * 2;
				} else {
					totalBurgers += item.quantity;
				}
			}
		}
		return totalBurgers;
	};

	// Función para agregar un nuevo campo de cupón dinámicamente
	const addCouponField = () => {
		// Calcular el máximo de cupones permitidos
		const totalBurgers = getTotalBurgers();
		const maxCoupons = Math.floor(totalBurgers / 2);

		if (couponCodes.length < maxCoupons) {
			setCouponCodes([...couponCodes, ""]); // Añadir un nuevo campo vacío
			setVoucherStatus([...voucherStatus, ""]); // Añadir un nuevo estado vacío para el nuevo cupón
			setIsValidating([...isValidating, false]); // Añadir el estado de validación para el nuevo campo
		} else {
			// Opcional: Mostrar un mensaje o manejar el caso cuando se alcanza el máximo de cupones
		}
	};
	const handleCouponChange = (index, value, setFieldValue) => {
		const updatedCoupons = [...couponCodes];
		updatedCoupons[index] = value;
		setCouponCodes(updatedCoupons);

		const updatedVoucherStatus = [...voucherStatus];

		console.log(descuento);
		console.log(voucherStatus);
		if (value.length < 5) {
			// Mostrar mensaje de error indicando que deben ser al menos 5 dígitos
			updatedVoucherStatus[index] = "Deben ser al menos 5 dígitos.";
			setVoucherStatus(updatedVoucherStatus);
		} else if (value.length === 5) {
			// Limpiar cualquier mensaje de error previo
			updatedVoucherStatus[index] = "";
			setVoucherStatus(updatedVoucherStatus);

			// Validar el cupón cuando tiene exactamente 5 caracteres
			// No establecemos updatedVoucherStatus aquí para evitar sobrescribir el resultado de la validación
		} else {
			// Mostrar mensaje de error si el código es mayor a 5 caracteres
			updatedVoucherStatus[index] =
				"El código debe tener exactamente 5 caracteres.";
			setVoucherStatus(updatedVoucherStatus);
		}
	};

	// Nueva función para manejar la eliminación de cupones excedentes
	const removeExcessCoupons = (maxCoupons) => {
		// Asegurarse de que siempre haya al menos un campo de cupón
		const adjustedMaxCoupons = Math.max(maxCoupons, 1);

		const newCouponCodes = couponCodes.slice(0, adjustedMaxCoupons);
		const newVoucherStatus = voucherStatus.slice(0, adjustedMaxCoupons);
		const newIsValidating = isValidating.slice(0, adjustedMaxCoupons);
		// Asegúrate de actualizar los estados correspondientes si es necesario
	};

	useEffect(() => {
		let hasInvalidVoucher = false;
		let validCouponCount = 0;
		// Recorre el voucherStatus

		console.log(voucherStatus);
		console.log(couponCodes);
		voucherStatus.forEach((v, index) => {
			// Si el voucher no es "¡Código válido!" o está vacío, es inválido
			if (v !== "¡Código válido!") {
				hasInvalidVoucher = true;
			} else {
				validCouponCount++;
			}
		});
		// Si algún cupón no es válido, quitar el descuento
		if (hasInvalidVoucher && descuento !== 0) {
			console.log("descuentoForOneUnit", descuentoForOneUnit);
			const newDescuento = descuentoForOneUnit * validCouponCount;
			console.log("NUEVO DESCUENTO", newDescuento);
			setDescuento(newDescuento);
			setDiscountedTotal(total - newDescuento);
		} else {
			// Opcional: Manejar el caso cuando no hay cupones inválidos
		}
	}, [voucherStatus, setDescuento, setDiscountedTotal, descuento, total, cart]);

	// Función para validar la cantidad de hamburguesas necesarias
	function validarCantidadDeBurgers(cartToCheck, numCoupons) {
		if (!Array.isArray(cartToCheck)) {
			console.error(
				"Invalid cart passed to validarCantidadDeBurgers",
				cartToCheck
			);
			return false;
		}

		let burgerCount = 0;

		for (const item of cartToCheck) {
			if (item.category === "burger" || item.category === "burgers") {
				// Maneja ambas categorías
				burgerCount += item.quantity;
			}
		}

		const minBurgersRequired = numCoupons * 2;
		return burgerCount >= minBurgersRequired;
	}

	const getPromoAndNonPromoProducts = (cart) => {
		const promoProducts = cart.filter((item) => item.type === "promo");
		const nonPromoProducts = cart.filter((item) => item.type !== "promo");
		return { promoProducts, nonPromoProducts };
	};

	// Función para manejar la validación de un cupón
	const handleVoucherValidation = async (
		index,
		value,
		updatedCoupons,
		setFieldValue
	) => {
		// Iniciar la animación de carga
		setIsValidating((prev) => {
			const updated = [...prev];
			updated[index] = true; // Activar el estado de carga
			return updated;
		});

		// Obtener la cantidad total de hamburguesas
		const totalBurgers = getTotalBurgers(cart);

		// Primera validación: evitar cupones duplicados
		if (updatedCoupons.indexOf(value) !== index) {
			const updatedVoucherStatus = [...voucherStatus];
			updatedVoucherStatus[index] = "Este código ya fue ingresado.";
			setVoucherStatus(updatedVoucherStatus);
			setIsValidating((prev) => {
				const updated = [...prev];
				updated[index] = false; // Desactivar el estado de carga
				return updated;
			});
			return;
		}

		// Validar que haya suficientes hamburguesas
		const numCoupons = updatedCoupons.filter(
			(code) => code.trim() !== ""
		).length;

		const hasEnoughBurgers = totalBurgers >= numCoupons * 2;

		if (!hasEnoughBurgers) {
			const updatedVoucherStatus = [...voucherStatus];
			updatedVoucherStatus[index] = `Necesitas al menos ${
				numCoupons * 2
			} hamburguesas (considerando las promociones 2x1) para canjear los vouchers.`;
			setVoucherStatus(updatedVoucherStatus);
			return;
		}

		// Verificar si hay productos promocionales y no promocionales
		const { promoProducts, nonPromoProducts } =
			getPromoAndNonPromoProducts(cart);

		if (promoProducts.length > 0 && nonPromoProducts.length === 0) {
			const updatedVoucherStatus = [...voucherStatus];
			updatedVoucherStatus[index] =
				"No se pueden aplicar vouchers a productos en promoción.";
			setVoucherStatus(updatedVoucherStatus);
			return;
		}

		if (promoProducts.length > 0 && nonPromoProducts.length > 0) {
			const updatedVoucherStatus = [...voucherStatus];
			updatedVoucherStatus[index] =
				"El cupón se aplica solo a productos no promocionales.";
			setVoucherStatus(updatedVoucherStatus);
			// Continuar con la validación y aplicación del descuento solo para productos no promocionales
			const totalNonPromoBurgers = getTotalBurgers(nonPromoProducts);
			const numNonPromoCoupons = updatedCoupons.filter(
				(code) => code.trim() !== ""
			).length;
			const hasEnoughNonPromoBurgers =
				totalNonPromoBurgers >= numNonPromoCoupons * 2;

			if (!hasEnoughNonPromoBurgers) {
				updatedVoucherStatus[index] = `Necesitas al menos ${
					numNonPromoCoupons * 2
				} hamburguesas no promocionales (considerando las promociones 2x1) para canjear los vouchers.`;
				setVoucherStatus(updatedVoucherStatus);
				return;
			}
		}

		try {
			// Validar el cupón
			const isValid = await canjearVoucher(value);
			const updatedVoucherStatus = [...voucherStatus];

			if (isValid) {
				const { newTotal, totalDescuento } = calculateDiscountedTotal(
					cart,
					numCoupons
				);

				if (descuentoForOneUnit === 0) {
					setDescuentoForOneUnit(totalDescuento);
				}
				setDiscountedTotal(newTotal);
				setDescuento(totalDescuento); // Establece el descuento total si hay cupones válidos
				updatedVoucherStatus[index] = "¡Código válido!";
				setFieldValue("efectivoCantidad", "");
				setFieldValue("mercadopagoCantidad", "");
			} else {
				updatedVoucherStatus[index] = "Código no válido.";

				// Filtrar solo los cupones válidos y recalcular el descuento
				const validCoupons = updatedCoupons.filter(
					(code, i) => voucherStatus[i] === "¡Código válido!"
				);
				const { newTotal, totalDescuento } = calculateDiscountedTotal(
					cart,
					validCoupons.length
				);

				setDiscountedTotal(newTotal); // Recalcula el total con solo cupones válidos
				setDescuento(totalDescuento); // Recalcula el descuento con solo cupones válidos
			}

			setVoucherStatus(updatedVoucherStatus);
		} catch (error) {
			console.error("Error while validating coupon:", error);
			const updatedVoucherStatus = [...voucherStatus];
			updatedVoucherStatus[index] = "Error al validar el cupón.";
			setVoucherStatus(updatedVoucherStatus);
		}

		// Desactivar la animación de carga
		setIsValidating((prev) => {
			const updated = [...prev];
			updated[index] = false;
			return updated;
		});
	};

	// Actualizar el total con descuentos cuando cambia el total original
	useEffect(() => {
		setDiscountedTotal(total);
	}, [total]);

	const [selectedHora, setSelectedHora] = useState("");

	const handleChange = (event) => {
		setSelectedHora(event.target.value);
	};

	// Función para ajustar la hora restando 30 minutos
	const adjustHora = (hora) => {
		const [hours, minutes] = hora.split(":").map(Number);
		const date = new Date();
		date.setHours(hours, minutes, 0, 0);
		date.setMinutes(date.getMinutes() - 30);

		// Formatear la nueva hora en "HH:mm"
		const adjustedHours = date.getHours().toString().padStart(2, "0");
		const adjustedMinutes = date.getMinutes().toString().padStart(2, "0");
		const adjustedTime = `${adjustedHours}:${adjustedMinutes}`;
		return adjustedTime;
	};

	// Function to get available time slots
	const getAvailableTimeSlots = () => {
		const now = new Date();
		const currentHour = now.getHours();
		const currentMinute = now.getMinutes();

		// Define all possible time slots
		const allTimeSlots = [
			"20:30",
			"21:00",
			"21:30",
			"22:00",
			"22:30",
			"23:00",
			"23:30",
			"00:00",
		];

		// Calculate the next 30-minute slot
		// First, round up to the next 30 minutes
		const nextSlotMinutes =
			Math.ceil((currentHour * 60 + currentMinute) / 30) * 30 + 30;
		const nextSlotHour = Math.floor(nextSlotMinutes / 60);
		const nextSlotMinute = nextSlotMinutes % 60;

		// Filter time slots
		return allTimeSlots.filter((timeSlot) => {
			let [slotHour, slotMinute] = timeSlot.split(":").map(Number);

			// Handle midnight (00:00) special case
			if (slotHour === 0) slotHour = 24;

			// Convert both times to minutes for comparison
			const slotTimeInMinutes = slotHour * 60 + slotMinute;
			const nextValidTimeInMinutes = nextSlotHour * 60 + nextSlotMinute;

			return slotTimeInMinutes >= nextValidTimeInMinutes;
		});
	};

	// TimeSelector component
	const TimeSelector = ({ selectedHora, handleChange, setFieldValue }) => {
		const availableTimeSlots = useMemo(getAvailableTimeSlots, []);

		return (
			<Field
				as="select"
				name="hora"
				className={`custom-select ${
					selectedHora === "" ? "text-gray-400" : "text-black"
				}`}
				value={selectedHora}
				onChange={(e) => {
					handleChange(e);
					setFieldValue("hora", e.target.value);
				}}
			>
				<option value="" disabled>
					¿Quieres reservar para más tarde?
				</option>
				{availableTimeSlots.map((timeSlot) => (
					<option key={timeSlot} value={timeSlot}>
						{timeSlot}
					</option>
				))}
			</Field>
		);
	};

	return (
		<div className="flex mt-2 mr-4 mb-10 min-h-screen ml-4 flex-col">
			<style>{`
                .custom-select {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    background: transparent;
                    padding: 0;
                    width: 100%;
                    height: 40px;
                    border: none;
                    outline: none;
                    font-size: 16px;
                }
                .custom-select::placeholder {
                    color: rgba(0, 0, 0, 0.5);
                }
            `}</style>
			<Formik
				initialValues={{
					subTotal: discountedTotal,
					phone: "",
					deliveryMethod: "delivery",
					references: "",
					paymentMethod: "efectivo",
					money: "",
					address: "",
					hora: "",
					efectivoCantidad: 0,
					mercadopagoCantidad: 0,
					aclaraciones: "",
				}}
				validationSchema={formValidations}
				onSubmit={async (values) => {
					// if (true) {
					//   return;
					// }
					// Determinar si el pedido es una reserva
					if (!altaDemanda?.open) {
						openCloseModal(); // Abrir el modal personalizado
						return; // No proceder si es lunes, martes o miércoles
					}
					const isReserva = values.hora.trim() !== "";

					// Solo verificar alta demanda si NO es una reserva
					if (!isReserva && altaDemanda?.isHighDemand) {
						setPendingValues(values);
						setShowHighDemandModal(true);
						return;
					}

					// Verificar si es una reserva y proceder sin el modal de alta demanda
					// (Opcional: Puedes manejar alguna lógica adicional aquí si es necesario)

					// Verificar restricciones de horario antes de procesar el pedido
					if (isWithinClosedDays()) {
						openTimeRestrictedModal(); // Abrir el modal personalizado
						return; // No proceder si es lunes, martes o miércoles
					}

					if (!isWithinOrderTimeRange()) {
						console.log(
							"La hora actual está fuera del rango permitido para pedidos"
						);
						openTimeRestrictedModal(); // Abrir el modal personalizado
						return;
					}

					if (values.paymentMethod === "efectivo") {
						await processPedido(values, isReserva);
					} else if (values.paymentMethod === "mercadopago") {
						// Manejar el pago con Mercado Pago aquí si es necesario
						// Por ejemplo, podrías llamar a un método para procesar el pago
					}
				}}
			>
				{({
					getFieldProps,
					isSubmitting,
					setFieldValue,
					values,
					submitForm,
					isValid,
				}) => {
					useEffect(() => {
						couponCodes.forEach((code, index) => {
							if (
								code.trim().length === 5 &&
								voucherStatus[index] !== "¡Código válido!"
							) {
								handleVoucherValidation(
									index,
									code,
									couponCodes,
									setFieldValue
								);
							}
							// No limpiar el estado de validación aquí
						});
					}, [cart, couponCodes, setFieldValue]);

					// Nuevo useEffect para manejar la cantidad de cupones basada en la cantidad de hamburguesas
					useEffect(() => {
						setCouponCodes([""]);
						setVoucherStatus([""]);
						setIsValidating([false]);
						setDescuento(0);
						setDescuentoForOneUnit(0);
					}, [cart]);

					// Agregar logs para cambios en el carrito si se modifica dentro de este componente
					useEffect(() => {
						console.log("Descuento aplicado:", descuento);
					}, [cart, total, discountedTotal, descuento]);

					return (
						<Form>
							<div className="flex flex-col mb-2">
								{/* Sección de aclaraciones */}
								<div className="flex flex-row justify-between px-3 h-10 m items-start border-2 border-black rounded-3xl mt-4">
									<div className="flex flex-row w-full items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="h-6"
										>
											<path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
										</svg>

										<MyTextInput
											label="Aclaraciones"
											name="aclaraciones"
											type="text"
											placeholder="¿Aclaraciones? Ej: La simple vegetariana"
											autoComplete="off"
											className="bg-transparent px-0 h-10 text-opacity-20 outline-none w-full"
										/>
									</div>
								</div>
								{/* Datos para la entrega */}
								<div className="flex justify-center flex-col mt-7 items-center">
									<p className="text-2xl font-bold mb-2">
										Datos para la entrega
									</p>
									{/* Botones para seleccionar método de envío */}
									<div className="flex flex-row w-full gap-2 mb-4">
										<button
											type="button"
											className={`h-20 flex-1 font-bold items-center flex justify-center gap-2 rounded-lg  ${
												values.deliveryMethod === "delivery"
													? "bg-black text-gray-100"
													: "bg-gray-300 text-black"
											}`}
											onClick={() =>
												setFieldValue("deliveryMethod", "delivery")
											}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 500 500"
												className="h-8"
											>
												<path
													d="M76.849,210.531C34.406,210.531,0,244.937,0,287.388c0,42.438,34.406,76.847,76.849,76.847 c30.989,0,57.635-18.387,69.789-44.819l18.258,14.078c0,0,134.168,0.958,141.538-3.206c0,0-16.65-45.469,4.484-64.688 c2.225-2.024,5.021-4.332,8.096-6.777c-3.543,8.829-5.534,18.45-5.534,28.558c0,42.446,34.403,76.846,76.846,76.846 c42.443,0,76.843-34.415,76.843-76.846c0-42.451-34.408-76.849-76.843-76.849c-0.697,0-1.362,0.088-2.056,0.102 c5.551-3.603,9.093-5.865,9.093-5.865l-5.763-5.127c0,0,16.651-3.837,12.816-12.167c-3.848-8.33-44.19-58.28-44.19-58.28 s7.146-15.373-7.634-26.261l-7.098,15.371c0,0-18.093-12.489-25.295-10.084c-7.205,2.398-18.005,3.603-21.379,8.884l-3.358,3.124 c0,0-0.95,5.528,4.561,13.693c0,0,55.482,17.05,58.119,29.537c0,0,3.848,7.933-12.728,9.844l-3.354,4.328l-8.896,0.479 l-16.082-36.748c0,0-15.381,4.082-23.299,10.323l1.201,6.24c0,0-64.599-43.943-125.362,21.137c0,0-44.909,12.966-76.37-26.897 c0,0-0.479-12.968-76.367-10.565l5.286,5.524c0,0-5.286,0.479-7.444,3.841c-2.158,3.358,1.2,6.961,18.494,6.961 c0,0,39.153,44.668,69.17,42.032l42.743,20.656l18.975,32.42c0,0,0.034,2.785,0.23,7.045c-4.404,0.938-9.341,1.979-14.579,3.09 C139.605,232.602,110.832,210.531,76.849,210.531z M390.325,234.081c29.395,0,53.299,23.912,53.299,53.299 c0,29.39-23.912,53.294-53.299,53.294c-29.394,0-53.294-23.912-53.294-53.294C337.031,257.993,360.932,234.081,390.325,234.081z M76.849,340.683c-29.387,0-53.299-23.913-53.299-53.295c0-29.395,23.912-53.299,53.299-53.299 c22.592,0,41.896,14.154,49.636,34.039c-28.26,6.011-56.31,11.99-56.31,11.99l3.619,19.933l55.339-2.444 C124.365,322.116,102.745,340.683,76.849,340.683z M169.152,295.835c1.571,5.334,3.619,9.574,6.312,11.394l-24.696,0.966 c1.058-3.783,1.857-7.666,2.338-11.662L169.152,295.835z"
													fill="currentColor"
												/>
											</svg>
											Delivery
										</button>
										<button
											type="button"
											className={`h-20 flex-1 flex-col font-bold items-center flex justify-center   rounded-lg ${
												values.deliveryMethod === "takeaway"
													? "bg-black text-gray-100"
													: "bg-gray-300 text-black"
											}`}
											onClick={() =>
												setFieldValue("deliveryMethod", "takeaway")
											}
										>
											<div className="flex flex-row items-center gap-2">
												<img
													src={isologo}
													className={`h-4 ${
														values.deliveryMethod === "takeaway"
															? "invert brightness-0"
															: "brightness-0"
													}`}
													alt=""
												/>
												<p className="font-bold text-">Retiro</p>
											</div>
											<p className="font-light text-xs">por Buenos Aires 618</p>
										</button>
									</div>
									<div
										className={`w-full items-center rounded-3xl border-2 border-black transition-all duration-300`}
									>
										{values.deliveryMethod === "delivery" && (
											<>
												<MapDirection
													setUrl={setUrl}
													setValidarUbi={setValidarUbi}
													setNoEncontre={setNoEncontre}
													setFieldValue={setFieldValue}
												/>

												<ErrorMessage
													name="address"
													component="span"
													className="text-sm text-red-main font-coolvetica font-light"
												/>

												{noEncontre && (
													<div className="flex flex-row justify-between px-3 h-10 items-center">
														<div className="flex flex-row gap-2">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																viewBox="0 0 24 24"
																fill="currentColor"
																className="h-6"
															>
																<path
																	fillRule="evenodd"
																	d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
																	clipRule="evenodd"
																/>
															</svg>
															<MyTextInput
																name="address"
																type="text"
																placeholder="Tu dirección"
																className="bg-white text-opacity-20 text-black outline-none px-2"
															/>
														</div>
													</div>
												)}

												{/* Campo para referencias */}
												<div className="flex flex-row border-t border-black border-opacity-20 gap-2 pl-3 h-10 items-center">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
														fill="currentColor"
														className="h-6"
													>
														<path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
													</svg>

													<MyTextInput
														label="Referencias"
														name="references"
														type="text"
														placeholder="¿Referencias? Ej: Casa de portón negro"
														autoComplete="off"
														className="bg-transparent px-0 h-10 text-opacity-20 outline-none w-full"
													/>
												</div>
											</>
										)}
										{/* Campo para el número de teléfono */}
										<div
											className={`flex flex-row justify-between px-3 h-auto items-start ${
												values.deliveryMethod === "delivery"
													? "border-t border-black border-opacity-20"
													: ""
											}`}
										>
											<div className="flex flex-row items-center gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
													<path
														fillRule="evenodd"
														d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z"
														clipRule="evenodd"
													/>
												</svg>

												<div className="flex flex-col w-full">
													<MyTextInput
														name="phone"
														type="text"
														placeholder="Tu número de teléfono"
														autoComplete="phone"
														className="bg-transparent px-0 h-10 text-opacity-20 outline-none w-full"
													/>
													<ErrorMessage
														name="phone"
														component="span"
														className="text-sm text-red-main font-coolvetica font-light mt-1"
													/>
												</div>
											</div>
										</div>

										{/* Campo para reservar hora */}
										<div className="flex flex-row justify-between px-3 h-auto items-start border-t border-black border-opacity-20">
											<div className="flex flex-row items-center gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path
														fillRule="evenodd"
														d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
														clipRule="evenodd"
													/>
												</svg>
												<TimeSelector
													selectedHora={selectedHora}
													handleChange={handleChange}
													setFieldValue={setFieldValue}
												/>
												<ErrorMessage
													name="hora"
													component="span"
													className="text-sm text-red-main font-coolvetica font-light mt-1"
												/>
											</div>
										</div>
									</div>
								</div>
								{/* Método de pago y cupones */}
								<div className="flex justify-center flex-col mt-6 items-center">
									<p className="text-2xl font-bold mb-2">Método de pago</p>
									<div className="w-full items-center rounded-3xl border-2 border-black">
										<div className="flex flex-row justify-between px-3 h-auto items-start border border-black rounded-t-3xl border-opacity-20">
											{/* Campo de selección de método de pago */}
											<div className="flex flex-row items-center gap-2">
												{/* Icono */}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
													<path
														fillRule="evenodd"
														d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
														clipRule="evenodd"
													/>
													<path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
												</svg>

												<Field
													as="select"
													name="paymentMethod"
													className="bg-transparent px-0 h-10 text-opacity-20 outline-none w-full"
													style={{
														WebkitAppearance: "none",
														MozAppearance: "none",
													}}
													onChange={(e) => {
														setFieldValue("paymentMethod", e.target.value);
													}}
												>
													<option value="efectivo">Efectivo</option>
													<option value="mercadopago">Mercado Pago</option>
												</Field>
											</div>
										</div>

										{/* Campos de cupones */}
										<div className="flex flex-col">
											{couponCodes.map((coupon, index) => (
												<div
													key={index}
													className={`flex flex-col w-full transition-all duration-300 ${
														index !== 0
															? "border-t border-black border-opacity-20"
															: ""
													}`}
												>
													<div className="flex flex-row gap-2 px-3 items-center">
														{/* Icono de cupón */}
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 24 24"
															fill="currentColor"
															className="h-6"
														>
															<path
																fillRule="evenodd"
																d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
																clipRule="evenodd"
															/>
														</svg>

														{/* Campo de entrada de cupón */}
														<MyTextInput
															name={`couponCode${index}`}
															type="text"
															placeholder={
																index === 0
																	? "¿Tenes algun cupón?"
																	: "¿Tenes otro cupón?"
															}
															value={couponCodes[index]}
															onChange={(e) => {
																handleCouponChange(
																	index,
																	e.target.value,
																	setFieldValue
																);
															}}
															className="bg-transparent px-0 h-10 text-opacity-20 outline-none w-full"
														/>

														{/* Indicador de validación */}
														{isValidating[index] ? (
															<div
																className="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] text-black"
																role="status"
															>
																<span className="sr-only">Loading...</span>
															</div>
														) : voucherStatus[index] === "¡Código válido!" ? (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																viewBox="0 0 24 24"
																fill="green"
																className="h-6"
															>
																<path
																	fillRule="evenodd"
																	d="M10.828 16.172a.75.75 0 0 1-1.06 0L5.47 11.875a.75.75 0 0 1 1.06-1.06l3.298 3.297 6.364-6.364a.75.75 0 1 1 1.06 1.06l-7.425 7.425Z"
																	clipRule="evenodd"
																/>
															</svg>
														) : null}
													</div>

													{/* Mensaje de validación */}
													{voucherStatus[index] &&
														voucherStatus[index] !== "¡Código válido!" && (
															<div className="flex flex-row h-10 justify-between px-3 items-start">
																<div className="flex flex-row items-center gap-2">
																	<p className="bg-transparent px-0 text-opacity-100 w-full text-red-main">
																		{voucherStatus[index]}
																	</p>
																</div>
															</div>
														)}

													{/* Lógica para agregar un nuevo campo de cupón */}
													{voucherStatus[index] === "¡Código válido!" &&
														index === couponCodes.length - 1 &&
														couponCodes.length <
															Math.floor(getTotalBurgers() / 2) &&
														addCouponField()}
												</div>
											))}
										</div>
									</div>
								</div>
								{/* Resumen */}
								<div className="flex justify-center flex-col mt-6 items-center">
									<p className="text-2xl font-bold">Resumen</p>
									<div className="flex flex-row justify-between w-full">
										<p>Productos</p>
										<p>{currencyFormat(total)}</p>
									</div>
									<div className="flex flex-row justify-between w-full">
										<p>Envío</p>
										<p>
											{values.deliveryMethod === "delivery"
												? currencyFormat(envio)
												: currencyFormat(0)}
										</p>
									</div>
									<div className="flex flex-row justify-between w-full">
										<p>Descuentos</p>
										<p>-{currencyFormat(descuento)}</p>
									</div>
									<div className="flex flex-row justify-between w-full">
										<p className="font-bold">Total</p>
										<p className="font-bold">
											{values.deliveryMethod === "delivery"
												? currencyFormat(discountedTotal + envio)
												: currencyFormat(discountedTotal)}
										</p>
									</div>
								</div>
								{/* Botón de envío */}
								{values.paymentMethod === "mercadopago" ? (
									<Payment
										cart={cart}
										values={values}
										discountedTotal={discountedTotal}
										envio={envio}
										mapUrl={mapUrl}
										couponCodes={couponCodes}
										submitForm={submitForm}
										setPendingValues={setPendingValues}
										altaDemanda={altaDemanda}
										isValid={isValid} // Pasamos isValid al componente Payment
										pendingValues={pendingValues}
									/>
								) : (
									<button
										type="submit"
										disabled={isSubmitting}
										className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 rounded-3xl h-20 font-bold hover:bg-red-600 transition-colors duration-300 ${
											isSubmitting ? "opacity-50 cursor-not-allowed" : ""
										}`}
									>
										{isSubmitting ? (
											<LoadingPoints color="text-gray-100" />
										) : (
											"Pedir"
										)}
									</button>
								)}
							</div>
						</Form>
					);
				}}
			</Formik>
			{/* Modal de restricción de tiempo */}
			<AppleModal
				isOpen={isTimeRestrictedModalOpen}
				onClose={closeTimeRestrictedModal}
				title="Está cerrado"
			>
				<p>Abrimos de jueves a domingo de 20:00 hs a 00:00 hs.</p>
			</AppleModal>

			<AppleModal
				isOpen={isCloseRestrictedModalOpen}
				onClose={closeCloseRestrictedModal}
				title="Está cerrado"
			>
				<p>
					FELIZ NAVIDAD 🎁 Se vendieron mas de 500 burgers wtff ❤️‍🔥 PD: Saca
					captura de esto, vale por 2x1 😎
				</p>
			</AppleModal>
			{/* Modal de alta demanda */}
			<AppleModal
				isOpen={
					showHighDemandModal && pendingValues.paymentMethod === "efectivo"
				}
				onClose={() => setShowHighDemandModal(false)}
				title="Alta Demanda"
				twoOptions={true}
				isLoading={isModalConfirmLoading}
				onConfirm={async () => {
					setIsModalConfirmLoading(true);
					if (pendingValues) {
						const isReserva = pendingValues.hora.trim() !== "";
						await processPedido(pendingValues, isReserva);
					}
					setIsModalConfirmLoading(false);
					setShowHighDemandModal(false);
				}}
			>
				<p>
					Estamos en alta demanda, tu pedido comenzará a cocinarse dentro de{" "}
					{altaDemanda?.delayMinutes} minutos, ¿lo esperas?
				</p>
			</AppleModal>
		</div>
	);
};

export default FormCustom;
