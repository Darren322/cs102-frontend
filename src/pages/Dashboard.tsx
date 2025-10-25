"use client"

import { useState, useEffect } from "react"
import { Rows4, ShieldX, ShieldCheck, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSessionByCreator } from "@/components/api/backend-methods/Sessions"
import { stringFormatter } from "@/components/utils/stringFormatter"
import { Link } from "react-router-dom"

type StatCardSpec = {
  title: string
  value: string | number
  change: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: "blue" | "green" | "purple" | "orange"
}

// Minimal shape based on how you use it
type CourseLite = { courseName: string }
type Session = {
  id?: string | number
  sessionID: string | number
  date: string // ISO date (yyyy-mm-dd)
  active?: boolean
  status: "ACTIVE" | "CLOSED" | string
  courseName?: string
  course?: CourseLite
  attendance?: string | number
}

const colorMap = {
  blue: { text: "text-blue-500", bgSoft: "bg-blue-500/10", textSoft: "text-blue-400" },
  green: { text: "text-emerald-500", bgSoft: "bg-emerald-500/10", textSoft: "text-emerald-400" },
  purple: { text: "text-purple-500", bgSoft: "bg-purple-500/10", textSoft: "text-purple-400" },
  orange: { text: "text-orange-500", bgSoft: "bg-orange-500/10", textSoft: "text-orange-400" },
} as const

export default function DashboardPage() {
  const [usrSession, setUsrSession] = useState<Session[]>([])
  const [lengthActive, setLengthActive] = useState<number>(0)
  const [beforeSession, setBeforeSession] = useState<Session[]>([])
  const [afterSession, setAfterSession] = useState<Session[]>([])

  useEffect(() => {
    (async () => {
      const response = await getSessionByCreator()
      const data = (response?.data ?? []) as Session[]

      setUsrSession(data)

      const activeSessions = data.filter((s) => s.active === true)
      setLengthActive(activeSessions.length)

      // normalize "today" to local midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const past = data.filter((sess) => new Date(`${sess.date}T00:00:00`) < today)
      const upcoming = data.filter((sess) => new Date(`${sess.date}T00:00:00`) > today)

      past.sort(
        (a: Session, b: Session) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      upcoming.sort(
        (a: Session, b: Session) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      setBeforeSession(past)
      setAfterSession(upcoming)
    })()
  }, [])

  const statCards: StatCardSpec[] = [
    { title: "Total Sessions", value: usrSession.length, icon: Rows4, color: "blue", change: "Sessions in total." },
    { title: "Active Sessions", value: lengthActive, icon: ShieldCheck, color: "purple", change: "Active Sessions in Total" },
    { title: "Past Sessions", value: beforeSession.length, icon: ShieldX, color: "orange", change: "Past Sessions in Total" },
    { title: "Upcoming Sessions", value: afterSession.length, icon: Calendar, color: "green", change: "Upcoming Sessions in Total" },
  ]

  const username = localStorage.getItem("username") ?? sessionStorage.getItem("username") ?? "User"

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <div className="flex-1 py-6 px-8">
        {/* Header */}
        <Card className="mb-6 bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
          <CardHeader className="px-6 py-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl tracking-tight">Dashboard</CardTitle>
                <CardDescription className="mt-1 text-muted-foreground">
                  Welcome back, {username}
                </CardDescription>
              </div>
              <div className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => {
              const Icon = card.icon
              const colors = colorMap[card.color]
              return (
                <Card
                  key={card.title}
                  className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm transition-all hover:shadow-lg hover:border-slate-700/50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-400">{card.title}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
                        <p className={cn("mt-1 text-sm", colors.textSoft)}>{card.change}</p>
                      </div>
                      <div className={cn("p-2 rounded-xl", colors.bgSoft, "rounded-2xl")}>
                        <Icon className={cn("h-6 w-6", colors.text)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {beforeSession.map((s) => (
                  <Link key={s.sessionID} to={`/session_start/${s.sessionID}`} className="block">
                    <div
                      className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/50 transition-all"
                    >
                      <div>
                        <p className="font-medium text-white">{s.courseName}</p>
                        <p className="text-sm text-slate-400">{s.course?.courseName}</p>
                        <p className="text-sm text-slate-300">{s.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{s.attendance}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize rounded-full px-3 py-1 font-medium border",
                            s.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : s.status === "CLOSED"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                          )}
                        >
                          {stringFormatter(s.status)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Schedule */}
            <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {afterSession.map((s) => (
                  <Link key={s.sessionID} to={`/session_start/${s.sessionID}`} className="block">
                    <div
                      className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/50 transition-all"
                    >
                      <div>
                        <p className="font-medium text-white">{s.courseName}</p>
                        <p className="text-sm text-slate-400">{s.course?.courseName}</p>
                        <p className="text-sm text-slate-300">{s.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize rounded-full px-3 py-1 font-medium border",
                            s.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : s.status === "CLOSED"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                          )}
                        >
                          {stringFormatter(s.status)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
