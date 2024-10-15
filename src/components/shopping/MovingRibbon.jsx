import { useEffect, useRef } from "react";

const MovingRibbon = ({ angle }) => {
	const ribbonRef = useRef(null);

	useEffect(() => {
		const ribbon = ribbonRef.current;
		let animationFrame;
		let position = 0;

		const animateRibbon = () => {
			position -= 1;
			if (position <= -ribbon.scrollWidth) {
				position = 0;
			}
			ribbon.style.transform = `translateX(${position}px)`;
			animationFrame = requestAnimationFrame(animateRibbon);
		};

		animationFrame = requestAnimationFrame(animateRibbon);

		return () => cancelAnimationFrame(animationFrame);
	}, []);

	return (
		<div
			className="overflow-hidden  bg-white absolute"
			style={{
				transform: `rotate(${angle}deg)`,
				top: "0",
				left: "0px",
				width: "100vw",
				overflow: "hidden",
				zIndex: "1",
			}}
		>
			<div
				ref={ribbonRef}
				className="inline-block "
				style={{
					minWidth: "150vw",
					whiteSpace: "nowrap",
				}}
			>
				<div className="flex flex-row gap-4">
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							; export default MovingRibbon{" "}
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className="text mb-[-20px] text-end text-black font-black  font-coolvetica">
								Vas a pedir más.
							</p>
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
					<div className="flex flex-row items-center mt-2 gap-8">
						<div className="flex flex-col">
							<p className=" text-black font-black text-9xl italic font-coolvetica">
								ANHELO
							</p>
							<p className="text mt-[-20px] text-start text-black font-black  font-coolvetica mb-4">
								Vas a pedir más.
							</p>
						</div>
						<p className="font-black text-9xl text-black mb-2">-</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MovingRibbon;
