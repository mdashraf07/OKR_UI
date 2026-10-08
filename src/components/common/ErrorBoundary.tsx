import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9fe] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#64748b] max-w-md mb-6 leading-relaxed">
            An unexpected error occurred while loading this view. You can reload the page or return to the dashboard.
          </p>
          {this.state.error && (
            <div className="mb-6 p-3 bg-red-50/60 border border-red-100 rounded-xl text-xs font-mono text-red-800 max-w-lg text-left overflow-auto max-h-32">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={this.handleReload} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Reload Page
            </Button>
            <Button variant="primary" onClick={this.handleReset} leftIcon={<Home className="w-4 h-4" />}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
