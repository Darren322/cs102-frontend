import { api } from "../axios"

const url = 'http://localhost:8081/api/courses'

export function getDropdownCourse(){
    const response = api.get(url)
    return response
}