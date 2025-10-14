"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
//import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

export default function EnrolPage() {
  //const { toast } = useToast()
  const [formData, setFormData] = useState({
    studentId: "",
    username: "",
    name: "",
    email: "",
    phone: "",
    faceData: "",
  })

  const [courses, setCourses] = useState<string[]>([])
  const [currentCourse, setCurrentCourse] = useState("")

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail") || ""
    setFormData((prev) => ({ ...prev, email: storedEmail }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.studentId || !formData.name || !formData.phone) {
    //   toast({
    //     title: "Error",
    //     description: "Please fill in all required fields",
    //     variant: "destructive",
    //   })
      return
    }

    if (!/^\d{8}$/.test(formData.phone)) {
    //   toast({
    //     title: "Error",
    //     description: "Phone number must be 8 digits",
    //     variant: "destructive",
    //   })
      return
    }

    if (!/^S\d{8}$/.test(formData.studentId)) {
    //   toast({
    //     title: "Error",
    //     description: "Student ID must be in format S12345678",
    //     variant: "destructive",
    //   })
      return
    }

    const studentObject = {
      studentId: formData.studentId,
      username: formData.username || undefined,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      faceData: formData.faceData || "",
      courses: courses,
    }

    console.log("[v0] Student enrolled:", studentObject)

    // toast({
    //   title: "Success",
    //   description: "Student enrolled successfully!",
    // })

    setFormData({
      studentId: "",
      username: "",
      name: "",
      email: formData.email,
      phone: "",
      faceData: "",
    })
    setCourses([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addCourse = () => {
    const trimmedCourse = currentCourse.trim()
    if (trimmedCourse && !courses.includes(trimmedCourse)) {
      setCourses([...courses, trimmedCourse])
      setCurrentCourse("")
    } else if (courses.includes(trimmedCourse)) {
    //   toast({
    //     title: "Duplicate Course",
    //     description: "This course has already been added",
    //     variant: "destructive",
    //   })
    }
  }

  const removeCourse = (courseToRemove: string) => {
    setCourses(courses.filter((course) => course !== courseToRemove))
  }

  const handleCourseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addCourse()
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] mt-10 ml-4 rounded-2xl px-auto">
      <div className="mx-auto px-auto">
        <Card className="border-0 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Enrol for Class</CardTitle>
            <CardDescription>Add a new student to the attendance system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="studentId">
                  Student ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentId"
                  name="studentId"
                  placeholder="S12345678"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="bg-background"
                />
                <p className="text-sm text-muted-foreground">Format: S followed by 8 digits</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nicholas Tan"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="nick"
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nick@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Email is retrieved from your account</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="91234567"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={8}
                  className="bg-background"
                />
                <p className="text-sm text-muted-foreground">8-digit phone number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courses">Courses</Label>
                <div className="flex gap-2">
                  <Input
                    id="courses"
                    placeholder="Enter course name (e.g., CS101, Math201)"
                    value={currentCourse}
                    onChange={(e) => setCurrentCourse(e.target.value)}
                    onKeyDown={handleCourseKeyDown}
                    className="bg-background"
                  />
                  <Button type="button" onClick={addCourse} variant="secondary">
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Press Enter or click Add to add a course</p>

                {courses.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {courses.map((course) => (
                      <div
                        key={course}
                        className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1 text-sm text-primary"
                      >
                        <span>{course}</span>
                        <button
                          type="button"
                          onClick={() => removeCourse(course)}
                          className="hover:text-primary/80"
                          aria-label={`Remove ${course}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  Enrol Student
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      studentId: "",
                      username: "",
                      name: "",
                      email: formData.email,
                      phone: "",
                      faceData: "",
                    })
                    setCourses([])
                  }}
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
