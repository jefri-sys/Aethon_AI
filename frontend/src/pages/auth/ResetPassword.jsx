import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError(
        'Password must be at least 8 characters and include 1 uppercase letter and 1 number.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post('/auth/reset-password', {
        token,
        password,
      });
      setSuccess(data.message || 'Password reset successful. Please log in.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error.response?.data?.message || 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Use a strong password with at least one uppercase letter and one number."
      footer={
        <Link className="font-medium text-indigo-600" to="/login">
          Back to login
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          New password
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Confirm password
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
