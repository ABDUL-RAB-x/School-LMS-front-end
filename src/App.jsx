import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import { ROLE_HOME } from './components/layout/nav.js'

import LoginPortal from './pages/auth/LoginPortal.jsx'
import { loginPath } from './pages/auth/portals.js'
import Login from './pages/auth/Login.jsx'
import VerifyCode from './pages/auth/VerifyCode.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import ChangePassword from './pages/auth/ChangePassword.jsx'
import NotFound from './pages/NotFound.jsx'

// Admin
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminStudents from './pages/admin/Students.jsx'
import AdminStudentForm from './pages/admin/StudentForm.jsx'
import AdminStudentDetail from './pages/admin/StudentDetail.jsx'
import AdminTeachers from './pages/admin/Teachers.jsx'
import AdminTeacherForm from './pages/admin/TeacherForm.jsx'
import AdminTeacherDetail from './pages/admin/TeacherDetail.jsx'
import AdminClasses from './pages/admin/Classes.jsx'
import AdminSubjects from './pages/admin/Subjects.jsx'
import AdminAttendance from './pages/admin/Attendance.jsx'
import AdminExams from './pages/admin/Exams.jsx'
import AdminFees from './pages/admin/Fees.jsx'
import AdminTimetable from './pages/admin/Timetable.jsx'
import AdminAnnouncements from './pages/admin/Announcements.jsx'
import AdminSettings from './pages/admin/Settings.jsx'
import AdminAuditLogs from './pages/admin/AuditLogs.jsx'

// Teacher
import TeacherDashboard from './pages/teacher/Dashboard.jsx'
import TeacherClasses from './pages/teacher/MyClasses.jsx'
import TeacherAttendance from './pages/teacher/MarkAttendance.jsx'
import TeacherAssignments from './pages/teacher/Assignments.jsx'
import TeacherMarks from './pages/teacher/MarksEntry.jsx'
import TeacherTimetable from './pages/teacher/Timetable.jsx'
import TeacherAnnouncements from './pages/teacher/Announcements.jsx'
import TeacherProfile from './pages/teacher/Profile.jsx'

// Student
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentAttendance from './pages/student/Attendance.jsx'
import StudentTimetable from './pages/student/Timetable.jsx'
import StudentExams from './pages/student/Exams.jsx'
import StudentAssignments from './pages/student/Assignments.jsx'
import StudentFees from './pages/student/Fees.jsx'
import StudentAnnouncements from './pages/student/Announcements.jsx'
import StudentProfile from './pages/student/Profile.jsx'

function LegacyLoginRedirect() {
  const { role } = useParams()
  return <Navigate to={loginPath(role)} replace />
}

function RootRedirect() {
  const { user, booting } = useAuth()
  if (booting) return null
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPortal />} />
        <Route path="/admin/login" element={<Login role="admin" />} />
        <Route path="/teacher/login" element={<Login role="teacher" />} />
        <Route path="/student/login" element={<Login role="student" />} />
        {/* Old links (/login/teacher …) keep working. */}
        <Route path="/login/:role" element={<LegacyLoginRedirect />} />
        <Route path="/verify" element={<VerifyCode />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="students/new" element={<AdminStudentForm />} />
          <Route path="students/:id" element={<AdminStudentDetail />} />
          <Route path="students/:id/edit" element={<AdminStudentForm />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="teachers/new" element={<AdminTeacherForm />} />
          <Route path="teachers/:id" element={<AdminTeacherDetail />} />
          <Route path="teachers/:id/edit" element={<AdminTeacherForm />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="timetable" element={<AdminTimetable />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="audit-log" element={<AdminAuditLogs />} />
        </Route>

        <Route path="/teacher" element={<DashboardLayout role="teacher" />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
          <Route path="profile" element={<TeacherProfile />} />
        </Route>

        <Route path="/student" element={<DashboardLayout role="student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
