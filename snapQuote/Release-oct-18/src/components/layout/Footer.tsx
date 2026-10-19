import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="text-xs text-slate-400">
            &copy; 2026 SnapQuote. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link
              to="/terms"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors duration-150"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/privacy"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors duration-150"
            >
              Privacy Policy
            </Link>
            <Link
              to="/refunds"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors duration-150"
            >
              Refund Policy
            </Link>
          </div>

        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <p className="text-[11px] text-slate-400">Made in India 🇮🇳</p>
          <span className="hidden sm:block text-slate-300">·</span>
          <a
            href="mailto:contact@snapquote.in"
            className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors duration-150"
          >
            contact@snapquote.in
          </a>
        </div>
      </div>
    </footer>
  );
}
