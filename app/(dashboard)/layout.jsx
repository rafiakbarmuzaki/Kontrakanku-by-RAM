import { UserProvider } from '@/components/UserProvider';
import { AppShell } from '@/components/AppShell';

export default function DashboardLayout({ children }) {
  return (
    <UserProvider>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
