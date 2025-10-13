import { api } from "../axios";

const url = 'http://localhost:8081/api/export';

export function pdfExport(){
    const response = api.post(url);
    return response;
}
export function csvExport(){
    const response = api.post(url);
    return response;
}