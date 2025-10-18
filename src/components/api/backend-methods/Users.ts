import { api } from "../axios";

const url = "http://localhost:8081/api/users";
export function getByUsername(){
    if(localStorage['username']!== undefined){
        return api.get(url + `/${localStorage['username']}`)
    }   
    return Promise.reject('Unable to process.');
}