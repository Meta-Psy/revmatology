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

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import NewsAdmin from './pages/admin/NewsAdmin';
import NewsEditor from './pages/admin/NewsEditor';
import UsersAdmin from './pages/admin/UsersAdmin';
import CongressAdmin from './pages/admin/CongressAdmin';
import BoardMembersAdmin from './pages/admin/BoardMembersAdmin';
import PartnersAdmin from './pages/admin/PartnersAdmin';
import CharterAdmin from './pages/admin/CharterAdmin';
import ChiefRheumatologistsAdmin from './pages/admin/ChiefRheumatologistsAdmin';
import DiseasesAdmin from './pages/admin/DiseasesAdmin';
import CentersAdmin from './pages/admin/CentersAdmin';
import CenterStaffAdmin from './pages/admin/CenterStaffAdmin';

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
            <Route path="news/new" element={<NewsEditor />} />
            <Route path="news/:id/edit" element={<NewsEditor />} />
            <Route path="board" element={<BoardMembersAdmin />} />
            <Route path="partners" element={<PartnersAdmin />} />
            <Route path="charter" element={<CharterAdmin />} />
            <Route path="chief-rheumatologists" element={<ChiefRheumatologistsAdmin />} />
            <Route path="diseases" element={<DiseasesAdmin />} />
            <Route path="centers" element={<CentersAdmin />} />
            <Route path="center-staff" element={<CenterStaffAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="congress" element={<CongressAdmin />} />
          </Route>

          {/* Public pages with layout */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />

                  {/* О центре - подразделы */}
                  <Route path="/about" element={<Navigate to="/about/activities" replace />} />
                  <Route path="/about/activities" element={<Activities />} />
                  <Route path="/about/centers" element={<Rheumatology />} />
                  <Route path="/about/chief-rheumatologists" element={<Rheumatology defaultTab="chiefs" />} />
                  <Route path="/about/schools" element={<Schools />} />
                  <Route path="/about/documents" element={<Navigate to="/documents" replace />} />

                  {/* Конгресс */}
                  <Route path="/congress" element={<Congress />} />
                  <Route path="/congress/:id" element={<Congress />} />

                  {/* Нормативные документы */}
                  <Route path="/documents" element={<Rheumatology defaultTab="documents" />} />

                  {/* Новости */}
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsDetail />} />

                  {/* Старые маршруты для совместимости */}
                  <Route path="/rheumatology" element={<Navigate to="/about/centers" replace />} />
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
