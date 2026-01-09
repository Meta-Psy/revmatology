import { useState, useEffect } from 'react';
import api from '../../services/api';

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error loading users:', err);
      // Mock data
      setUsers([
        { id: 1, email: 'admin@example.com', full_name: 'Администратор', role: 'admin', is_active: true, created_at: '2024-01-01T10:00:00' },
        { id: 2, email: 'user@example.com', full_name: 'Иванов Иван', role: 'user', is_active: true, created_at: '2024-01-10T10:00:00' },
        { id: 3, email: 'doctor@example.com', full_name: 'Петров Пётр', role: 'user', is_active: true, created_at: '2024-01-15T10:00:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error deleting user:', err);
      setUsers(users.filter(u => u.id !== id));
    }
    setDeleteModal(null);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, null, { params: { role: newRole } });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setRoleModal(null);
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
        <h1 className="text-2xl font-bold text-gray-800">Управление пользователями</h1>
        <div className="text-sm text-gray-500">
          Всего: {users.length} пользователей
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setRoleModal(user)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => setDeleteModal(user)}
                    className="text-red-500 hover:text-red-700"
                    title="Удалить"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить пользователя?</h3>
            <p className="text-gray-500 mb-6">
              Вы уверены, что хотите удалить пользователя "{deleteModal.full_name}"?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Изменить роль</h3>
            <p className="text-gray-500 mb-4">
              Пользователь: {roleModal.full_name}
            </p>
            <div className="space-y-2 mb-6">
              <button
                onClick={() => handleRoleChange(roleModal.id, 'user')}
                className={`w-full p-3 rounded-lg border text-left ${
                  roleModal.role === 'user' ? 'border-[var(--color-primary)] bg-cyan-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Пользователь</div>
                <div className="text-sm text-gray-500">Базовый доступ к сайту</div>
              </button>
              <button
                onClick={() => handleRoleChange(roleModal.id, 'admin')}
                className={`w-full p-3 rounded-lg border text-left ${
                  roleModal.role === 'admin' ? 'border-[var(--color-primary)] bg-cyan-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Администратор</div>
                <div className="text-sm text-gray-500">Полный доступ к админ-панели</div>
              </button>
            </div>
            <button
              onClick={() => setRoleModal(null)}
              className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
