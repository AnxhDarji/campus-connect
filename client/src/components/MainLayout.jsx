import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import PageTransition from './PageTransition';

export default function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--cc-bg)] text-[var(--cc-text)]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
