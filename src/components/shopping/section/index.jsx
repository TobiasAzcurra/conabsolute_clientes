import React, { useEffect, useRef, useState } from "react";
import { items } from "../../../pages/menu/MenuPage";
import Card from "../card";
import { useSelector } from "react-redux";
import StickerCanvas from "../../StickerCanvas"; // Ensure the path is correct

const Section = ({ products = [], path }) => {
	const cart = useSelector((state) => state.cartState.cart);

	// Define the containerRef using useRef
	const containerRef = useRef(null);

	let originalsBurgers = [];
	let ourCollection = [];
	let satisfyer = [];
	let promo = [];

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

	// Use useEffect for scrolling
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return (
		<div className="relative">
			{/* Ensure the parent container has position: relative */}
			<div ref={containerRef}>
				{items.burgers === path ? (
					<div className="mt-8 mb-4 mr-4 ml-4">
						{satisfyer.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-4 text-black font-coolvetica z-50">
									Satisfyers
								</p>
								<div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center mb-8">
									{satisfyer.map(({ name, description, price, id, img }, i) => (
										<Card
											key={i}
											img={img}
											name={name}
											description={description}
											price={price}
											path={path}
											id={id}
										/>
									))}
								</div>
							</div>
						)}
						{originalsBurgers.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-4 text-black font-coolvetica z-50">
									Originals
								</p>
								<div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center mb-8">
									{originalsBurgers.map(
										({ name, description, price, id, img }, i) => (
											<Card
												key={i}
												img={img}
												name={name}
												description={description}
												price={price}
												path={path}
												id={id}
											/>
										)
									)}
								</div>
							</div>
						)}
						{ourCollection.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-4 text-black font-coolvetica z-50">
									Masterpieces
								</p>
								<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
									{ourCollection.map(
										({ name, description, price, id, img }, i) => (
											<Card
												key={id}
												img={img}
												name={name}
												description={description}
												price={price}
												path={path}
												id={id}
											/>
										)
									)}
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="mt-4 mb-4 mr-4 ml-4 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
						{products.length > 0 ? (
							products.map(({ name, description, price, id, img }, i) => (
								<Card
									key={i}
									img={img}
									name={name}
									description={description}
									price={price}
									path={path}
									id={id}
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
