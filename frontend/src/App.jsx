import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Rheumatology from './pages/Rheumatology';
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
                  <Route path="/rheumatology" element={<Rheumatology />} />
                  <Route path="/congress" element={<Congress />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsDetail />} />
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
