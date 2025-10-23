import { Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { db } from "../../firebase/config";
import { StockManager } from "../../utils/stockManager";
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
import { extractCoordinates } from "../../helpers/currencyFormat";
import { isBusinessOpen } from "../../utils/businessHoursValidator";
import { useDiscountCode } from "../../hooks/useDiscountCode";
import SimpleModal from "../ui/SimpleModal";
import { useAvailableFulfillmentMethods } from "../../hooks/useAvailableFulfillmentMethods";
import { parseTimeToTimestamp } from "../../utils/timestampHelpers";

const FormCustom = ({ cart, total }) => {
  const navigate = useNavigate();
  const { addLastCart, clearCart, cartItems, updateCartItem, subtotal } =
    useCart();
  const {
    slugEmpresa,
    slugSucursal,
    empresaId,
    sucursalId,
    clientConfig,
    clientData,
  } = useClient();
  const stockManager = new StockManager({
    id: empresaId,
    selectedSucursal: { id: sucursalId },
  });
  const envio = clientConfig?.logistics?.deliveryFee || 2000;
  const expressDeliveryFee = clientConfig?.logistics?.expressFee || 2000;
  const timezone =
    clientConfig?.regional?.timezone || "America/Argentina/Buenos_Aires";

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
    currentPaymentMethod,
    subtotal,
    timezone
  );
  const availableMethods = useAvailableFulfillmentMethods(cartItems);

  const updateCartStockVersions = async () => {
    try {
      setIsProcessingStock(true);
      const updatedItems = await stockManager.updateCartStockVersions(
        cartItems
      );
      updatedItems.forEach((item) => {
        updateCartItem(item.id, {
          stockVersion: item.stockVersion,
          availableStock: item.availableStock,
        });
        console.log(
          `Actualizado ${item.productName}: version ${item.stockVersion} → ${item.stockVersion}`
        );
      });
      console.log("Versiones de stock actualizadas exitosamente");
      setShowStockUpdateModal(false);
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
      let estimatedTime = null;
      if (isReserva && values.hora && values.hora.trim() !== "") {
        estimatedTime = parseTimeToTimestamp(values.hora, timezone);
        console.log("Hora de reserva convertida a Timestamp UTC");
      }
      const coordinates = mapUrl ? extractCoordinates(mapUrl) : [0, 0];
      if (values.deliveryMethod === "delivery" && mapUrl) {
        console.log("Coordenadas extraídas:", coordinates);
      }
      const updatedValues = {
        ...values,
        estimatedTime,
        envioExpress: isEnabled ? expressDeliveryFee : 0,
        shipping: values.deliveryMethod === "delivery" ? envio : 0,
        coordinates,
        appliedDiscount,
      };
      console.log("Iniciando procesamiento con schema POS");
      const posCartItems = adaptCartToPOSFormat(cartItems);
      console.log("Items para procesar:", posCartItems.length);
      const orderId = await handlePOSSubmit(
        updatedValues,
        posCartItems,
        { id: empresaId, selectedSucursal: { id: sucursalId } },
        clientData
      );
      if (orderId) {
        console.log("Pedido procesado exitosamente con ID:", orderId);
        navigate(`/${slugEmpresa}/${slugSucursal}/success/${orderId}`);
        addLastCart();
        clearCart();
      }
    } catch (err) {
      console.error("Error al procesar el pedido:", err);
      if (err.message.includes("RACE_CONDITION")) {
        setPendingSubmitValues({ values, isReserva, appliedDiscount });
        setShowStockUpdateModal(true);
      } else if (err.message.includes("INSUFFICIENT_STOCK")) {
        alert(
          "No hay suficiente stock disponible.\n\nPor favor verificá las cantidades disponibles."
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
    const updatedValues = {
      ...values,
      delayMinutes: delayMinutes,
    };
    console.log(`Aplicando delay de ${delayMinutes} minutos`);
    await processPedido(updatedValues, false, appliedDiscount);
  };

  const handleFormSubmit = async (values) => {
    const isReserva = values.hora.trim() !== "";
    if (!isReserva) {
      const businessHours = clientConfig?.logistics?.businessHours;
      const status = isBusinessOpen(businessHours);
      if (!status.isOpen) {
        setClosedMessage(status.message);
        setShowClosedModal(true);
        return;
      }
    }
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
    const delayConfig = clientConfig?.operaciones?.delay;
    if (delayConfig?.isActive && !isReserva) {
      const now = new Date();
      const tsToDate = (ts) => {
        if (!ts) return null;
        if (typeof ts.toDate === "function") return ts.toDate();
        return new Date(ts);
      };
      const expiresAt = tsToDate(delayConfig?.expiresAt);
      if (delayConfig?.isActive && !isReserva && expiresAt && now < expiresAt) {
        setDelayMinutes(delayConfig.minutes || 15);
        setPendingDelaySubmit({ values, isReserva, appliedDiscount });
        setShowDelayModal(true);
        return;
      }
    }
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
            deliveryMethod: availableMethods.delivery.available
              ? "delivery"
              : "takeaway",
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
            const productsTotal = subtotal;
            const descuento = discountHook.validation.isValid
              ? discountHook.validation.discount
              : 0;
            let finalTotal = productsTotal - descuento;
            if (values.deliveryMethod === "delivery") finalTotal += envio;
            if (isEnabled) finalTotal += expressDeliveryFee;
            return (
              <Form>
                <div className="flex flex-col">
                  <div className="flex flex-row gap-1 mb-4 p-0.5 shadow-gray-200 shadow-lg bg-gray-300 w-fit rounded-full">
                    <button
                      type="button"
                      disabled={!availableMethods.delivery.available}
                      className={`h-10 px-4 text-xs flex items-center justify-center gap-2 rounded-full ${
                        values.deliveryMethod === "delivery"
                          ? "bg-gray-100 text-black"
                          : !availableMethods.delivery.available
                          ? "bg-red-100 text-red-400 cursor-not-allowed"
                          : "bg-gray-300 text-gray-400"
                      }`}
                      onClick={() =>
                        availableMethods.delivery.available &&
                        setFieldValue("deliveryMethod", "delivery")
                      }
                    >
                      <p className="font-light">Delivery</p>
                    </button>
                    <button
                      type="button"
                      disabled={!availableMethods.takeaway.available}
                      className={`h-10 px-4 text-xs flex flex-col items-center justify-center rounded-full ${
                        values.deliveryMethod === "takeaway"
                          ? "bg-gray-100 text-black"
                          : !availableMethods.takeaway.available
                          ? "bg-red-100 text-red-400 cursor-not-allowed"
                          : "bg-gray-300 text-gray-400"
                      }`}
                      onClick={() =>
                        availableMethods.takeaway.available &&
                        setFieldValue("deliveryMethod", "takeaway")
                      }
                    >
                      <p className="font-light">Retiro</p>
                    </button>
                  </div>
                  {(!availableMethods.delivery.available ||
                    !availableMethods.takeaway.available) && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-xs text-yellow-800 font-light">
                        {!availableMethods.delivery.available && (
                          <>
                            <strong>Delivery no disponible:</strong>{" "}
                            {availableMethods.delivery.blockedBy.join(", ")}{" "}
                            {!availableMethods.takeaway.available
                              ? ""
                              : "solo está disponible para retiro en local."}
                          </>
                        )}
                        {!availableMethods.takeaway.available &&
                          availableMethods.delivery.available && (
                            <>
                              <strong>Retiro no disponible:</strong>{" "}
                              {availableMethods.takeaway.blockedBy.join(", ")}{" "}
                              solo está disponible para delivery.
                            </>
                          )}
                        {!availableMethods.delivery.available &&
                          !availableMethods.takeaway.available && (
                            <>
                              <strong>Productos incompatibles:</strong> Tenés
                              productos que no se pueden pedir juntos. Por favor
                              eliminá algunos del carrito.
                            </>
                          )}
                      </p>
                    </div>
                  )}
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
                    className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-primary text-gray-100 rounded-3xl h-20 font-bold transition-colors duration-300 ${
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
