import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (userId: string, password: string) => void;
  onCancel: () => void;
  error: string | null;
  userCount: number;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onCancel, error, userCount }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(userId, password);
  };

  const handleSeed = async () => {
    if (!confirm("This will reset the user database to default. Continue?")) return;
    setIsSeeding(true);
    try {
        await fetch('/api/system/seed', { method: 'POST' });
        alert('System reset complete. Please refresh the page.');
        window.location.reload();
    } catch (e) {
        alert('Failed to reset system.');
    } finally {
        setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-fade-in-down">
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-brand-primary text-center mb-2">System Login</h2>
            <p className="text-center text-slate-500 mb-6">Enter your credentials to access the system.</p>
            
            {userCount === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4 text-sm">
                    <p className="font-bold">No users found!</p>
                    <p className="mb-2">The database appears to be empty.</p>
                    <button 
                        type="button"
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="text-blue-600 underline hover:text-blue-800"
                    >
                        {isSeeding ? 'Initializing...' : 'Click here to initialize default users'}
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                <input
                  type="text"
                  id="userId"
                  autoFocus
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="password"className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;