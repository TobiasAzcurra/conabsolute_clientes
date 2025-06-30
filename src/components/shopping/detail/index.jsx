import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useClient } from '../../../contexts/ClientContext';
import currencyFormat from '../../../helpers/currencyFormat';
import { listenToAltaDemanda } from '../../../firebase/constants/altaDemanda';
import arrowIcon from '../../../assets/arrowIcon.png';
import VideoSlider from './VideoSlider';
import QuickAddToCart from '../card/quickAddToCart';

const capitalizeWords = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const DetailCard = () => {
  const { slug: category, id } = useParams();
  const { productsByCategory, clientAssets, clientConfig } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cartState.cart);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [altaDemanda, setAltaDemanda] = useState(null);
  const [itemsOut, setItemsOut] = useState({});
  const [customization, setCustomization] = useState(true);
  const [disable, setDisable] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const prevImagesRef = useRef([]);

  const reels = clientAssets?.reels || [];
  const logo = clientAssets?.logoFooter || clientAssets?.logo || '';

  const product = useMemo(() => {
    if (location?.state?.product) return location.state.product;

    const list = productsByCategory?.[category] || [];
    const foundProduct = list.find((p) => p.id === id);

    return foundProduct;
  }, [location?.state, productsByCategory, category, id]);

  const variantStats = useMemo(() => {
    const stats = {};

    for (const variant of product?.variants || []) {
      const key = variant.linkedTo;
      const value = variant.name;
      if (!key || !value) continue;

      const stringKey = String(key).toLowerCase();
      const stringValue = String(value).toLowerCase();

      if (!stats[stringKey]) stats[stringKey] = new Set();
      stats[stringKey].add(stringValue);
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

        const variantKey = variant.linkedTo?.toLowerCase?.();
        const variantValue = variant.name?.toLowerCase?.();

        return key === variantKey && value === variantValue;
      });
    });

    setSelectedVariant(matched || null);
  }, [selectedVariants, product?.variants]);

  useEffect(() => {
    if (!product?.variants || product.variants.length === 0) return;

    if (Object.keys(selectedVariants).length > 0) return;

    const autoSelected = {};
    const stats = {};

    for (const variant of product.variants) {
      const key = variant.linkedTo;
      const value = variant.name;
      if (!key || !value) continue;

      const stringKey = String(key).toLowerCase();
      const stringValue = String(value).toLowerCase();

      if (!stats[stringKey]) stats[stringKey] = new Set();
      stats[stringKey].add(stringValue);
    }

    for (const key in stats) {
      autoSelected[key] = Array.from(stats[key])[0];
    }

    setSelectedVariants(autoSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.variants]);

  useEffect(() => {
    const unsubscribe = listenToAltaDemanda((altaDemandaData) => {
      setAltaDemanda(altaDemandaData);
      setItemsOut(altaDemandaData.itemsOut);
    });

    return () => unsubscribe();
  }, []);

  const productImages = useMemo(() => {
    const variantHasImages =
      Array.isArray(selectedVariant?.productImage) &&
      selectedVariant.productImage.length > 0;

    const imgs = variantHasImages
      ? selectedVariant.productImage
      : product?.img || product?.image || product?.images || [];

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

  const variantTotalPrice = useMemo(() => {
    return Object.entries(selectedVariants).reduce((acc, [key, value]) => {
      if (!value) return acc;
      const variant = product.variants?.find(
        (v) =>
          v.linkedTo?.toLowerCase() === key && v.name?.toLowerCase() === value
      );
      return acc + (variant?.price || 0);
    }, 0);
  }, [selectedVariants, product?.variants]);

  const basePrice = product.price || 0;
  const totalBeforeFactor = basePrice + variantTotalPrice;
  const priceFactor = altaDemanda?.priceFactor || 1;
  const totalPrice = Math.ceil((totalBeforeFactor * priceFactor) / 100) * 100;

  const variantNames = useMemo(() => {
    return Object.values(selectedVariants)
      .filter(Boolean)
      .map((v) => capitalizeWords(v))
      .join(' ');
  }, [selectedVariants]);

  const combinedName = useMemo(() => {
    return variantNames ? `${product.name} ${variantNames}` : product.name;
  }, [product?.name, variantNames]);

  const firstVariantWithImage = useMemo(() => {
    return product.variants?.find(
      (v) =>
        selectedVariants[v.linkedTo?.toLowerCase()] === v.name?.toLowerCase() &&
        v.productImage?.length > 0
    );
  }, [product.variants, selectedVariants]);

  const selectedVariantsArray = useMemo(() => {
    return (product.variants || []).filter((v) => {
      const key = v.linkedTo?.toLowerCase();
      const value = v.name?.toLowerCase();
      return selectedVariants[key] === value;
    });
  }, [product.variants, selectedVariants]);

  const productToSend = useMemo(() => {
    return {
      ...product,
      id: product.id,
      name: combinedName,
      category: product.category,
      img:
        firstVariantWithImage?.productImage?.[0] ||
        product.img?.[0] ||
        product.img,
      price: totalPrice,
      basePrice: basePrice,
      finalPrice: totalPrice,
      variants: selectedVariantsArray,
    };
  }, [
    product,
    combinedName,
    firstVariantWithImage,
    totalPrice,
    selectedVariantsArray,
  ]);

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

          <div className="flex flex-col bg-gray-50 z-50 rounded-t-3xl gap-4">
            <button
              onClick={handleGoBack}
              className="text-xs font-coolvetica flex flex-row gap-2 items-center justify-center mt-3 opacity-50 hover:opacity-75 transition-opacity cursor-pointer "
            >
              <img src={arrowIcon} className="h-2 rotate-180" alt="" />
              Volver
            </button>
            <h4 className="font-coolvetica font-bold text-4xl sm:text-6xl text-gray-900 px-4 leading-9 w-full text-center">
              {capitalizeWords(product.name)}
            </h4>
            {product.detailDescription && (
              <p className="font-coolvetica text-xs text-gray-900 font-light pl-4 pr-16 leading-tight">
                {product.detailDescription}
              </p>
            )}

            {customization ? (
              <div className="w-full flex justify-center px-4">
                <div className="space-y-2 w-full">
                  {Object.entries(variantStats).map(([key, values]) => (
                    <div key={key}>
                      <h5 className="font-coolvetica font-light mb-2 text-xs w-full text-gray-900">
                        {clientConfig?.labels?.[key] || capitalizeWords(key)}
                      </h5>
                      <div className="flex w-full overflow-auto">
                        <div className="flex">
                          {values.map((value, index) => {
                            const isSelected = selectedVariants[key] === value;
                            const isFirst = index === 0;
                            const isLast = index === values.length - 1;
                            const isOnly = values.length === 1;

                            const borderRadiusClass = isOnly
                              ? 'rounded-full'
                              : isFirst
                              ? 'rounded-l-full'
                              : isLast
                              ? 'rounded-r-full'
                              : 'rounded-none';

                            const variant = (product.variants || []).find(
                              (v) =>
                                v.linkedTo?.toLowerCase() === key &&
                                v.name?.toLowerCase() === value
                            );
                            const hasAttributeImage =
                              variant &&
                              Array.isArray(variant.attributeImage) &&
                              variant.attributeImage.length > 0;

                            const totalVariants = values.length;
                            const maxTotalWidth = 500; // px
                            const widthPerButton = Math.min(
                              Math.floor(maxTotalWidth / totalVariants),
                              200
                            );

                            return (
                              <button
                                key={value}
                                onClick={() => handleVariantSelect(key, value)}
                                className={`px-4 h-10 font-coolvetica text-xs transition-all duration-200 border border-gray-300 ${borderRadiusClass} ${
                                  index > 0 ? '-ml-px' : ''
                                } flex items-center justify-center
                                  ${
                                    !hasAttributeImage
                                      ? isSelected
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-600'
                                      : ''
                                  }
                                `}
                                style={
                                  hasAttributeImage
                                    ? {
                                        padding: 0,
                                        width: '100%',
                                        height: 40,
                                        overflow: 'hidden',
                                      }
                                    : {}
                                }
                              >
                                {hasAttributeImage ? (
                                  <img
                                    src={variant.attributeImage[0]}
                                    alt={value}
                                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                                      isSelected ? 'opacity-100' : 'opacity-50'
                                    }`}
                                    style={{ width: '100%', height: '100%' }}
                                  />
                                ) : (
                                  capitalizeWords(value)
                                )}
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

            <div className="flex flex-row items-center w-full px-4 gap-2">
              <div className="flex-shrink-0 flex-1">
                <QuickAddToCart
                  product={productToSend}
                  calculatedPrice={totalPrice}
                  displayAsFullButton={true}
                />
              </div>

              <div className="flex-1 pl-2 font-coolvetica flex-col">
                <p className="text-xs text-gray-900">
                  Por <strong>{currencyFormat(totalPrice)}</strong>
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
