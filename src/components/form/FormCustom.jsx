// components/form/FormCustom.jsx - Con StockManager integrado
import { Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import validations from "./validations";
import handleSubmit from "./handleSubmit"; // Fallback para casos de error
import {
  handlePOSSubmit,
  adaptCartToPOSFormat,
} from "../../utils/orderProcessing"; // NUEVO
import LoadingPoints from "../LoadingPoints";
import { useClient } from "../../contexts/ClientContext";
import { useFormStates } from "../../hooks/useFormStates";
import AddressInputs from "./AddressInputs";
import OrderSummary from "./OrderSummary";
import { adjustHora } from "../../helpers/time";
import { cleanPhoneNumber } from "../../firebase/utils/phoneUtils"; // Asegurar import
import { addTelefonoCliente } from "../../firebase/orders/uploadOrder"; // Asegurar import
import { obtenerFechaActual } from "../../firebase/utils/dateHelpers"; // Asegurar import

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

  const { isEnabled, handleExpressToggle } = useFormStates(expressDeliveryFee);

  // Crear enterpriseData para StockManager
  const enterpriseData = {
    id: empresaId,
    selectedSucursal: { id: sucursalId },
  };

  const processPedido = async (values, isReserva, message = "") => {
    try {
      setIsProcessingStock(true);

      let hora = values.hora;
      if (isReserva) hora = adjustHora(values.hora);

      const updatedValues = {
        ...values,
        hora,
        envioExpress: isEnabled ? expressDeliveryFee : 0,
        shipping: values.deliveryMethod === "delivery" ? envio : 0,
        coordinates: [0, 0], // TODO: Extraer desde mapUrl si es necesario
      };

      console.log("🚀 Iniciando procesamiento con nuevo schema POS");

      // Intentar usar el nuevo sistema con StockManager
      try {
        // Convertir carrito Context a formato POS
        const posCartItems = adaptCartToPOSFormat(cartItems);

        console.log("📦 Items para procesar:", posCartItems.length);

        // Usar nuevo handleSubmit con StockManager
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

          // Navegar a success y limpiar carrito
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
          descuento: 0,
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

  return (
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

      {/* Indicator de procesamiento de stock */}
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
        onSubmit={async (values) => {
          const isReserva = values.hora.trim() !== "";
          console.log("Submitting form with values:", values);
          await processPedido(values, isReserva);
        }}
      >
        {({ values, setFieldValue, isSubmitting, submitForm, errors }) => {
          console.log("Formik errors:", errors);

          const productsTotal = cart.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
          );

          let descuento = 0;
          const activeCoupons = [
            "APMCONKINGCAKES",
            "APMCONANHELO",
            "APMCONPROVIMARK",
            "APMCONLATABLITA",
          ];
          if (activeCoupons.includes(values.couponCode.trim().toUpperCase())) {
            const hasYerba = cart.some(
              (item) => item.category?.toLowerCase() === "yerba"
            );
            if (!hasYerba) {
              descuento = Math.round(productsTotal * 0.3);
            }
          }

          let finalTotal = productsTotal - descuento;
          if (values.deliveryMethod === "delivery") finalTotal += envio;
          if (isEnabled) finalTotal += expressDeliveryFee;

          return (
            <Form>
              <div className="flex flex-col">
                {/* togle entre delivery y retiro */}
                <div className="flex flex-row  gap-1 mb-4 p-0.5 bg-gray-300 w-fit rounded-full">
                  <button
                    type="button"
                    className={`h-10 px-4 text-xs flex items-center justify-center gap-2 rounded-full ${
                      values.deliveryMethod === "delivery"
                        ? "bg-gray-100 text-black"
                        : "bg-gray-300 text-gray-400"
                    }`}
                    onClick={() => setFieldValue("deliveryMethod", "delivery")}
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
                    onClick={() => setFieldValue("deliveryMethod", "takeaway")}
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
  );
};

export default FormCustom;
