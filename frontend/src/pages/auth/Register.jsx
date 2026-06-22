import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import api from '../../services/api.js';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  college: '',
  course: '',
  semester: '',
};

const fieldClass = 'auth-input';
const labelClass = 'auth-label';

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password || score <= 1) {
    return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
  }

  if (score <= 3) {
    return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
  }

  return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
}

function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college,
        course: form.course,
        semester: Number(form.semester),
      });

      setSuccess('Check your email.');
      setForm(initialForm);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your Synapse workspace after verifying your email."
      footer={
        <>
          Already have an account?{' '}
          <Link className="auth-forgot-link" to="/login">
            Log in
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className={labelClass}>
          Name
          <input
            className={fieldClass}
            name="name"
            onChange={handleChange}
            required
            type="text"
            value={form.name}
          />
        </label>

        <label className={labelClass}>
          Email
          <input
            className={fieldClass}
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className={labelClass}>
          Password
          <input
            className={fieldClass}
            minLength={8}
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        <div aria-live="polite" className="mt-2">
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className={`h-1.5 rounded-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-neutral-400">
            Password strength: <span className="text-white">{passwordStrength.label}</span>
          </p>
        </div>

        <label className={labelClass}>
          Confirm Password
          <input
            className={fieldClass}
            minLength={8}
            name="confirmPassword"
            onChange={handleChange}
            required
            type="password"
            value={form.confirmPassword}
          />
        </label>

        <label className={labelClass}>
          College
          <input
            className={fieldClass}
            name="college"
            onChange={handleChange}
            required
            type="text"
            value={form.college}
          />
        </label>

        <label className={labelClass}>
          Course
          <input
            className={fieldClass}
            name="course"
            onChange={handleChange}
            placeholder="MCA, BCA, B.Tech, B.Com"
            required
            type="text"
            value={form.course}
          />
        </label>

        <label className={labelClass}>
          Semester
          <input
            className={fieldClass}
            min={1}
            name="semester"
            onChange={handleChange}
            required
            type="number"
            value={form.semester}
          />
        </label>

        {error ? (
          <div className="auth-error-box">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="auth-error-box !bg-emerald-500/10 !border-emerald-500 !text-emerald-400">
            {success}
          </div>
        ) : null}

        <button
          className="auth-btn mt-4"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
