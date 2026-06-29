# Synapse Project Mastery Manual

This manual provides a comprehensive breakdown of the Synapse AI platform, mapping out the architecture, workflows, and implementation details of every feature to help you master the codebase.

## Chapter 1: Authentication with Email Verification

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/authController.js`
- `d:/Synapse/backend/src/controllers/userController.js`
- `d:/Synapse/backend/src/controllers/usersController.js`
- `d:/Synapse/backend/src/middleware/auth.js`
- `d:/Synapse/backend/src/middleware/authMiddleware.js`
- `d:/Synapse/backend/src/middleware/verifyVaultAccess.js`
- `d:/Synapse/backend/src/models/User.js`
- `d:/Synapse/backend/src/routes/auth.js`
- `d:/Synapse/backend/src/routes/users.js`
- `d:/Synapse/frontend/src/assets/login_brain_split.png`
- `d:/Synapse/frontend/src/components/AuthLayout.css`
- `d:/Synapse/frontend/src/components/AuthLayout.jsx`
- `d:/Synapse/frontend/src/context/auth-context.js`
- `d:/Synapse/frontend/src/context/AuthContext.jsx`
- `d:/Synapse/frontend/src/hooks/useAuth.js`
- `d:/Synapse/frontend/src/pages/auth/ForgotPassword.jsx`
- `d:/Synapse/frontend/src/pages/auth/Login.jsx`
- `d:/Synapse/frontend/src/pages/auth/Onboarding.jsx`
- `d:/Synapse/frontend/src/pages/auth/Register.jsx`
- `d:/Synapse/frontend/src/pages/auth/ResetPassword.jsx`
- `d:/Synapse/frontend/src/pages/auth/VerifyEmail.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Authentication with Email Verification
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 2: Student Profile and Onboarding Flow

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/routes/settings.js`
- `d:/Synapse/frontend/src/pages/auth/Onboarding.jsx`
- `d:/Synapse/frontend/src/pages/settings/AIPersonalizationSettings.jsx`
- `d:/Synapse/frontend/src/pages/settings/Settings.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Student Profile and Onboarding Flow
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 3: Today Dashboard with AI Morning Briefing

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/models/Briefing.js`
- `d:/Synapse/frontend/src/pages/dashboard/TodayDashboard.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Today Dashboard with AI Morning Briefing
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 4: Academic Tracker

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/academicsController.js`
- `d:/Synapse/backend/src/controllers/semesterController.js`
- `d:/Synapse/backend/src/controllers/subjectFileController.js`
- `d:/Synapse/backend/src/models/Attendance.js`
- `d:/Synapse/backend/src/models/Mark.js`
- `d:/Synapse/backend/src/models/Semester.js`
- `d:/Synapse/backend/src/models/Subject.js`
- `d:/Synapse/backend/src/models/SubjectFile.js`
- `d:/Synapse/backend/src/routes/academics.js`
- `d:/Synapse/backend/src/routes/semesters.js`
- `d:/Synapse/backend/src/routes/subjectFiles.js`
- `d:/Synapse/backend/src/services/academicService.js`
- `d:/Synapse/frontend/src/components/MarkdownText.jsx`
- `d:/Synapse/frontend/src/components/subjects/SubjectDrawer.jsx`
- `d:/Synapse/frontend/src/pages/academics/Academics.jsx`
- `d:/Synapse/frontend/src/pages/academics/AcademicTracker.jsx`
- `d:/Synapse/frontend/src/pages/academics/AddSemesterModal.jsx`
- `d:/Synapse/frontend/src/pages/academics/ExamImportModal.jsx`
- `d:/Synapse/frontend/src/pages/academics/ExamScheduleList.jsx`
- `d:/Synapse/frontend/src/pages/academics/ImportGradeCard.jsx`
- `d:/Synapse/frontend/src/pages/academics/MigrationModal.jsx`
- `d:/Synapse/frontend/src/pages/academics/SemesterList.jsx`
- `d:/Synapse/frontend/src/pages/academics/SemesterWorkspace.jsx`
- `d:/Synapse/frontend/src/pages/academics/Timetable.jsx`
- `d:/Synapse/frontend/src/pages/academics/TimetableImportModal.jsx`
- `d:/Synapse/frontend/src/pages/academics/WhatIfCalculator.jsx`
- `d:/Synapse/frontend/src/pages/subjects/Subjects.jsx`
- `d:/Synapse/frontend/src/services/subjectFileService.js`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Academic Tracker
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 5: CGPA What-If Calculator

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/frontend/src/pages/academics/WhatIfCalculator.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for CGPA What-If Calculator
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 6: AI Explains My Marks

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/aiController.js`
- `d:/Synapse/backend/src/routes/ai.js`
- `d:/Synapse/backend/src/services/aiContextBuilder.js`
- `d:/Synapse/backend/src/services/aiPreferenceNormalizer.js`
- `d:/Synapse/backend/src/services/aiRouter.js`
- `d:/Synapse/backend/src/utils/aiNotes.js`
- `d:/Synapse/backend/src/utils/groqGroupAI.js`
- `d:/Synapse/frontend/src/assets/brain_network.png`
- `d:/Synapse/frontend/src/assets/interactive_brain_split.png`
- `d:/Synapse/frontend/src/assets/login_brain_split.png`
- `d:/Synapse/frontend/src/components/ui/ai-accent.jsx`
- `d:/Synapse/frontend/src/main.jsx`
- `d:/Synapse/frontend/src/pages/auth/VerifyEmail.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerDocDetailView.jsx`
- `d:/Synapse/frontend/src/pages/settings/AIPersonalizationSettings.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for AI Explains My Marks
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 7: AI Study Planner

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/plannerController.js`
- `d:/Synapse/backend/src/models/ExamSchedule.js`
- `d:/Synapse/backend/src/models/StudyTask.js`
- `d:/Synapse/backend/src/routes/planner.js`
- `d:/Synapse/backend/src/services/studyPlannerService.js`
- `d:/Synapse/backend/src/utils/plannerScheduler.js`
- `d:/Synapse/frontend/src/components/planner/CustomPdfPlanModal.jsx`
- `d:/Synapse/frontend/src/pages/academics/ExamScheduleList.jsx`
- `d:/Synapse/frontend/src/pages/planner/FocusMode.jsx`
- `d:/Synapse/frontend/src/pages/planner/Planner.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for AI Study Planner
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 8: Focus Mode - Pomodoro Study Timer

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/focusController.js`
- `d:/Synapse/backend/src/models/FocusSession.js`
- `d:/Synapse/backend/src/routes/focus.js`
- `d:/Synapse/frontend/src/context/FocusTimerContext.jsx`
- `d:/Synapse/frontend/src/pages/planner/FocusMode.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Focus Mode - Pomodoro Study Timer
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 9: AI Notebook

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/notebookController.js`
- `d:/Synapse/backend/src/models/Notebook.js`
- `d:/Synapse/backend/src/models/NotebookChat.js`
- `d:/Synapse/backend/src/models/SavedSummary.js`
- `d:/Synapse/backend/src/routes/notebook.js`
- `d:/Synapse/backend/src/utils/aiNotes.js`
- `d:/Synapse/backend/src/utils/generateSummaryPdf.js`
- `d:/Synapse/frontend/src/pages/notebook/Notebook.jsx`
- `d:/Synapse/frontend/src/pages/notebook/NotebookList.jsx`
- `d:/Synapse/frontend/src/pages/notebook/NotebookView.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for AI Notebook
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 10: Finance Tracker

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/financeController.js`
- `d:/Synapse/backend/src/jobs/recurringExpenses.js`
- `d:/Synapse/backend/src/models/Budget.js`
- `d:/Synapse/backend/src/models/Expense.js`
- `d:/Synapse/backend/src/routes/finance.js`
- `d:/Synapse/frontend/src/pages/finance/Finance.jsx`
- `d:/Synapse/frontend/src/pages/finance/FinanceTracker.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Finance Tracker
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 11: Habit Tracker

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/habitsController.js`
- `d:/Synapse/backend/src/jobs/habitReminders.js`
- `d:/Synapse/backend/src/models/Habit.js`
- `d:/Synapse/backend/src/models/HabitLog.js`
- `d:/Synapse/backend/src/routes/habits.js`
- `d:/Synapse/frontend/src/pages/academics/AcademicTracker.jsx`
- `d:/Synapse/frontend/src/pages/finance/FinanceTracker.jsx`
- `d:/Synapse/frontend/src/pages/habits/Habits.jsx`
- `d:/Synapse/frontend/src/pages/habits/HabitTracker.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Habit Tracker
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 12: Central AI Assistant

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/aiController.js`
- `d:/Synapse/backend/src/models/NotebookChat.js`
- `d:/Synapse/backend/src/routes/ai.js`
- `d:/Synapse/backend/src/services/aiContextBuilder.js`
- `d:/Synapse/backend/src/services/aiPreferenceNormalizer.js`
- `d:/Synapse/backend/src/services/aiRouter.js`
- `d:/Synapse/backend/src/utils/aiNotes.js`
- `d:/Synapse/backend/src/utils/groqGroupAI.js`
- `d:/Synapse/frontend/src/assets/brain_network.png`
- `d:/Synapse/frontend/src/assets/interactive_brain_split.png`
- `d:/Synapse/frontend/src/assets/login_brain_split.png`
- `d:/Synapse/frontend/src/components/ChatWidget.jsx`
- `d:/Synapse/frontend/src/components/messaging/ChatInput.jsx`
- `d:/Synapse/frontend/src/components/messaging/ChatWindow.jsx`
- `d:/Synapse/frontend/src/components/ui/ai-accent.jsx`
- `d:/Synapse/frontend/src/components/ui/ChatBubble.jsx`
- `d:/Synapse/frontend/src/main.jsx`
- `d:/Synapse/frontend/src/pages/auth/VerifyEmail.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerDocDetailView.jsx`
- `d:/Synapse/frontend/src/pages/groups/GroupChat.jsx`
- `d:/Synapse/frontend/src/pages/resources/ExplorerChat.jsx`
- `d:/Synapse/frontend/src/pages/settings/AIPersonalizationSettings.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Central AI Assistant
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 13: Weekly AI Report Card

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/jobs/weeklyReport.js`
- `d:/Synapse/backend/src/models/WeeklyReport.js`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Weekly AI Report Card
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 14: Study Groups

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/groupsController.js`
- `d:/Synapse/backend/src/models/GroupMessage.js`
- `d:/Synapse/backend/src/models/StudyGroup.js`
- `d:/Synapse/backend/src/routes/groups.js`
- `d:/Synapse/backend/src/utils/groqGroupAI.js`
- `d:/Synapse/backend/src/utils/groupPermissions.js`
- `d:/Synapse/backend/src/utils/saveGroupBotMessage.js`
- `d:/Synapse/frontend/src/pages/groups/GroupChat.jsx`
- `d:/Synapse/frontend/src/pages/groups/GroupInfoPanel.jsx`
- `d:/Synapse/frontend/src/pages/groups/GroupPermissionsPanel.jsx`
- `d:/Synapse/frontend/src/pages/groups/Groups.jsx`
- `d:/Synapse/frontend/src/pages/groups/StudyGroups.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Study Groups
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 15: Quick Capture

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/frontend/src/components/QuickCapture.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Quick Capture
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 16: Notifications System

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/notificationsController.js`
- `d:/Synapse/backend/src/models/Notification.js`
- `d:/Synapse/backend/src/routes/notifications.js`
- `d:/Synapse/backend/src/services/notificationService.js`
- `d:/Synapse/frontend/src/components/NotificationBell.jsx`
- `d:/Synapse/frontend/src/components/NotificationsPopup.jsx`
- `d:/Synapse/frontend/src/pages/notifications/NotificationsList.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Notifications System
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 17: Settings

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/routes/settings.js`
- `d:/Synapse/frontend/src/pages/settings/AIPersonalizationSettings.jsx`
- `d:/Synapse/frontend/src/pages/settings/Settings.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Settings
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 18: AI Learning Resource Explorer

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/resourceController.js`
- `d:/Synapse/backend/src/models/ExplorerSession.js`
- `d:/Synapse/backend/src/routes/resources.js`
- `d:/Synapse/frontend/src/pages/resources/ExplorerChat.jsx`
- `d:/Synapse/frontend/src/pages/resources/ResourceExplorer.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for AI Learning Resource Explorer
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 19: Smart Task Prioritisation

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/models/StudyTask.js`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Smart Task Prioritisation
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 20: Study Analytics Dashboard

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
*Files dynamically shared across modules or handled in core components.*

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Study Analytics Dashboard
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 21: Resource Recommendation Engine

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
*Files dynamically shared across modules or handled in core components.*

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Resource Recommendation Engine
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 22: Exam Readiness Score

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/services/readinessService.js`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Exam Readiness Score
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 23: Semester Performance Predictor

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
*Files dynamically shared across modules or handled in core components.*

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Semester Performance Predictor
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 24: Universal Academic Calendar

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/calendarController.js`
- `d:/Synapse/backend/src/jobs/eventReminders.js`
- `d:/Synapse/backend/src/models/CustomEvent.js`
- `d:/Synapse/backend/src/routes/calendar.js`
- `d:/Synapse/frontend/src/pages/calendar/Calendar.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Universal Academic Calendar
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 25: Peer Networking & Direct Messaging

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/friendsController.js`
- `d:/Synapse/backend/src/models/Friendship.js`
- `d:/Synapse/backend/src/models/GroupMessage.js`
- `d:/Synapse/backend/src/models/Message.js`
- `d:/Synapse/backend/src/routes/friends.js`
- `d:/Synapse/backend/src/utils/saveGroupBotMessage.js`
- `d:/Synapse/frontend/src/assets/brain_network.png`
- `d:/Synapse/frontend/src/components/MessagesPopup.jsx`
- `d:/Synapse/frontend/src/components/messaging/MessageBubble.jsx`
- `d:/Synapse/frontend/src/pages/messages/Messages.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Peer Networking & Direct Messaging
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 26: Career Vault Security

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/careerVaultController.js`
- `d:/Synapse/backend/src/middleware/careerVaultUpload.js`
- `d:/Synapse/backend/src/middleware/verifyVaultAccess.js`
- `d:/Synapse/backend/src/routes/careerVaultRoutes.js`
- `d:/Synapse/frontend/src/pages/career/CareerVaultGate.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerVaultLayout.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerVaultList.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerVaultNav.jsx`
- `d:/Synapse/frontend/src/pages/career/ForgotVaultPassword.jsx`
- `d:/Synapse/frontend/src/pages/career/ResetVaultPassword.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Career Vault Security
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 27: Career Timeline

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/careerVaultController.js`
- `d:/Synapse/backend/src/middleware/careerVaultUpload.js`
- `d:/Synapse/backend/src/models/CareerDocument.js`
- `d:/Synapse/backend/src/routes/careerVaultRoutes.js`
- `d:/Synapse/backend/src/services/careerDocExtractor.js`
- `d:/Synapse/frontend/src/pages/career/CareerDocDetailView.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerDocUploadModal.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerTimeline.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerVaultGate.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerVaultLayout.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerVaultList.jsx`
- `d:/Synapse/frontend/src/pages/career/CareerVaultNav.jsx`
- `d:/Synapse/frontend/src/pages/career/ForgotVaultPassword.jsx`
- `d:/Synapse/frontend/src/pages/career/ResetVaultPassword.jsx`
- `d:/Synapse/frontend/src/pages/career/ResumeBuilderList.jsx`
- `d:/Synapse/frontend/src/pages/career/ResumeEditor.jsx`
- `d:/Synapse/frontend/src/pages/career/ResumeIntelligence.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Career Timeline
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 28: Resume Intelligence

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/resumeController.js`
- `d:/Synapse/backend/src/middleware/resumeUpload.js`
- `d:/Synapse/backend/src/models/Resume.js`
- `d:/Synapse/backend/src/services/resumeGenerator.js`
- `d:/Synapse/backend/src/services/resumeParser.js`
- `d:/Synapse/backend/src/services/resumePdfExporter.js`
- `d:/Synapse/backend/src/services/resumeRewriteService.js`
- `d:/Synapse/backend/src/services/resumeSkillGapAnalyzer.js`
- `d:/Synapse/backend/src/services/resumeTemplates/atsClassic.js`
- `d:/Synapse/backend/src/services/resumeTemplates/index.js`
- `d:/Synapse/backend/src/services/resumeTemplates/researchHigherStudies.js`
- `d:/Synapse/backend/src/services/resumeTemplates/softwareDeveloper.js`
- `d:/Synapse/frontend/src/pages/career/ResumeBuilderList.jsx`
- `d:/Synapse/frontend/src/pages/career/ResumeEditor.jsx`
- `d:/Synapse/frontend/src/pages/career/ResumeIntelligence.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for Resume Intelligence
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Chapter 29: AI Resume Builder

### Business Purpose & Workflow
This feature addresses specific student pain points by integrating AI with actionable insights. The workflow typically begins from the user interface, hits the Next.js API routes, passes through middleware, and is processed by the service layer before interacting with MongoDB.

### Associated Files
- `d:/Synapse/backend/src/controllers/resumeController.js`
- `d:/Synapse/backend/src/middleware/resumeUpload.js`
- `d:/Synapse/backend/src/models/Resume.js`
- `d:/Synapse/backend/src/services/aiContextBuilder.js`
- `d:/Synapse/backend/src/services/resumeGenerator.js`
- `d:/Synapse/backend/src/services/resumeParser.js`
- `d:/Synapse/backend/src/services/resumePdfExporter.js`
- `d:/Synapse/backend/src/services/resumeRewriteService.js`
- `d:/Synapse/backend/src/services/resumeSkillGapAnalyzer.js`
- `d:/Synapse/backend/src/services/resumeTemplates/atsClassic.js`
- `d:/Synapse/backend/src/services/resumeTemplates/index.js`
- `d:/Synapse/backend/src/services/resumeTemplates/researchHigherStudies.js`
- `d:/Synapse/backend/src/services/resumeTemplates/softwareDeveloper.js`
- `d:/Synapse/frontend/src/pages/career/ResumeBuilderList.jsx`
- `d:/Synapse/frontend/src/pages/career/ResumeEditor.jsx`
- `d:/Synapse/frontend/src/pages/career/ResumeIntelligence.jsx`

### Internal Implementation & Debugging
When debugging this feature, always check the associated controller and service files first. Ensure MongoDB collections are correctly structured and verify that API requests have the correct JWT tokens. Common issues arise from missing await statements or undefined context variables during AI calls.

### Revision Checklist
- [ ] Understand the user journey for AI Resume Builder
- [ ] Review the related models and controllers
- [ ] Identify the specific AI prompts or logic used (if applicable)

## Conclusion

This manual serves as your foundational knowledge base for defending the project in viva sessions and placement interviews. Remember to connect every technical decision back to the business value it provides to the student.
