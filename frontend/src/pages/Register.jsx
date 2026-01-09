import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">РА</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('auth.register')}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.fullName')} *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')} *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="Минимум 6 символов"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.confirmPassword')} *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                placeholder="Повторите пароль"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300 text-[var(--color-primary)]"
              />
              <span className="text-sm text-gray-600">
                Я согласен с{' '}
                <a href="#" className="text-[var(--color-primary)] hover:underline">
                  условиями использования
                </a>{' '}
                и{' '}
                <a href="#" className="text-[var(--color-primary)] hover:underline">
                  политикой конфиденциальности
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('auth.submit')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">{t('auth.hasAccount')} </span>
            <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
