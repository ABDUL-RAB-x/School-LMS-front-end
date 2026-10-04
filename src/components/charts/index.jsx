import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const AXIS = {
  tick: { fill: '#94A3B8', fontSize: 12, fontWeight: 500 },
  axisLine: false,
  tickLine: false,
}

function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-btn border border-line bg-white px-3 py-2 shadow-lift">
      <p className="mb-1 text-[12px] font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-[12px] text-ink-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold text-ink">
            {prefix}
            {p.value}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  )
}

// New admissions per month (bars) with the running roll (line, right axis)
export function AdmissionsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="month" {...AXIS} />
        <YAxis yAxisId="new" {...AXIS} width={54} allowDecimals={false} />
        <YAxis yAxisId="total" orientation="right" {...AXIS} width={44} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
        <Bar yAxisId="new" dataKey="students" name="New admissions" fill="#0F766E" radius={[6, 6, 0, 0]} maxBarSize={30} />
        <Line yAxisId="total" type="monotone" dataKey="total" name="Students on roll" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Horizontal bars, one row per label: readable with long names
export function HorizontalBarChart({ data, labelKey, bars, suffix = '', domain = [0, 100] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 46 + 30)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barGap={3}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" horizontal={false} />
        <XAxis type="number" domain={domain} {...AXIS} tickFormatter={(v) => `${v}${suffix}`} />
        <YAxis type="category" dataKey={labelKey} {...AXIS} width={130} />
        <Tooltip content={<ChartTooltip suffix={suffix} />} cursor={{ fill: '#F1F5F9' }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[0, 6, 6, 0]} maxBarSize={14} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RevenueBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barGap={6}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="month" {...AXIS} />
        <YAxis {...AXIS} width={68} tickFormatter={(v) => `Rs ${v}k`} />
        <Tooltip content={<ChartTooltip prefix="Rs " suffix="k" />} cursor={{ fill: '#F1F5F9' }} />
        <Bar dataKey="collected" name="Collected" fill="#0F766E" radius={[6, 6, 0, 0]} maxBarSize={26} />
        <Bar dataKey="outstanding" name="Outstanding" fill="#CBD5E1" radius={[6, 6, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function GradeBarChart({ data, dataKey = 'students', labelKey = 'grade', color = '#334155' }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey={labelKey} {...AXIS} />
        <YAxis {...AXIS} width={54} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
        <Bar dataKey={dataKey} name="Students" fill={color} radius={[6, 6, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({ data, centerLabel, centerValue }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-2xl font-semibold text-ink">{centerValue}</p>
        <p className="text-[12px] text-ink-muted">{centerLabel}</p>
      </div>
    </div>
  )
}

export function TrendLineChart({ data, dataKey, labelKey, color = '#0F766E', suffix = '%', domain = [0, 100], name = dataKey }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey={labelKey} {...AXIS} />
        <YAxis {...AXIS} width={54} domain={domain} />
        <Tooltip content={<ChartTooltip suffix={suffix} />} cursor={{ stroke: '#CBD5E1', strokeDasharray: '4 4' }} />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function StackedAttendanceChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="month" {...AXIS} />
        <YAxis {...AXIS} width={54} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
        <Bar dataKey="present" name="Present" stackId="a" fill="#0F766E" maxBarSize={30} />
        <Bar dataKey="late" name="Late" stackId="a" fill="#D97706" maxBarSize={30} />
        <Bar dataKey="absent" name="Absent" stackId="a" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2 text-[12px] font-medium text-ink-muted">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
          {i.value != null && <span className="font-semibold text-ink">{i.value}</span>}
        </span>
      ))}
    </div>
  )
}
