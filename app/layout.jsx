import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'Kontrakan Damai - Sistem Manajemen Kontrakan',
  description: 'Kelola pintu, penghuni, pembayaran, dan laporan kontrakan.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
