
import React, { useState, useMemo, useRef } from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS: string[] = [];

const SearchBar: React.FC<SearchBarProps> = ({ query, onQueryChange, placeholder, suggestions = DEFAULT_SUGGESTIONS }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (query && suggestions.length > 0) {
      const lowerQuery = query.toLowerCase();
      return suggestions
        .filter(s => s && s.toLowerCase().includes(lowerQuery) && s.toLowerCase() !== lowerQuery)
        .slice(0, 8); // Limit to top 8 suggestions
    }
    return DEFAULT_SUGGESTIONS;
  }, [query, suggestions]);

  const handleFocus = () => {
      if (query && filteredSuggestions.length > 0) setShowSuggestions(true);
  };

  const handleBlur = () => {
      // Delay hiding to allow click event on suggestion to fire
      setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSelect = (value: string) => {
      onQueryChange(value);
      setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
            onQueryChange(e.target.value);
            setShowSuggestions(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || 'Search...'}
        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.map((item, idx) => (
                <li 
                    key={idx}
                    className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700 border-b last:border-b-0 border-slate-100"
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before click
                        handleSelect(item);
                    }}
                >
                    {item}
                </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
