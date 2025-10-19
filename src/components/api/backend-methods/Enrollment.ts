import { api } from "../axios"

const url = "http://localhost:8081/api/enrollments"

export type EnrollmentPayload = {
    studentId: string,
    courseCode: string
}

export function createEnrollment(enrollment: EnrollmentPayload, token?: string) {
    if (token) {
        return api.post(url, enrollment, { headers: { Authorization: `Bearer ${token}` } })
    }
    return api.post(url, enrollment)
}
