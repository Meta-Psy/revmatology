import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Activities from './pages/Activities';
import Rheumatology from './pages/Rheumatology';
import Schools from './pages/Schools';
import Congress from './pages/Congress';
import CongressProgram from './pages/CongressProgram';
import CongressYoungScientists from './pages/CongressYoungScientists';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import BoardMembers from './pages/BoardMembers';
import LegalDocs from './pages/LegalDocs';
import History from './pages/History';
import EducationEvents from './pages/EducationEvents';
import MediaResources from './pages/MediaResources';
import DiseaseInfo from './pages/DiseaseInfo';

import AdminChunkBoundary from './components/AdminChunkBoundary';

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
                  <Route path="/about" element={<Navigate to="/about/activities" replace />} />
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
                  <Route path="/about/centers" element={<Navigate to="/rheumatology/centers" replace />} />
                  <Route path="/about/chief-rheumatologists" element={<Navigate to="/rheumatology/chief-rheumatologists" replace />} />
                  <Route path="/about/documents" element={<Navigate to="/rheumatology/diseases" replace />} />
                  <Route path="/documents" element={<Navigate to="/rheumatology/diseases" replace />} />
                  <Route path="/rheumatology" element={<Navigate to="/rheumatology/centers" replace />} />
                  <Route path="/activities" element={<Navigate to="/about/activities" replace />} />
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
