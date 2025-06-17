import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toppings from "../../../assets/toppings-v1.json";
import { addItem } from "../../../redux/cart/cartSlice";
import currencyFormat from "../../../helpers/currencyFormat";
import ArrowBack from "../../back";
import QuickAddToCart from "../card/quickAddToCart";
import VideoSlider from "./VideoSlider";
import { listenToAltaDemanda } from "../../../firebase/readConstants";
import { getProductById } from "../../../firebase/getProducts";
import { getImageSrc } from "../../../helpers/getImageSrc";
import logo from "../../../assets/Logo APM-07.png";
import imagen2 from "../../../assets/IMG_8408.jpg";
import imagen3 from "../../../assets/IMG_8413.jpg";
import arrowIcon from "../../../assets/arrowIcon.png";
import labrado1 from "../../../assets/labrado1.jpg";
import labrado2 from "../../../assets/labrado2.jpg";
import labrado3 from "../../../assets/labrado3.jpg";

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
  const [customization, setCustomization] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedLabrado, setSelectedLabrado] = useState(null);

  // Función para ir hacia atrás
  const handleGoBack = () => {
    navigate(-1);
  };

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
          console.error("❌ Error cargando producto:", err);
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
        <p className="text-xs m font-semibold text-gray-700">
          Cargando producto...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center mt-8 font-coolvetica text-gray-900 text-xs m">
        Producto no encontrado.
      </div>
    );
  }

  const imageSrc = getImageSrc(product);

  // Array de imágenes: primera es la principal, segunda y tercera son las importadas
  const productImages = useMemo(() => [imageSrc, imagen2, imagen3], [imageSrc]);

  // Auto-cambio de imágenes cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedImageIndex(
        (prevIndex) => (prevIndex + 1) % productImages.length
      );
    }, 2000);

    // Limpiar el intervalo cuando el componente se desmonte o cambie
    return () => clearInterval(interval);
  }, [productImages.length]);

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

            {/* Círculos de imágenes */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageIndex === index
                      ? "border-white opacity-100 shadow-lg"
                      : "border-white opacity-70 hover:opacity-90"
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
              <p className="font-coolvetica text-xs mt-2 text-gray-900 font-light text-xs pl-4 pr-16 text-gray-500 leading-tight">
                {product.detailDescription}
              </p>
            )}

            {customization ? (
              <div className="w-full flex justify-center px-4 mt-4">
                <div className="space-y-2 w-full">
                  {/* Selector de Color */}
                  <div>
                    <h5 className="font-coolvetica font-light mb-2 text-xs w-full text-gray-900">
                      Color
                    </h5>
                    <div className="flex">
                      <button
                        onClick={() => setSelectedColor("red")}
                        className={`px-4 h-10 rounded-l-full font-coolvetica text-xs transition-all duration-200 ${
                          selectedColor === "red"
                            ? "bg-gray-300 text-gray-900"
                            : "bg-gray-50  font-light text-gray-500"
                        }`}
                      >
                        Rojo
                      </button>
                      <button
                        onClick={() => setSelectedColor("black")}
                        className={`px-4 h-10 rounded-r-full font-coolvetica text-xs transition-all duration-200 ${
                          selectedColor === "black"
                            ? "bg-gray-300 text-gray-900"
                            : "bg-gray-50  font-light text-gray-500 "
                        }`}
                      >
                        Negro
                      </button>
                    </div>
                  </div>

                  {/* Selector de Tamaño */}
                  <div>
                    <h5 className="font-coolvetica font-light mb-2 text-xs w-full text-gray-900">
                      Tamaño
                    </h5>
                    <div className="flex">
                      <button
                        onClick={() => setSelectedSize("small")}
                        className={`px-4 h-10 rounded-l-full font-coolvetica text-xs transition-all duration-200 ${
                          selectedSize === "small"
                            ? "bg-gray-300 text-gray-900"
                            : "bg-gray-50  font-light text-gray-500 "
                        }`}
                      >
                        Chico
                      </button>
                      <button
                        onClick={() => setSelectedSize("medium")}
                        className={`px-4 h-10  font-coolvetica text-xs   transition-all duration-200 ${
                          selectedSize === "medium"
                            ? "bg-gray-300 text-gray-900"
                            : "bg-gray-50  font-light text-gray-500 "
                        }`}
                      >
                        Mediano
                      </button>
                      <button
                        onClick={() => setSelectedSize("large")}
                        className={`px-4 h-10 rounded-r-full font-coolvetica text-xs transition-all duration-200 ${
                          selectedSize === "large"
                            ? "bg-gray-300 text-gray-900"
                            : "bg-gray-50  font-light text-gray-500 "
                        }`}
                      >
                        Grande
                      </button>
                    </div>
                  </div>

                  {/* Selector de labrado */}
                  <div>
                    <h5 className="font-coolvetica font-light mb-2 text-xs w-full text-gray-900">
                      Labrado
                    </h5>
                    <div className="flex">
                      <button
                        onClick={() => setSelectedLabrado("labrado1")}
                        className={`relative overflow-hidden h-10 w-1/3 rounded-l-full transition-all duration-200 ${
                          selectedLabrado === "labrado1"
                            ? "opacity-100"
                            : "opacity-30"
                        }`}
                      >
                        <img
                          src={labrado1}
                          alt="Labrado 1"
                          className="w-full h-full object-cover"
                        />
                        {selectedLabrado === "labrado1" && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-20"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedLabrado("labrado2")}
                        className={`relative overflow-hidden h-10 w-1/3 transition-all duration-200 ${
                          selectedLabrado === "labrado2"
                            ? "opacity-100"
                            : "opacity-30"
                        }`}
                      >
                        <img
                          src={labrado2}
                          alt="Labrado 2"
                          className="w-full h-full object-cover"
                        />
                        {selectedLabrado === "labrado2" && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-20"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedLabrado("labrado3")}
                        className={`relative overflow-hidden h-10 w-1/3 rounded-r-full transition-all duration-200 ${
                          selectedLabrado === "labrado3"
                            ? "opacity-100"
                            : "opacity-30"
                        }`}
                      >
                        <img
                          src={labrado3}
                          alt="Labrado 3"
                          className="w-full h-full object-cover"
                        />
                        {selectedLabrado === "labrado3" && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-20"></div>
                        )}
                      </button>
                    </div>
                  </div>
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
                  Por <strong>{currencyFormat(totalPrice)}</strong>.{" "}
                </p>
                <p className="font-light  text-xs w-full text-gray-900">
                  8u. disponibles
                </p>
              </div>
            </div>
            <div className="mt-10">
              <VideoSlider />
            </div>
            <img
              src={logo}
              className="invert brigtness-0 w-1/3 mx-auto flex justify-center  my-16"
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailCard;
