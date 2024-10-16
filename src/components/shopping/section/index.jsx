// src/components/Section.jsx

import React, { useEffect, useRef, useState } from "react";
import { items } from "../../../pages/menu/MenuPage";
import Card from "../card";
import { useSelector } from "react-redux";
import StickerCanvas from "../../StickerCanvas"; // Asegúrate de que la ruta sea correcta

const Section = ({ products = [], path }) => {
	const cart = useSelector((state) => state.cartState.cart);

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

	// Usar useEffect para el scroll
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	const containerRef = useRef(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth;
				const height = containerRef.current.offsetHeight;
				console.log("Container Width:", width, "Container Height:", height); // Para depuración
				setContainerSize({
					width,
					height,
				});
			}
		};

		// Inicializar el tamaño
		updateSize();

		// Actualizar el tamaño al cambiar el tamaño de la ventana
		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, []);

	return (
		<div className="relative">
			{" "}
			{/* Asegurarse de que el contenedor padre tenga position: relative */}
			<div ref={containerRef}>
				{items.burgers === path ? (
					<div className="mt-8 mb-4 mr-4 ml-4">
						{satisfyer.length > 0 && (
							<div className="section">
								<p className="relative font-bold text-5xl text-center mb-4 text-black font-coolvetica z-50">
									Satisfyers
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center mb-8">
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
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center mb-2">
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
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
									{ourCollection.map(
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
			{/* Integrar el Canvas de Stickers fuera del contenedor principal */}
			<StickerCanvas
				containerWidth={containerSize.width}
				containerHeight={containerSize.height}
			/>
		</div>
	);
};

export default Section;
