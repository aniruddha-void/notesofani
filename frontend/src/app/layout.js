import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'NotesofAni — Notes. Resources. Everything in one place.',
  description: 'NotesofAni is a professional study-material and academic resource-sharing platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian-900 font-sans antialiased text-slate-200 selection:bg-sky-500/20 selection:text-sky-300 min-h-screen flex flex-col justify-between relative overflow-x-hidden">
        {/* Ambient Glow Elements matching Stitch design system */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-gradient-to-b from-sky-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10"></div>
        <div className="fixed top-1/2 -right-48 w-[400px] h-[400px] bg-sky-900/10 blur-[120px] pointer-events-none -z-10"></div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
