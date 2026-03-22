import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAuth = await isAdminAuthenticated();

  // Allow login page without auth
  // We check the path via a workaround: if not authenticated and not on login, redirect
  if (!isAuth) {
    // This layout wraps all /admin routes including /admin/login
    // We need to let /admin/login through without auth
    // Since we can't easily check the path in a layout, we'll handle this in middleware
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {isAuth && <AdminSidebar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
