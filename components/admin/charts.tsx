'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e5eae7',
  borderRadius: 14,
  fontSize: 12,
  color: '#29463f',
  boxShadow: '0 12px 32px rgba(36,62,57,0.08)',
}

export function ActivityAreaChart({ data }: { data: { date: string; listings: number; users: number }[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="listingsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#315e55" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#315e55" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d1734b" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#d1734b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#edf1ef" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b9994' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#8b9994' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area type="monotone" dataKey="listings" name="Listings" stroke="#315e55" fill="url(#listingsFill)" strokeWidth={2.5} />
          <Area type="monotone" dataKey="users" name="Users" stroke="#d1734b" fill="url(#usersFill)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EventsAreaChart({ data }: { data: { date: string; events: number; users: number }[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="eventsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#315e55" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#315e55" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="eventUsersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d1734b" stopOpacity={0.26} />
              <stop offset="95%" stopColor="#d1734b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#edf1ef" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b9994' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#8b9994' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area type="monotone" dataKey="events" name="Events" stroke="#315e55" fill="url(#eventsFill)" strokeWidth={2.5} />
          <Area type="monotone" dataKey="users" name="Unique users" stroke="#d1734b" fill="url(#eventUsersFill)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryBarChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#edf1ef" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8b9994' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#8b9994' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(49,94,85,0.06)' }} />
          <Bar dataKey="count" name="Listings" fill="#315e55" radius={[10, 10, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
