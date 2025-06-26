import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useClient } from '../../../contexts/ClientContext';
import currencyFormat from '../../../helpers/currencyFormat';
import { listenToAltaDemanda } from '../../../firebase/constants/altaDemanda';
import arrowIcon from '../../../assets/arrowIcon.png';
import VideoSlider from './VideoSlider';

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const DetailCard = ({ type }) => {
  const { slug: category, id } = useParams();
  const { productsByCategory, clientAssets } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cartState.cart);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [altaDemanda, setAltaDemanda] = useState(null);
  const [itemsOut, setItemsOut] = useState({});
  const [dataTopping, setDataTopping] = useState([]);
  const [customization, setCustomization] = useState(true);
  const [disable, setDisable] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const prevImagesRef = useRef([]);

  const reels = clientAssets?.reels || [];
  const logo = clientAssets?.logoFooter || clientAssets?.logo || '';

  const product = useMemo(() => {
    if (location?.state?.product) return location.state.product;

    const list = productsByCategory?.[category] || [];
    return list.find((p) => p.id === id);
  }, [location?.state, productsByCategory, category, id]);

  const variantStats = useMemo(() => {
    const stats = {};

    for (const variant of product?.variants || []) {
      Object.entries(variant).forEach(([key, value]) => {
        if (!value) return;

        const stringValue =
          typeof value === 'object' && value !== null
            ? value.name?.toLowerCase?.()
            : String(value).toLowerCase();

        if (!stringValue) return;

        if (!stats[key]) stats[key] = new Set();
        stats[key].add(stringValue);
      });
    }

    const result = {};
    for (const key in stats) {
      result[key] = Array.from(stats[key]);
    }

    return result;
  }, [product?.variants]);

  useEffect(() => {
    if (!product?.variants) return;

    const matched = product.variants.find((variant) => {
      return Object.entries(selectedVariants).every(([key, value]) => {
        if (!value) return true;
        const variantValue = variant[key];

        const stringValue =
          typeof variantValue === 'object' && variantValue !== null
            ? variantValue.name?.toLowerCase?.()
            : String(variantValue).toLowerCase();

        return stringValue === value;
      });
    });

    setSelectedVariant(matched || null);
  }, [selectedVariants, product?.variants]);

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemandaData) => {
      setAltaDemanda(altaDemandaData);
      setItemsOut(altaDemandaData.itemsOut);
    });

    return () => unsubscribe();
  }, []);

  const productImages = useMemo(() => {
    const imgs =
      selectedVariant?.images ||
      product?.img ||
      product?.image ||
      product?.images ||
      [];

    const normalized = Array.isArray(imgs) ? imgs : [imgs];

    const isSame =
      prevImagesRef.current.length === normalized.length &&
      prevImagesRef.current.every((img, i) => img === normalized[i]);

    if (!isSame) {
      prevImagesRef.current = normalized;
    }

    return prevImagesRef.current;
  }, [selectedVariant, product]);

  useEffect(() => {
    if (!productImages || productImages.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex(
        (prevIndex) => (prevIndex + 1) % productImages.length
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [productImages]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productImages]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const basePrice = selectedVariant?.price || product.price || 0;
    const toppingsCost = dataTopping
      .filter((t) => t.price > 0)
      .reduce((acc, t) => acc + t.price, 0);
    const priceFactor = altaDemanda?.priceFactor || 1;
    return Math.ceil(((basePrice + toppingsCost) * priceFactor) / 100) * 100;
  }, [selectedVariant, product, dataTopping, altaDemanda?.priceFactor]);

  const handleVariantSelect = (key, value) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!product) {
    return (
      <div className="text-center mt-8 font-coolvetica text-gray-900 text-xs m">
        Producto no encontrado.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex flex-col justify-items-center items-center ">
          <div className="w-full h-[200px] flex items-center justify-center relative">
            <img
              className="w-full h-[250px] object-cover object-center"
              src={productImages[selectedImageIndex]}
              alt={product.name}
            />

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageIndex === index
                      ? 'border-white opacity-100 shadow-lg'
                      : 'border-white opacity-70 hover:opacity-90'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} - imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col bg-gray-50 z-50 rounded-t-3xl">
            <button
              onClick={handleGoBack}
              className="text-xs font-coolvetica flex flex-row gap-2 items-center justify-center mt-3 opacity-50 hover:opacity-75 transition-opacity cursor-pointer "
            >
              <img src={arrowIcon} className="h-2 rotate-180" alt="" />
              Volver
            </button>
            <h4 className="font-coolvetica mt-6 font-bold text-4xl sm:text-6xl text-gray-900  px-4 leading-9 w-full">
              {capitalizeWords(product.name)}
            </h4>
            {product.detailDescription && (
              <p className="font-coolvetica text-xs mt-2 text-gray-900 font-light pl-4 pr-16 leading-tight">
                {product.detailDescription}
              </p>
            )}

            {customization ? (
              <div className="w-full flex justify-center px-4 mt-4">
                <div className="space-y-2 w-full">
                  {Object.entries(variantStats).map(([key, values]) => (
                    <div key={key}>
                      <h5 className="font-coolvetica font-light mb-2 text-xs w-full text-gray-900">
                        {capitalizeWords(key)}
                      </h5>
                      <div className="flex w-full overflow-auto">
                        <div className="flex">
                          {values.map((value, index) => {
                            const isSelected = selectedVariants[key] === value;
                            const isFirst = index === 0;
                            const isLast = index === values.length - 1;

                            const borderRadiusClass = isFirst
                              ? 'rounded-l-full'
                              : isLast
                              ? 'rounded-r-full'
                              : 'rounded-none';

                            return (
                              <button
                                key={value}
                                onClick={() => handleVariantSelect(key, value)}
                                className={`px-4 h-10 font-coolvetica text-xs transition-all duration-200 border border-gray-300 ${
                                  isSelected
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-600'
                                } ${borderRadiusClass} ${
                                  index > 0 ? '-ml-px' : ''
                                }`} // evita separación entre botones
                              >
                                {capitalizeWords(value)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* quickaddtocart o agotado */}
            <div className="flex flex-row items-center  w-full mt-10 gap-2">
              {/* {hasUnavailableIngredients() ? (
              <div className="bg-red-500 -mt-4 -mb-5 flex flex-row items-center gap-2 font-coolvetica font-medium text-white rounded-full p-4 text-4xl">
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
              <div className="font-coolvetica bg-black rounded-3xl h-20 text-gray-50 items-center text-center flex flex-row gap-2 px-8 text-4xl w-fit ml-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z"
                    clipRule="evenodd"
                  />
                </svg>
                Agregar
              </div>
              <div className="flex  pl-2  font-coolvetica flex-col">
                <p className=" text-xs text-gray-900">
                  Por <strong>{currencyFormat(totalPrice)}</strong>.{' '}
                </p>
                <p className="font-light  text-xs w-full text-gray-900">
                  8u. disponibles
                </p>
              </div>
            </div>
            <div className="mt-10">
              <VideoSlider reels={reels} />
            </div>
            {logo && (
              <img
                src={logo}
                className="invert brigtness-0 w-1/3 mx-auto flex justify-center  my-16"
                alt=""
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailCard;
