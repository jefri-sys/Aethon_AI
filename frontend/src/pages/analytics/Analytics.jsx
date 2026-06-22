import React from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import { LineChart, Activity, TrendingUp, BarChart3 } from 'lucide-react';

function Analytics() {
  return (
    <ProtectedPage
      title="Analytics Dashboard"
      description="Deep dive into your study metrics, grades, and focus hours."
    >
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-200 blur-3xl opacity-50 rounded-full"></div>
          <LineChart className="w-24 h-24 text-blue-600 relative z-10" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Understand Your Progress</h2>
        <p className="text-gray-500 max-w-lg text-center mb-10 leading-relaxed">
          Unlock insights into your academic journey. Analyze your performance over time and optimize your study habits. Coming soon!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-4 bg-blue-50 rounded-full mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Study Trends</h3>
            <p className="text-xs text-gray-500 mt-2">See how your focus hours vary by day and subject.</p>
          </div>
          
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-4 bg-indigo-50 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Grade Predictions</h3>
            <p className="text-xs text-gray-500 mt-2">AI-driven forecasts based on your past assessments.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-4 bg-violet-50 rounded-full mb-4">
              <BarChart3 className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Performance Reports</h3>
            <p className="text-xs text-gray-500 mt-2">Download comprehensive PDF reports of your semester.</p>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}

export default Analytics;
