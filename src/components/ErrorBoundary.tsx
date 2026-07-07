import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" id="error-boundary-screen">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 animate-fade-in" id="error-boundary-card">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4 mx-auto" id="error-boundary-icon-container">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" id="error-boundary-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-center text-gray-900 mb-2" id="error-boundary-heading">
              Terjadi Kesalahan Aplikasi
            </h1>
            
            <p className="text-sm text-gray-600 text-center mb-6" id="error-boundary-message">
              Sistem mendeteksi adanya kendala saat memuat komponen ini. Jangan khawatir, data Anda tersimpan dengan aman secara lokal.
            </p>

            <div className="bg-red-50/50 rounded-lg p-4 mb-6 border border-red-100 overflow-hidden" id="error-boundary-details">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-800" id="error-boundary-details-label">
                Pesan Kesalahan:
              </span>
              <p className="text-xs font-mono text-red-700 mt-1 break-words leading-relaxed" id="error-boundary-details-text">
                {this.state.error?.message || 'Error tidak diketahui'}
              </p>
            </div>

            <div className="flex flex-col gap-2" id="error-boundary-actions">
              <button
                onClick={this.handleReload}
                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                id="error-boundary-reload-btn"
              >
                Muat Ulang Rapor
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
