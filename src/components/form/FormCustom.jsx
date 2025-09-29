// components/form/FormCustom.jsx - Con validación de descuentos desde Firebase
import { Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import validations from "./validations";
import handleSubmit from "./handleSubmit";
import {
  handlePOSSubmit,
  adaptCartToPOSFormat,
} from "../../utils/orderProcessing";
import LoadingPoints from "../LoadingPoints";
import { useClient } from "../../contexts/ClientContext";
import { useFormStates } from "../../hooks/useFormStates";
import AddressInputs from "./AddressInputs";
import OrderSummary from "./OrderSummary";
import { adjustHora } from "../../helpers/time";
import { extractCoordinates } from "../../helpers/currencyFormat";
import { cleanPhoneNumber } from "../../firebase/utils/phoneUtils";
import { addTelefonoCliente } from "../../firebase/orders/uploadOrder";
import { obtenerFechaActual } from "../../firebase/utils/dateHelpers";
import { isBusinessOpen } from "../../utils/businessHoursValidator";
import { useDiscountCode } from "../../hooks/useDiscountCode";
import SimpleModal from "../ui/SimpleModal";

const FormCustom = ({ cart, total }) => {
  const navigate = useNavigate();
  const { addLastCart, clearCart, cartItems } = useCart();

  const {
    slugEmpresa,
    slugSucursal,
    empresaId,
    sucursalId,
    clientConfig,
    clientData,
    clientAssets,
  } = useClient();

  const envio = clientConfig?.logistics?.deliveryFee || 2000;
  const expressDeliveryFee = clientConfig?.logistics?.expressFee || 2000;

  const [mapUrl, setUrl] = useState("");
  const [validarUbi, setValidarUbi] = useState(false);
  const [noEncontre, setNoEncontre] = useState(false);
  const [isProcessingStock, setIsProcessingStock] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const [discountError, setDiscountError] = useState("");

  const { isEnabled, handleExpressToggle } = useFormStates(expressDeliveryFee);

  // Hook de descuentos
  const discountHook = useDiscountCode(empresaId, sucursalId);

  // Crear enterpriseData para StockManager
  const enterpriseData = {
    id: empresaId,
    selectedSucursal: { id: sucursalId },
  };

  const processPedido = async (
    values,
    isReserva,
    message = "",
    appliedDiscount = null
  ) => {
    try {
      setIsProcessingStock(true);

      let hora = values.hora;
      if (isReserva) hora = adjustHora(values.hora);

      // Extraer coordenadas del mapUrl
      const coordinates = mapUrl ? extractCoordinates(mapUrl) : [0, 0];

      if (values.deliveryMethod === "delivery" && mapUrl) {
        console.log("📍 Coordenadas extraídas:", coordinates);
      }

      const updatedValues = {
        ...values,
        hora,
        envioExpress: isEnabled ? expressDeliveryFee : 0,
        shipping: values.deliveryMethod === "delivery" ? envio : 0,
        coordinates,
        // Agregar info de descuento si existe
        appliedDiscount,
      };

      console.log("🚀 Iniciando procesamiento con nuevo schema POS");

      // Intentar usar el nuevo sistema con StockManager
      try {
        const posCartItems = adaptCartToPOSFormat(cartItems);

        console.log("📦 Items para procesar:", posCartItems.length);

        const orderId = await handlePOSSubmit(
          updatedValues,
          posCartItems,
          enterpriseData,
          clientData
        );

        if (orderId) {
          // Guardar teléfono del cliente
          const phone = String(updatedValues.phone) || "";
          if (phone) {
            try {
              await addTelefonoCliente(
                empresaId,
                sucursalId,
                phone,
                obtenerFechaActual()
              );
              localStorage.setItem("customerPhone", cleanPhoneNumber(phone));
            } catch (phoneError) {
              console.warn("Error guardando teléfono:", phoneError);
            }
          }

          console.log("✅ Pedido procesado exitosamente con ID:", orderId);

          navigate(`/${slugEmpresa}/${slugSucursal}/success/${orderId}`);
          addLastCart();
          clearCart();

          return;
        }
      } catch (stockError) {
        console.error("❌ Error con nuevo sistema POS:", stockError);

        // Fallback: usar sistema anterior
        console.log("🔄 Fallback a sistema anterior...");

        const submitConfig = {
          empresaId,
          sucursalId,
          envio,
          mapUrl,
          couponCodes: [],
          descuento: appliedDiscount?.discount || 0,
          isPending: clientConfig?.logistics?.pendingOfBeingAccepted || false,
          priceFactor: 1,
        };

        const orderId = await handleSubmit(
          updatedValues,
          cart,
          submitConfig,
          message,
          clientData
        );

        if (orderId) {
          navigate(`/${slugEmpresa}/${slugSucursal}/success/${orderId}`);
          addLastCart();
          clearCart();
        }
      }
    } catch (err) {
      console.error("❌ Error general en processPedido:", err);
      alert("Error al procesar el pedido. Por favor intenta nuevamente.");
    } finally {
      setIsProcessingStock(false);
    }
  };

  const handleFormSubmit = async (values) => {
    const isReserva = values.hora.trim() !== "";

    // 1. Validar horarios si NO es reserva
    if (!isReserva) {
      const businessHours = clientConfig?.logistics?.businessHours;
      const status = isBusinessOpen(businessHours);

      if (!status.isOpen) {
        setClosedMessage(status.message);
        setShowClosedModal(true);
        return;
      }
    }

    // 2. Validar código de descuento si existe
    let appliedDiscount = null;
    setDiscountError("");

    if (discountHook.code && discountHook.code.trim()) {
      const productsTotal = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      const discountResult = await discountHook.validateFull(
        cart,
        productsTotal,
        values.deliveryMethod,
        values.paymentMethod
      );

      if (!discountResult.isValid) {
        setDiscountError(discountResult.message);
        return; // Detener envío si código inválido
      }

      appliedDiscount = discountResult;
      console.log("✅ Descuento aplicado:", appliedDiscount);
    }

    // 3. Procesar pedido
    console.log("Submitting form with values:", values);
    await processPedido(values, isReserva, "", appliedDiscount);
  };

  return (
    <>
      {/* Modal de negocio cerrado */}
      <SimpleModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        title="Estamos cerrados"
        message={closedMessage}
      />

      {/* Modal de error de descuento */}
      <SimpleModal
        isOpen={!!discountError}
        onClose={() => setDiscountError("")}
        title="Código de descuento"
        message={discountError}
      />

      <div className="flex px-4 flex-col">
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
            font-size: 0.75rem;
          }
          .custom-select::placeholder {
            color: rgba(0, 0, 0, 0.5);
          }
        `}</style>

        {/* Indicador de procesamiento de stock */}
        {isProcessingStock && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-600">
                Procesando stock y creando pedido...
              </p>
            </div>
          </div>
        )}

        <Formik
          initialValues={{
            subTotal: total,
            phone: "",
            deliveryMethod: "delivery",
            references: "",
            paymentMethod: "cash",
            hora: "",
            couponCode: "",
            address: "",
            deliveryNotes: "",
          }}
          validationSchema={validations(total + envio, cart)}
          onSubmit={handleFormSubmit}
        >
          {({ values, setFieldValue, isSubmitting, submitForm, errors }) => {
            const productsTotal = cart.reduce(
              (acc, item) => acc + item.price * item.quantity,
              0
            );

            // Calcular descuento solo para UI (validación real en submit)
            let descuento = 0;
            if (
              discountHook.basicValidation.isValid &&
              discountHook.basicValidation.checked
            ) {
              // Mostrar descuento aproximado (se validará exacto en submit)
              descuento = Math.round(productsTotal * 0.1); // Placeholder visual
            }

            let finalTotal = productsTotal - descuento;
            if (values.deliveryMethod === "delivery") finalTotal += envio;
            if (isEnabled) finalTotal += expressDeliveryFee;

            return (
              <Form>
                <div className="flex flex-col">
                  {/* Toggle entre delivery y retiro */}
                  <div className="flex flex-row gap-1 mb-4 p-0.5 bg-gray-300 w-fit rounded-full">
                    <button
                      type="button"
                      className={`h-10 px-4 text-xs flex items-center justify-center gap-2 rounded-full ${
                        values.deliveryMethod === "delivery"
                          ? "bg-gray-100 text-black"
                          : "bg-gray-300 text-gray-400"
                      }`}
                      onClick={() =>
                        setFieldValue("deliveryMethod", "delivery")
                      }
                    >
                      <p className="font-light">Delivery</p>
                    </button>
                    <button
                      type="button"
                      className={`h-10 px-4 text-xs flex flex-col items-center justify-center rounded-full ${
                        values.deliveryMethod === "takeaway"
                          ? "bg-gray-100 text-black"
                          : "bg-gray-300 text-gray-400"
                      }`}
                      onClick={() =>
                        setFieldValue("deliveryMethod", "takeaway")
                      }
                    >
                      <p className="font-light">Retiro</p>
                    </button>
                  </div>

                  {/* Datos de entrega */}
                  <AddressInputs
                    values={values}
                    setFieldValue={setFieldValue}
                    setUrl={setUrl}
                    setValidarUbi={setValidarUbi}
                    setNoEncontre={setNoEncontre}
                    cart={cart}
                    discountHook={discountHook}
                  />

                  {/* Resumen */}
                  <OrderSummary
                    productsTotal={productsTotal}
                    envio={envio}
                    expressFee={isEnabled ? expressDeliveryFee : 0}
                    expressBaseFee={expressDeliveryFee}
                    finalTotal={finalTotal}
                    descuento={descuento}
                    handleExpressToggle={handleExpressToggle}
                    isEnabled={isEnabled}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || isProcessingStock}
                    className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-blue-apm text-gray-100 rounded-3xl h-20 font-bold hover:bg-blue-600 transition-colors duration-300 ${
                      isSubmitting || isProcessingStock
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isSubmitting || isProcessingStock ? (
                      <LoadingPoints color="text-gray-100" />
                    ) : (
                      "Pedir"
                    )}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default FormCustom;
