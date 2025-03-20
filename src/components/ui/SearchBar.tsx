
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search agents...", 
  className = "" 
}) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search size={18} className="text-muted-foreground" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        className="w-full py-2.5 pl-10 pr-10 bg-secondary border-0 rounded-lg focus:ring-1 focus:ring-primary focus:bg-background transition-colors text-sm"
        placeholder={placeholder}
      />
      {query && (
        <button
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          onClick={clearSearch}
        >
          <X size={16} className="text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
