import { api } from "../axios"

const url = 'http://localhost:8081/api/enrollments'
export function getStudentEnrollmentByMod(moduleCode: string){
    const response = api.get(url + `/course/${moduleCode}`);
    return response;
}

export function getStudentEnrollments(studentId: string) {
    return api.get(`${url}/student/${studentId}`)
}

export type StudentEnrollmentPayload = {
    studentId: string,
    courseCode: string
}

export function createEnrollment(enrollment: StudentEnrollmentPayload, token?: string) {
    if (token) return api.post(url, enrollment, { headers: { Authorization: `Bearer ${token}` } })
    return api.post(url, enrollment)
}