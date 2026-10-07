import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faFileCsv, faFileExcel, faAngleDown, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function ExportDropdown({ onExport, label = 'Export', size = 'sm', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (format) => {
    setIsOpen(false);
    if (!onExport) return;
    try {
      setIsExporting(true);
      await onExport(format);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef}>
      <button
        type="button"
        className={`btn btn-outline-secondary ${size === 'sm' ? 'btn-sm' : ''} d-flex align-items-center gap-2`}
        onClick={() => !disabled && !isExporting && setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={isExporting ? faSpinner : faFileExport} spin={isExporting} />
        <span>{isExporting ? 'Exporting...' : label}</span>
        <FontAwesomeIcon icon={faAngleDown} className="small" />
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-1 bg-white rounded shadow-sm border py-1"
          style={{ minWidth: '170px', zIndex: 1050 }}
        >
          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-dark small"
            onClick={() => handleSelect('csv')}
          >
            <FontAwesomeIcon icon={faFileCsv} className="text-primary" />
            <span>Export as CSV (.csv)</span>
          </button>
          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-dark small"
            onClick={() => handleSelect('xlsx')}
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-success" />
            <span>Export as Excel (.xlsx)</span>
          </button>
        </div>
      )}
    </div>
  );
}
