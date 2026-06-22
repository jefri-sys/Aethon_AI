function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
      <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export default Spinner;
