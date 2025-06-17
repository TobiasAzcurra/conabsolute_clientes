import React, { useState, useEffect } from "react";
import LoadingPoints from "../LoadingPoints";

const PhoneAutosuggest = ({ value, onChange, onSearch, searching }) => {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [previousPhone, setPreviousPhone] = useState("");

  useEffect(() => {
    const storedPhone = localStorage.getItem("customerPhone");
    if (storedPhone) {
      setPreviousPhone(storedPhone);
    }
  }, []);

  const handleInputFocus = () => {
    if (previousPhone && !value) {
      setShowSuggestion(true);
    }
  };

  const handleInputBlur = () => {
    // Small delay to allow clicking the suggestion
    setTimeout(() => setShowSuggestion(false), 200);
  };

  const handleSuggestionClick = () => {
    onChange({ target: { name: "telefono", value: previousPhone } });
    setShowSuggestion(false);
  };

  return (
    <div className="relative w-full">
      <div className="border-2 border-black h-10 flex items-center z-50 rounded-full">
        <input
          type="tel"
          name="telefono"
          value={value}
          onChange={onChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          required
          autoComplete="off"
          placeholder="Busca tu pedido con tu telefono ej: 3585168275"
          className="px-4 h-10 rounded-l-full outline-none bg-transparent w-full flex justify-center text-xs"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={searching || value.length < 8}
          className={`h-10 w-20 bg-black flex items-center justify-center border-l border-black rounded-r-full ${
            searching ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {searching ? (
            <LoadingPoints color="text-gray-100" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 text-gray-100"
            >
              <path
                fillRule="evenodd"
                d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      {showSuggestion && previousPhone && (
        <div className="absolute w-full mt-2 h-10  bg-gray-50  shadow-lg rounded-full border border-gray-200">
          <button
            onClick={handleSuggestionClick}
            className="w-full text-left px-4 h-10  rounded-md text-xs flex items-center "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4  text-gray-400 mr-1"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-gray-400 mr-2">Ultima vez:</p>
            {previousPhone}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneAutosuggest;
