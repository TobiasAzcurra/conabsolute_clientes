import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toppings from '../../../assets/toppings-v1.json';
import { addItem } from '../../../redux/cart/cartSlice';
import currencyFormat from '../../../helpers/currencyFormat';
import ArrowBack from '../../back';
import logo from '../../../assets/anheloTMwhite.png';
import QuickAddToCart from '../card/quickAddToCart';
import VideoSlider from './VideoSlider';
import { listenToAltaDemanda } from '../../../firebase/readConstants';
import { getProductById } from '../../../firebase/getProducts';

const toppingPrice = 300;
const toppingsArray = Object.values(toppings);
const toppingsFree = toppingsArray.filter((t) => t.price === 0);
const toppings100 = toppingsArray.filter((t) => t.price === toppingPrice);

const DetailCard = ({ type }) => {
  const location = useLocation();
  const { id, slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [disable, setDisable] = useState(false);
  const [dataTopping, setDataTopping] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [altaDemanda, setAltaDemanda] = useState(null);
  const [itemsOut, setItemsOut] = useState({});
  const cart = useSelector((state) => state.cartState.cart);

  // Escucha cambios en alta demanda
  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemandaData) => {
      setAltaDemanda(altaDemandaData);
      setItemsOut(altaDemandaData.itemsOut); // Usar altaDemandaData directamente
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!product && slug && id) {
      console.log(`Cargando producto con slug: ${slug} y id: ${id}`);
      getProductById(slug, id)
        .then((data) => {
          setProduct(data);
          console.log(`✅ Producto cargado:`, data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('❌ Error cargando producto:', err);
          setLoading(false);
        });
    }
  }, [product, slug, id]);

  // Función para capitalizar cada palabra con solo la primera letra en mayúscula
  const capitalizeWords = (str) => {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Arreglo de dependencias vacío

  const handleToppingChange = (event) => {
    const toppingName = event.target.value;
    const isChecked = event.target.checked;

    const selectedTopping = toppingsArray.find((t) => t.name === toppingName);

    if (selectedTopping) {
      if (isChecked) {
        setDataTopping((prevToppings) => [...prevToppings, selectedTopping]);
      } else {
        setDataTopping((prevToppings) =>
          prevToppings.filter((item) => item.name !== selectedTopping.name)
        );
      }
    }
  };

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const basePrice = product.price || 0;
    const toppingsCost = dataTopping
      .filter((t) => t.price > 0)
      .reduce((acc, t) => acc + t.price, 0);
    const priceFactor = altaDemanda?.priceFactor || 1;
    return Math.ceil(((basePrice + toppingsCost) * priceFactor) / 100) * 100;
  }, [product, dataTopping, altaDemanda?.priceFactor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4" />
        <p className="text-sm font-semibold text-gray-700">
          Cargando producto...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center mt-8 font-coolvetica text-black text-sm">
        Producto no encontrado.
      </div>
    );
  }

  const getObjectPositionForType = (type) => {
    return type === 'originals' ? 'object-center' : 'object-bottom';
  };

  // product.ingredients?.some((i) => itemsOut[i] === false);

  // Función para verificar si el producto tiene ingredientes agotados
  // const hasUnavailableIngredients = () => {
  //   const ingredients = productIngredients[product.name] || []; // Cambiar name por product.name
  //   // Si no tiene ingredientes o solo tiene strings vacíos, no filtrar
  //   if (
  //     ingredients.length === 0 ||
  //     (ingredients.length === 1 && ingredients[0] === '')
  //   ) {
  //     return false;
  //   }
  //   // Verificar si algún ingrediente está agotado (false)
  //   return ingredients.some(
  //     (ingredient) => ingredient !== '' && itemsOut[ingredient] === false
  //   );
  // };

  const getTypeDescription = (type) => {
    const map = {
      satisfyer:
        'La versión accesible de Anhelo, para que puedas pedir más en todo momento.',
      originals: 'Anhelo, creado por vos. Tu burger ideal.',
      our: 'Nuestras mejores combinaciones. Obras de arte.',
    };
    return map[type] || '';
  };

  // Función para mapear nombres de toppings a keys de Firebase
  const mapToppingToFirebaseKey = (t) => t.firebaseKey || t.name.toLowerCase();

  // Función para verificar si un topping está disponible
  const isToppingAvailable = (toppingName) => {
    const firebaseKey = mapToppingToFirebaseKey(toppingName);
    return itemsOut[firebaseKey] !== false; // true si está disponible o undefined
  };

  const getImageSrc = () => {
    const imgSrc = product?.img || product?.image;
    if (!imgSrc) return '/placeholder-product.jpg';
    if (imgSrc.startsWith('https://') || imgSrc.startsWith('data:image/')) {
      return imgSrc;
    }
    return `/menu/${imgSrc}`;
  };

  const imageSrc = getImageSrc();

  return (
    <div>
      <div className="flex flex-col ">
        <ArrowBack />
        <div className="flex flex-col pt-8 md:pt-6 justify-items-center items-center ">
          <h4 className="font-coolvetica font-bold text-4xl sm:text-6xl text-black text-center px-4 leading-9 ">
            {capitalizeWords(product.name)}
          </h4>
          <p className="font-coolvetica  px-4 text-xs w-full mt-1 font-bold text-center">
            {product.description}
          </p>
          {/* Select para elegir toppings */}
          {product.type === 'originals' && (
            <div className="flex flex-col mt-2 items-center">
              {toppingsArray.map((topping) => {
                const isAvailable = isToppingAvailable(topping.name);

                return (
                  <label
                    key={topping.name}
                    className={`flex items-center mb-2 cursor-pointer ${
                      !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* Checkbox oculto */}
                    <input
                      type="checkbox"
                      value={topping.name}
                      onChange={handleToppingChange}
                      className="hidden peer"
                      checked={dataTopping.some((t) => t.name === topping.name)}
                      disabled={!isAvailable} // Deshabilitar si no está disponible
                    />
                    {/* Checkbox personalizado */}
                    <span
                      className={`relative w-6 h-6 mr-3 border border-gray-400 rounded-full flex-shrink-0 
                       ${
                         isAvailable
                           ? 'peer-checked:bg-black peer-checked:border-transparent'
                           : 'bg-gray-300 border-gray-300'
                       } 
                       transition-colors duration-200 ease-in-out
                       flex items-center justify-center`}
                    >
                      {/* Icono de check, visible solo cuando está seleccionado */}
                      {dataTopping.some((t) => t.name === topping.name) &&
                        isAvailable && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-gray-100"
                          >
                            <path
                              fillRule="evenodd"
                              d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      {/* Icono de X para ingredientes no disponibles */}
                      {!isAvailable && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-gray-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                    {/* Texto del topping */}
                    <p
                      className={`font-bold font-coolvetica text-black text-xs ${
                        !isAvailable ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {capitalizeWords(topping.name)}:{' '}
                      {!isAvailable
                        ? 'Agotado por hoy'
                        : topping.price === 0
                        ? 'Gratis'
                        : currencyFormat(topping.price)}
                    </p>
                  </label>
                );
              })}
            </div>
          )}
          <div className="w-full h-[300px] mt-8 flex items-center justify-center">
            <img
              className="max-w-full sm:w-full md:w-auto h-[300px] object-cover object-center"
              src={imageSrc}
              alt={product.name}
            />
          </div>
          <div className="flex flex-col items-center mb-8 mt-8 gap-2">
            {/* {hasUnavailableIngredients() ? (
              <div className="bg-red-main -mt-4 -mb-5 flex flex-row items-center gap-2 font-coolvetica font-medium text-white rounded-full p-4 text-4xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="h-6"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                    clip-rule="evenodd"
                  />
                </svg>
                Agotado
              </div>
            ) : (
              <QuickAddToCart
                product={product}
                toppings={dataTopping}
                calculatedPrice={totalPrice} // Agregar esta prop
              />
            )} */}

            <p className="mt-4 px-4 text-center font-coolvetica text-xs text-black">
              Por <strong>{currencyFormat(totalPrice)}</strong>.{' '}
              {product.type === 'satisfyer'
                ? 'La versión accesible de Anhelo, para que puedas pedir más en todo momento.'
                : product.type === 'originals'
                ? 'Anhelo, creado por vos. Tu burger ideal.'
                : product.type === 'our'
                ? 'Nuestras mejores combinaciones. Obras de arte.'
                : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailCard;
