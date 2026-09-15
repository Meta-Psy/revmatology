import { Component } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Файл во входе: импортировать сюда только то, что там уже есть.

// Заглушка, пока грузится кусок страницы. Минимальная высота — чтобы подвал не прыгал.
export const PageLoading = ({ className = 'min-h-[60vh]' }) => {
  const { t } = useTranslation();
  return (
    <div role="status" className={`${className} flex items-center justify-center text-sm text-slate-400`}>
      {t('common.loading')}
    </div>
  );
};

const PageLoadError = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center">
        <p className="text-base font-semibold text-slate-800">{t('pageLoadError.title')}</p>
        <p className="mt-1 text-sm text-slate-500">{t('pageLoadError.hint')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          {t('pageLoadError.reload')}
        </button>
      </div>
    </div>
  );
};

// Ловит сбой загрузки ленивого куска страницы (обрыв на медленном канале) и ошибку
// рендера страницы: вместо белого экрана — сообщение, шапка и меню на месте.
// Error boundary в React пишется только классом.
class Boundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps, prevState) {
    // Сброс при смене адреса, иначе после ошибки не уйти по меню. Только если ошибка
    // уже была показана: сбой на том же рендере, что сменил адрес, не сбрасываем.
    if (prevState.failed && this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? <PageLoadError /> : this.props.children;
  }
}

// Сорвавшийся кусок React.lazy запоминает: вернуться на ту же страницу поможет только
// «Обновить страницу», на другие — переход по меню.
const PageChunkBoundary = ({ children }) => {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
};

export default PageChunkBoundary;
