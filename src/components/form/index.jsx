import { Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addLastCart, setEnvioExpress } from "../../redux/cart/cartSlice";
import { useState } from "react";
import validations from "./validations";
import handleSubmit from "./handleSubmit";
import Payment from "../mercadopago/Payment";
import LoadingPoints from "../LoadingPoints";
import AppleModal from "../AppleModal";
import { useClient } from "../../contexts/ClientContext";
import { useFormStates } from "../../hooks/useFormStates";
import AddressInputs from "./AddressInputs";
import OrderSummary from "./OrderSummary";
import { adjustHora } from "../../helpers/time";

const FormCustom = ({ cart, total }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  const formValidations = validations(total + envio);
  const [mapUrl, setUrl] = useState("");
  const [validarUbi, setValidarUbi] = useState(false);
  const [noEncontre, setNoEncontre] = useState(false);

  const {
    isEnabled,
    handleExpressToggle,
    showHighDemandModal,
    setShowHighDemandModal,
    pendingValues,
    setPendingValues,
    showOutOfStockModal,
    setShowOutOfStockModal,
    isModalConfirmLoading,
    setIsModalConfirmLoading,
    showMessageModal,
    setShowMessageModal,
    isTimeRestrictedModalOpen,
    setIsTimeRestrictedModalOpen,
    isCloseRestrictedModalOpen,
    setIsCloseRestrictedModalOpen,
  } = useFormStates(expressDeliveryFee);

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

  const processPedido = async (values, isReserva, message = "") => {
    try {
      let hora = values.hora;
      if (isReserva) hora = adjustHora(values.hora);

      const updatedValues = {
        ...values,
        hora,
        envioExpress: isEnabled ? expressDeliveryFee : 0,
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
        dispatch({ type: "cart/addLastCart" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeTimeRestrictedModal = () => {
    setIsTimeRestrictedModalOpen(false);
  };

  const closeCloseRestrictedModal = () => {
    setIsCloseRestrictedModalOpen(false);
  };

  return (
    <div className="flex   px-4    flex-col">
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
          paymentMethod: "efectivo",
          hora: "",
          couponCode: "",
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
              <div className="flex flex-col ">
                <div className="flex flex-row w-full  gap-1 mb-4">
                  <button
                    type="button"
                    className={`h-20 flex-1 font-bold flex items-center justify-center gap-2 rounded-2xl ${
                      values.deliveryMethod === "delivery"
                        ? "bg-black text-gray-100"
                        : "bg-gray-300 text-black"
                    }`}
                    onClick={() => setFieldValue("deliveryMethod", "delivery")}
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
                    className={`h-20 flex-1 font-bold flex flex-col items-center justify-center rounded-2xl ${
                      values.deliveryMethod === "takeaway"
                        ? "bg-black text-gray-100"
                        : "bg-gray-300 text-black"
                    }`}
                    onClick={() => setFieldValue("deliveryMethod", "takeaway")}
                  >
                    <div className="flex flex-row items-center gap-2">
                      {clientAssets?.logo && (
                        <img
                          src={clientAssets.logo}
                          className={`h-4 ${
                            values.deliveryMethod === "takeaway"
                              ? "invert brightness-0"
                              : "brightness-0"
                          }`}
                          alt="logo"
                        />
                      )}
                      <p className="font-bold">Retiro</p>
                    </div>
                    {clientData?.address && clientData?.province && (
                      <p className="font-light text-xs text-center">
                        Por {clientData?.address}
                        <br />
                        {clientData?.province}
                      </p>
                    )}
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
                {/* Botón */}
                {values.paymentMethod === "mercadopago" ? (
                  <Payment
                    cart={cart}
                    values={values}
                    // discountedTotal={discountedTotal}
                    envio={envio}
                    // mapUrl={mapUrl}
                    // couponCodes={couponCodes}
                    // calculateFinalTotal={calculateFinalTotal}
                    // isEnabled={isEnabled}
                    // isValid={isValid}
                    submitForm={submitForm}
                    finalTotal={finalTotal}
                    // altaDemanda={altaDemanda}
                    // shouldValidate={true}
                  />
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-blue-apm text-gray-100 rounded-3xl h-20 font-bold hover:bg-blue-600 transition-colors duration-300 ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      console.log("Submitting form");
                    }}
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
    </div>
  );
};

export default FormCustom;
