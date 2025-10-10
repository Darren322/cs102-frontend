import {api} from '../axios';

const url = `http://localhost:8081/api/attendance`
export function getAttendanceRecord(sessionID:any){
    const res = api.get(url+`/${sessionID}`)
    return res;
}

export function updateSingleAttendanceRecordManually(){
    
}