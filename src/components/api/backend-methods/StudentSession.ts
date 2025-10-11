import { api } from "../axios";

const API_BASE_URL = "http://localhost:8081/api/studentSessions";

export const addStudentToSession = async (studentId: string, sessionId: string) => {
  const payload = {
    id: {
      studentId: studentId,
      sessionId: sessionId,
    },
  };

  try {
    const response = await api.post(API_BASE_URL, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error adding student to session:", error);
    throw error;
  }
};