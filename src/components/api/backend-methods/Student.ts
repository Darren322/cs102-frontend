import { api } from "../axios"


const url = "http://localhost:8081/api/student"

type Student = {
    student_id : string,
    username:string,
    name: string,
    email:string,
    phone:string,
    created_at: Date,
    updated_at: Date,
    classGroup: string
}
export function getAllStudent(){
    const response = api.get(url)
    return response
}
export function addNewStudent(student: Student){
    const response = api.post(url,student)
    return response
}

//Need to add face data here
export function addStudentFace(studentId:string){
    const response = api.post(url+ `/api/student/${studentId}/faces`)
    // export function addStudent() {
    // //sample
    // let studentObject = {
    //     "studentId": "S12345678", // user input
    //     "username": "nick", //opt field ?
    //     "name": "Nicholas Tan", //user input
    //     "email": "nick@email.com", //get from localStorage
    //     "phone": "91234567", // user input
    //     "faceData": "base64EncodedFaceDataString" //set as empty first.
    // }}

    return response
}

export function updateStudent(studentId:string){
    const response = api.put(url+`${studentId}`)
    return response
}

export function deleteStudent(studentId:string){
    const response = api.delete(url + `${studentId}`)
    return response
}