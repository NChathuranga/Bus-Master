import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    this.setState({ hasError: false, error: null });
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl max-w-md shadow-2xl">
            <div className="text-4xl mb-4">🚌</div>
            <h2 className="text-2xl font-black text-white mb-2">BusMaster System Reset</h2>
            <p className="text-slate-400 text-sm mb-4">
              Application session state cleared. Click below to return to the sign-in portal.
            </p>
            {this.state.error && (
              <p className="text-rose-400 text-xs font-mono mb-4 bg-slate-950 p-2.5 rounded-xl border border-rose-900/50 break-words text-left">
                Error: {String(this.state.error?.message || this.state.error)}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Go to Sign In Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
