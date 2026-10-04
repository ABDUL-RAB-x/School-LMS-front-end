import { BookOpen, GraduationCap, ShieldCheck } from 'lucide-react'

// One sign-in page per panel, each at its own URL: /admin/login, /teacher/login, /student/login
export const PORTALS = {
  admin: {
    key: 'admin',
    label: 'Admin',
    title: 'Administrator sign in',
    description: 'Manage students, staff, classes, fees and school settings.',
    icon: ShieldCheck,
    public: false,
  },
  teacher: {
    key: 'teacher',
    label: 'Teacher',
    title: 'Teacher sign in',
    description: 'Take attendance, set assignments and enter marks for your classes.',
    icon: BookOpen,
    public: true,
  },
  student: {
    key: 'student',
    label: 'Student',
    title: 'Student sign in',
    description: 'See your timetable, results, assignments and fee status.',
    icon: GraduationCap,
    public: true,
  },
}

// Portals offered on the public /login chooser and linked from each other
export const PUBLIC_PORTALS = Object.values(PORTALS).filter((p) => p.public)

export const loginPath = (role) => (PORTALS[role] ? `/${role}/login` : '/login')
