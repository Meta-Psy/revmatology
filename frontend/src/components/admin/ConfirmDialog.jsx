import { AlertTriangle } from 'lucide-react';
import AdminModal from './AdminModal';

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Подтверждение', message = 'Вы уверены?', confirmText = 'Удалить', loading = false }) => {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Удаление...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm text-slate-600 pt-2">{message}</p>
      </div>
    </AdminModal>
  );
};

export default ConfirmDialog;
