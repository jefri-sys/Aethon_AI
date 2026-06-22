import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import ProtectedPage from '../../components/ProtectedPage.jsx';

export default function ForgotVaultPassword() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/career-vault/forgot-password');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedPage title="Career Vault Recovery">
      <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Vault Password?</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          This will send a secure link to your email to reset your Career Vault password. 
          Your main Synapse account password will not be affected.
        </p>

        {success ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 mb-6">
            <p className="font-semibold">Check your email for a reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/career" className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-2" />
            Back to Career Vault
          </Link>
        </div>
      </div>
    </ProtectedPage>
  );
}
