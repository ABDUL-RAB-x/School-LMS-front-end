import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Library,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  Wallet,
} from 'lucide-react'

export const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/students', label: 'Manage Students', icon: Users },
    { to: '/admin/teachers', label: 'Manage Teachers', icon: GraduationCap },
    { to: '/admin/classes', label: 'Classes & Sections', icon: Layers },
    { to: '/admin/subjects', label: 'Manage Subjects', icon: Library },
    { to: '/admin/attendance', label: 'Attendance Overview', icon: ClipboardCheck },
    { to: '/admin/exams', label: 'Exams & Results', icon: FileSpreadsheet },
    { to: '/admin/fees', label: 'Fee Management', icon: Wallet },
    { to: '/admin/timetable', label: 'Timetable', icon: CalendarDays },
    { to: '/admin/announcements', label: 'Announcements', icon: Bell },
    { to: '/admin/audit-log', label: 'Audit Log', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/classes', label: 'My Classes', icon: BookOpen },
    { to: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardCheck },
    { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/teacher/marks', label: 'Exams & Marks', icon: FileSpreadsheet },
    { to: '/teacher/timetable', label: 'Timetable', icon: CalendarDays },
    { to: '/teacher/announcements', label: 'Announcements', icon: Bell },
    { to: '/teacher/profile', label: 'Profile', icon: UserCircle },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/attendance', label: 'My Attendance', icon: ClipboardCheck },
    { to: '/student/timetable', label: 'My Timetable', icon: CalendarDays },
    { to: '/student/exams', label: 'Exams & Results', icon: FileSpreadsheet },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/student/fees', label: 'Fee Status', icon: CreditCard },
    { to: '/student/announcements', label: 'Announcements', icon: Bell },
    { to: '/student/profile', label: 'Profile', icon: UserCircle },
  ],
}

export const ROLE_LABEL = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
}

export const ROLE_HOME = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
}
