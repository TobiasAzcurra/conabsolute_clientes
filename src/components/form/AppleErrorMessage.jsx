import React from "react";

const AppleErrorMessage = ({ children, voucher = false }) => {
	if (!children) return null;

	return (
		<div
			className={`flex flex-col items-center w-full justify-center gap-2 min-h-10 py-4 px-4 bg-red-main text-gray-100 mt-1 transition-all duration-300 ease-in-out ${voucher ? "" : ""
				}`}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="h-6"
			>
				<path
					fillRule="evenodd"
					d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
					clipRule="evenodd"
				/>
			</svg>

			<span className="text-center font-bold">{children}</span>
		</div>
	);
};

export default AppleErrorMessage;
