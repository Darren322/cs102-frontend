"use client"

import { useState, useEffect } from "react"
import {
  Rows4,
  ShieldX,
  ShieldCheck,
  Calendar
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

export default function DashboardPage() {


  const [usrSession, setUsrSession] = useState<any>([])
  const [lengthActive, setLengthActive] = useState(0);

  const [beforeSession, setBeforeSession] = useState<any>([]);
  const [afterSession, setAfterSession] = useState<any>([]);
  useEffect(() => {
    getSessionByCreator().then((response) => {
      setUsrSession(response.data)
      const activeSessions = response.data.filter((singleSess: any) => { singleSess.active == true })
      setLengthActive(activeSessions.length)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize to midnight
      console.log(today)

      const dates = response.data.filter((sess: any) => {
        let cur = new Date(`${sess.date}T00:00:00`);
        return cur < today;
      })

      const afterDates = response.data.filter((sess: any) => {
        let cur = new Date(`${sess.date}T00:00:00`);
        return cur > today;
      })
      console.log(dates)
      setBeforeSession(dates)
      setAfterSession(afterDates)
    })
  }, [])
  console.log(beforeSession)

  console.log(usrSession)
  const statCards: StatCardSpec[] = [
    { title: "Total Sessions", value: usrSession.length, icon: Rows4, color: "blue", change: "Sessions in total." },
    { title: "Active Sessions", value: lengthActive, icon: ShieldCheck, color: "purple", change: "Active Sessions in Total" },
    { title: "Past Sessions", value: `${beforeSession.length}`, icon: ShieldX, color: "orange", change: "Past Sessions in Total" },
    { title: "Upcoming Sessions", value: `${afterSession.length}`, icon: Calendar, color: "green", change: "Upcoming Sessions in Total" },
  ]

  const colorMap = {
    blue: { text: "text-blue-500", bgSoft: "bg-blue-500/10", textSoft: "text-blue-400" },
    green: { text: "text-emerald-500", bgSoft: "bg-emerald-500/10", textSoft: "text-emerald-400" },
    purple: { text: "text-purple-500", bgSoft: "bg-purple-500/10", textSoft: "text-purple-400" },
    orange: { text: "text-orange-500", bgSoft: "bg-orange-500/10", textSoft: "text-orange-400" },
  } as const



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
                  Welcome back, {localStorage.username}
                </CardDescription>
              </div>

              <div className="text-sm text-slate-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}

                <div className="flex justify-end">
                  <Button
                    className="
              rounded-full h-11 px-6 font-medium
              bg-blue-500/20 text-blue-300 border border-blue-500/30
              backdrop-blur-md transition-all
              hover:bg-blue-500/30 hover:text-blue-100 hover:border-blue-400/50
              shadow-sm hover:shadow-blue-500/20
            "
                  >
                    View Reports
                  </Button>
                </div>
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
                {beforeSession.map((s: any) => (
                  <Link to={`/session_start/${s.sessionID}`} className="block">
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/50 transition-all"
                    >
                      <div>
                        <p className="font-medium text-white">{s.courseName}</p>
                        <p className="text-sm text-slate-400">{s.course.courseName} • {s.date}</p>
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

            {/* Today's Schedule */}
            <Card className="bg-slate-900/50 border-slate-800/50 rounded-2xl shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {afterSession.map((s: any) => (
                  <Link to={`/session_start/${s.sessionID}`} className="block">
                    <div
                      key={s.sessionID}
                      className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/50 p-3 hover:border-slate-600/50 transition-all"
                    >
                      <div>
                        <p className="font-medium text-white">{s.courseName}</p>
                        <p className="text-sm text-slate-400">{s.course.courseName} • {s.date}</p>

                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{s.students.length} students</p>

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