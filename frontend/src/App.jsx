import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Spinner from './components/Spinner.jsx';
import { useAuth } from './hooks/useAuth.js';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Onboarding from './pages/auth/Onboarding.jsx';
import TodayDashboard from './pages/dashboard/TodayDashboard.jsx';
import Subjects from './pages/subjects/Subjects.jsx';
import Academics from './pages/academics/Academics.jsx';
import ImportGradeCard from './pages/academics/ImportGradeCard.jsx';
import Planner from './pages/planner/Planner.jsx';
import NotebookList from './pages/notebook/NotebookList.jsx';
import NotebookView from './pages/notebook/NotebookView.jsx';
import FinanceTracker from './pages/finance/FinanceTracker.jsx';
import HabitTracker from './pages/habits/HabitTracker.jsx';
import CareerVaultList from './pages/career/CareerVaultList.jsx';
import CareerDocDetailView from './pages/career/CareerDocDetailView.jsx';
import CareerVaultLayout from './pages/career/CareerVaultLayout.jsx';
import CareerTimeline from './pages/career/CareerTimeline.jsx';
import ResumeBuilderList from './pages/career/ResumeBuilderList.jsx';
import ResumeEditor from './pages/career/ResumeEditor.jsx';
import ResumeIntelligence from './pages/career/ResumeIntelligence.jsx';
import ForgotVaultPassword from './pages/career/ForgotVaultPassword.jsx';
import ResetVaultPassword from './pages/career/ResetVaultPassword.jsx';
import Groups from './pages/groups/Groups.jsx';
import Messages from './pages/messages/Messages.jsx';
import Settings from './pages/settings/Settings.jsx';
import Calendar from './pages/calendar/Calendar.jsx';
import ResourceExplorer from './pages/resources/ResourceExplorer.jsx';
import NotificationsList from './pages/notifications/NotificationsList.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import CallOverlay from './components/messaging/CallOverlay.jsx';
import SmartSidebar from './components/SmartSidebar.jsx';

import Landing from './pages/landing/Landing.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '50px', background: 'red', color: 'white', whiteSpace: 'pre-wrap'}}>
          <h1>Error Occurred</h1>
          <p>{this.state.error.toString()}</p>
          <p>{this.state.error.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  
  const allowedWidgetPaths = ['/dashboard', '/subjects', '/academics'];
  const showWidgets = user && allowedWidgetPaths.includes(location.pathname);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/career/reset-vault-password" element={<ResetVaultPassword />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <TodayDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute>
              <Subjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics"
          element={
            <ProtectedRoute>
              <Academics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academics/import"
          element={
            <ProtectedRoute>
              <ImportGradeCard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planner"
          element={
            <ProtectedRoute>
              <Planner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notebook"
          element={
            <ProtectedRoute>
              <NotebookList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notebook/:id"
          element={
            <ProtectedRoute>
              <NotebookView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <FinanceTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <HabitTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/career"
          element={
            <ProtectedRoute>
              <CareerVaultLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CareerVaultList />} />
          <Route path="timeline" element={<CareerTimeline />} />
          <Route path="resume-intelligence" element={<ResumeIntelligence />} />
          <Route path="resumes" element={<ResumeBuilderList />} />
          <Route path="resumes/:id" element={<ResumeEditor />} />
          <Route path=":id" element={<CareerDocDetailView />} />
        </Route>
        <Route
          path="/career/forgot-vault-password"
          element={
            <ProtectedRoute>
              <ForgotVaultPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <Groups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <ResourceExplorer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsList />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {showWidgets && (
        <>
          <SmartSidebar />
          <ChatWidget />
        </>
      )}
      <CallOverlay />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
