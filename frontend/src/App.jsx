import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Activities from './pages/Activities';
import Rheumatology from './pages/Rheumatology';
import Schools from './pages/Schools';
import Congress from './pages/Congress';
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

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import NewsAdmin from './pages/admin/NewsAdmin';

import UsersAdmin from './pages/admin/UsersAdmin';
import CongressAdmin from './pages/admin/CongressAdmin';
import BoardMembersAdmin from './pages/admin/BoardMembersAdmin';
import PartnersAdmin from './pages/admin/PartnersAdmin';
import CharterAdmin from './pages/admin/CharterAdmin';
import ChiefRheumatologistsAdmin from './pages/admin/ChiefRheumatologistsAdmin';
import DiseasesAdmin from './pages/admin/DiseasesAdmin';
import CentersAdmin from './pages/admin/CentersAdmin';
import CenterStaffAdmin from './pages/admin/CenterStaffAdmin';
import EducationEventsAdmin from './pages/admin/EducationEventsAdmin';
import MediaResourcesAdmin from './pages/admin/MediaResourcesAdmin';
import HistoryAdmin from './pages/admin/HistoryAdmin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth pages without layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin pages */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="news" element={<NewsAdmin />} />
            <Route path="board" element={<BoardMembersAdmin />} />
            <Route path="partners" element={<PartnersAdmin />} />
            <Route path="charter" element={<CharterAdmin />} />
            <Route path="chief-rheumatologists" element={<ChiefRheumatologistsAdmin />} />
            <Route path="diseases" element={<DiseasesAdmin />} />
            <Route path="centers" element={<CentersAdmin />} />
            <Route path="center-staff" element={<CenterStaffAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="congress" element={<CongressAdmin />} />
            <Route path="education-events" element={<EducationEventsAdmin />} />
            <Route path="media-resources" element={<MediaResourcesAdmin />} />
            <Route path="history" element={<HistoryAdmin />} />
          </Route>

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
