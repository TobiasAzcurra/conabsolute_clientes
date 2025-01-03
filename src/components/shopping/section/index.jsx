import React, { useEffect, useRef } from "react";
import { items } from "../../../pages/menu/MenuPage";
import Card from "../card";
import { useSelector } from "react-redux";
import StickerCanvas from "../../StickerCanvas";

const Section = ({ products = [], path }) => {
	const cart = useSelector((state) => state.cartState.cart);
	const containerRef = useRef(null);

	let originalsBurgers = [];
	let ourCollection = [];
	let satisfyer = [];
	let promo = [];

	//   {
	//     "name": "Crispy BCN",
	//     "description": "Doble smash burger de nuestro blend de carnes, cheddar, cebolla crispy, bacon y salsa barbecue envuelto en un delicioso pan de papa. Incluye porción de papas.",
	//     "price": 9970,
	//     "id": "35135ASFA",
	//     "type": "our",
	//     "img": "crispy.png",
	//     "category": "burger"
	//   },

	// {
	//   "description": "2 Triples smash burger de nuestro blend de carnes, cheddar,  envuelto en un delicioso pan de papa Incluye dos porciones de papas.",
	//   "img": "promo2x1bcn.png",
	//   "id": "PROMO2X1BCN",
	//   "name": "2x1 Triple Cheeseburger",
	//   "price": 10360,
	//   "type": "promo",
	//   "category": "burger"
	// }
	if (items.burgers === path) {
		promo = products.filter((product) => product.type.includes("promo"));
		originalsBurgers = products.filter((product) =>
			product.type.includes("originals")
		);
		ourCollection = products.filter((product) => product.type.includes("our"));
		satisfyer = products.filter((product) =>
			product.type.includes("satisfyer")
		);
	} else {
		ourCollection = products;
	}

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return (
		<div className="relative">
			<div ref={containerRef}>
				{items.burgers === path ? (
					<div className="mt-8 mb-4 mr-4 ml-4">
						{promo.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
									Promos
								</p>
								<div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center ">
									{promo.map((product, i) => (
										<Card
											key={i}
											img={product.img}
											name={product.name}
											category={product.category}
											description={product.description}
											price={product.price}
											path={path}
											id={product.id}
											rating={product.rating}
											type={product.type} // Agregar la propiedad 'type' aquí
										/>
									))}
								</div>
							</div>
						)}
						{satisfyer.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
									Satisfyers
								</p>
								<div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center ">
									{satisfyer.map((product, i) => (
										<Card
											key={i}
											category={product.category}
											img={product.img}
											rating={product.rating}
											name={product.name}
											description={product.description}
											price={product.price}
											path={path}
											id={product.id}
											type={product.type} // Agregar la propiedad 'type' aquí
										/>
									))}
								</div>
							</div>
						)}
						{originalsBurgers.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
									Originals
								</p>
								<div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center ">
									{originalsBurgers.map((product, i) => (
										<Card
											key={i}
											category={product.category}
											img={product.img}
											rating={product.rating}
											name={product.name}
											description={product.description}
											price={product.price}
											path={path}
											id={product.id}
											type={product.type} // Agregar la propiedad 'type' aquí
										/>
									))}
								</div>
							</div>
						)}
						{ourCollection.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-8 mt-10 text-black font-coolvetica z-50">
									Masterpieces
								</p>
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
									{ourCollection.map((product, i) => (
										<Card
											key={i}
											category={product.category}
											img={product.img}
											rating={product.rating}
											name={product.name}
											description={product.description}
											price={product.price}
											path={path}
											id={product.id}
											type={product.type} // Agregar la propiedad 'type' aquí
										/>
									))}
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center mb-8 mt-10 px-4">
						{products.length > 0 ? (
							products.map((product, i) => (
								<Card
									key={i}
									category={product.category}
									img={product.img}
									rating={product.rating}
									name={product.name}
									description={product.description}
									price={product.price}
									path={path}
									id={product.id}
									type={product.type} // Agregar la propiedad 'type' aquí
								/>
							))
						) : (
							<span>No hay nada xd</span>
						)}
					</div>
				)}
				{cart.length > 0 && <div className="w-full h-20 bg-black"></div>}
			</div>
		</div>
	);
};

export default Section;
