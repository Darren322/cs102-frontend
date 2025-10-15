import { api } from '../axios';
//import type { Session } from "../../utils/types";
const url = `http://localhost:8081/api/sessions`
export function getSessionByCreator() {
    console.log(localStorage)
    if (localStorage['username'] !== undefined) {
        const currentMail = localStorage['username']
        const response = api.get(url + `/creator/${currentMail}`)
        return response;
    }
    return Promise.reject("Unable to hit endpoint.")
}
export function activateCourse(sessionID : string){
    if(localStorage['username'] !== undefined){
        const response = api.post(url + `/${sessionID}` + "/activate")
        return response;
    }
    return Promise.reject("Unable to hit endpoint")
}

export function closeCourse(sessionID : string){
    if(localStorage['username']!== undefined){
        const response = api.post(url + `/${sessionID}/close`)
        return response;
    }
    return Promise.reject("Unable to hit endpoint")
}

export function getCurrentSession(sessionId: any){
    const response = api.get(url + `/${sessionId}`)
    return response;
}

export function getActiveByCreator(){
    if(localStorage['username'] !== undefined){
        const currentMail = localStorage['username']
        const response = api.get(url + `/creator/${currentMail}/active`);
        return response;
    }
    return Promise.reject("Unable to hit endpoint.")
}

export function createSessions(sessionData : any){
    if(localStorage['username']!== undefined){
        const response = api.post(url, sessionData, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": localStorage['username'], // <-- your creator header
        },
      });
      return response;
    }
    return Promise.reject("Unable to hit endpoint")
}

export function deleteSession(sessionId:any){
    const response = api.delete(url+`/${sessionId}`);
    return response;
}