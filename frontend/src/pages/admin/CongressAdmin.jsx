import { useState, useEffect } from 'react';
import api from '../../services/api';

const CongressAdmin = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const res = await api.get('/admin/congress/registrations');
      setRegistrations(res.data);
    } catch (err) {
      console.error('Error loading registrations:', err);
      // Mock data
      setRegistrations([
        { id: 1, full_name: 'Иванов Иван Иванович', email: 'ivanov@mail.com', phone: '+998901234567', organization: 'ТашМИ', position: 'Врач-ревматолог', created_at: '2024-01-15T10:00:00' },
        { id: 2, full_name: 'Петров Пётр Петрович', email: 'petrov@mail.com', phone: '+998907654321', organization: 'РСНПМЦ', position: 'Заведующий отделением', created_at: '2024-01-14T10:00:00' },
        { id: 3, full_name: 'Сидорова Анна Сергеевна', email: 'sidorova@mail.com', phone: '+998909876543', organization: 'Городская клиника', position: 'Терапевт', created_at: '2024-01-13T10:00:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ФИО', 'Email', 'Телефон', 'Организация', 'Должность', 'Дата регистрации'];
    const rows = registrations.map(r => [
      r.full_name,
      r.email,
      r.phone || '',
      r.organization || '',
      r.position || '',
      new Date(r.created_at).toLocaleDateString('ru-RU')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'congress_registrations.csv';
    link.click();
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Заявки на конгресс</h1>
          <p className="text-gray-500">Всего заявок: {registrations.length}</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Экспорт CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ФИО
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Контакты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Организация
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Должность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата заявки
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{reg.full_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{reg.email}</div>
                    <div className="text-sm text-gray-500">{reg.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.organization || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.position || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reg.created_at).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {registrations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Заявок пока нет
          </div>
        )}
      </div>
    </div>
  );
};

export default CongressAdmin;
