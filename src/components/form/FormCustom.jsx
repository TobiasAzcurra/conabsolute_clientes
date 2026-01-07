import { Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
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
import { useDeliveryDistance } from "../../hooks/useDeliveryDistance";

const FormCustom = ({ cart, total }) => {
  const navigate = useNavigate();
  const {
    addLastCart,
    clearCart,
    cartItems,
    updateCartItem,
    removeFromCart,
    subtotal,
  } = useCart();
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
  const [clientCoordinates, setClientCoordinates] = useState(null);
  const [validarUbi, setValidarUbi] = useState(false);
  const [noEncontre, setNoEncontre] = useState(false);
  const [isProcessingStock, setIsProcessingStock] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const [showDiscountWarning, setShowDiscountWarning] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorList, setErrorList] = useState([]);
  const [pendingSubmitValues, setPendingSubmitValues] = useState(null);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [pendingDelaySubmit, setPendingDelaySubmit] = useState(null);
  const [currentDeliveryMethod, setCurrentDeliveryMethod] =
    useState("delivery");
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState("cash");
  const [showOutOfRangeModal, setShowOutOfRangeModal] = useState(false);

  // ✨ NUEVOS estados para descuento parcial
  const [showPartialDiscountModal, setShowPartialDiscountModal] =
    useState(false);
  const [partialDiscountInfo, setPartialDiscountInfo] = useState(null);

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

  // Hook de distancia
  const deliveryDistance = useDeliveryDistance(
    clientData?.coordinates,
    clientCoordinates,
    clientConfig?.logistics?.deliveryPricing,
    currentDeliveryMethod
  );

  // Actualizar coordenadas cuando cambie el mapa
  useEffect(() => {
    if (mapUrl) {
      const coords = extractCoordinates(mapUrl);
      setClientCoordinates(coords);
      console.log("📍 Coordenadas del cliente actualizadas:", coords);
    }
  }, [mapUrl]);

  const handleUpdateStock = async (itemId) => {
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
      setErrorList((prev) => prev.filter((error) => error.itemId !== itemId));
    } catch (error) {
      console.error("Error actualizando versiones de stock:", error);
      setErrorList((prev) =>
        prev.map((error) =>
          error.itemId === itemId
            ? {
                ...error,
                message: "Error al actualizar stock. Intenta nuevamente.",
              }
            : error
        )
      );
    } finally {
      setIsProcessingStock(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    console.log(`Item ${itemId} eliminado del carrito`);
    setErrorList((prev) => prev.filter((error) => error.itemId !== itemId));
  };

  const handleAdjustStock = (itemId, availableStock) => {
    console.log("🔧 handleAdjustStock EJECUTADO");
    console.log("📦 Item ID:", itemId);
    console.log("📊 Stock disponible:", availableStock);
    console.log("🛒 Item existe?", !!cartItems[itemId]);

    updateCartItem(itemId, {
      quantity: availableStock,
    });

    console.log("✅ Cantidad actualizada");

    setErrorList((prev) => prev.filter((error) => error.itemId !== itemId));

    console.log("✅ Error removido");
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

      // Usar deliveryFee dinámico
      const dynamicShippingCost =
        values.deliveryMethod === "delivery" ? deliveryDistance.deliveryFee : 0;

      const updatedValues = {
        ...values,
        estimatedTime,
        envioExpress: isEnabled ? expressDeliveryFee : 0,
        shipping: dynamicShippingCost,
        coordinates,
        appliedDiscount,
        deliveryDistance: deliveryDistance.distance,
      };

      console.log("💰 Procesando con envío dinámico:", {
        distancia: deliveryDistance.distance,
        costo: dynamicShippingCost,
        detalles: deliveryDistance.details,
      });

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
        navigate(`/${slugEmpresa}/${slugSucursal}/success/${orderId}`, {
          state: { phone: values.phone },
        });
        addLastCart();
        clearCart();
      }
    } catch (err) {
      console.error("Error al procesar el pedido:", err);
      if (err.errorList) {
        setErrorList(err.errorList);
        setPendingSubmitValues({ values, isReserva, appliedDiscount });
        setShowErrorModal(true);
      } else {
        setErrorList([
          {
            itemId: "unknown",
            productName: "Desconocido",
            variantName: "",
            errorType: "GENERIC",
            message: err.message.includes(
              "Firestore transactions require all reads to be executed before all writes"
            )
              ? "Error al procesar el stock. Intenta nuevamente."
              : `Error inesperado: ${err.message}`,
          },
        ]);
        setShowErrorModal(true);
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

  // ✨ NUEVA función para aplicar descuento parcial
  const applyPartialDiscount = async () => {
    setShowPartialDiscountModal(false);

    if (pendingSubmitValues && partialDiscountInfo) {
      const appliedDiscount = {
        isValid: true,
        discount: partialDiscountInfo.partialDiscount,
        discountId: discountHook.validation.discountId,
        discountData: discountHook.validation.discountData,
        message: `Descuento parcial aplicado: -$${partialDiscountInfo.partialDiscount}`,
        isPartial: true,
      };

      await processPedido(
        pendingSubmitValues.values,
        pendingSubmitValues.isReserva,
        appliedDiscount
      );
    }
  };

  const handleFormSubmit = async (values) => {
    const isReserva = values.hora.trim() !== "";

    // Validar radio de entrega
    if (values.deliveryMethod === "delivery" && deliveryDistance.isOutOfRange) {
      setShowOutOfRangeModal(true);
      return;
    }

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
        // ✨ NUEVO: si tiene productos excluidos, mostrar modal especial
        if (
          discountHook.validation.reason === "excluded_items" &&
          discountHook.validation.partialDiscountDetails
        ) {
          setPartialDiscountInfo(
            discountHook.validation.partialDiscountDetails
          );
          setPendingSubmitValues({ values, isReserva });
          setShowPartialDiscountModal(true);
          return;
        }

        // Otros errores: modal genérico
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
          isPartial: false,
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
        isOpen={showOutOfRangeModal}
        onClose={() => setShowOutOfRangeModal(false)}
        title="Fuera del radio de entrega"
        message={`Tu dirección está a ${deliveryDistance.distance?.toFixed(
          1
        )} km. Solo realizamos entregas dentro de ${
          clientConfig?.logistics?.deliveryPricing?.maxDistance || 12
        } km.`}
      />

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

      {/* ✨ MODAL de descuento parcial */}
      <SimpleModal
        isOpen={showPartialDiscountModal}
        onClose={() => {
          setShowPartialDiscountModal(false);
          setPartialDiscountInfo(null);
          setPendingSubmitValues(null);
        }}
        title="Descuento parcial disponible"
        message={
          partialDiscountInfo && (
            <div className="text-left space-y-2">
              <div className="">
                <p className="font-light text-xs mb-1">No aplica para:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {partialDiscountInfo.excludedProducts.map((p) => (
                    <li key={p.id}>
                      {p.name} {p.variantName && `(${p.variantName})`}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-light text-xs mb-1">Sí aplica para:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {partialDiscountInfo.eligibleProducts.map((p) => (
                    <li key={p.id}>
                      {p.name} {p.variantName && `(${p.variantName})`} - $
                      {p.price * p.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-sm flex flex-row gap-1 items-baseline">
                <span className="font-light text-xs ">
                  Descuento de -${partialDiscountInfo.partialDiscount} sobre $
                  {partialDiscountInfo.eligibleSubtotal} de productos elegibles
                </span>
              </div>
            </div>
          )
        }
        twoButtons={true}
        cancelText="Modificar"
        confirmText="Pedir"
        onConfirm={applyPartialDiscount}
      />

      <SimpleModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          setErrorList([]);
          setPendingSubmitValues(null);
        }}
        title="Problemas con tu pedido"
        errorList={errorList}
        onUpdateStock={handleUpdateStock}
        onRemoveItem={handleRemoveItem}
        onAdjustStock={handleAdjustStock}
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
          validationSchema={validations(
            total +
              (currentDeliveryMethod === "delivery"
                ? deliveryDistance.deliveryFee
                : 0),
            cart
          )}
          onSubmit={handleFormSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => {
            useEffect(() => {
              setCurrentDeliveryMethod(values.deliveryMethod);
              setCurrentPaymentMethod(values.paymentMethod);
            }, [values.deliveryMethod, values.paymentMethod]);

            const productsTotal = subtotal;

            // ✨ AGREGADO: logs para debugging
            console.log("🔍 Estado del descuento:", {
              isValid: discountHook.validation.isValid,
              discount: discountHook.validation.discount,
              reason: discountHook.validation.reason,
              hasPartialDetails:
                !!discountHook.validation.partialDiscountDetails,
              partialDiscount:
                discountHook.validation.partialDiscountDetails?.partialDiscount,
            });

            // ✨ CORREGIDO: incluir descuento parcial
            const descuento = discountHook.validation.isValid
              ? discountHook.validation.discount
              : (discountHook.validation.reason === "excluded_items" &&
                  discountHook.validation.partialDiscountDetails
                    ?.partialDiscount) ||
                0;

            console.log("💰 Descuento calculado:", descuento);
            console.log(
              "🏷️ Es parcial:",
              discountHook.validation.reason === "excluded_items"
            );

            let finalTotal = productsTotal - descuento;
            if (values.deliveryMethod === "delivery")
              finalTotal += deliveryDistance.deliveryFee;
            if (isEnabled) finalTotal += expressDeliveryFee;

            console.log("💵 Total final:", finalTotal);

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

                  {values.deliveryMethod === "delivery" &&
                    deliveryDistance.isOutOfRange && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs text-red-800 font-light">
                          <strong>Fuera del radio:</strong> Tu dirección está a{" "}
                          {deliveryDistance.distance?.toFixed(1)} km. Solo
                          entregamos dentro de{" "}
                          {clientConfig?.logistics?.deliveryPricing
                            ?.maxDistance || 12}{" "}
                          km.
                        </p>
                      </div>
                    )}

                  <OrderSummary
                    productsTotal={productsTotal}
                    envio={deliveryDistance.deliveryFee}
                    expressFee={isEnabled ? expressDeliveryFee : 0}
                    finalTotal={finalTotal}
                    descuento={descuento}
                    isPartialDiscount={
                      discountHook.validation.reason === "excluded_items"
                    }
                    handleExpressToggle={handleExpressToggle}
                    isEnabled={isEnabled}
                    deliveryMethod={values.deliveryMethod}
                    distance={deliveryDistance.distance}
                    isCalculatingDistance={deliveryDistance.isCalculating}
                  />
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isProcessingStock ||
                      deliveryDistance.isOutOfRange ||
                      (values.deliveryMethod === "delivery" &&
                        deliveryDistance.isCalculating)
                    }
                    className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-primary text-gray-100 rounded-3xl h-20 font-bold transition-colors duration-300 ${
                      isSubmitting ||
                      isProcessingStock ||
                      deliveryDistance.isOutOfRange ||
                      (values.deliveryMethod === "delivery" &&
                        deliveryDistance.isCalculating)
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
