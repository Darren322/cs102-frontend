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
import { getMyStudent, getcurrentStudent } from "@/components/api/backend-methods/Student"
import { createEnrollment } from "@/components/api/backend-methods/StudentEnrollment"
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
        const storedStudent = sessionStorage.getItem("studentId") || ""
        // Try to fetch the current user's student record when a token exists.
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        if (token) {
            getMyStudent(token).then((resp) => {
                if (resp?.data?.studentId) {
                    // overwrite any stale studentId with the server value
                    sessionStorage.setItem("studentId", resp.data.studentId)
                    setFormData((prev) => ({ ...prev, studentId: resp.data.studentId }))
                    return
                }
                // if /me returned no student, fall back to stored value (if any)
                if (storedStudent) setFormData((prev) => ({ ...prev, studentId: storedStudent }))
            }).catch((err) => {
                // fallback: server might not support /me or token may not map — use stored value or try username-based lookup
                console.warn("Could not fetch current student via /me, falling back:", err)
                if (storedStudent) {
                    setFormData((prev) => ({ ...prev, studentId: storedStudent }))
                    return
                }
                try {
                    const username = localStorage.getItem('username') || ''
                    if (!username) return
                    getcurrentStudent().then((resp) => {
                        const all = resp?.data || []
                        const found = all.find((s: any) => (s.username || s.email) === username)
                        if (found && found.studentId) {
                            sessionStorage.setItem('studentId', found.studentId)
                            setFormData((prev) => ({ ...prev, studentId: found.studentId }))
                        }
                    }).catch((e) => console.warn('fallback getcurrentStudent failed', e))
                } catch (e) {
                    console.warn('fallback lookup failed', e)
                }
            })
        } else if (storedStudent) {
            // no token, but we have a stored studentId from earlier — show it
            setFormData((prev) => ({ ...prev, studentId: storedStudent }))
        }
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
        // use current studentId and selected course
        const sidRaw = formData.studentId || sessionStorage.getItem('studentId')
        const course = currentSelected
        if (!sidRaw) {
            console.warn('No studentId set, cannot enroll')
            alert('No Student ID found. Please ensure you are logged in as a student.')
            return
        }
        if (!course) {
            console.warn('No course selected')
            alert('Please select a course before enrolling.')
            return
        }
        const token = (localStorage.getItem('token') || sessionStorage.getItem('token')) ?? undefined
        const sid = sidRaw as string
        
        console.log('Attempting enrollment with:', { studentId: sid, courseCode: course })
        
        createEnrollment({ studentId: sid, courseCode: course }, token).then((resp) => {
            console.log('Enrollment created successfully!', resp.data)
            alert(`Successfully enrolled in ${course}!`)
            setCurrentSelected("") // Clear selection after successful enrollment
        }).catch((err) => {
            console.error('Failed to create enrollment - Full error:', err)
            console.error('Error response data:', err.response?.data)
            console.error('Error status:', err.response?.status)
            console.error('Error headers:', err.response?.headers)
            console.error('Error message:', err.message)
            
            // Try to extract meaningful error message
            let errorMsg = 'Unknown error occurred'
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data
                } else if (err.response.data.message) {
                    errorMsg = err.response.data.message
                } else if (err.response.data.error) {
                    errorMsg = err.response.data.error
                } else {
                    errorMsg = JSON.stringify(err.response.data)
                }
            }
            
            console.error('Parsed error message:', errorMsg)
            alert(`Failed to enroll: ${errorMsg}`)
        })
    }



    const [currentSelected, setCurrentSelected] = useState("")
    const [allCourses, setAllCourses] = useState<string[]>([])
    useEffect(() => {
        getDropdownCourse().then((response) => {
            const responseData = response.data as Array<{ courseCode: string }>;
            const currentCodes = responseData.map((d) => d.courseCode)
            setAllCourses(currentCodes)
        }).catch((e) => console.warn('Failed to load courses', e))
    }, [])

    console.log(allCourses)

    return (
        <div className="min-h-screen bg-[#020617] mt-14 rounded-2xl px-auto items-center ml-auto mr-auto">
            <div className="mx-auto px-auto items-center ml-auto mr-auto">
                <Card className="border-0 rounded-2xl w-[98%] h-[300px]">
                    <CardHeader>
                        <CardTitle className="text-2xl">Enrol for Class</CardTitle>
                        <CardDescription>Enrol yourself to a module</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* studentId (read-only) */}
                                <div className="space-y-2">
                                    <Label>
                                        Student ID
                                    </Label>
                                    {formData.studentId ? (
                                        <div className="px-3 py-2 bg-slate-900 text-slate-200 rounded-md">{formData.studentId}</div>
                                    ) : (
                                        <div className="px-3 py-2 bg-yellow-900/20 text-yellow-300 rounded-md">Student ID not set. Please add your Student ID in your profile settings.</div>
                                    )}
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
                                            {allCourses.map((course: string) => (
                                                <SelectItem key={course} value={course}>
                                                    {course}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>





                            {/* buttons stay as-is */}
                            <div className="flex gap-4 pt-4 justify-end">
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
