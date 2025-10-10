// src/pages/Dashboard.tsx (or DashboardPage.tsx)
"use client"

import { useState, useEffect } from "react";
import {
  Users, Clock, TrendingUp, Activity, Book,
  CheckCircle, AlertCircle
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type StatCardSpec = {
  title: string;
  value: string | number;
  change: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: "blue" | "green" | "purple" | "orange";
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    activeRosters: 0,
    averageAttendance: 0,
    todaySessions: 0,
    pendingSessions: 0
  });

  const [recentSessions] = useState([
    { id: 1, name: "CS101 - Introduction to Programming", course: "CS101", date: new Date().toISOString().split("T")[0], attendance: "24/30", status: "completed" },
    { id: 2, name: "CS201 - Data Structures Lab",        course: "CS201", date: new Date(Date.now() - 86400000).toISOString().split("T")[0], attendance: "18/22", status: "completed" },
    { id: 3, name: "CS301 - Machine Learning",           course: "CS301", date: new Date().toISOString().split("T")[0], attendance: "0/25",  status: "scheduled" },
  ]);

  const [upcomingSessions] = useState([
    { id: 1, name: "CS101 - Variables and Functions", course: "CS101", time: "10:00 AM", students: 30, room: "Lab 203" },
    { id: 2, name: "CS201 - Algorithm Analysis",      course: "CS201", time: "2:00 PM",  students: 22, room: "Room 105" },
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      setStats({
        totalSessions: 47,
        totalStudents: 156,
        activeRosters: 8,
        averageAttendance: 87.3,
        todaySessions: 3,
        pendingSessions: 2
      });
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const statCards: StatCardSpec[] = [
    { title: "Total Sessions",   value: stats.totalSessions,         icon: Clock,     color: "blue",   change: "+12%"  },
    { title: "Total Students",   value: stats.totalStudents,         icon: Users,     color: "green",  change: "+5%"   },
    { title: "Active Rosters",   value: stats.activeRosters,         icon: Book,      color: "purple", change: "+2"    },
    { title: "Avg Attendance",   value: `${stats.averageAttendance}%`, icon: TrendingUp, color: "orange", change: "+3.2%" },
  ];

  const colorMap = {
    blue:   { text: "text-blue-500",   bgSoft: "bg-blue-100/20",   textSoft: "text-blue-400"   },
    green:  { text: "text-emerald-500",bgSoft: "bg-emerald-100/20",textSoft: "text-emerald-400"},
    purple: { text: "text-purple-500", bgSoft: "bg-purple-100/20", textSoft: "text-purple-400" },
    orange: { text: "text-orange-500", bgSoft: "bg-orange-100/20", textSoft: "text-orange-400" },
  } as const;

  return (
    <div
      className={cn(
        "relative size-full overflow-hidden",
        "bg-[radial-gradient(ellipse_at_bottom,theme(colors.slate.900)_0%,theme(colors.slate.950)_100%)]"
      )}
    >
      <div className="h-full w-full p-4 md:p-6 lg:p-8">
        {/* Header */}
        <Card className="mb-6 border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-2xl">Dashboard</CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                Welcome back, Prof. Parker
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
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
              const Icon = card.icon;
              const colors = colorMap[card.color];
              return (
                <Card key={card.title} className="border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                        <p className={cn("mt-1 text-sm", colors.textSoft)}>
                          {card.change} from last month
                        </p>
                      </div>
                      <div className={cn("p-2 rounded-md", colors.bgSoft)}>
                        <Icon className={cn("h-6 w-6", colors.text)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card className="border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="secondary" className="justify-start gap-3">
                  <Clock className="h-5 w-5" />
                  <span>Start New Session</span>
                </Button>
                <Button variant="secondary" className="justify-start gap-3">
                  <Users className="h-5 w-5" />
                  <span>Manage Rosters</span>
                </Button>
                <Button variant="secondary" className="justify-start gap-3">
                  <Activity className="h-5 w-5" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <Card className="border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.course} • {s.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{s.attendance}</span>
                      <Badge
                        variant={s.status === "completed" ? "secondary" : "outline"}
                        className={cn(
                          "capitalize",
                          s.status === "completed"
                            ? "bg-emerald-100/20 text-emerald-400"
                            : "border-yellow-400 text-yellow-400"
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
            <Card className="border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.time} • {s.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{s.students} students</p>
                      <p className="text-xs text-muted-foreground">{s.course}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card className="border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
                  <span className="text-sm text-foreground">Face Recognition: Online</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
                  <span className="text-sm text-foreground">Database: Connected</span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-foreground">Camera Access: Limited</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
