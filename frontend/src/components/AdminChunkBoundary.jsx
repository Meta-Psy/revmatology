import { Component } from 'react';

// Ловит сбой загрузки ленивого куска админки (обрыв на медленном канале,
// кусок пропал после выкатки). Без неё вместо админки — белый экран.
// Error boundary в React пишется только классом.
// Ничего из components/admin сюда не импортировать — кит вернётся в основной кусок.
class AdminChunkBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <p className="text-base font-semibold text-slate-800">Не удалось загрузить админку</p>
          <p className="mt-1 text-sm text-slate-500">Проверьте соединение и обновите страницу.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }
}

export default AdminChunkBoundary;
