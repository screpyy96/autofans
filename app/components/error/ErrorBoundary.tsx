import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-premium-gradient flex items-center justify-center p-4">
          <Card className="w-full bg-glass backdrop-blur-xl border-premium">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">
                Oops! Ceva nu a mers bine
              </h1>
              
              <p className="text-gray-400 mb-6 leading-relaxed">
                Ne pare rău, dar a apărut o eroare neașteptată. 
                Echipa noastră a fost notificată și lucrează la rezolvarea problemei.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  className="bg-gold-gradient hover:bg-gold-gradient text-secondary-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Încearcă din nou
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="bg-glass border-premium hover:bg-gold-gradient hover:text-secondary-900"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Înapoi acasă
                </Button>
              </div>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-8 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                    Detalii tehnice (doar în dezvoltare)
                  </summary>
                  <div className="bg-secondary-900/50 rounded-lg p-4 text-xs font-mono text-red-400 overflow-auto max-h-40">
                    <div className="mb-2 font-bold">Error:</div>
                    <div className="mb-4">{this.state.error.toString()}</div>
                    {this.state.errorInfo && (
                      <>
                        <div className="mb-2 font-bold">Component Stack:</div>
                        <div>{this.state.errorInfo.componentStack}</div>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Route-level error boundary for specific pages
interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

export function RouteErrorBoundary({ children, routeName }: RouteErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <Card className="w-full bg-glass backdrop-blur-xl border-premium">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
              
              <h2 className="text-lg font-semibold text-white mb-3">
                Eroare la încărcarea paginii
              </h2>
              
              <p className="text-gray-400 text-sm mb-4">
                {routeName ? `Pagina "${routeName}" nu poate fi încărcată momentan.` : 'Această pagină nu poate fi încărcată momentan.'}
              </p>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="bg-glass border-premium hover:bg-gold-gradient hover:text-secondary-900"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reîncarcă pagina
              </Button>
            </div>
          </Card>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error(`Route error in ${routeName || 'unknown route'}:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Component-level error boundary for smaller components
interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
}

export function ComponentErrorBoundary({ 
  children, 
  componentName, 
  fallback 
}: ComponentErrorBoundaryProps) {
  const defaultFallback = (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span>
          {componentName ? `Eroare la componenta ${componentName}` : 'Eroare la componentă'}
        </span>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback}
      onError={(error, errorInfo) => {
        console.error(`Component error in ${componentName || 'unknown component'}:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}