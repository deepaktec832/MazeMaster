import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Maze Master Error Boundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
    this.logCrash(error.toString(), errorInfo.componentStack || '');
  }

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleGlobalError = (event: ErrorEvent) => {
    console.error('[Global Error Listener]:', event.error || event.message);
    this.logCrash(event.message || 'Global Window Error', event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : '');
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('[Unhandled Promise Rejection]:', event.reason);
    const reasonStr = event.reason instanceof Error ? event.reason.stack || event.reason.message : String(event.reason);
    this.logCrash(`Unhandled Promise Rejection: ${reasonStr}`, '');
  };

  private logCrash = (message: string, stack: string) => {
    try {
      const logs = JSON.parse(localStorage.getItem('maze_master_crash_logs') || '[]');
      logs.unshift({
        timestamp: new Date().toISOString(),
        message,
        stack,
      });
      localStorage.setItem('maze_master_crash_logs', JSON.stringify(logs.slice(0, 20)));
    } catch {
      // Ignore localStorage write failures
    }
  };

  private handleCopy = () => {
    const { error, errorInfo } = this.state;
    const logDetails = `
=== Maze Master Crash Log ===
Timestamp: ${new Date().toISOString()}
Error: ${error?.toString() || 'Unknown Error'}
Stack: ${errorInfo?.componentStack || error?.stack || 'N/A'}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(logDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearDataAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Application Exception</h1>
                <p className="text-xs text-slate-400">An unexpected runtime error was caught</p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-red-300 overflow-x-auto max-h-40 mb-4">
              <p className="font-semibold mb-1">{this.state.error?.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-slate-500 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack.trim()}
                </pre>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl transition flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={this.handleCopy}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl transition flex items-center justify-center space-x-1.5"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Log</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Error Details</span>
                    </>
                  )}
                </button>

                <button
                  onClick={this.handleClearDataAndReload}
                  className="flex-1 py-2 px-3 bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-medium rounded-xl border border-red-900/40 transition flex items-center justify-center space-x-1.5"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Clear Cache & Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
