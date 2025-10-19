import { api } from "../axios"


const url = "http://localhost:8081/api/student"

// Payload type for creating/enrolling a student (API expects studentId)
export type StudentPayload = {
    studentId: string,
    name?: string,
    email?: string,
    phone?: string,
    faceData?: string | null,
    username?: string
}

export type Student = {
    student_id: string,
    username: string,
    name: string,
    email: string,
    phone: string,
    created_at: Date,
    updated_at: Date,
    classGroup: string
}

export function getAllStudent() {
    const response = api.get(url)
    return response
}

// Create a new Student record. Optionally pass an auth token to include in the
// Authorization header. Returns the axios response promise.
// Enroll/create a student for the currently authenticated user.
// The backend endpoint expects POST /api/student/me and uses the JWT principal to
// associate the Student with the existing User, so include the token when available.
export function addNewStudent(student: StudentPayload, token?: string) {
    const endpoint = `${url}/me`
    // ensure we don't send the username/PK to the server — server should derive it from the JWT
    const body = { ...student } as StudentPayload & Record<string, unknown>
    if (body.username) delete body.username

    if (token) {
        return api.post(endpoint, body, { headers: { Authorization: `Bearer ${token}` } })
    }
    return api.post(endpoint, body)
}

// Need to add face data here
export function addStudentFace(studentId: string) {
    const response = api.post(url + `/api/student/${studentId}/faces`)


    return response
}

export function updateStudent(studentId: string) {
    const response = api.put(url + `${studentId}`)
    return response
}

export function deleteStudent(studentId: string) {
    const response = api.delete(url + `${studentId}`)
    return response
}

export async function getcurrentStudent() {
  const allStudentsResp = await api.get(url);
  const allStudents = allStudentsResp.data;
  const cur = allStudents.filter((s:any) => { return s.username == localStorage['username']});
  console.log(`${url}/${cur[0]['studentId']}`)
  return api.get(`${url}/${cur[0]['studentId']}`); 
}

// Get the current authenticated user's student record. Requires Authorization header.
export function getMyStudent(token?: string) {
    const endpoint = `${url}/me`;
    if (token) return api.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    return api.get(endpoint);
}