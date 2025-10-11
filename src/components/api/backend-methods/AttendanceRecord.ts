import {api} from '../axios';

const url = `http://localhost:8081/api/attendance`
export function getAttendanceRecord(sessionID:any){
    const res = api.get(url+`/${sessionID}`)
    return res;
}

export function getAttendanceRecordForSession(sessionId:any){
    const res = api.get(url+`/${sessionId}`)
    return res;
}   

export function getTotalPresent(sessionId:any){
    const res = api.get(url+`/countByType/${sessionId}/PRESENT`)
    return res;
}
export function getTotalLate(sessionId:any){
    const res = api.get(url+`/countByType/${sessionId}/LATE`)
    return res;

}
export function getTotalPending(sessionId:any){
    const res = api.get(url+`/countByType/${sessionId}/PENDING`)
    return res;
}
export function getTotalMedical(sessionId:any){
    const res = api.get(url+`/countByType/${sessionId}/MEDICAL`)
    return res;
}
export function getTotalAbsent(sessionId:any){
    const res = api.get(url+`/countByType/${sessionId}/ABSENT`)
    return res;
}

export function getPresentPeople(sessionId:any){
    const res = api.get(url+`/status/${sessionId}/PRESENT`)
    return res
}

export function getLatePeople(sessionId:any){
    const res = api.get(url+`/status/${sessionId}/LATE`)
    return res
}

export function getAbsentPeople(sessionId:any){
    const res = api.get(url+`/status/${sessionId}/ABSENT`)
    return res
}

export function getPendingPeople(sessionId:any){
    const res = api.get(url+`/status/${sessionId}/PENDING`)
    return res
}

export function getMedicalPeople(sessionId:any){
    const res = api.get(url+`/status/${sessionId}/MEDICAL`)
    return res
}

export function batchUpdate(sessionId:any){
    const res = api.get(url + `/batch/mark-all/${sessionId}`)
    return res
}
export function manualMarkStudent(sessionId:any, studentId:any){
    const res = api.get(url +`/manual/${sessionId}/${studentId}`)
    return res;
}

export function updateSingle(sessionId: any, studentId:any){
    const res = api.put(url + `/manual/${sessionId}/${studentId}`)
    return res;
}

