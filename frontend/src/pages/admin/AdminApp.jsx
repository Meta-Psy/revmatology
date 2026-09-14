import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import NewsAdmin from './NewsAdmin';
import UsersAdmin from './UsersAdmin';
import CongressAdmin from './CongressAdmin';
import BoardMembersAdmin from './BoardMembersAdmin';
import PartnersAdmin from './PartnersAdmin';
import CharterAdmin from './CharterAdmin';
import ChiefRheumatologistsAdmin from './ChiefRheumatologistsAdmin';
import DiseasesAdmin from './DiseasesAdmin';
import CentersAdmin from './CentersAdmin';
import CenterStaffAdmin from './CenterStaffAdmin';
import EducationEventsAdmin from './EducationEventsAdmin';
import MediaResourcesAdmin from './MediaResourcesAdmin';
import HistoryAdmin from './HistoryAdmin';
import HeroImagesAdmin from './HeroImagesAdmin';

// Вся админка — отдельный кусок кода: App грузит его лениво на /admin/*,
// публичные страницы его не качают. Пути здесь относительные (от /admin),
// ссылки в AdminLayout — абсолютные.
const AdminApp = () => (
  <Routes>
    <Route element={<AdminLayout />}>
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
      <Route path="hero-images" element={<HeroImagesAdmin />} />
    </Route>
  </Routes>
);

export default AdminApp;
