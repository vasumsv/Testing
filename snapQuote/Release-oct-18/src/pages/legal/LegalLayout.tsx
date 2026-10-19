import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { Footer } from '../../components/layout/Footer';

interface Props {
  title: string;
  lastUpdated: string;
  onBack: () => void;
  children: ReactNode;
}

export function LegalLayout({ title, lastUpdated, onBack, children }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-sm font-medium text-slate-900">{title}</span>
        </div>
      </nav>

      <main className="flex-1 py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 pb-8 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{title}</h1>
            <p className="text-sm text-slate-400">Last updated: {lastUpdated}</p>
          </div>

          <div>{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
