import { api } from "../axios"

const url = 'http://localhost:8081/api/enrollments'
export function getStudentEnrollmentByMod(moduleCode: string){
    const response = api.get(url + `/course/${moduleCode}`);
    return response;
}