import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/rheumatology', label: t('nav.rheumatology') },
    { path: '/congress', label: t('nav.congress') },
    { path: '/news', label: t('nav.news') },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">РА</span>
            </div>
            <span className="hidden sm:block font-semibold text-[var(--color-text)] text-sm lg:text-base">
              {t('hero.title')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-[var(--color-primary)] ${
                  isActive(link.path)
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                    : 'text-[var(--color-text)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Language + Auth */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm text-[var(--color-text-light)]">{user.full_name}</span>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium py-2 ${
                    isActive(link.path)
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t flex flex-col space-y-3">
                {user ? (
                  <>
                    <span className="text-sm text-[var(--color-text-light)]">{user.full_name}</span>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-sm text-red-600 text-left"
                    >
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm">
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-sm">
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
