import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <h1 className="text-base font-semibold text-ink mb-2">Something went wrong</h1>
            <p className="text-sm text-ink-muted mb-6 leading-relaxed">
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors shadow-sm"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
