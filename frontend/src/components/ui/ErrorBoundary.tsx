import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-3xl mx-auto my-8 p-6 glass-card border border-rose-500/40 rounded-3xl text-slate-100 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3 border-b border-rose-500/20 pb-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
            <div>
              <h3 className="text-base font-black text-white">
                {this.props.fallbackTitle || 'Game Analyzer Error Caught'}
              </h3>
              <p className="text-xs text-rose-300 font-mono">
                An unexpected error occurred during position rendering.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-40 space-y-1">
            <p className="font-bold text-rose-400">{this.state.error?.toString()}</p>
            {this.state.errorInfo?.componentStack && (
              <pre className="text-[10px] text-slate-400 whitespace-pre-wrap pt-2 border-t border-slate-800">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="accent"
              onClick={this.handleReset}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset View & Retry</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
