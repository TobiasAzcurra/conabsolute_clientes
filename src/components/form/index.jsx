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
import { useState } from "react";
import { MapDirection } from "./MapDirection";
import { canjearVoucher } from "../../firebase/validateVoucher";
import Payment from "../mercadopago/Payment";
import SignInButton from "../google/SignInButton";
import Navbar from "../Navbar";

const calculateDiscountedTotal = (cart, numCupones) => {
  // 1. Calcular la cantidad de hamburguesas a las que se aplicará el descuento
  const discountedBurgersCount = numCupones * 2;

  // 2. Crear un array con todas las hamburguesas, repitiendo según su cantidad
  let allBurgers = [];
  cart.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      allBurgers.push({
        price: item.price,
        toppingsPrice: item.toppings.reduce(
          (sum, topping) => sum + topping.price,
          0,
        ),
      });
    }
  });

  // 3. Ordenar las hamburguesas de mayor a menor precio total
  allBurgers.sort(
    (a, b) => b.price + b.toppingsPrice - (a.price + a.toppingsPrice),
  );

  // 4. Seleccionar las hamburguesas mas caras según la cantidad de cupones
  const discountedBurgers = allBurgers.slice(0, discountedBurgersCount);

  // 5. Calcular el total de las hamburguesas con descuento
  const discountedTotal =
    discountedBurgers.reduce(
      (sum, burger) => sum + burger.price + burger.toppingsPrice,
      0,
    ) / 2;

  // 6. Calcular el total del resto del carrito
  const remainingBurgers = allBurgers.slice(discountedBurgersCount);
  const remainingTotal = remainingBurgers.reduce(
    (sum, burger) => sum + burger.price + burger.toppingsPrice,
    0,
  );

  // 7. Sumar ambos totales
  const finalTotal = discountedTotal + remainingTotal;

  return finalTotal;
};

const envio = parseInt(import.meta.env.VITE_ENVIO);
const FormCustom = ({ cart, total }) => {
  const handlePaymentSuccess = async (payment) => {
    console.log("Pago exitoso, guardando pedido...");
  };

  const handlePaymentFailure = (payment) => {
    console.error("Pago fallido:", payment);
    // Manejar el fallo del pago (mostrar un mensaje al usuario, etc.)
  };

  const handlePaymentPending = (payment) => {
    console.warn("Pago en proceso:", payment);
    // Manejar pagos pendientes
  };
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

  return (
    <div className="flex mt-2  mr-4 mb-10 min-h-screen  ml-4 flex-col">
      <ArrowBack />
      <Formik
        initialValues={{
          subTotal: discountedTotal,
          phone: "",
          deliveryMethod: "delivery",
          references: "",
          paymentMethod: "",
          money: "",
          address: "",
          hora: "",
          efectivoCantidad: 0,
          mercadopagoCantidad: 0,
        }}
        onSubmit={async (values) => {
          if (values.paymentMethod === "mercadopago") {
          }
          // handleSubmit(
          //   values,
          //   cart,
          //   discountedTotal,
          //   envio,
          //   mapUrl,
          //   values.address,
          //   couponCodes,
          // );
          // dispatch(addLastCart());
          // dispatch(clearCart());

          // navigate("/menu");
        }}
        // validationSchema={formValidations}
      >
        {({ getFieldProps, isSubmitting, setFieldValue, values }) => {
          const handleEfectivoChange = (e) => {
            const montoEfectivo = parseFloat(e.target.value) || 0;
            const montoMercadoPago = Math.max(
              discountedTotal + envio - montoEfectivo,
              0,
            );
            setFieldValue("efectivoCantidad", montoEfectivo);
            setFieldValue("mercadopagoCantidad", montoMercadoPago);
          };

          const handleMercadoPagoChange = (e) => {
            const montoMercadoPago = parseFloat(e.target.value) || 0;
            const montoEfectivo = Math.max(
              discountedTotal + envio - montoMercadoPago,
              0,
            );
            setFieldValue("mercadopagoCantidad", montoMercadoPago);
            setFieldValue("efectivoCantidad", montoEfectivo);
          };
          return (
            <Form>
              <div className="flex flex-col mb-2">
                <Navbar />
                <a className="font-antonio mb-2 mt-1 font-bold text-2xl">
                  TELEFONO:
                </a>
                <MyTextInput
                  name="phone"
                  type="number"
                  placeholder="PARA PODER CONTACTARNOS..."
                  autoComplete="phone"
                />
                <a className="font-antonio  font-bold text-2xl">
                  FORMA DE PAGO:
                </a>
                {/* Enlace para mostrar el campo del cupón */}
                <div className="flex flex-col ">
                  <div className="flex flex-col">
                    <a
                      className="font-antonio mb-2 font-bold text-xs text-black cursor-pointer"
                      onClick={() => setShowCouponInput(!showCouponInput)}
                    >
                      ¿Tenes un codigo de descuento? Clickea aca
                    </a>

                    {/* Mostrar los campos de cupones */}
                    {showCouponInput &&
                      couponCodes.map((coupon, index) => (
                        <div key={index} className="flex flex-col w-full  ">
                          <div className="flex flex-row">
                            <MyTextInput
                              name={`couponCode${index}`}
                              type="text"
                              placeholder="INGRESA TU CODIGO"
                              value={couponCodes[index]}
                              onChange={(e) =>
                                handleCouponChange(index, e.target.value)
                              }
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
                    {showCouponInput && (
                      <div className="flex  gap-1 mb-4">
                        <button
                          type="button"
                          onClick={addCouponField}
                          className="  font-antonio  text-black text-xs  font-bold "
                        >
                          ¿Tenes mas cupones? Clickea aca.
                        </button>
                        <div className="text-xs font-bold font-antonio  ">
                          Monto actual con envio: ${discountedTotal + envio}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-row  md:w-6/12 justify-between ">
                  <MyRadioGroup
                    name="paymentMethod"
                    options={[
                      { value: "efectivo", label: "EFECTIVO" },
                      { value: "mercadopago", label: "MERCADOPAGO" },
                      { value: "ambos", label: "UTILIZAR AMBOS" },
                    ]}
                  />
                </div>
                {getFieldProps("paymentMethod").value === "ambos" && (
                  <div className="flex flex-col ">
                    <label className="font-antonio uppercase mb-2 font-bold text-2xl">
                      Pago en Efectivo:
                    </label>
                    <MyTextInput
                      name="efectivoCantidad"
                      type="number"
                      placeholder="Monto a pagar en efectivo"
                      onChange={handleEfectivoChange}
                      value={values.efectivoCantidad || ""}
                    />
                    <label className="font-antonio uppercase mb-2 font-bold text-2xl ">
                      Pago con MercadoPago:
                    </label>
                    <MyTextInput
                      name="mercadopagoCantidad"
                      type="number"
                      placeholder="Monto a pagar con MercadoPago"
                      value={values.mercadopagoCantidad || ""}
                      onChange={handleMercadoPagoChange}
                    />
                  </div>
                )}
                <a className="font-antonio mb-[-15px] font-bold text-2xl">
                  DIRECCION:
                </a>
              </div>

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
                <div className="mt-4">
                  <MyTextInput
                    name="address"
                    type="text"
                    placeholder="Ingresa tu direccion manualmente"
                  />
                </div>
              )}

              <div className="flex flex-col mb-2 mt-8">
                <a className="font-antonio mb-2 font-bold text-2xl">
                  ACLARACIONES PARA EL CADETE:
                </a>

                <MyTextInput
                  label="Referencias"
                  name="references"
                  type="text"
                  placeholder="PISO, COLOR, PLANTAS, ARBOLES, ENTRE OTROS"
                  autoComplete="off"
                />
              </div>
              <a
                className="font-antonio mb-2 font-bold text-xs text-black cursor-pointer"
                onClick={() => setShowReservaInput(!showReservaInput)}
              >
                ¿Queres reservar para mas tarde? Clickea aca
              </a>

              {/* Campo del cupón, visible solo cuando showCouponInput es true */}
              {showReservaInput && (
                <Field
                  as="select"
                  name="hora"
                  className="font-antonio focus:border-none focus:outline-none  bg-gray-300 text-xs p-2 mb-2 text-gray-400 md:w-6/12 w-full"
                >
                  <option value="">SELECCIONA UNA HORA</option>
                  <option value="20:30">20:30</option>
                  <option value="21:00">21:00</option>
                  <option value="21:30">21:30</option>
                  <option value="22:00">22:00</option>
                  <option value="22:30">22:30</option>
                  <option value="23:00">23:00</option>
                  <option value="23:30">23:30</option>
                  <option value="00:00">00:00</option>
                </Field>
              )}

              {values.paymentMethod === "mercadopago" ? (
                <Payment
                  cart={cart} // Pasamos el carrito de compras al componente hijo
                  values={values} // Pasamos los valores de la dirección, teléfono, etc.
                  discountedTotal={discountedTotal} // Total con descuentos
                  envio={envio} // Costo de envío
                  mapUrl={mapUrl} // URL del mapa
                  couponCodes={couponCodes} // Códigos de cupones
                  onPaymentSuccess={handlePaymentSuccess} // Manejar éxito del pago
                  onPaymentFailure={handlePaymentFailure} // Manejar fallo del pago
                  onPaymentPending={handlePaymentPending} // Manejar pagos pendientes
                />
              ) : (
                <button
                  type="submit"
                  className="w-full flex flex-row md:w-6/12 justify-center mt-2 py-4 text-white font-bold font-kotch text-xl bg-red-main focus:outline-none hover:bg-black hover:text-red-main  gap-1"
                  disabled={isSubmitting}
                >
                  pedir
                  <img src={fire} className="h-6" />
                </button>
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default FormCustom;
