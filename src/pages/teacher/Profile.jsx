import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Avatar, Badge, Card, CardBody, CardHeader, PageHeader, Skeleton, Tabs } from '../../components/ui/index.jsx'
import SecurityCard from '../../components/SecurityCard.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
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

export default function TeacherProfile() {
  const { user, profile: p } = useAuth()
  const [tab, setTab] = useState('profile')
  const classes = useApi(() => endpoints.teachers.myClasses(), [])
  const myClasses = classes.data?.data ?? []

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your staff record — the school office keeps these details up to date">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </PageHeader>

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardBody className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar name={p?.name ?? user?.name} size="xl" />
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{p?.name ?? user?.name}</h3>
                <p className="text-[13px] text-ink-muted">{p?.qualification || '—'}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {p?.subject?.name && <Badge tone="accent">{p.subject.name}</Badge>}
                  {p?.department && <Badge tone="neutral">{p.department}</Badge>}
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

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-item bg-surface-muted p-3 text-center">
                  <p className="font-display text-lg font-semibold text-ink">{p?.experience ?? 0}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">Years teaching</p>
                </div>
                <div className="rounded-item bg-surface-muted p-3 text-center">
                  <p className="font-display text-lg font-semibold text-ink">{classes.loading ? '…' : myClasses.length}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">Classes</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {tab === 'profile' ? (
          <>
            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader title="Staff record" subtitle="Managed by the administration office" />
                <CardBody className="grid grid-cols-1 gap-x-8 pt-1 sm:grid-cols-2">
                  <div>
                    <InfoRow label="Staff ID" value={p?.staffId} />
                    <InfoRow label="Employee ID" value={p?.employeeId} />
                    <InfoRow label="Department" value={p?.department} />
                    <InfoRow label="Subject" value={p?.subject?.name} />
                  </div>
                  <div>
                    <InfoRow label="Qualification" value={p?.qualification} />
                    <InfoRow label="Experience" value={p?.experience != null ? `${p.experience} years` : '—'} />
                    <InfoRow label="Date joined" value={formatDate(p?.joined)} />
                    <InfoRow label="Status" value={p?.status} />
                  </div>
                  {p?.bio && <p className="mt-4 text-[13px] leading-relaxed text-ink-muted sm:col-span-2">{p.bio}</p>}
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="xl:col-span-3">
              <Card>
                <CardHeader title="Assigned classes" subtitle="Sections you teach this term" />
                <CardBody className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-5">
                  {classes.loading ? (
                    <Skeleton className="h-[80px] w-full" />
                  ) : myClasses.length === 0 ? (
                    <p className="text-[13px] text-ink-muted">No classes assigned yet.</p>
                  ) : (
                    myClasses.map((c) => (
                      <div key={c._id} className="rounded-item border border-line p-4">
                        <p className="text-[14px] font-semibold text-ink">{c.label}</p>
                        <p className="mt-2 text-[12px] text-ink-faint">
                          {c.students} students{c.room ? ` · Room ${c.room}` : ''}
                        </p>
                      </div>
                    ))
                  )}
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
