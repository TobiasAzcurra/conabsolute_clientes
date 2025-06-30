import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../contexts/ClientContext';

const SearchBar = ({
  phoneNumber,
  setPhoneNumber,
  showSuggestion,
  setShowSuggestion,
  previousPhone,
  onSuggestionClick,
}) => {
  const { slugEmpresa, slugSucursal } = useClient();
  const navigate = useNavigate();

  const handleSearch = () => {
    if (phoneNumber.trim().length < 8) return;
    navigate(`/${slugEmpresa}/${slugSucursal}/pedido`, {
      state: { phoneNumber },
    });
  };

  return (
    <div className="fixed z-[60] top-4 right-4 left-4 w-auto h-10 rounded-full backdrop-blur-sm border border-gray-100 bg-opacity-60 flex items-center shadow-black">
      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        onFocus={() => previousPhone && !phoneNumber && setShowSuggestion(true)}
        onBlur={() => setTimeout(() => setShowSuggestion(false), 300)}
        placeholder="Busca tu pedido con tu telefono ej: 3585168275"
        className="text-gray-100 font-light px-4 placeholder:text-gray-100 font-coolvetica text-xs bg-transparent outline-none w-full"
      />
      <button
        onClick={handleSearch}
        className="bg-gray-50  h-10 w-20 flex items-center justify-center rounded-r-full rounded-l-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
          />
        </svg>
      </button>

      {showSuggestion && previousPhone && (
        <div className="absolute left-0 right-0 top-12 h-10 bg-gray-50  shadow-lg rounded-full border border-gray-200 z-50">
          <button
            onClick={onSuggestionClick}
            className="w-full font-bold text-left px-4 h-10 text-xs flex items-center"
          >
            Último: {previousPhone}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
