import { useState } from 'react';

const LANGS = [
  { key: 'ru', label: 'RU' },
  { key: 'uz', label: 'UZ' },
  { key: 'en', label: 'EN' },
];

const LangTabs = ({ children, className = '' }) => {
  const [activeLang, setActiveLang] = useState('ru');

  return (
    <div className={className}>
      <div className="flex gap-0.5 mb-3 bg-slate-100 rounded-md p-0.5 w-fit">
        {LANGS.map(lang => (
          <button
            key={lang.key}
            type="button"
            onClick={() => setActiveLang(lang.key)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeLang === lang.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
      <div>
        {typeof children === 'function' ? children(activeLang) : children}
      </div>
    </div>
  );
};

export default LangTabs;
