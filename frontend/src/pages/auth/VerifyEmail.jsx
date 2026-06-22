import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        await api.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        if (isMounted) {
          setStatus('success');
          setMessage('Email verified. Go to Login');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('error');
          setMessage(
            error.response?.data?.message ||
              'Verification link is invalid or has expired.'
          );
        }
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async () => {
    setResendMessage('');

    if (!email) {
      setResendMessage('Enter your email to resend verification.');
      return;
    }

    try {
      setResending(true);
      await api.post('/auth/resend-verification', { email });
      setResendMessage('Verification email sent.');
    } catch (error) {
      setResendMessage(
        error.response?.data?.message || 'Could not resend verification email.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify email"
      subtitle="We are checking your verification link."
      footer={
        <Link className="font-medium text-indigo-600" to="/login">
          Back to login
        </Link>
      }
    >
      {status === 'loading' ? (
        <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          {message}
        </div>
      ) : null}

      {status === 'success' ? (
        <div className="space-y-4">
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
          <Link
            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            to="/login"
          >
            Go to Login
          </Link>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="space-y-4">
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>

          {resendMessage ? (
            <p className="text-sm text-slate-600">{resendMessage}</p>
          ) : null}

          <button
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={resending}
            onClick={handleResend}
            type="button"
          >
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      ) : null}
    </AuthLayout>
  );
}

export default VerifyEmail;
