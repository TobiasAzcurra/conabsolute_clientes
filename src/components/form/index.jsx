import { ErrorMessage, Field, Form, Formik } from "formik";
import MyTextInput from "./MyTextInput";
import ArrowBack from "../back";
import MyRadioGroup from "./MyRadioGroup";
import DeliveryDetails from "./DeliveryDetails";
import validations from "./validations";
import handleSubmit from "./handleSubmit";
import fire from "../../assets/icon-fire.gif";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addLastCart, clearCart } from "../../redux/cart/cartSlice";
import { useEffect, useState } from "react";
import { MapDirection } from "./MapDirection";
import { canjearVoucher } from "../../firebase/validateVoucher";
import Payment from "../mercadopago/Payment";
import SignInButton from "../google/SignInButton";
import Navbar from "../Navbar";
import arrow from "../../assets/arrowIcon.png";
import currencyFormat from "../../helpers/currencyFormat";
import { calculateDiscountedTotal } from "../../helpers/currencyFormat";

const envio = parseInt(import.meta.env.VITE_ENVIO);
const FormCustom = ({ cart, total }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const formValidations = validations(total + envio);
	const [mapUrl, setUrl] = useState("");
	const [validarUbi, setValidarUbi] = useState(false);
	const [noEncontre, setNoEncontre] = useState(false);

	const [discountedTotal, setDiscountedTotal] = useState(total);

	const [couponCodes, setCouponCodes] = useState([""]);
	const [descuento, setDescuento] = useState(0);
	const [voucherStatus, setVoucherStatus] = useState([""]);
	const [showCouponInput, setShowCouponInput] = useState(false);
	const [showReservaInput, setShowReservaInput] = useState(false);

	// Agregar estados necesarios para MercadoPago
	const [preferenceId, setPreferenceId] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	// Modifica la función `addCouponField` para permitir agregar un nuevo campo dinámicamente:
	const addCouponField = () => {
		setCouponCodes([...couponCodes, ""]); // Añadir un nuevo campo vacío
		setVoucherStatus([...voucherStatus, ""]); // Añadir un nuevo status vacío para el nuevo cupón
		setIsValidating([...isValidating, false]); // Añadir el estado de validación para el nuevo campo
	};

	const handleCouponChange = (index, value) => {
		const updatedCoupons = [...couponCodes];
		updatedCoupons[index] = value;
		setCouponCodes(updatedCoupons);
	};

	function validarCantidadDeBurgers(cart, numCoupons) {
		// Contador para las hamburguesas
		let burgerCount = 0;

		// Recorre el carrito
		for (const item of cart) {
			// Verifica si el item es una hamburguesa
			if (item.category === "burger") {
				burgerCount += item.quantity;
			}

			// Calcula la cantidad mínima de hamburguesas necesarias
			const minBurgersRequired = numCoupons * 2;

			// Si ya hay al menos la cantidad mínima de hamburguesas, retorna true
			if (burgerCount >= minBurgersRequired) {
				return true;
			}
		}

		// Si después de recorrer el carrito no hay la cantidad mínima de hamburguesas, retorna false
		return false;
	}
	const [isValidating, setIsValidating] = useState([false]); // Nuevo estado para manejar la carga

	const handleVoucherValidation = async (index, setFieldValue) => {
		// Iniciar la animación de carga
		setIsValidating((prev) => {
			const updated = [...prev];
			updated[index] = true; // Activar el estado de carga
			return updated;
		});

		// Primera validación: evitar cupones duplicados
		if (couponCodes.indexOf(couponCodes[index]) !== index) {
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
		const numCoupons = couponCodes.length;
		const hasEnoughBurgers = validarCantidadDeBurgers(cart, numCoupons);

		if (!hasEnoughBurgers) {
			const updatedVoucherStatus = [...voucherStatus];
			updatedVoucherStatus[index] = `Necesitas al menos ${
				numCoupons * 2
			} hamburguesas para canjear los vouchers.`;
			setVoucherStatus(updatedVoucherStatus);
			setIsValidating((prev) => {
				const updated = [...prev];
				updated[index] = false; // Desactivar el estado de carga
				return updated;
			});
			return;
		}

		try {
			// Validar el cupón
			const isValid = await canjearVoucher(couponCodes[index]);
			const updatedVoucherStatus = [...voucherStatus];

			if (isValid) {
				const { newTotal, totalDescuento } = calculateDiscountedTotal(
					cart,
					couponCodes.length
				);
				setDiscountedTotal(newTotal);
				setDescuento(totalDescuento);
				updatedVoucherStatus[index] = "¡Código válido!";
				setFieldValue("efectivoCantidad", "");
				setFieldValue("mercadopagoCantidad", "");
			} else {
				updatedVoucherStatus[index] = "Código no válido.";
			}
			setVoucherStatus(updatedVoucherStatus);
		} catch (error) {
			const updatedVoucherStatus = [...voucherStatus];
			updatedVoucherStatus[index] = "Error al validar el cupón.";
			setVoucherStatus(updatedVoucherStatus);
			console.error("Error al validar el cupón:", error);
		}

		// Desactivar la animación de carga
		setIsValidating((prev) => {
			const updated = [...prev];
			updated[index] = false;
			return updated;
		});
	};

	useEffect(() => {
		setDiscountedTotal(total);
	}, [total]);

	const [selectedHora, setSelectedHora] = useState("");

	const handleChange = (event) => {
		setSelectedHora(event.target.value);
	};

	return (
		<div className="flex mt-2  mr-4 mb-10 min-h-screen  ml-4 flex-col">
			<style jsx>{`
				.custom-select {
					appearance: none; /* Elimina la flecha en la mayoría de los navegadores */
					-webkit-appearance: none; /* Elimina la flecha en Safari y Chrome */
					-moz-appearance: none; /* Elimina la flecha en Firefox */
					background: transparent; /* Fondo transparente */
					padding: 0;
					width: 100%;
					height: 40px;
					border: none;
					outline: none;
					font-size: 16px;
				}
				/* Añadir un fondo personalizado si deseas imitar el comportamiento de un select */
				.custom-select::placeholder {
					color: rgba(0, 0, 0, 0.5); /* Opcional, color del placeholder */
				}
			`}</style>
			<ArrowBack />
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
				onSubmit={async (values) => {
					if (values.paymentMethod === "efectivo") {
						const orderId = await handleSubmit(
							values,
							cart,
							discountedTotal,
							envio,
							mapUrl,
							couponCodes
						);

						if (orderId) {
							// Si el ID es válido, redirigir al usuario a la página de confirmación
							navigate(`/success/${orderId}`);
							// dispatch(clearCart());
							// dispatch(addLastCart());
						} else {
							// Manejar el error, como mostrar una notificación al usuario
							console.error("Error al procesar la orden");
						}
					}
				}}
				validationSchema={formValidations}
			>
				{({ getFieldProps, isSubmitting, setFieldValue, values }) => {
					return (
						<Form>
							<div className="flex flex-col mb-2">
								<div className="flex flex-row justify-between px-3 h-auto items-start border-2 border-black rounded-3xl  mt-4">
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
											placeholder="¿Alguna aclaracion sobre tu pedido?"
											autoComplete="off"
											className="bg-transparent  px-0 h-10 text-opacity-20  outline-none w-full "
										/>
									</div>
								</div>
								<div className="flex justify-center flex-col mt-3.5 items-center ">
									<p className="text-2xl font-bold mb-2">
										Datos para la entrega
									</p>
									<div className="w-full items-center rounded-3xl border-2 border-black ">
										<MapDirection
											setUrl={setUrl}
											setValidarUbi={setValidarUbi}
											setNoEncontre={setNoEncontre}
											setFieldValue={setFieldValue}
										/>

										<ErrorMessage
											name="address"
											component="span"
											className=" text-sm text-red-main font-antonio font-light"
										/>

										{noEncontre && (
											<div className="flex flex-row justify-between px-3 h-10 items-center border-t  border-black border-opacity-20">
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
														placeholder="Tu direccion"
														className="bg-white text-opacity-20 text-black outline-none  px-2" // Fondo blanco, texto negro, sin borde por defecto
													/>
												</div>
											</div>
										)}

										<div className="flex flex-row justify-between px-3 h-auto items-start border-t border-black border-opacity-20">
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
													{" "}
													{/* Contenedor para el input y el mensaje de error */}
													<MyTextInput
														name="phone"
														type="text"
														placeholder="Tu número de teléfono"
														autoComplete="phone"
														className="bg-transparent  px-0 h-10 text-opacity-20  outline-none w-full "
													/>
													<ErrorMessage
														name="phone"
														component="span"
														className="text-sm text-red-main font-antonio font-light mt-1" // Margen superior para espaciar el mensaje de error
													/>
												</div>
											</div>
										</div>
										<div className="flex flex-row justify-between px-3 h-auto items-start border border-black border-opacity-20">
											<div className="flex flex-row items-center gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
													className="h-6"
												>
													<path
														fill-rule="evenodd"
														d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
														clip-rule="evenodd"
													/>
												</svg>
												<Field
													as="select"
													name="hora"
													className={`custom-select ${
														selectedHora === "" ? "text-gray-400" : "text-black"
													}`}
													value={selectedHora}
													onChange={handleChange}
												>
													<option value="" disabled>
														¿Queres reservar para mas tarde?
													</option>
													<option value="20:30">20:30</option>
													<option value="21:00">21:00</option>
													<option value="21:30">21:30</option>
													<option value="22:00">22:00</option>
													<option value="22:30">22:30</option>
													<option value="23:00">23:00</option>
													<option value="23:30">23:30</option>
													<option value="00:00">00:00</option>
												</Field>
											</div>
										</div>
										<div className="flex flex-row gap-2 pl-3 h-10 items-center">
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
												placeholder="¿Queres dejar alguna referencia?"
												autoComplete="off"
												className="bg-transparent  px-0 h-10 text-opacity-20  outline-none w-full "
											/>
										</div>
									</div>
								</div>

								<div className="flex justify-center flex-col mt-6 items-center ">
									<p className="text-2xl font-bold mb-2">Metodo de pago</p>
									<div className="w-full items-center rounded-3xl border-2 border-black ">
										<div className="flex flex-row justify-between px-3 h-auto items-start border border-black rounded-t-3xl border-opacity-20">
											<div className="flex flex-row items-center gap-2">
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
													className="bg-transparent  px-0 h-10 text-opacity-20  outline-none w-full "
													style={{
														WebkitAppearance: "none",
														MozAppearance: "none",
													}} // Ocultar la flecha del select
												>
													<option value="efectivo">Efectivo</option>
													<option value="mercadopago">Mercado pago</option>
												</Field>
											</div>
											{/* Adjust height of arrow if needed */}
										</div>

										<div className="flex flex-col gap-4">
											{couponCodes.map((coupon, index) => (
												<div
													key={index}
													className={`flex flex-col w-full gap-2 transition-all duration-300`}
												>
													<div className="flex flex-row gap-2 px-3 items-center">
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

														<MyTextInput
															name={`couponCode${index}`}
															type="text"
															placeholder={
																index === 0
																	? "¿Tienes algún cupón?"
																	: "¿Tienes otro código?"
															}
															value={couponCodes[index]}
															onChange={(e) => {
																handleCouponChange(index, e.target.value);
																handleVoucherValidation(index, setFieldValue); // Inicia la validación automáticamente
															}}
															className="bg-transparent px-0 h-10 text-opacity-20 outline-none w-full"
														/>

														{/* Mostrar spinner mientras se valida */}
														{isValidating[index] ? (
															<div
																className="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] text-black"
																role="status"
															>
																<span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
																	Loading...
																</span>
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

													{/* Mostrar el mensaje de código válido o inválido */}
													{voucherStatus[index] &&
														voucherStatus[index] !== "¡Código válido!" && (
															<div className="flex flex-row h-10 justify-between px-3 items-start">
																<div className="flex flex-row items-center gap-2">
																	<p className="bg-transparent px-0 text-opacity-20 w-full">
																		{voucherStatus[index]}
																	</p>
																</div>
															</div>
														)}

													{/* Añadir automáticamente un nuevo campo si el código actual es válido */}
													{voucherStatus[index] === "¡Código válido!" &&
														index === couponCodes.length - 1 &&
														addCouponField()}
												</div>
											))}
										</div>
									</div>
								</div>

								<div className="flex justify-center flex-col mt-6 items-center">
									<p className="text-2xl font-bold">Resumen</p>
									<div className="flex flex-row justify-between w-full">
										<p>Productos</p>
										<p>{currencyFormat(discountedTotal)}</p>
									</div>
									<div className="flex flex-row justify-between w-full">
										<p>Envio</p>
										<p>{currencyFormat(envio)}</p>
									</div>
									<div className="flex flex-row justify-between w-full">
										<p>Descuentos</p>
										<p>-{currencyFormat(descuento)}</p>
									</div>
									<div className="flex flex-row justify-between w-full">
										<p className="font-bold">Total</p>
										<p className="font-bold">
											{currencyFormat(discountedTotal + envio)}
										</p>
									</div>
								</div>
								{values.paymentMethod === "mercadopago" ? (
									<Payment
										cart={cart} // Pasamos el carrito de compras al componente hijo
										values={values} // Pasamos los valores de la dirección, teléfono, etc.
										discountedTotal={discountedTotal} // Total con descuentos
										envio={envio} // Costo de envío
										mapUrl={mapUrl} // URL del mapa
										couponCodes={couponCodes} // Códigos de cupones
									/>
								) : (
									<button
										type="submit"
										disabled={isSubmitting}
										className="text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100  rounded-3xl h-[80px] font-bold hover:bg-red-600 transition-colors duration-300"
									>
										Pedir
									</button>
								)}
							</div>
						</Form>
					);
				}}
			</Formik>
		</div>
	);
};

export default FormCustom;
