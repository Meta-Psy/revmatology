import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { newsAPI } from '../../services/api';

const NewsAdmin = () => {
  const { i18n } = useTranslation();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const res = await newsAPI.getAll(0, 100);
      setNews(res.data);
    } catch (err) {
      console.error('Error loading news:', err);
      // Mock data for demo
      setNews([
        { id: 1, title_ru: 'Анонс III Конгресса Ревматологов', title_uz: 'III Revmatologlar Kongressi e\'loni', title_en: 'III Rheumatologists Congress Announcement', is_published: true, created_at: '2024-01-15T10:00:00' },
        { id: 2, title_ru: 'Новые методы диагностики', title_uz: 'Yangi diagnostika usullari', title_en: 'New diagnostic methods', is_published: true, created_at: '2024-01-10T10:00:00' },
        { id: 3, title_ru: 'Школа ревматологов: набор', title_uz: 'Revmatologlar maktabi', title_en: 'Rheumatologists School', is_published: false, created_at: '2024-01-05T10:00:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = (item) => {
    const lang = i18n.language;
    return item[`title_${lang}`] || item.title_ru;
  };

  const handleDelete = async (id) => {
    try {
      await newsAPI.delete(id);
      setNews(news.filter(n => n.id !== id));
      setDeleteModal(null);
    } catch (err) {
      console.error('Error deleting news:', err);
      // For demo, just remove from local state
      setNews(news.filter(n => n.id !== id));
      setDeleteModal(null);
    }
  };

  const togglePublish = async (item) => {
    try {
      await newsAPI.update(item.id, { is_published: !item.is_published });
      setNews(news.map(n => n.id === item.id ? { ...n, is_published: !n.is_published } : n));
    } catch (err) {
      console.error('Error updating news:', err);
      setNews(news.map(n => n.id === item.id ? { ...n, is_published: !n.is_published } : n));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Управление новостями</h1>
        <Link
          to="/admin/news/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить новость
        </Link>
      </div>

      {/* News Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заголовок
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {news.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                    {getTitle(item)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => togglePublish(item)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.is_published ? 'Опубликовано' : 'Черновик'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/news/${item.id}`}
                      className="text-gray-400 hover:text-gray-600"
                      title="Просмотреть"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link
                      to={`/admin/news/${item.id}/edit`}
                      className="text-blue-500 hover:text-blue-700"
                      title="Редактировать"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setDeleteModal(item)}
                      className="text-red-500 hover:text-red-700"
                      title="Удалить"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {news.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Новостей пока нет
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить новость?</h3>
            <p className="text-gray-500 mb-6">
              Вы уверены, что хотите удалить "{getTitle(deleteModal)}"? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;
