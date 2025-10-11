import { api } from "../axios";

//THIS IS FKING ROSTER
const API_BASE_URL = "http://localhost:8081/api/studentSessions";

export const addStudentToSession = async (courseCode: string, studentIds: string[]) => {
  const payload = {courseCode, studentIds};

  try {
    const response = await api.post(API_BASE_URL+`/addByCourse`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error adding student to session:", error);
    throw error;
  }
};

export function getAllRoster(){
  const response = api.get(API_BASE_URL + "/rosters")
  return response
}