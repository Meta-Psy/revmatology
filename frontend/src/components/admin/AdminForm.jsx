const AdminForm = ({ onSubmit, children, loading, submitText = 'Сохранить', onCancel, className = '' }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        {children}
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : submitText}
        </button>
      </div>
    </form>
  );
};

export default AdminForm;
