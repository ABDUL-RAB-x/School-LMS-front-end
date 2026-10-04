import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Avatar, Badge, Card, CardBody, CardHeader, PageHeader, Tabs } from '../../components/ui/index.jsx'
import SecurityCard from '../../components/SecurityCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate } from '../../lib/utils.js'
import { fadeUp, stagger } from '../../lib/motion.js'

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'security', label: 'Security' },
]

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{value || '—'}</span>
    </div>
  )
}

export default function StudentProfile() {
  const { user, profile: p } = useAuth()
  const [tab, setTab] = useState('profile')
  const room = p?.classRoom

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your student record — the school office keeps these details up to date">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </PageHeader>

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardBody className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar name={p?.name ?? user?.name} size="xl" />
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{p?.name ?? user?.name}</h3>
                <p className="text-[13px] text-ink-muted">{room ? `${room.name} · Section ${room.section}` : '—'}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {p?.roll && <Badge tone="accent">Roll {p.roll}</Badge>}
                  {p?.studentId && <Badge tone="neutral">{p.studentId}</Badge>}
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <p className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                  <Mail className="h-4 w-4 shrink-0 text-ink-faint" />
                  <span className="truncate">{p?.email ?? user?.email}</span>
                </p>
                <p className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                  <Phone className="h-4 w-4 shrink-0 text-ink-faint" />
                  {p?.phone || '—'}
                </p>
                <p className="flex items-start gap-2.5 text-[13px] text-ink-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                  {p?.address || '—'}
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {tab === 'profile' ? (
          <>
            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader title="Academic record" subtitle="Managed by the administration office" />
                <CardBody className="grid grid-cols-1 gap-x-8 pt-1 sm:grid-cols-2">
                  <div>
                    <InfoRow label="Student ID" value={p?.studentId} />
                    <InfoRow label="Class" value={room ? `${room.name} · ${room.section}` : '—'} />
                    <InfoRow label="Room" value={room?.room} />
                    <InfoRow label="Roll number" value={p?.roll} />
                  </div>
                  <div>
                    <InfoRow label="Date of birth" value={p?.dob ? formatDate(p.dob) : '—'} />
                    <InfoRow label="Admission date" value={formatDate(p?.admissionDate)} />
                    <InfoRow label="Gender" value={p?.gender} />
                    <InfoRow label="Blood group" value={p?.bloodGroup} />
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="xl:col-span-3">
              <Card>
                <CardHeader title="Guardian" subtitle="Primary emergency contact" />
                <CardBody className="grid grid-cols-1 gap-x-8 pt-1 sm:grid-cols-3">
                  <InfoRow label="Name" value={p?.guardian?.name} />
                  <InfoRow label="Relationship" value={p?.guardian?.relationship} />
                  <InfoRow label="Phone" value={p?.guardian?.phone} />
                </CardBody>
              </Card>
              <p className="mt-3 text-[12px] text-ink-muted">Something wrong? Ask the school office to correct your record.</p>
            </motion.div>
          </>
        ) : (
          <motion.div variants={fadeUp} className="xl:col-span-2">
            <SecurityCard email={p?.email ?? user?.email} />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
