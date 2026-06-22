import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      setSubmitting(true);
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(
        data.message || 'If an account exists, a password reset link was sent.'
      );
    } catch {
      setMessage('If an account exists, a password reset link was sent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we will send a reset link if the account exists."
      footer={
        <Link className="font-medium text-indigo-600" to="/login">
          Back to login
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        {message ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
