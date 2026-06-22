import React from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import { Target, CalendarCheck, Flame, Trophy } from 'lucide-react';

function Habits() {
  return (
    <ProtectedPage
      title="Habits Tracker"
      description="Build positive routines and track your daily streaks."
    >
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-rose-200 blur-3xl opacity-50 rounded-full"></div>
          <Target className="w-24 h-24 text-rose-600 relative z-10" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Consistency is Key</h2>
        <p className="text-gray-500 max-w-lg text-center mb-10 leading-relaxed">
          Create custom habits, maintain your daily streaks, and visualize your personal growth. Coming soon!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-4 bg-rose-50 rounded-full mb-4">
              <CalendarCheck className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Daily Logs</h3>
            <p className="text-xs text-gray-500 mt-2">Check off habits as you complete them.</p>
          </div>
          
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-4 bg-orange-50 rounded-full mb-4">
              <Flame className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Track Streaks</h3>
            <p className="text-xs text-gray-500 mt-2">Don't break the chain. Watch your streaks grow.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-4 bg-yellow-50 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Earn Rewards</h3>
            <p className="text-xs text-gray-500 mt-2">Unlock milestones as you build consistency.</p>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}

export default Habits;
