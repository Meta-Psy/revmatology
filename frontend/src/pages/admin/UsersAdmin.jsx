import { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import { adminAPI } from '../../services/api';
import {
  PageHeader,
  AdminTable,
  AdminModal,
  AdminForm,
  AdminFormField,
  ConfirmDialog,
  Skeleton,
} from '../../components/admin';
import { useToast } from '../../components/admin/Toast';

const ROLE_OPTIONS = [
  { value: 'user', label: 'Пользователь' },
  { value: 'admin', label: 'Администратор' },
];

const RoleBadge = ({ role }) => {
  const isAdmin = role === 'admin';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isAdmin
          ? 'bg-purple-50 text-purple-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {isAdmin && <Shield className="w-3 h-3" />}
      {isAdmin ? 'Администратор' : 'Пользователь'}
    </span>
  );
};

const columns = [
  {
    key: 'full_name',
    label: 'Имя',
    sortable: true,
    render: (val) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-slate-500">
            {val?.charAt(0) || 'U'}
          </span>
        </div>
        <span className="font-medium text-slate-800">{val || '\u2014'}</span>
      </div>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (val) => <span className="text-slate-500">{val}</span>,
  },
  {
    key: 'role',
    label: 'Роль',
    sortable: true,
    width: 'w-36',
    render: (val) => <RoleBadge role={val} />,
  },
  {
    key: 'created_at',
    label: 'Дата регистрации',
    sortable: true,
    width: 'w-36',
    render: (val) => (
      <span className="text-xs text-slate-500">
        {val ? new Date(val).toLocaleDateString('ru-RU') : '\u2014'}
      </span>
    ),
  },
];

const UsersAdmin = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch {
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminAPI.deleteUser(deleteTarget.id);
      setUsers(users.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Пользователь удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const openRoleModal = (user) => {
    setRoleModal(user);
    setSelectedRole(user.role);
  };

  const handleRoleChange = async () => {
    if (selectedRole === roleModal.role) {
      setRoleModal(null);
      return;
    }
    setSavingRole(true);
    try {
      await adminAPI.updateUserRole(roleModal.id, selectedRole);
      setUsers(users.map((u) => (u.id === roleModal.id ? { ...u, role: selectedRole } : u)));
      toast.success('Роль обновлена');
      setRoleModal(null);
    } catch {
      toast.error('Ошибка обновления роли');
    } finally {
      setSavingRole(false);
    }
  };

  if (loading) return <Skeleton rows={8} cols={4} />;

  return (
    <div>
      <PageHeader
        title="Управление пользователями"
        breadcrumbs={[
          { label: 'Главная', path: '/admin' },
          { label: 'Пользователи' },
        ]}
        action={
          <span className="text-xs text-slate-500">
            Всего: {users.length} пользователей
          </span>
        }
      />

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        onDelete={setDeleteTarget}
        actions={(row) => (
          <button
            onClick={() => openRoleModal(row)}
            className="p-1.5 rounded-md text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            title="Изменить роль"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
        )}
        emptyIcon={Users}
        emptyTitle="Пользователей пока нет"
      />

      {/* Role Change Modal */}
      <AdminModal
        open={!!roleModal}
        onClose={() => setRoleModal(null)}
        title="Изменить роль"
        size="sm"
      >
        {roleModal && (
          <AdminForm
            onSubmit={handleRoleChange}
            loading={savingRole}
            submitText="Сохранить"
            onCancel={() => setRoleModal(null)}
          >
            <p className="text-sm text-slate-600 mb-1">
              Пользователь: <span className="font-medium text-slate-800">{roleModal.full_name}</span>
            </p>

            <AdminFormField
              label="Роль"
              name="role"
              type="select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              options={ROLE_OPTIONS}
            />
          </AdminForm>
        )}
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить пользователя?"
        message={`Вы уверены, что хотите удалить пользователя "${deleteTarget?.full_name}"?`}
        loading={deleting}
      />
    </div>
  );
};

export default UsersAdmin;
