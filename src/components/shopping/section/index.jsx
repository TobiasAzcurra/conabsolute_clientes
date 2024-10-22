import React, { useEffect, useRef } from "react";
import { items } from "../../../pages/menu/MenuPage";
import Card from "../card";
import { useSelector } from "react-redux";
import StickerCanvas from "../../StickerCanvas";

const Section = ({ products = [], path }) => {
	const cart = useSelector((state) => state.cartState.cart);
	const containerRef = useRef(null);

	const categorizedProducts = {
		promo: products.filter((product) => product.type?.includes("promo")),
		originals: products.filter((product) =>
			product.type?.includes("originals")
		),
		our: products.filter((product) => product.type?.includes("our")),
		satisfyer: products.filter((product) =>
			product.type?.includes("satisfyer")
		),
	};

	const getLoadingStrategy = (sectionName, index) => {
		if (index < 4 && sectionName === "satisfyer") return "eager";
		if (index < 2 && sectionName === "originals") return "eager";
		if (index < 4 && sectionName === "our") return "eager";
		return "lazy";
	};

	const ProductSection = ({ title, products, sectionName }) => {
		if (!products.length) return null;

		return (
			<div className="section">
				<p className="relative font-bold text-5xl text-center mb-4 text-black font-coolvetica z-50">
					{title}
				</p>
				<div
					className={`
            ${
							sectionName === "our"
								? "grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
								: "flex flex-col md:flex-row gap-4 justify-items-center md:justify-center mb-8"
						}
          `}
				>
					{products.map((product, index) => (
						<Card
							key={product.id || index}
							{...product}
							path={path}
							loadingStrategy={getLoadingStrategy(sectionName, index)}
							priority={index < 4 && sectionName === "satisfyer"}
						/>
					))}
				</div>
			</div>
		);
	};

	useEffect(() => {
		window.scrollTo(0, 0);

		if (items.burgers === path && categorizedProducts.satisfyer.length) {
			const firstProduct = categorizedProducts.satisfyer[0];
			if (firstProduct) {
				const img = new Image();
				img.src = `/menu/${firstProduct.img}`;
			}
		}
	}, []);

	return (
		<div className="relative">
			<div ref={containerRef}>
				{items.burgers === path ? (
					<div className="mt-8 mb-4 mr-4 ml-4">
						<ProductSection
							title="Satisfyers"
							products={categorizedProducts.satisfyer}
							sectionName="satisfyer"
						/>
						<ProductSection
							title="Originals"
							products={categorizedProducts.originals}
							sectionName="originals"
						/>
						<ProductSection
							title="Masterpieces"
							products={categorizedProducts.our}
							sectionName="our"
						/>
					</div>
				) : (
					<div className="flex flex-col md:flex-row gap-4 justify-items-center md:justify-center mb-8 mt-10 px-4">
						{products.length > 0 ? (
							products.map((product, index) => (
								<Card
									key={product.id || index}
									{...product}
									path={path}
									loadingStrategy={index < 4 ? "eager" : "lazy"}
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
