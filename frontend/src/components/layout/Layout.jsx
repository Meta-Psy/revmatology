import { Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import PageChunkBoundary, { PageLoading } from '../PageChunkBoundary';

// Страницы — ленивые куски (App.jsx): пока кусок грузится или если он не загрузился,
// меняется только область контента, шапка и подвал остаются.
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <PageChunkBoundary>
          <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </PageChunkBoundary>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Layout;
