const AdminFormField = ({ label, name, type = 'text', value, onChange, placeholder, required, error, rows, options, accept, children, className = '' }) => {
  const baseInput = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors';
  const errorInput = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';

  const handleChange = (e) => {
    if (type === 'checkbox') {
      onChange({ target: { name, value: e.target.checked, type: 'checkbox' } });
    } else if (type === 'file') {
      onChange({ target: { name, files: e.target.files, type: 'file' } });
    } else {
      onChange(e);
    }
  };

  return (
    <div className={`${className}`}>
      {label && type !== 'checkbox' && (
        <label htmlFor={name} className="block text-xs font-medium text-slate-600 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows || 3}
          className={`${baseInput} ${errorInput} resize-y`}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          className={`${baseInput} ${errorInput}`}
        >
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name={name}
            checked={!!value}
            onChange={handleChange}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      ) : children ? (
        children
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={type === 'file' ? undefined : (value || '')}
          onChange={handleChange}
          placeholder={placeholder}
          accept={accept}
          className={`${baseInput} ${errorInput}`}
        />
      )}

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};

export default AdminFormField;
