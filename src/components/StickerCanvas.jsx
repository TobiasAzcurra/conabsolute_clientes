// src/components/StickerCanvas.jsx

import React, { useState } from "react";
import Draggable from "react-draggable";
import Bolsaa from "../assets/Bolsaa.png";
import Box from "../assets/box.png";

const availableStickers = [
	Bolsaa,
	Box,
	// Añade más stickers si es necesario
];

const StickerCanvas = () => {
	const [stickers, setStickers] = useState([]);

	const addSticker = (src) => {
		const newSticker = {
			id: Date.now(),
			src,
			x: 0,
			y: 0,
		};
		setStickers([...stickers, newSticker]);
	};

	const updatePosition = (id, data) => {
		setStickers((prevStickers) =>
			prevStickers.map((sticker) =>
				sticker.id === id ? { ...sticker, x: data.x, y: data.y } : sticker
			)
		);
	};

	const removeSticker = (id) => {
		setStickers(stickers.filter((sticker) => sticker.id !== id));
	};

	return (
		<div className="relative w-full h-screen bg-gray-100">
			{/* Barra de herramientas para añadir stickers */}
			<div className="absolute top-4 left-4 flex space-x-2">
				{availableStickers.map((src, index) => (
					<img
						key={index}
						src={src}
						alt={`Sticker ${index + 1}`}
						className="w-24 h-24 cursor-pointer" // Tamaño duplicado en la barra
						onClick={() => addSticker(src)}
					/>
				))}
			</div>

			{/* Área de canvas donde se colocan los stickers */}
			<div className="w-full h-full">
				{stickers.map((sticker) => (
					<Draggable
						key={sticker.id}
						defaultPosition={{ x: sticker.x, y: sticker.y }}
						onStop={(e, data) => updatePosition(sticker.id, data)}
					>
						<img
							src={sticker.src}
							alt="Sticker"
							className="w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 cursor-move" // Tamaño duplicado y responsivo
							onDoubleClick={() => removeSticker(sticker.id)}
						/>
					</Draggable>
				))}
			</div>
		</div>
	);
};

export default StickerCanvas;
