
import { getcurrentStudent } from "@/components/api/backend-methods/Student";
import { getByUsername } from "@/components/api/backend-methods/Users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, stringFormatter } from "@/components/utils/stringFormatter";
import { useEffect, useState } from "react";
import DirectionCountdownCapture from "@/components/capture/SimpleDirectionCapture";


export default function ProfileContent() {
  const currentUserType = localStorage['role']
  console.log(localStorage)
  const [curUsrInfo, setCurUsrInfo] = useState<any>(null);
  const [curStudent, setCurStudent] = useState<any>(null);
  useEffect(() => {
    getByUsername().then((resp) => {
      console.log(resp.data)
      setCurUsrInfo(resp.data)
    }).catch((err) => {
      setCurUsrInfo(err)
    })
  }, [localStorage['username']])

  console.log(curUsrInfo, 'usr table')

  useEffect(() => {
    getcurrentStudent().then((resp) => {
      console.log(resp.data)
      setCurStudent(resp.data);
    })
      .catch((err) => {
        setCurStudent({});
      })
  }, [localStorage['username']])

  console.log(curStudent, 'stu table')

  return (
    <Tabs defaultValue="personal" className="space-y-6 rounded-4xl">
      <TabsList className={`grid w-full rounded-2xl ${currentUserType === "STAFF" ? "grid-cols-1" : "grid-cols-2"
        }`}>
        <TabsTrigger value="personal" className="rounded-2xl hover:cursor-pointer hover:backdrop-brightness-80 transition-transform">Personal</TabsTrigger>
        {
          currentUserType == "STAFF" && (
            <></>
            // <TabsTrigger value="account" className="rounded-2xl hover:cursor-pointer hover:backdrop-brightness-80 transition-transform">Account Settings</TabsTrigger>
          )
        }
        {
          currentUserType !== "STAFF" && (
            <TabsTrigger value="security" className="rounded-2xl hover:cursor-pointer hover:backdrop-brightness-80 transition-transform">Face Upload</TabsTrigger>
          )
        }
      </TabsList>

      {/* Personal Information */}
      <TabsContent value="personal" className="space-y-6 rounded-4xl">
        <Card className="rounded-2xl p-12">

          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            {
              currentUserType == "STAFF" ? (
                <CardDescription>Your personal details, at a glance.</CardDescription>
              ) : (
                <CardDescription>Update your personal details and profile information.</CardDescription>
              )
            }


          </CardHeader>
          <CardContent className="space-y-6">

            {
              currentUserType != "STAFF" ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Name</Label>
                    <Input id="firstName" value={curStudent?.name} className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" className="rounded-2xl" value={localStorage['username']} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Student ID</Label>
                    <Input id="phone" value={curStudent?.studentId} className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Role</Label>
                    <Input id="jobTitle" value={curUsrInfo ? stringFormatter(curUsrInfo.role) : ""} className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Account created at</Label>
                    <Input id="jobTitle" value={curUsrInfo ? formatDateTime(curUsrInfo.createdAt) : "—"} className="rounded-2xl" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Last login at</Label>
                    <Input id="company" value={curUsrInfo ? formatDateTime(curUsrInfo.updatedAt) : "—"} className="rounded-2xl" disabled />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Email</Label>
                    <Input id="fullName" defaultValue={localStorage['username']} className="rounded-2xl" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Role</Label>
                    <Input id="phone" defaultValue={stringFormatter(localStorage['role'])} className="rounded-2xl" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Account created at</Label>
                    <Input id="jobTitle" value={curUsrInfo ? formatDateTime(curUsrInfo.createdAt) : "—"} className="rounded-2xl" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Last login at</Label>
                    <Input id="company" value={curUsrInfo ? formatDateTime(curUsrInfo.updatedAt) : "—"} className="rounded-2xl" disabled />
                  </div>
                </div>
              )
            }

          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Settings */}
      {
        currentUserType == "STAFF"
        &&
        (
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences and subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Data Export</Label>
                    <p className="text-muted-foreground text-sm">Download a copy of your data</p>
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )
      }

            <TabsContent value="security" className="space-y-6">
        <Card className="justify-center flex-1 text-center">
          <CardHeader>
            <CardTitle>Face Enrollment</CardTitle>
            <CardDescription>Upload your faces for live attendance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 justify-center">
            <DirectionCountdownCapture />


          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
