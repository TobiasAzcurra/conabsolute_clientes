// src/components/StickerCanvas.jsx

import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import Bolsaa from "../assets/Bolsaa.png";
import Box from "../assets/IMG-20240130-WA0059-removebg-preview.png";
// Importa más stickers si lo deseas

const availableStickers = [
	Bolsaa,
	Box,
	// Añade más stickers aquí
];

const StickerCanvas = ({ containerWidth, containerHeight }) => {
	const [stickers, setStickers] = useState([]);

	// Función para generar posiciones aleatorias dentro del contenedor
	const getRandomPosition = (stickerWidth, stickerHeight) => {
		const padding = 20; // Espacio desde los bordes
		const maxX = containerWidth - stickerWidth - padding;
		const maxY = Math.min(containerHeight - stickerHeight - padding, 1000); // Limitar a 1000px

		const x = Math.floor(Math.random() * (maxX - padding)) + padding;
		const y = Math.floor(Math.random() * (maxY - padding)) + padding;
		return { x, y };
	};

	// useEffect para inicializar los stickers al cargar la página
	useEffect(() => {
		if (containerWidth === 0 || containerHeight === 0) {
			// Evitar inicializar si las dimensiones no están disponibles
			return;
		}

		// Crear 5 copias de cada sticker en lugar de 15
		const initialStickers = availableStickers.flatMap((src) => {
			return Array.from({ length: 5 }, () => {
				const { x, y } = getRandomPosition(48, 48); // Tamaño ajustado
				return {
					id: `${Date.now()}-${Math.random()}`, // ID único
					src,
					x,
					y,
				};
			});
		});

		console.log("Initial Stickers:", initialStickers); // Para depuración
		setStickers(initialStickers);
	}, [containerWidth, containerHeight]);

	// Función para actualizar la posición de un sticker
	const updatePosition = (id, data) => {
		setStickers((prevStickers) =>
			prevStickers.map((sticker) =>
				sticker.id === id ? { ...sticker, x: data.x, y: data.y } : sticker
			)
		);
	};

	// Función para eliminar un sticker
	const removeSticker = (id) => {
		setStickers((prevStickers) =>
			prevStickers.filter((sticker) => sticker.id !== id)
		);
	};

	return (
		<div className="absolute top-0 left-0 w-full h-full pointer-events-none">
			{/* Área de canvas donde se colocan los stickers */}
			<div className="w-full h-full">
				{stickers.map((sticker) => (
					<Draggable
						key={sticker.id}
						position={{ x: sticker.x, y: sticker.y }}
						onStop={(e, data) => updatePosition(sticker.id, data)}
					>
						<img
							src={sticker.src}
							alt="Sticker"
							className="w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 cursor-move pointer-events-auto"
							onDoubleClick={() => removeSticker(sticker.id)}
						/>
					</Draggable>
				))}
			</div>
		</div>
	);
};

export default StickerCanvas;
