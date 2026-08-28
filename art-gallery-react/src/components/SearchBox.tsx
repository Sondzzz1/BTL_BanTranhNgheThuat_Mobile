import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { artworkService } from '../services/artworkService';
import { Artwork } from '../types';
import './SearchBox.css';

const SearchBox: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const handleSearch = async () => {
      setIsLoading(true);
      try {
        const data = await artworkService.searchArtworks(keyword);
        setResults(data.slice(0, 8)); // Hiển thị 8 kết quả
        setShowDropdown(data.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      if (keyword.trim().length >= 1) {
        handleSearch();
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Click outside to close dropdown and search box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowSearchBox(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectArtwork = (artworkId: string) => {
    navigate(`/artworks/${artworkId}`);
    setKeyword('');
    setShowDropdown(false);
    setShowSearchBox(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/artworks?search=${encodeURIComponent(keyword)}`);
      setShowDropdown(false);
      setShowSearchBox(false);
    }
  };

  return (
    <div className="search-box-wrapper" ref={searchRef}>
      {/* Search Icon */}
      <div 
        className="search-icon-trigger"
        onMouseEnter={() => setShowSearchBox(true)}
        onClick={() => setShowSearchBox(!showSearchBox)}
      >
        🔍
      </div>

      {/* Search Box Dropdown */}
      {showSearchBox && (
        <div className="search-box-dropdown">
          <form onSubmit={handleSubmit} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm tác phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setShowDropdown(true);
              }}
              autoFocus
            />
            <button type="submit" className="search-btn-submit">
              🔍
            </button>
          </form>

          {showDropdown && (
            <div className="search-dropdown">
              {isLoading ? (
                <div className="search-loading">Đang tìm kiếm...</div>
              ) : results.length > 0 ? (
                <>
                  {results.map((artwork) => (
                    <div
                      key={artwork.id}
                      className="search-result-item"
                      onClick={() => handleSelectArtwork(artwork.id)}
                    >
                      <img
                        src={artwork.anhTranh}
                        alt={artwork.tenTranh}
                        className="search-result-img"
                      />
                      <div className="search-result-info">
                        <div className="search-result-name">{artwork.tenTranh}</div>
                        <div className="search-result-artist">{artwork.tacGia}</div>
                        <div className="search-result-price">
                          {artwork.giaBan.toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="search-view-all" onClick={handleSubmit}>
                    Xem tất cả kết quả →
                  </div>
                </>
              ) : keyword.trim().length >= 1 && !isLoading ? (
                <div className="search-no-results">Không tìm thấy tác phẩm</div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
