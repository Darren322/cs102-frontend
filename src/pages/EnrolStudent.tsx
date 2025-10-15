"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
//import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import { getDropdownCourse } from "@/components/api/backend-methods/Courses"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    const enrolStudent = () =>{
        console.log('enroled')
    }



    const [currentSelected, setCurrentSelected] = useState("")
    const [allCourses, setAllCourses] = useState<any>([])
    useEffect(() => {
        getDropdownCourse().then((response) => {
            let responseData = response.data;
            let currentCodes = responseData.map((data: any) => {
                return data.courseCode;
            })
            setAllCourses(currentCodes)
        })
    }, [])

    console.log(allCourses)

    return (
        <div className="min-h-screen bg-[#020617] mt-14 rounded-2xl px-auto items-center ml-auto mr-auto">
            <div className="mx-auto px-auto items-center ml-auto mr-auto">
                <Card className="border-0 rounded-2xl w-[70%]">
                    <CardHeader>
                        <CardTitle className="text-2xl">Enrol for Class</CardTitle>
                        <CardDescription>Enrol yourself to a module</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* studentId */}
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

                                {/* course */}
                                <div className="space-y-2">
                                    <Label htmlFor="course">
                                        Course Code <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={currentSelected} onValueChange={setCurrentSelected}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allCourses.map((course: any) => (
                                                <SelectItem key={course} value={course}>
                                                    {course}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>





                            {/* buttons stay as-is */}
                            <div className="flex gap-4 pt-4">
                                <Button type="submit" className="" onClick={()=>{enrolStudent()}}>
                                    Enrol Student
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
