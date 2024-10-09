import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toppings from '../../../assets/toppings-v1.json';
import { addItem } from '../../../redux/cart/cartSlice';
import currencyFormat from '../../../helpers/currencyFormat';
import ArrowBack from '../../back';
import fire from '../../../assets/icon-fire.gif';

const toppingPrice = 300;
const toppingsArray = Object.values(toppings);
const toppingsFree = toppingsArray.filter((t) => t.price === 0);
const toppings100 = toppingsArray.filter((t) => t.price === toppingPrice);
const DetailCard = ({ products, type }) => {
  const { id } = useParams();

  const dispatch = useDispatch();

  const navigate = useNavigate();
  const [disable, setDisable] = useState(false);
  const [dataTopping, setDataTopping] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const [product] = products.filter((p) => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [window]);

  const handleToppingChange = (event) => {
    const toppingName = event.target.value;
    const isChecked = event.target.checked;

    const selectedTopping = toppingsArray.find((t) => t.name === toppingName);

    if (selectedTopping) {
      if (isChecked) {
        setDataTopping([...dataTopping, selectedTopping]);
      } else {
        setDataTopping(dataTopping.filter((item) => item !== selectedTopping));
      }
    }
  };

  const addToCart = (name, price, img, category) => {
    setDisable(true);

    const burgerObject = {
      name,
      price,
      img,
      toppings: dataTopping,
      quantity,
      category,
    };

    dispatch(addItem(burgerObject));
    navigate(-1);
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <>
      <div className="flex flex-col mx-auto max-w-screen-lg px-4 lg:px-0 min-h-screen">
        <div className="grid grid-cols-1 pt-8 sm:pb-14 sm:grid-cols-2 justify-items-center items-center my-auto sm:gap-20">
          <img className="w-full" src={`/menu/${product.img}`} alt="imagen" />

          <div className="my-auto w-full sm:w-11/12">
            <ArrowBack category={type} />

            <h4 className="font-antonio font-bold text-6xl sm:text-6xl leading-none text-black text-left mb-4">
              {product.name.toUpperCase()}
            </h4>
            <p className="font-bold font-antonio text-xs  w-full mb-2 text-black text-left">
              {product.description.toUpperCase()}
            </p>
            <p className="text-left  font-bold font-antonio text-xl text-black">
              {currencyFormat(product.price)}
            </p>
            <hr className="my-6 border border-black border-opacity-50 w-6/12" />
            <div className="flex flex-col">
              {/* solo poner toppings a las originals */}
              {type === 'burgers' && product.type === 'originals' ? (
                <div className="flex flex-col">
                  <h4 className="font-antonio font-bold text-xl leading-none text-black text-left  mb-2">
                    SELECCIONA LOS TOPPINGS QUE QUIERAS:
                  </h4>
                  <p className="font-bold font-antonio text-xs  w-full mb-2 text-black text-left text-red-main">
                    TOPPINGS GRATIS.
                  </p>
                  <div className="grid grid-cols-2 py-2 gap-2 font-antonio text-xs font-light w-8/12">
                    {toppingsFree.map((topping) => (
                      <label
                        className="inline-flex items-center"
                        key={topping.id}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-4"
                          value={topping.name}
                          onChange={handleToppingChange}
                        />
                        <span className="ml-2 text-black">{topping.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="font-bold font-antonio text-xs  w-full mb-2 text-black text-left text-red-main">
                    TOPPINGS POR ${toppingPrice}.
                  </p>
                  <div className="grid grid-cols-2 py-2 gap-2 font-antonio text-xs font-light w-8/12">
                    {toppings100.map((topping) => (
                      <label
                        className="inline-flex items-center"
                        key={topping.id}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-4"
                          value={topping.name}
                          onChange={handleToppingChange}
                        />
                        <span className="ml-2 text-black">{topping.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
            <div className="flex items-center justify-between w-full mt-7">
              <h4 className="font-antonio font-bold text-xl leading-none text-black text-left ">
                CANTIDAD DE UNIDADES:
              </h4>
              <div className="ml-auto flex items-center">
                <button
                  onClick={() => decrementQuantity()}
                  className="bg-red-main text-white font-bold h-7 w-7 text-xs"
                >
                  -
                </button>
                <span className="font-antonio font-bold text-xs mx-4">
                  {quantity}
                </span>
                <button
                  onClick={() => incrementQuantity()}
                  className="bg-red-main text-white font-bold text-xs h-7 w-7"
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="w-full flex justify-center mx-auto mt-7 mb-7 sm:mb-0 py-4 text-white font-bold font-kotch text-xl bg-red-main focus:outline-none hover:bg-black hover:text-red-main  gap-1"
              onClick={() =>
                addToCart(
                  product.name,
                  product.price,
                  product.img,
                  product.category
                )
              }
              disabled={disable}
            >
              agregar
              <img src={fire} className="h-6" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailCard;
