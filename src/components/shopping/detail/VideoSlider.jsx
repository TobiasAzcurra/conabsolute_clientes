import React, { useState, useRef } from "react";
import video from "../../../assets/anhelo.mp4";
import video2 from "../../../assets/anhelo2.mp4";
import video3 from "../../../assets/anhelo3.mp4";
import video4 from "../../../assets/anhelo4.mp4";

const VideoSlider = () => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const sliderRef = useRef(null);
	const touchStartXRef = useRef(0);
	const touchEndXRef = useRef(0);

	const slides = [
		{
			type: "video",
			src: video2,
			title: "Muy sexy",
		},
		{
			type: "video",
			src: video,
			title: "Obsesion",
		},
		{
			type: "video",
			src: video4,
			title: "No hacen falta palabras",
		},
		{
			type: "video",
			src: video3,
			title: "Nacido en Rio Cuarto",
		},
		{
			type: "text",
			title: (
				<>
					<span className="opacity-50">Entendelo</span>{" "}
					<span className="opacity-100">personalmente.</span>
				</>
			),
		},
	];

	const goToSlide = (index) => {
		setCurrentIndex(index);
	};

	const handleTouchStart = (e) => {
		touchStartXRef.current = e.touches[0].clientX;
	};

	const handleTouchMove = (e) => {
		touchEndXRef.current = e.touches[0].clientX;
	};

	const handleTouchEnd = () => {
		const touchDifference = touchStartXRef.current - touchEndXRef.current;

		if (touchDifference > 50) {
			// Swipe left
			setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
		} else if (touchDifference < -50) {
			// Swipe right
			setCurrentIndex((prevIndex) =>
				prevIndex === 0 ? slides.length - 1 : prevIndex - 1
			);
		}

		// Reset touch start and end values
		touchStartXRef.current = 0;
		touchEndXRef.current = 0;
	};

	return (
		<div
			ref={sliderRef}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			className="relative overflow-hidden w-full max-w-4xl mx-auto pl-4 pr-2"
		>
			<div
				className="flex transition-transform gap-4 ease-in-out duration-500 rounded-3xl"
				style={{ transform: `translateX(-${currentIndex * 83.33}%)` }}
			>
				{slides.map((slide, index) => (
					<div className="min-w-[83.33%] box-border relative " key={index}>
						{slide.type === "video" ? (
							<video
								src={slide.src}
								autoPlay
								loop
								muted
								playsInline
								webkit-playsinline="true"
								className="w-full h-auto object-cover rounded-3xl"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-start bg-black text-white font-coolvetica rounded-3xl p-8 text-left">
								<h2 className="text-2xl font-bold">{slide.title}</h2>
							</div>
						)}
						{slide.type !== "text" && (
							<div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent rounded-b-3xl pointer-events-none"></div>
						)}
						{slide.type !== "text" && (
							<div className="absolute bottom-5 left-5 text-white">
								<h2 className="text-xl font-bold">{slide.title}</h2>
								{/* Si no tienes una descripción, puedes eliminar esta línea */}
								{/* <p className="text-lg">{slide.description}</p> */}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default VideoSlider;
