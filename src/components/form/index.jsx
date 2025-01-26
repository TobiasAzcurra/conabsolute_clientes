import { ErrorMessage, Field, Form, Formik } from 'formik';
import MyTextInput from './MyTextInput';
import validations from './validations';
import handleSubmit from './handleSubmit';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addLastCart, setEnvioExpress } from '../../redux/cart/cartSlice';
import { useEffect, useState, useMemo } from 'react';
import { MapDirection } from './MapDirection';
import AppleErrorMessage from './AppleErrorMessage';
import {
  validarVoucher,
  canjearVouchers,
} from '../../firebase/validateVoucher';
import Payment from '../mercadopago/Payment';
import currencyFormat from '../../helpers/currencyFormat';
import { calculateDiscountedTotal } from '../../helpers/currencyFormat';
import isologo from '../../assets/isologo.png';
import {
  isWithinClosedDays,
  isWithinOrderTimeRange,
} from '../../helpers/validate-hours';
import LoadingPoints from '../LoadingPoints';
import Toggle from '../Toggle';
import AppleModal from '../AppleModal';
import { listenToAltaDemanda } from '../../firebase/readConstants';
import Tooltip from '../Tooltip';

const envio = parseInt(import.meta.env.VITE_ENVIO) || 2000;
const expressDeliveryFee = 2000;

const FormCustom = ({ cart, total }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formValidations = validations(total + envio);
  const [mapUrl, setUrl] = useState('');
  const [validarUbi, setValidarUbi] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const [noEncontre, setNoEncontre] = useState(false);

  // Estados para alta demanda
  const [altaDemanda, setAltaDemanda] = useState(null);
  const [showHighDemandModal, setShowHighDemandModal] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  const [discountedTotal, setDiscountedTotal] = useState(total);
  const [couponCodes, setCouponCodes] = useState(['']);

  const [descuento, setDescuento] = useState(0);
  const [descuentoForOneUnit, setDescuentoForOneUnit] = useState(0);
  const [isModalConfirmLoading, setIsModalConfirmLoading] = useState(false);

  const [voucherStatus, setVoucherStatus] = useState(['']);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showReservaInput, setShowReservaInput] = useState(false);

  // Estados para MercadoPago
  const [preferenceId, setPreferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isValidating, setIsValidating] = useState([false]);

  const [isTimeRestrictedModalOpen, setIsTimeRestrictedModalOpen] =
    useState(false);
  const [isCloseRestrictedModalOpen, setIsCloseRestrictedModalOpen] =
    useState(false);
  const [isOpenPaymentMethod, setIsOpenPaymentMethod] = useState(
    altaDemanda?.open || false
  );

  // Escucha de alta demanda
  useEffect(() => {
    let unsubscribeAltaDemanda = null;

    const iniciarEscuchaAltaDemanda = async () => {
      try {
        unsubscribeAltaDemanda = listenToAltaDemanda((altaDemandaData) => {
          console.log(
            '✨ Datos de Alta Demanda recibidos en Form:',
            altaDemandaData
          );
          setAltaDemanda(altaDemandaData);
        });
      } catch (error) {
        console.error('❌ Error al conectar con Alta Demanda:', error);
      }
    };

    iniciarEscuchaAltaDemanda();

    return () => {
      if (unsubscribeAltaDemanda) {
        unsubscribeAltaDemanda();
      }
    };
  }, []);
  const handleExpressToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    dispatch(setEnvioExpress(newValue ? expressDeliveryFee : 0));
  };

  const processPedido = async (values, isReserva) => {
    try {
      const validCoupons = couponCodes.filter(
        (code, index) =>
          code.trim() !== '' && voucherStatus[index] === '¡Código válido!'
      );

      if (validCoupons.length > 0) {
        const canjeSuccess = await canjearVouchers(validCoupons);
        if (!canjeSuccess) {
          console.error('Error al canjear los cupones');
          return;
        }
      }

      let adjustedHora = values.hora;

      if (isReserva) {
        adjustedHora = adjustHora(values.hora);
      }

      if (altaDemanda?.isHighDemand && pendingValues) {
        const delayMinutes = altaDemanda.delayMinutes || 0;
        const currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + delayMinutes);

        const adjustedHours = currentTime
          .getHours()
          .toString()
          .padStart(2, '0');
        const adjustedMinutes = currentTime
          .getMinutes()
          .toString()
          .padStart(2, '0');
        adjustedHora = `${adjustedHours}:${adjustedMinutes}`;
      }

      const updatedValues = {
        ...values,
        hora: adjustedHora,
        envioExpress: isEnabled ? expressDeliveryFee : 0,
      };

      console.log('Submitting form with values:', updatedValues);

      const orderId = await handleSubmit(
        updatedValues,
        cart,
        discountedTotal,
        envio,
        mapUrl,
        couponCodes,
        descuento
      );

      if (orderId) {
        navigate(`/success/${orderId}`);
        dispatch(addLastCart());
      } else {
        console.error('Error al procesar la orden');
      }
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
    }
  };

  const getTotalBurgers = (cartToCheck = cart) => {
    if (!Array.isArray(cartToCheck)) {
      console.error('Invalid cart passed to getTotalBurgers', cartToCheck);
      return 0;
    }

    let totalBurgers = 0;
    for (const item of cartToCheck) {
      if (item.category === 'burger' || item.category === 'burgers') {
        if (item.name.includes('2x1')) {
          totalBurgers += item.quantity * 2;
        } else {
          totalBurgers += item.quantity;
        }
      }
    }
    return totalBurgers;
  };

  const addCouponField = () => {
    const totalBurgers = getTotalBurgers();
    const maxCoupons = Math.floor(totalBurgers / 2);

    if (couponCodes.length < maxCoupons) {
      setCouponCodes([...couponCodes, '']);
      setVoucherStatus([...voucherStatus, '']);
      setIsValidating([...isValidating, false]);
    }
  };

  const handleCouponChange = (index, value, setFieldValue) => {
    const updatedCoupons = [...couponCodes];
    updatedCoupons[index] = value;
    setCouponCodes(updatedCoupons);

    const updatedVoucherStatus = [...voucherStatus];

    if (value.length < 5) {
      updatedVoucherStatus[index] = 'Deben ser al menos 5 dígitos.';
    } else if (value.length === 5) {
      updatedVoucherStatus[index] = '';
    } else {
      updatedVoucherStatus[index] =
        'El código debe tener exactamente 5 caracteres.';
    }
    setVoucherStatus(updatedVoucherStatus);
  };
  const removeExcessCoupons = (maxCoupons) => {
    const adjustedMaxCoupons = Math.max(maxCoupons, 1);
    const newCouponCodes = couponCodes.slice(0, adjustedMaxCoupons);
    const newVoucherStatus = voucherStatus.slice(0, adjustedMaxCoupons);
    const newIsValidating = isValidating.slice(0, adjustedMaxCoupons);

    setCouponCodes(newCouponCodes);
    setVoucherStatus(newVoucherStatus);
    setIsValidating(newIsValidating);
  };

  const handleVoucherValidation = async (
    index,
    value,
    updatedCoupons,
    setFieldValue
  ) => {
    setIsValidating((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });

    try {
      const totalBurgers = getTotalBurgers(cart);

      if (updatedCoupons.indexOf(value) !== index) {
        const updatedVoucherStatus = [...voucherStatus];
        updatedVoucherStatus[index] = 'Este código ya fue ingresado.';
        setVoucherStatus(updatedVoucherStatus);
        return;
      }

      const numCoupons = updatedCoupons.filter(
        (code) => code.trim() !== ''
      ).length;
      if (totalBurgers < numCoupons * 2) {
        const updatedVoucherStatus = [...voucherStatus];
        updatedVoucherStatus[index] = `Necesitas al menos ${numCoupons * 2
          } hamburguesas para canjear los vouchers.`;
        setVoucherStatus(updatedVoucherStatus);
        return;
      }

      const { promoProducts, nonPromoProducts } =
        getPromoAndNonPromoProducts(cart);

      if (promoProducts.length > 0 && nonPromoProducts.length === 0) {
        const updatedVoucherStatus = [...voucherStatus];
        updatedVoucherStatus[index] =
          'No se pueden aplicar vouchers a productos en promoción.';
        setVoucherStatus(updatedVoucherStatus);
        return;
      }

      if (promoProducts.length > 0 && nonPromoProducts.length > 0) {
        const updatedVoucherStatus = [...voucherStatus];
        updatedVoucherStatus[index] =
          'El cupón se aplica solo a productos no promocionales.';
        setVoucherStatus(updatedVoucherStatus);

        const totalNonPromoBurgers = getTotalBurgers(nonPromoProducts);
        const numNonPromoCoupons = updatedCoupons.filter(
          (code) => code.trim() !== ''
        ).length;
        const hasEnoughNonPromoBurgers =
          totalNonPromoBurgers >= numNonPromoCoupons * 2;

        if (!hasEnoughNonPromoBurgers) {
          updatedVoucherStatus[index] = `Necesitas al menos ${numNonPromoCoupons * 2
            } hamburguesas no promocionales para canjear los vouchers.`;
          setVoucherStatus(updatedVoucherStatus);
          return;
        }
      }

      const { isValid, message } = await validarVoucher(value);
      const updatedVoucherStatus = [...voucherStatus];

      if (isValid) {
        updatedVoucherStatus[index] = '¡Código válido!';
        const { newTotal, totalDescuento } = calculateDiscountedTotal(
          cart,
          numCoupons
        );
        if (descuentoForOneUnit === 0) {
          setDescuentoForOneUnit(totalDescuento / numCoupons);
        }
        setDiscountedTotal(newTotal);
        setDescuento(totalDescuento);
      } else {
        updatedVoucherStatus[index] = message;
      }

      setVoucherStatus(updatedVoucherStatus);
    } catch (error) {
      console.error('Error validating voucher:', error);
      const updatedVoucherStatus = [...voucherStatus];
      updatedVoucherStatus[index] = 'Error al validar el cupón.';
      setVoucherStatus(updatedVoucherStatus);
    } finally {
      setIsValidating((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };
  useEffect(() => {
    let hasInvalidVoucher = false;
    let validCouponCount = 0;

    voucherStatus.forEach((v, index) => {
      if (v !== '¡Código válido!') {
        hasInvalidVoucher = true;
      } else {
        validCouponCount++;
      }
    });

    if (hasInvalidVoucher && descuento !== 0) {
      const newDescuento = descuentoForOneUnit * validCouponCount;
      setDescuento(newDescuento);
      setDiscountedTotal(total - newDescuento);
    }
  }, [voucherStatus, setDescuento, setDiscountedTotal, descuento, total, cart]);

  useEffect(() => {
    setDiscountedTotal(total);
  }, [total]);

  useEffect(() => {
    const validatePendingCoupons = async () => {
      const pendingCoupons = couponCodes.filter(
        (code, index) =>
          code.trim().length === 5 && voucherStatus[index] !== '¡Código válido!'
      );

      if (pendingCoupons.length > 0) {
        const lastIndex = couponCodes.findIndex(
          (code, index) => code === pendingCoupons[pendingCoupons.length - 1]
        );

        await handleVoucherValidation(
          lastIndex,
          pendingCoupons[pendingCoupons.length - 1],
          couponCodes,
          setFieldValue
        );
      }
    };

    validatePendingCoupons();
  }, [cart, couponCodes]);

  const [selectedHora, setSelectedHora] = useState('');

  const handleChange = (event) => {
    setSelectedHora(event.target.value);
  };

  const adjustHora = (hora) => {
    const [hours, minutes] = hora.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() - 30);

    const adjustedHours = date.getHours().toString().padStart(2, '0');
    const adjustedMinutes = date.getMinutes().toString().padStart(2, '0');
    const adjustedTime = `${adjustedHours}:${adjustedMinutes}`;
    return adjustedTime;
  };

  const getAvailableTimeSlots = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const allTimeSlots = [
      '20:30',
      '21:00',
      '21:30',
      '22:00',
      '22:30',
      '23:00',
      '23:30',
      // '00:00', De momento deshabilitado
    ];

    const nextSlotMinutes =
      Math.ceil((currentHour * 60 + currentMinute) / 30) * 30 + 30;
    const nextSlotHour = Math.floor(nextSlotMinutes / 60);
    const nextSlotMinute = nextSlotMinutes % 60;

    return allTimeSlots.filter((timeSlot) => {
      let [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      if (slotHour === 0) slotHour = 24;
      const slotTimeInMinutes = slotHour * 60 + slotMinute;
      const nextValidTimeInMinutes = nextSlotHour * 60 + nextSlotMinute;
      return slotTimeInMinutes >= nextValidTimeInMinutes;
    });
  };

  const TimeSelector = ({ selectedHora, handleChange, setFieldValue }) => {
    const availableTimeSlots = useMemo(getAvailableTimeSlots, []);

    return (
      <Field
        as="select"
        name="hora"
        className={`custom-select font-light ${selectedHora === '' ? 'text-gray-400' : 'text-black'
          }`}
        value={selectedHora}
        onChange={(e) => {
          handleChange(e);
          setFieldValue('hora', e.target.value);
        }}
      >
        <option value="" disabled>
          ¿Quieres reservar para más tarde?
        </option>
        {availableTimeSlots.map((timeSlot) => (
          <option key={timeSlot} value={timeSlot}>
            {timeSlot}
          </option>
        ))}
      </Field>
    );
  };

  const openTimeRestrictedModal = () => {
    setIsTimeRestrictedModalOpen(true);
  };

  const closeTimeRestrictedModal = () => {
    setIsTimeRestrictedModalOpen(false);
  };

  const openCloseModal = () => {
    setIsCloseRestrictedModalOpen(true);
  };

  const closeCloseRestrictedModal = () => {
    setIsCloseRestrictedModalOpen(false);
  };

  const calculateProductsTotal = () => {
    let productsTotal = 0;
    let totalToppings = 0;
    cart.forEach(({ price, quantity, toppings }) => {
      productsTotal += price * quantity;
      toppings.forEach(({ price }) => {
        totalToppings += price * quantity;
      });
    });
    return productsTotal + totalToppings;
  };

  const getPromoAndNonPromoProducts = (cart) => {
    const promoProducts = cart.filter((item) => item.type === 'promo');
    const nonPromoProducts = cart.filter((item) => item.type !== 'promo');
    return { promoProducts, nonPromoProducts };
  };

  useEffect(() => {
    setIsOpenPaymentMethod(altaDemanda?.open || false);
  }, [altaDemanda]);

  return (
    <div className="flex mt-2 mr-4 mb-10 min-h-screen ml-4 flex-col">
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
                    font-size: 16px;
                }
                .custom-select::placeholder {
                    color: rgba(0, 0, 0, 0.5);
                }
            `}</style>
      <Formik
        initialValues={{
          subTotal: discountedTotal,
          phone: '',
          deliveryMethod: 'delivery',
          references: '',
          paymentMethod: 'efectivo',
          money: '',
          address: '',
          hora: '',
          efectivoCantidad: 0,
          mercadopagoCantidad: 0,
          aclaraciones: '',
        }}
        validationSchema={formValidations}
        onSubmit={async (values) => {
          if (!altaDemanda?.open) {
            if (values.paymentMethod === 'mercadopago') {
              setFieldValue('paymentMethod', 'efectivo');
            }
            setPendingValues({ ...values, paymentMethod: 'efectivo' });
            openCloseModal();
            return;
          }
          const isReserva = values.hora.trim() !== '';

          if (!isReserva && altaDemanda?.isHighDemand) {
            setPendingValues(values);
            setShowHighDemandModal(true);
            return;
          }

          if (!isWithinOrderTimeRange()) {
            console.log(
              'La hora actual está fuera del rango permitido para pedidos'
            );
            openTimeRestrictedModal();
            return;
          }

          if (values.paymentMethod === 'efectivo') {
            await processPedido(values, isReserva);
          } else if (values.paymentMethod === 'mercadopago') {
            // await processPedido(values, isReserva);
          }
        }}
      >
        {({
          getFieldProps,
          isSubmitting,
          setFieldValue,
          values,
          submitForm,
          isValid,
        }) => {
          const calculateFinalTotal = () => {
            let finalTotal = calculateProductsTotal() - descuento;
            if (values.deliveryMethod === 'delivery') {
              finalTotal += envio;
            }
            if (isEnabled) {
              finalTotal += expressDeliveryFee;
            }
            console.log('isEnabled:', isEnabled);
            return finalTotal;
          };

          useEffect(() => {
            couponCodes.forEach((code, index) => {
              if (
                code.trim().length === 5 &&
                voucherStatus[index] !== '¡Código válido!'
              ) {
                handleVoucherValidation(
                  index,
                  code,
                  couponCodes,
                  setFieldValue
                );
              }
            });
          }, [cart, couponCodes, setFieldValue]);

          useEffect(() => {
            setCouponCodes(['']);
            setVoucherStatus(['']);
            setIsValidating([false]);
            setDescuento(0);
            setDescuentoForOneUnit(0);
          }, [cart]);

          useEffect(() => {
            console.log('Descuento aplicado:', descuento);
          }, [cart, total, discountedTotal, descuento]);
          return (
            <Form>
              <div className="flex flex-col mb-2">
                {/* Sección de aclaraciones */}
                <div className="flex flex-row justify-between px-3 h-10 m items-start border-2 border-black rounded-3xl mt-4">
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
                      placeholder="¿Aclaraciones? Ej: La simple vegetariana"
                      autoComplete="off"
                      className="bg-transparent font-light  px-0 h-10 text-opacity-20 outline-none w-full"
                    />
                  </div>
                </div>

                {/* Datos para la entrega */}
                <div className="flex justify-center flex-col mt-7 items-center">
                  <p className="text-2xl font-bold mb-2">
                    Datos para la entrega
                  </p>
                  <div className="flex flex-row w-full gap-2 mb-4">
                    <button
                      type="button"
                      className={`h-20 flex-1 font-bold items-center flex justify-center gap-2 rounded-lg  ${values.deliveryMethod === 'delivery'
                        ? 'bg-black text-gray-100'
                        : 'bg-gray-300 text-black'
                        }`}
                      onClick={() =>
                        setFieldValue('deliveryMethod', 'delivery')
                      }
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
                      className={`h-20 flex-1 flex-col font-bold items-center flex justify-center rounded-lg ${values.deliveryMethod === 'takeaway'
                        ? 'bg-black text-gray-100'
                        : 'bg-gray-300 text-black'
                        }`}
                      onClick={() =>
                        setFieldValue('deliveryMethod', 'takeaway')
                      }
                    >
                      <div className="flex flex-row items-center gap-2">
                        <img
                          src={isologo}
                          className={`h-4 ${values.deliveryMethod === 'takeaway'
                            ? 'invert brightness-0'
                            : 'brightness-0'
                            }`}
                          alt=""
                        />
                        <p className="font-bold text-">Retiro</p>
                      </div>
                      <p className="font-light text-xs">por Buenos Aires 618</p>
                    </button>
                  </div>
                  <div
                    className={`w-full items-center rounded-3xl border-2 border-black transition-all duration-300`}
                  >
                    {values.deliveryMethod === 'delivery' && (
                      <>
                        <MapDirection
                          setUrl={setUrl}
                          setValidarUbi={setValidarUbi}
                          setNoEncontre={setNoEncontre}
                          setFieldValue={setFieldValue}
                        />

                        <ErrorMessage
                          name="address"
                          component={AppleErrorMessage}
                        />

                        {noEncontre && (
                          <div className="flex flex-row justify-between px-3 h-10 items-center">
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
                                placeholder="Tu dirección"
                                className="bg-white font-light text-opacity-20 text-black outline-none px-2"
                              />
                            </div>
                          </div>
                        )}
                        {/* Campo para referencias */}
                        <div className="flex flex-row border-t border-black border-opacity-20 gap-2 pl-3 h-10 items-center">
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
                            placeholder="¿Referencias? Ej: Casa de portón negro"
                            autoComplete="off"
                            className="bg-transparent font-light px-0 h-10 text-opacity-20 outline-none w-full"
                          />
                        </div>
                      </>
                    )}

                    {/* Campo para el número de teléfono */}
                    <div
                      className={`flex flex-col items-center transition-all duration-300 ${values.deliveryMethod === 'delivery'
                        ? 'border-t border-black border-opacity-20'
                        : ''
                        }`}
                    >
                      <div className="flex flex-row items-center pl-3 gap-2 w-full">
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
                          placeholder="Tu número de teléfono"
                          autoComplete="phone"
                          className="bg-transparent font-light px-0 h-10 text-opacity-20 outline-none w-full"
                        />
                      </div>
                      <div className="w-full">
                        <ErrorMessage
                          name="phone"
                          render={(msg) => (
                            <AppleErrorMessage>{msg}</AppleErrorMessage>
                          )}
                        />
                      </div>
                    </div>
                    {/* Campo para reservar hora */}
                    <div className="flex flex-row justify-between px-3 h-auto items-start border-t border-black border-opacity-20">
                      <div className="flex flex-row items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-6"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <TimeSelector
                          selectedHora={selectedHora}
                          handleChange={handleChange}
                          setFieldValue={setFieldValue}
                        />
                        <ErrorMessage
                          name="hora"
                          component="span"
                          className="text-sm text-red-main font-coolvetica font-light mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Método de pago y cupones */}
                <div className="flex justify-center flex-col mt-6 items-center">
                  <p className="text-2xl font-bold mb-2">Método de pago</p>
                  <div className="w-full items-center rounded-3xl border-2 border-black">
                    <div className="flex flex-row justify-between px-3 h-auto items-start border border-black rounded-t-3xl border-opacity-20">
                      <div className="flex flex-row items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-6 "
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
                          className="bg-transparent font-light px-0 h-10 text-opacity-20 outline-none w-full"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                          }}
                          onChange={(e) => {
                            setFieldValue('paymentMethod', e.target.value);
                          }}
                        >
                          <option value="efectivo">Efectivo</option>
                          {isOpenPaymentMethod && (
                            <option value="mercadopago">Mercado Pago</option>
                          )}
                        </Field>

                        {!isOpenPaymentMethod && (
                          <div className="absolute right-8">
                            <Tooltip
                              position="left"
                              text="Clickea en pedir para ver una mejor explicacion de por que no te deja elegir otra opcion."
                              duration={5000}
                              className="cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Campos de cupones */}
                    <div className="flex flex-col">
                      {couponCodes.map((coupon, index) => (
                        <div
                          key={index}
                          className={`flex flex-col w-full transition-all duration-300 ${index !== 0
                            ? 'border-t border-black border-opacity-20'
                            : ''
                            }`}
                        >
                          <div className="flex flex-row gap-2 px-3 items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-6"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375Zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75Zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75ZM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
                                clip-rule="evenodd"
                              />
                            </svg>

                            <MyTextInput
                              name={`couponCode${index}`}
                              type="text"
                              placeholder={
                                index === 0
                                  ? '¿Tenes algun cupón?'
                                  : '¿Tenes otro cupón?'
                              }
                              value={couponCodes[index]}
                              onChange={(e) => {
                                handleCouponChange(
                                  index,
                                  e.target.value,
                                  setFieldValue
                                );
                              }}
                              className="bg-transparent font-light px-0 h-10 text-opacity-20 outline-none w-full"
                            />

                            {isValidating[index] ? (
                              <div
                                className="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] text-black"
                                role="status"
                              >
                                <span className="sr-only">Loading...</span>
                              </div>
                            ) : voucherStatus[index] === '¡Código válido!' ? (
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

                          {voucherStatus[index] &&
                            voucherStatus[index] !== '¡Código válido!' && (
                              <AppleErrorMessage voucher={true}>
                                {voucherStatus[index]}
                              </AppleErrorMessage>
                            )}

                          {voucherStatus[index] === '¡Código válido!' &&
                            index === couponCodes.length - 1 &&
                            couponCodes.length <
                            Math.floor(getTotalBurgers() / 2) &&
                            addCouponField()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resumen */}
                <div className="flex justify-center flex-col mt-6 items-center">
                  <p className="text-2xl font-bold w-full text-center">
                    Resumen
                  </p>
                  <div className="w-full flex flex-row justify-between items-center mb-4 mt-4">
                    <div className="w-full flex flex-row justify-between items-center mb-4 mt-4">
                      <div className="flex flex-row items-center gap-2">
                        <Tooltip
                          text={`Si priorizas la <b>velocidad</b>, esta opcion es para vos: Tu pedido pasa al frente de la fila en cocinarse y, en caso de delivery, tu cadete sale solo con tu pedido. <br/> Si priorizas la <b>accesibilidad</b>, sin marcar esta opcion tu entrega sigue siendo lo mas eficiente posible.`}
                          duration={10000}
                          className="flex items-center"
                        />
                        <p className="font-coolvetica flex flex-row items-center gap-1">
                          Lo mas rapido posible
                          <p className="font-bold ">(+$2000)</p>
                        </p>
                      </div>
                      <Toggle isOn={isEnabled} onToggle={handleExpressToggle} />
                    </div>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p>Productos</p>
                    <p>{currencyFormat(calculateProductsTotal())}</p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <div className="flex flex-row items-center gap-2">
                      <Tooltip
                        text={`Mismo valor a toda la ciudad, independientemente de que tan lejos estes.`}
                        duration={10000}
                        className="flex items-center"
                      />
                      <p className="font-coolvetica flex flex-row items-center gap-1">
                        Envio
                      </p>
                    </div>
                    <p>
                      {values.deliveryMethod === 'delivery'
                        ? currencyFormat(envio)
                        : currencyFormat(0)}
                    </p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p className="font-coolvetica font-medium">
                      Velocidad extra
                    </p>
                    <p>
                      {isEnabled
                        ? currencyFormat(expressDeliveryFee)
                        : currencyFormat(0)}
                    </p>
                  </div>
                  <div className="flex flex-row justify-between w-full">
                    <p>Descuentos</p>
                    <p>-{currencyFormat(descuento)}</p>
                  </div>
                  <div className="flex flex-row justify-between border-t border-opacity-20 border-black mt-4 pt-4 px-4 w-screen">
                    <p className="text-2xl font-bold">Total</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(calculateFinalTotal())}
                    </p>
                  </div>
                </div>

                {/* Botón de envío */}
                {values.paymentMethod === 'mercadopago' ? (
                  <>
                    <Payment
                      cart={cart}
                      values={values}
                      discountedTotal={discountedTotal}
                      envio={envio}
                      mapUrl={mapUrl}
                      couponCodes={couponCodes}
                      calculateFinalTotal={calculateFinalTotal}
                      isEnabled={isEnabled}
                      isValid={isValid}
                      submitForm={submitForm}
                      altaDemanda={altaDemanda}
                      shouldValidate={true}
                    />
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`text-4xl z-50 text-center mt-6 flex items-center justify-center bg-red-main text-gray-100 rounded-3xl h-20 font-bold hover:bg-red-600 transition-colors duration-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isSubmitting ? (
                      <LoadingPoints color="text-gray-100" />
                    ) : (
                      'Pedir'
                    )}
                  </button>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>

      {/* Modales */}
      <AppleModal
        isOpen={isTimeRestrictedModalOpen}
        onClose={closeTimeRestrictedModal}
        title="Está cerrado"
      >
        <p>Abrimos de lunes a domingo de 20:00 hs a 00:00 hs.</p>
      </AppleModal>

      <AppleModal
        isOpen={isCloseRestrictedModalOpen}
        onClose={closeCloseRestrictedModal}
        title="Pendiente de confirmar"
        twoOptions={true}
        isLoading={isModalConfirmLoading}
        onConfirm={async () => {
          setIsModalConfirmLoading(true);
          try {
            if (pendingValues) {
              const orderId = await handleSubmit(
                pendingValues,
                cart,
                discountedTotal,
                envio,
                mapUrl,
                couponCodes,
                descuento,
                true // isPending
              );
              if (orderId) {
                navigate(`/success/${orderId}`);
                dispatch(addLastCart());
              }
            }
          } catch (error) {
            console.error('Error al procesar el pedido pendiente:', error);
          } finally {
            setIsModalConfirmLoading(false);
            closeCloseRestrictedModal();
          }
        }}
      >
        <p>
          Van +400 burgers ❤️‍🔥 En cocina están verificando si hay stock. Tu
          pedido estará pendiente de aprobación durante los próximos 3 a 5
          minutos, aceptas? <br />
          *Este feature esta en desarrollo, por default se enviara que pagas en
          efectivo pero podes escribir a 3584306832 para transferir!
        </p>
      </AppleModal>

      <AppleModal
        isOpen={
          showHighDemandModal && pendingValues?.paymentMethod === 'efectivo'
        }
        onClose={() => setShowHighDemandModal(false)}
        title="Alta Demanda"
        twoOptions={true}
        isLoading={isModalConfirmLoading}
        onConfirm={async () => {
          setIsModalConfirmLoading(true);
          if (pendingValues) {
            const isReserva = pendingValues.hora.trim() !== '';
            await processPedido(pendingValues, isReserva);
          }
          setIsModalConfirmLoading(false);
          setShowHighDemandModal(false);
        }}
      >
        <p>
          Estamos en alta demanda, tu pedido comenzará a cocinarse dentro de{' '}
          {altaDemanda?.delayMinutes} minutos, ¿lo esperas?
        </p>
      </AppleModal>
    </div>
  );
};

export default FormCustom;
