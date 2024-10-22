import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import QuickAddToCart from "../../components/shopping/card/quickAddToCart";

const Items = ({
	selectedItem,
	img,
	name,
	handleItemClick,
	priority = false,
}) => {
	const location = useLocation();
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageSrc, setImageSrc] = useState(null);

	const capitalizeWords = (str) => {
		return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const isCarrito = location.pathname === "/carrito";
	const isSelected = selectedItem === name;

	const borderStyle = isSelected
		? "border-2 border-black border-opacity-100"
		: "border border-black border-opacity-20";

	const className = `flex flex-col items-center ${borderStyle} rounded-3xl bg-gray-100 p-1 transition duration-300 text-black ${
		isCarrito ? "w-[110px]" : "w-full max-w-[200px]"
	}`;

	// Manejo optimizado de la carga de imágenes
	useEffect(() => {
		const image = new Image();
		// Ajustar la fuente de la imagen según el contexto
		let finalSrc = img;
		if (isCarrito) {
			finalSrc =
				img.startsWith("/menu/") || img.startsWith("http")
					? img
					: `/menu/${img}`;
		}

		image.src = finalSrc;
		image.fetchPriority = priority ? "high" : "auto";

		image.onload = () => {
			setImageSrc(finalSrc);
			// Pequeño delay para asegurar una transición suave
			setTimeout(() => {
				setImageLoaded(true);
			}, 50);
		};
	}, [img, isCarrito, priority]);

	const renderContent = () => (
		<>
			<div className="h-[70px] w-full rounded-t-3xl overflow-hidden bg-gradient-to-b from-gray-100 via-gray-100 to-gray-300 relative flex justify-center">
				{/* Skeleton loader */}
				<div
					className={`absolute inset-0 bg-gray-200 animate-pulse transition-opacity duration-300 ease-in-out ${
						imageLoaded ? "opacity-0" : "opacity-100"
					}`}
				/>

				{/* Imagen con fade-in */}
				{imageSrc && (
					<img
						className={`object-cover absolute top-2.5 h-[70px] transition-opacity duration-300 ${
							imageLoaded ? "opacity-100" : "opacity-0"
						}`}
						src={imageSrc}
						alt={name}
						loading={priority ? "eager" : "lazy"}
						decoding={priority ? "sync" : "async"}
						fetchPriority={priority ? "high" : "auto"}
					/>
				)}
			</div>
			<div
				className={`font-coolvetica text-center ${
					isCarrito
						? "flex flex-col items-center justify-between h-[93px]"
						: "h-[50px]"
				}`}
			>
				<h5 className="mt-1 text-xs font-medium tracking-tight">
					{capitalizeWords(name)}
				</h5>
				{isCarrito && selectedItem && (
					<div className="pb-3">
						<QuickAddToCart product={selectedItem} animateFromCenter={true} />
					</div>
				)}
			</div>
		</>
	);

	if (isCarrito) {
		return <div className={className}>{renderContent()}</div>;
	}

	return (
		<Link
			className={className}
			to={`/menu/${name}`}
			onClick={() => handleItemClick(name)}
		>
			{renderContent()}
		</Link>
	);
};

export default Items;
