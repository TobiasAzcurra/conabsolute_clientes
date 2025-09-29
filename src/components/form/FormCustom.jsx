// components/form/FormCustom.jsx - Versión final simplificada
import { Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import validations from "./validations";
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
  } = useClient();

  const envio = clientConfig?.logistics?.deliveryFee || 2000;
  const expressDeliveryFee = clientConfig?.logistics?.expressFee || 2000;

  const [mapUrl, setUrl] = useState("");
  const [validarUbi, setValidarUbi] = useState(false);
  const [noEncontre, setNoEncontre] = useState(false);
  const [isProcessingStock, setIsProcessingStock] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const [showDiscountWarning, setShowDiscountWarning] = useState(false);
  const [pendingSubmitValues, setPendingSubmitValues] = useState(null);

  const [currentDeliveryMethod, setCurrentDeliveryMethod] =
    useState("delivery");
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState("cash");

  const { isEnabled, handleExpressToggle } = useFormStates(expressDeliveryFee);

  const discountHook = useDiscountCode(
    empresaId,
    sucursalId,
    cart,
    currentDeliveryMethod,
    currentPaymentMethod
  );

  const enterpriseData = {
    id: empresaId,
    selectedSucursal: { id: sucursalId },
  };

  const processPedido = async (values, isReserva, appliedDiscount = null) => {
    try {
      setIsProcessingStock(true);

      let hora = values.hora;
      if (isReserva) hora = adjustHora(values.hora);

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
        appliedDiscount,
      };

      console.log("🚀 Iniciando procesamiento con schema POS");

      const posCartItems = adaptCartToPOSFormat(cartItems);

      console.log("📦 Items para procesar:", posCartItems.length);

      const orderId = await handlePOSSubmit(
        updatedValues,
        posCartItems,
        enterpriseData,
        clientData
      );

      if (orderId) {
        console.log("✅ Pedido procesado exitosamente con ID:", orderId);

        navigate(`/${slugEmpresa}/${slugSucursal}/success/${orderId}`);
        addLastCart();
        clearCart();
      }
    } catch (err) {
      console.error("❌ Error al procesar el pedido:", err);

      // Mensajes específicos según tipo de error
      if (err.message.includes("RACE_CONDITION")) {
        alert(
          "⚠️ Alguien compró este producto antes que vos.\n\n" +
            "Por favor recargá la página para ver el stock actualizado."
        );
        // Opcional: recargar automáticamente después de 2 segundos
        setTimeout(() => window.location.reload(), 2000);
      } else if (err.message.includes("INSUFFICIENT_STOCK")) {
        alert(
          "❌ No hay suficiente stock disponible.\n\n" +
            "Por favor recargá la página para ver el stock actualizado."
        );
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert("Error al procesar el pedido. Por favor intenta nuevamente.");
      }
    } finally {
      setIsProcessingStock(false);
    }
  };

  const processPedidoWithoutDiscount = async (values, isReserva) => {
    await processPedido(values, isReserva, null);
  };

  const handleFormSubmit = async (values) => {
    const isReserva = values.hora.trim() !== "";

    // 1. Validar horarios si NO es reserva
    // if (!isReserva) {
    //   const businessHours = clientConfig?.logistics?.businessHours;
    //   const status = isBusinessOpen(businessHours);

    //   if (!status.isOpen) {
    //     setClosedMessage(status.message);
    //     setShowClosedModal(true);
    //     return;
    //   }
    // }

    // 2. Verificar código de descuento
    let appliedDiscount = null;

    if (discountHook.code && discountHook.code.trim()) {
      if (!discountHook.validation.isValid && discountHook.validation.checked) {
        setPendingSubmitValues({ values, isReserva });
        setShowDiscountWarning(true);
        return;
      }

      if (discountHook.validation.isValid) {
        appliedDiscount = {
          isValid: true,
          discount: discountHook.validation.discount,
          discountId: discountHook.validation.discountId,
          discountData: discountHook.validation.discountData,
          message: discountHook.validation.message,
        };
      }
    }

    // 3. Procesar pedido
    console.log("Submitting form with values:", values);
    await processPedido(values, isReserva, appliedDiscount);
  };

  return (
    <>
      <SimpleModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        title="Estamos cerrados"
        message={closedMessage}
      />

      <SimpleModal
        isOpen={showDiscountWarning}
        onClose={() => {
          setShowDiscountWarning(false);
          setPendingSubmitValues(null);
        }}
        title="Código de descuento"
        message={`${discountHook.validation.message}. ¿Querés continuar sin descuento?`}
        twoButtons={true}
        cancelText="Corregir código"
        confirmText="Continuar sin descuento"
        onConfirm={async () => {
          setShowDiscountWarning(false);
          if (pendingSubmitValues) {
            await processPedidoWithoutDiscount(
              pendingSubmitValues.values,
              pendingSubmitValues.isReserva
            );
          }
        }}
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
          {({ values, setFieldValue, isSubmitting }) => {
            useEffect(() => {
              setCurrentDeliveryMethod(values.deliveryMethod);
              setCurrentPaymentMethod(values.paymentMethod);
            }, [values.deliveryMethod, values.paymentMethod]);

            const productsTotal = cart.reduce(
              (acc, item) => acc + item.price * item.quantity,
              0
            );

            const descuento = discountHook.validation.isValid
              ? discountHook.validation.discount
              : 0;

            let finalTotal = productsTotal - descuento;
            if (values.deliveryMethod === "delivery") finalTotal += envio;
            if (isEnabled) finalTotal += expressDeliveryFee;

            return (
              <Form>
                <div className="flex flex-col">
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

                  <AddressInputs
                    values={values}
                    setFieldValue={setFieldValue}
                    setUrl={setUrl}
                    setValidarUbi={setValidarUbi}
                    setNoEncontre={setNoEncontre}
                    cart={cart}
                    discountHook={discountHook}
                  />

                  <OrderSummary
                    productsTotal={productsTotal}
                    envio={envio}
                    expressFee={isEnabled ? expressDeliveryFee : 0}
                    finalTotal={finalTotal}
                    descuento={descuento}
                    handleExpressToggle={handleExpressToggle}
                    isEnabled={isEnabled}
                    deliveryMethod={values.deliveryMethod}
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
