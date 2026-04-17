import * as React from 'react';
import { Card, Button } from './Base';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    let errorInfo = "An unexpected error occurred.";
    
    // Attempt to parse FirestoreErrorInfo if present
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) {
        errorInfo = parsed.error;
      }
    } catch (e) {
      errorInfo = error.message;
    }

    return { hasError: true, errorInfo };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, errorInfo } = (this as any).state;
    if (hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50/50 rounded-3xl">
          <Card className="max-w-md p-10 text-center border-red-100 shadow-xl shadow-red-50/50" id="error-card">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-4">Something went wrong</h2>
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 mb-8">
              <p className="text-sm text-red-700 font-medium leading-relaxed italic">
                "{errorInfo}"
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                className="w-full h-14 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                onClick={() => window.location.reload()}
                id="reload-app-button"
              >
                <RefreshCcw className="mr-2 w-5 h-5" /> Reload Application
              </Button>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                Our team has been notified of this diagnostic
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
