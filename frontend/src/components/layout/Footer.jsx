import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">РА</span>
              </div>
              <span className="font-semibold text-lg">{t('hero.title')}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('about.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/rheumatology" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.rheumatology')}
                </Link>
              </li>
              <li>
                <Link to="/congress" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.congress')}
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.news')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.contacts')}</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Ташкент, Узбекистан</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+998 71 XXX XX XX</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@rheumatology.uz</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
