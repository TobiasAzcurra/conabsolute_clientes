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
import calculateDiscountedTotal from "../../helpers/currencyFormat";
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
  const [voucherStatus, setVoucherStatus] = useState([""]);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showReservaInput, setShowReservaInput] = useState(false);

  // Agregar estados necesarios para MercadoPago
  const [preferenceId, setPreferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const addCouponField = () => {
    setCouponCodes([...couponCodes, ""]); // Añadir un nuevo campo vacío
    setVoucherStatus([...voucherStatus, ""]); // Añadir un nuevo status vacío para el nuevo cupón
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
  const handleVoucherValidation = async (index, setFieldValue) => {
    // Primero, validar si el cupón ya fue ingresado en otro input
    if (couponCodes.indexOf(couponCodes[index]) !== index) {
      const updatedVoucherStatus = [...voucherStatus];
      updatedVoucherStatus[index] = "Este codigo ya fue ingresado.";
      setVoucherStatus(updatedVoucherStatus);
      return; // Detener la validación si hay un duplicado
    }

    // Validar que haya al menos el número de hamburguesas necesarias en el carrito
    const numCoupons = couponCodes.length;
    const hasEnoughBurgers = validarCantidadDeBurgers(cart, numCoupons);

    if (!hasEnoughBurgers) {
      const updatedVoucherStatus = [...voucherStatus];
      updatedVoucherStatus[index] = `Necesitas al menos ${
        numCoupons * 2
      } hamburguesas para canjear los vouchers.`;
      setVoucherStatus(updatedVoucherStatus);
      return; // Detener la ejecución si no hay suficientes hamburguesas
    }

    try {
      // Proceder a validar el voucher solo si no está duplicado y hay suficientes hamburguesas
      const isValid = await canjearVoucher(couponCodes[index]);

      const updatedVoucherStatus = [...voucherStatus];
      if (isValid) {
        // Calcular el total con el descuento del cupón actual
        const newTotal = calculateDiscountedTotal(cart, couponCodes.length);
        setDiscountedTotal(newTotal);
        updatedVoucherStatus[index] = "¡codigo válido!";

        // Borrar los valores de los inputs de pago
        setFieldValue("efectivoCantidad", "");
        setFieldValue("mercadopagoCantidad", "");
      } else {
        updatedVoucherStatus[index] = "codigo no válido.";
      }
      setVoucherStatus(updatedVoucherStatus);
    } catch (error) {
      const updatedVoucherStatus = [...voucherStatus];
      updatedVoucherStatus[index] = "Error al validar el cupón.";
      setVoucherStatus(updatedVoucherStatus);
      console.error("Error al validar el cupón:", error);
    }
  };

  useEffect(() => {
    setDiscountedTotal(total);
  }, [total]);

  return (
    <div className="flex mt-2  mr-4 mb-10 min-h-screen  ml-4 flex-col">
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
        }}
        onSubmit={async (values) => {
          if (values.paymentMethod === "efectivo") {
            const orderId = await handleSubmit(
              values,
              cart,
              discountedTotal,
              envio,
              mapUrl,
              couponCodes,
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
        // validationSchema={formValidations}
      >
        {({ getFieldProps, isSubmitting, setFieldValue, values }) => {
          return (
            <Form>
              <div className="flex flex-col mb-2">
                <div className="flex justify-center flex-col mt-3.5 items-center px-4">
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

                    <div className="flex flex-row justify-between px-3 h-10 items-center border border-black border-opacity-20">
                      <div className="flex flex-row gap-2">
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

                        <MyTextInput
                          name="phone"
                          type="text"
                          placeholder="Tu numero de telefono"
                          autoComplete="phone"
                          className="bg-white text-opacity-20 text-black outline-none w-full px-2" // Fondo blanco, texto negro, sin borde por defecto
                        />
                      </div>
                    </div>
                    <div className="flex flex-row justify-between px-3 h-10 items-center border-b border-black border-opacity-20">
                      <div className="flex flex-row gap-2">
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
                          className="bg-white text-opacity-20 text-black outline-none w-full px-2"
                        >
                          <option value="">
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
                        placeholder="¿Queres dejar alguna aclaracion?"
                        autoComplete="off"
                        className="bg-white text-opacity-20 text-black outline-none w-full px-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center flex-col mt-6 items-center px-4">
                  <p className="text-2xl font-bold mb-2">Metodo de pago</p>
                  <div className="w-full items-center rounded-3xl border-2 border-black ">
                    <div className="flex flex-row justify-between px-3 h-10 items-center border border-black rounded-t-3xl border-opacity-20">
                      <div className="flex flex-row gap-2">
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
                          className="bg-white text-opacity-20 text-black outline-none w-full px-2"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="mercadopago">Mercado pago</option>
                        </Field>
                      </div>
                      <img src={arrow} className="h-2" alt="" />
                    </div>
                    <div className="flex flex-col gap-4">
                      {couponCodes.map((coupon, index) => (
                        <div key={index} className="flex flex-col w-full gap-2">
                          <div className="flex flex-row gap-2 pl-3 h-10 items-center">
                            <MyTextInput
                              name={`couponCode${index}`}
                              type="text"
                              placeholder="INGRESA TU CODIGO"
                              value={couponCodes[index]}
                              onChange={(e) =>
                                handleCouponChange(index, e.target.value)
                              }
                              className="bg-white text-opacity-20 text-black outline-none w-full px-2"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleVoucherValidation(index, setFieldValue)
                              }
                              className="p-2 mb-2 font-antonio text-white text-xs font-bold bg-red-main"
                            >
                              VALIDAR
                            </button>
                          </div>
                          {voucherStatus[index] && (
                            <p
                              className={`text-xs mb-2 font-antonio ${
                                voucherStatus[index] === "¡codigo válido!"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {voucherStatus[index]}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Botón de agregar más cupones, separado de los inputs */}
                      <button
                        type="button"
                        onClick={addCouponField}
                        className="mt-4 font-antonio text-black text-xs font-bold"
                      >
                        ¿Tenes más cupones? Clickea acá.
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center flex-col mt-6 items-center">
                  <p className="text-2xl font-bold">Resumen</p>
                  <div className="flex flex-row justify-between w-full px-4">
                    <p>Productos</p>
                    <p>{currencyFormat(total)}</p>
                  </div>
                  <div className="flex flex-row justify-between w-full px-4">
                    <p>Envio</p>
                    <p>{currencyFormat(envio)}</p>
                  </div>
                  <div className="flex flex-row justify-between w-full px-4">
                    <p>Descuentos</p>
                    <p>-$900</p>
                  </div>
                  <div className="flex flex-row justify-between w-full px-4">
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
                    className="text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 mx-4 rounded-3xl h-[80px] font-bold hover:bg-red-600 transition-colors duration-300"
                  >
                    Pedir
                    <img src={fire} className="h-6" />
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
