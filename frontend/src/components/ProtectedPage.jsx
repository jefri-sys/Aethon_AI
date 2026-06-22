import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Subjects', path: '/subjects' },
  { label: 'Academics', path: '/academics' },
  { label: 'Planner', path: '/planner' },
  { label: 'Notebook', path: '/notebook' },
  { label: 'Resources', path: '/resources' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Finance', path: '/finance' },
  { label: 'Habits', path: '/habits' },
  { label: 'Career Vault', path: '/career' },
  { label: 'Groups', path: '/groups' },
  { label: 'Messages', path: '/messages' },
  { label: 'Settings', path: '/settings' },
];

function ProtectedPage({ title, description, children }) {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r">
          <div className="mb-6">
            <p className="text-xl font-semibold">Synapse</p>
            <p className="mt-1 text-sm text-slate-500">
              {user?.name || user?.email || 'Student'}
            </p>
          </div>

          <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={logout}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </aside>

        <section className="flex-1 p-5 sm:p-8">
          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          
          {children}
        </section>
      </div>
    </main>
  );
}

export default ProtectedPage;
