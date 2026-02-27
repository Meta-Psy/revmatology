import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

const FileUpload = ({ value, onChange, accept = 'image/*,.heic,.heif', label, preview = true }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onChange(file);
  };

  const isImage = accept.includes('image');
  const hasValue = !!value;

  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}

      {hasValue && preview ? (
        <div className="relative inline-block">
          {isImage && typeof value === 'string' ? (
            <img src={value} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-600 truncate max-w-[200px]">
                {typeof value === 'string' ? value.split('/').pop() : value?.name}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }`}
        >
          {isImage ? <ImageIcon className="w-6 h-6 text-slate-400 mb-1" /> : <Upload className="w-6 h-6 text-slate-400 mb-1" />}
          <span className="text-xs text-slate-500">Нажмите или перетащите файл</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
