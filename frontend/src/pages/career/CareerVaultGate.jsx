import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import api from '../../services/api.js';

export default function CareerVaultGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(null);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.post('/career-vault/verify-access', {});
        if (res.data.vaultSetupRequired) {
          setSetupRequired(true);
        } else {
          setSetupRequired(false);
        }
      } catch (err) {
        setSetupRequired(false);
      }
    };
    checkSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (setupRequired && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      if (setupRequired) {
        await api.post('/career-vault/setup-password', { password, confirmPassword });
      } else {
        await api.post('/career-vault/verify-access', { password });
      }
      onUnlock();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (setupRequired === null) {
    return (
      <ProtectedPage title="Career Vault Secured">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage
      title={setupRequired ? "Setup Career Vault" : "Career Vault Secured"}
      description="This area contains sensitive career documents. Please verify your identity."
    >
      <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-4">
            {setupRequired ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {setupRequired ? 'Set up your Vault password' : 'Re-enter your password'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {setupRequired 
              ? 'This password is specific to your Vault and separate from your main account login.' 
              : 'to access Career Vault'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {setupRequired ? 'New Vault Password' : 'Password'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                placeholder="••••••••"
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {setupRequired && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Vault Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {!setupRequired && (
            <div className="flex justify-end">
              <Link to="/career/forgot-vault-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {submitting ? (setupRequired ? 'Setting up...' : 'Verifying...') : (
              <>{setupRequired ? 'Create Vault Password' : 'Unlock'} <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </ProtectedPage>
  );
}
