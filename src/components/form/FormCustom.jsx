// components/form/FormCustom.jsx - Con actualización de stock sin recargar
import { Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
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
  const { addLastCart, clearCart, cartItems, updateCartItem } = useCart();

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
  const [showStockUpdateModal, setShowStockUpdateModal] = useState(false);
  const [pendingSubmitValues, setPendingSubmitValues] = useState(null);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [pendingDelaySubmit, setPendingDelaySubmit] = useState(null);

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

  // Función para actualizar versiones de stock del carrito
  const updateCartStockVersions = async () => {
    try {
      setIsProcessingStock(true);

      for (const itemId in cartItems) {
        const item = cartItems[itemId];

        const productRef = doc(
          db,
          "absoluteClientes",
          empresaId,
          "sucursales",
          sucursalId,
          "productos",
          item.productId
        );

        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          const productData = productDoc.data();
          const variant = productData.variants?.find(
            (v) => v.id === item.variantId
          );

          if (variant) {
            // Actualizar usando updateCartItem
            updateCartItem(itemId, {
              stockVersion: variant.stockSummary?.version || 0,
              availableStock: variant.stockSummary?.totalStock || 0,
            });

            console.log(
              `✅ Actualizado ${item.productName}: version ${item.stockVersion} → ${variant.stockSummary?.version}`
            );
          }
        }
      }

      console.log("✅ Versiones de stock actualizadas exitosamente");

      setShowStockUpdateModal(false);

      // Reintentar el submit
      if (pendingSubmitValues) {
        await processPedido(
          pendingSubmitValues.values,
          pendingSubmitValues.isReserva,
          pendingSubmitValues.appliedDiscount
        );
      }
    } catch (error) {
      console.error("Error actualizando versiones de stock:", error);
      alert("Error al actualizar el stock. Por favor intenta nuevamente.");
    } finally {
      setIsProcessingStock(false);
    }
  };

  const processPedido = async (values, isReserva, appliedDiscount = null) => {
    try {
      setIsProcessingStock(true);

      let hora = values.hora;

      // Solo ajustar hora si es una reserva explícita del usuario
      // Si viene del delay, ya tiene el formato correcto
      if (isReserva && !values.hora.includes(":")) {
        hora = adjustHora(values.hora);
      }

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

      if (err.message.includes("RACE_CONDITION")) {
        setPendingSubmitValues({ values, isReserva, appliedDiscount });
        setShowStockUpdateModal(true);
      } else if (err.message.includes("INSUFFICIENT_STOCK")) {
        alert(
          "❌ No hay suficiente stock disponible.\n\n" +
            "Por favor verificá las cantidades disponibles."
        );
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

  const processPedidoWithDelay = async (values, isReserva, appliedDiscount) => {
    const delayConfig = clientConfig?.operaciones?.delay;
    const delayMinutes = delayConfig?.minutes || 0;

    // Actualizar valores con el delay
    const updatedValues = {
      ...values,
      delayMinutes: delayMinutes, // ← PASAR AL PROCESSING
    };

    console.log(`⏰ Aplicando delay de ${delayMinutes} minutos`);

    // Procesar normalmente (sin hora específica)
    await processPedido(updatedValues, false, appliedDiscount);
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

    // 3. ✅ NUEVO: Verificar si hay delay activo
    const delayConfig = clientConfig?.operaciones?.delay;

    if (delayConfig?.isActive && !isReserva) {
      // Verificar si el delay no ha expirado
      const now = new Date();
      const expiresAt = new Date(delayConfig.expiresAt);

      if (now < expiresAt) {
        setDelayMinutes(delayConfig.minutes || 15);
        setPendingDelaySubmit({ values, isReserva, appliedDiscount });
        setShowDelayModal(true);
        return;
      }
    }

    // 4. Procesar pedido normalmente
    await processPedido(values, isReserva, appliedDiscount);
  };

  return (
    <>
      <SimpleModal
        isOpen={showDelayModal}
        onClose={() => {
          setShowDelayModal(false);
          setPendingDelaySubmit(null);
        }}
        title="Hay demora en los pedidos"
        message={`Actualmente hay una demora de ${delayMinutes} minutos. ¿Aceptás esperar este tiempo adicional?`}
        twoButtons={true}
        cancelText="No"
        confirmText="Sí, acepto"
        onConfirm={async () => {
          setShowDelayModal(false);
          if (pendingDelaySubmit) {
            await processPedidoWithDelay(
              pendingDelaySubmit.values,
              pendingDelaySubmit.isReserva,
              pendingDelaySubmit.appliedDiscount
            );
          }
        }}
      />
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

      <SimpleModal
        isOpen={showStockUpdateModal}
        onClose={() => {
          setShowStockUpdateModal(false);
          setPendingSubmitValues(null);
        }}
        title="Stock actualizado"
        message="Alguien compró antes que vos. Actualizá tu versión de stock para poder continuar."
        twoButtons={true}
        cancelText="Cancelar"
        confirmText="Actualizar stock"
        onConfirm={updateCartStockVersions}
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
                    className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-primary text-gray-100 rounded-3xl h-20 font-bold  transition-colors duration-300 ${
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
