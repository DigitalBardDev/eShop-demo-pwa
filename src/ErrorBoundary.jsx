import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Updates state so the next render shows the fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Logs the crash details
  componentDidCatch(error, errorInfo) {
    console.error("Storefront encountered an unhandled exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6 text-center">
          <div className="space-y-4 border border-zinc-800 p-12 bg-black rounded shadow-2xl">
            <h1 className="text-2xl font-serif text-white tracking-widest uppercase">Showroom Maintenance</h1>
            <p className="text-xs text-zinc-400 font-light tracking-widest uppercase">We are currently updating our collection. Please return shortly.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 border border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white px-8 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors rounded"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}