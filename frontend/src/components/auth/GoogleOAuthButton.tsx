import React, { useState, useEffect } from 'react';
import { LogIn, CheckCircle2 } from 'lucide-react';
import type { GoogleAuthPayload } from '../../types/auth';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleOAuthButtonProps {
  onSuccess: (payload: GoogleAuthPayload) => void;
  isLoading?: boolean;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  isLoading,
}) => {
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // If real Google Client ID is set, load Google Identity Services SDK
    if (clientId) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              // Decode JWT payload or forward credential
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                onSuccess({
                  googleToken: response.credential,
                  googleId: payload.sub,
                  email: payload.email,
                  name: payload.name || payload.email.split('@')[0],
                  avatarUrl: payload.picture,
                });
              } catch (e) {
                console.error('Error parsing Google OAuth token', e);
              }
            },
          });
          const btnParent = document.getElementById('google-real-btn-container');
          if (btnParent) {
            window.google.accounts.id.renderButton(btnParent, {
              theme: 'filled_dark',
              size: 'large',
              width: 320,
            });
          }
        }
      };
      document.body.appendChild(script);
    }
  }, [clientId, onSuccess]);

  const handleSimulatedAccountSelect = (email: string, name: string, avatarUrl: string) => {
    setShowSimulatedModal(false);
    onSuccess({
      googleToken: 'simulated_google_oauth_token_' + Date.now(),
      googleId: 'g_' + Math.floor(Math.random() * 10000000),
      email,
      name,
      avatarUrl,
    });
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    const email = customGoogleEmail.trim().toLowerCase();
    const name = customGoogleName.trim() || email.split('@')[0];
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    handleSimulatedAccountSelect(email, name, avatarUrl);
  };

  return (
    <>
      {clientId ? (
        <div id="google-real-btn-container" className="flex justify-center w-full min-h-[44px]" />
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setShowSimulatedModal(true)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 font-semibold text-sm transition-all duration-200 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 group active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      )}

      {/* Simulated Google OAuth Dialog (when client_id is not set or user wants direct OAuth selection) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <h3 className="text-base font-bold text-white leading-none">Sign in with Google</h3>
                  <p className="text-xs text-slate-400">Choose an account to continue to Grandmaster's Forge</p>
                </div>
              </div>
              <button
                onClick={() => setShowSimulatedModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Demo Accounts */}
            <div className="space-y-3 mb-6">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Select Google Account
              </span>

              <button
                onClick={() =>
                  handleSimulatedAccountSelect(
                    'alex.chess.master@gmail.com',
                    'Alex Rivera (Google)',
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                    alt="Alex Rivera"
                    className="w-10 h-10 rounded-full border border-cyan-400/40 object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Alex Rivera
                    </div>
                    <div className="text-xs text-slate-400">alex.chess.master@gmail.com</div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() =>
                  handleSimulatedAccountSelect(
                    'sarah.grandmaster@gmail.com',
                    'Sarah Chen (Google)',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                    alt="Sarah Chen"
                    className="w-10 h-10 rounded-full border border-purple-400/40 object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Sarah Chen
                    </div>
                    <div className="text-xs text-slate-400">sarah.grandmaster@gmail.com</div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Custom Google Email Input */}
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Or Use Another Google Email
              </span>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Display Name (optional)"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={!customGoogleEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Authorize & Sign In</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
