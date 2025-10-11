"use client"

import { useState, useEffect } from "react"
import {
  Users, Clock, TrendingUp, Activity, Book,
  CheckCircle, AlertCircle
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type StatCardSpec = {
  title: string
  value: string | number
  change: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: "blue" | "green" | "purple" | "orange"
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    activeRosters: 0,
    averageAttendance: 0,
    todaySessions: 0,
    pendingSessions: 0,
  })

  const [recentSessions] = useState([
    { id: 1, name: "CS101 - Introduction to Programming", course: "CS101", date: new Date().toISOString().split("T")[0], attendance: "24/30", status: "completed" },
    { id: 2, name: "CS201 - Data Structures Lab", course: "CS201", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], attendance: "18/22", status: "completed" },
    { id: 3, name: "CS301 - Machine Learning", course: "CS301", date: new Date().toISOString().split("T")[0], attendance: "0/25", status: "scheduled" },
  ])

  const [upcomingSessions] = useState([
    { id: 1, name: "CS101 - Variables and Functions", course: "CS101", time: "10:00 AM", students: 30, room: "Lab 203" },
    { id: 2, name: "CS201 - Algorithm Analysis", course: "CS201", time: "2:00 PM", students: 22, room: "Room 105" },
  ])

  useEffect(() => {
    const t = setTimeout(() => {
      setStats({
        totalSessions: 47,
        totalStudents: 156,
        activeRosters: 8,
        averageAttendance: 87.3,
        todaySessions: 3,
        pendingSessions: 2,
      })
    }, 300)
    return () => clearTimeout(t)
  }, [])

  const statCards: StatCardSpec[] = [
    { title: "Total Sessions", value: stats.totalSessions, icon: Clock, color: "blue", change: "+12%" },
    { title: "Total Students", value: stats.totalStudents, icon: Users, color: "green", change: "+5%" },
    { title: "Active Rosters", value: stats.activeRosters, icon: Book, color: "purple", change: "+2" },
    { title: "Avg Attendance", value: `${stats.averageAttendance}%`, icon: TrendingUp, color: "orange", change: "+3.2%" },
  ]

  const colorMap = {
    blue: { text: "text-blue-500", bgSoft: "bg-blue-500/10", textSoft: "text-blue-400" },
    green: { text: "text-emerald-500", bgSoft: "bg-emerald-500/10", textSoft: "text-emerald-400" },
    purple: { text: "text-purple-500", bgSoft: "bg-purple-500/10", textSoft: "text-purple-400" },
    orange: { text: "text-orange-500", bgSoft: "bg-orange-500/10", textSoft: "text-orange-400" },
  } as const

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <div className="flex-1 p-15">
        {/* Header */}
        <Card className="mb-6 bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-2xl tracking-tight">Dashboard</CardTitle>
              <CardDescription className="mt-1 text-slate-400">Welcome back, Prof. Parker</CardDescription>
            </div>
            <div className="text-sm text-slate-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
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
                        <p className={cn("mt-1 text-sm", colors.textSoft)}>{card.change} from last month</p>
                      </div>
                      <div className={cn("p-2 rounded-xl", colors.bgSoft)}>
                        <Icon className={cn("h-6 w-6", colors.text)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="default"
                  className="justify-start gap-3 rounded-xl bg-blue-600 hover:bg-blue-700 h-11 text-white font-medium shadow-md shadow-blue-600/20"
                >
                  <Clock className="h-5 w-5" />
                  <span>Start New Session</span>
                </Button>
                <Button
                  variant="default"
                  className="justify-start gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 h-11 text-white font-medium shadow-md shadow-emerald-600/20"
                >
                  <Users className="h-5 w-5" />
                  <span>Manage Rosters</span>
                </Button>
                <Button
                  variant="default"
                  className="justify-start gap-3 rounded-xl bg-purple-600 hover:bg-purple-700 h-11 text-white font-medium shadow-md shadow-purple-600/20"
                >
                  <Activity className="h-5 w-5" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/50 transition-all"
                  >
                    <div>
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="text-sm text-slate-400">{s.course} • {s.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{s.attendance}</span>
                      <Badge
                        variant={s.status === "completed" ? "secondary" : "outline"}
                        className={cn(
                          "capitalize rounded-full px-3 py-1 font-medium",
                          s.status === "completed"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        )}
                      >
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Today&apos;s Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/50 transition-all"
                  >
                    <div>
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="text-sm text-slate-400">{s.time} • {s.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{s.students} students</p>
                      <p className="text-xs text-slate-400">{s.course}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  <span className="text-sm text-slate-300">Face Recognition: Online</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  <span className="text-sm text-slate-300">Database: Connected</span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-slate-300">Camera Access: Limited</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}