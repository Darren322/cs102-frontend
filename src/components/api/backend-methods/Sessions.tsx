import { api } from '../axios';

const url = `http://localhost:8081/api/sessions`
export function getSessionByCreator() {
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
