import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

import AdminChunkBoundary from './components/AdminChunkBoundary';
import PageChunkBoundary, { PageLoading } from './components/PageChunkBoundary';

// Главная — во входе: самая частая точка входа, ленивая добавила бы запрос на /.
// Остальные страницы — по куску на страницу, грузятся при переходе.
// Suspense и boundary для них — в Layout; сторож сборки (vite-plugins/adminChunkGuard.js)
// роняет build, если страница кроме главной попала во вход.
const Activities = lazy(() => import('./pages/Activities'));
const Rheumatology = lazy(() => import('./pages/Rheumatology'));
const Schools = lazy(() => import('./pages/Schools'));
const Congress = lazy(() => import('./pages/Congress'));
const CongressProgram = lazy(() => import('./pages/CongressProgram'));
const CongressYoungScientists = lazy(() => import('./pages/CongressYoungScientists'));
const News = lazy(() => import('./pages/News'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const BoardMembers = lazy(() => import('./pages/BoardMembers'));
const LegalDocs = lazy(() => import('./pages/LegalDocs'));
const History = lazy(() => import('./pages/History'));
const EducationEvents = lazy(() => import('./pages/EducationEvents'));
const MediaResources = lazy(() => import('./pages/MediaResources'));
const DiseaseInfo = lazy(() => import('./pages/DiseaseInfo'));

// <Navigate> рисует пустоту; переход на ленивую цель идёт через startTransition
// и удерживает уже раскрытое — без заглушки main был бы пуст всю загрузку куска.
const Redirect = ({ to }) => (
  <>
    <PageLoading />
    <Navigate to={to} replace />
  </>
);

// Вход и регистрация — вне Layout, поэтому свои boundary и заглушка
const AuthPage = ({ children }) => (
  <PageChunkBoundary>
    <Suspense fallback={<PageLoading className="min-h-screen bg-gray-50" />}>{children}</Suspense>
  </PageChunkBoundary>
);

// Админка — отдельный кусок кода, грузится только на /admin/*
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

// Без components/admin: иначе кит админки вернётся в основной кусок
const AdminLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
    Загрузка…
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth pages without layout */}
          <Route path="/login" element={<AuthPage><Login /></AuthPage>} />
          <Route path="/register" element={<AuthPage><Register /></AuthPage>} />

          {/* Admin pages */}
          <Route
            path="/admin/*"
            element={
              <AdminChunkBoundary>
                <Suspense fallback={<AdminLoading />}>
                  <AdminApp />
                </Suspense>
              </AdminChunkBoundary>
            }
          />

          {/* Public pages with layout */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />

                  {/* О нас */}
                  <Route path="/about" element={<Redirect to="/about/activities" />} />
                  <Route path="/about/activities" element={<Activities />} />
                  <Route path="/about/board-members" element={<BoardMembers />} />
                  <Route path="/about/legal-docs" element={<LegalDocs />} />
                  <Route path="/about/history" element={<History />} />
                  <Route path="/about/schools" element={<Schools />} />

                  {/* Ревматология Узбекистана */}
                  <Route path="/rheumatology/centers" element={<Rheumatology defaultTab="centers" />} />
                  <Route path="/rheumatology/chief-rheumatologists" element={<Rheumatology defaultTab="chiefs" />} />
                  <Route path="/rheumatology/diseases" element={<DiseaseInfo />} />

                  {/* Образование и обучение */}
                  <Route path="/education/masterclasses" element={<EducationEvents eventType="masterclass" />} />
                  <Route path="/education/webinars" element={<EducationEvents eventType="webinar" />} />

                  {/* Медиаресурсы */}
                  <Route path="/media" element={<MediaResources />} />

                  {/* Конгресс */}
                  <Route path="/congress" element={<Congress />} />
                  <Route path="/congress/:id" element={<Congress />} />
                  <Route path="/congress/:id/program" element={<CongressProgram />} />
                  <Route path="/congress/:id/young-scientists" element={<CongressYoungScientists />} />

                  {/* Новости */}
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsDetail />} />

                  {/* Редиректы для обратной совместимости */}
                  <Route path="/about/centers" element={<Redirect to="/rheumatology/centers" />} />
                  <Route path="/about/chief-rheumatologists" element={<Redirect to="/rheumatology/chief-rheumatologists" />} />
                  <Route path="/about/documents" element={<Redirect to="/rheumatology/diseases" />} />
                  <Route path="/documents" element={<Redirect to="/rheumatology/diseases" />} />
                  <Route path="/rheumatology" element={<Redirect to="/rheumatology/centers" />} />
                  <Route path="/activities" element={<Redirect to="/about/activities" />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
