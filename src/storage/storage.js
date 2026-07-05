import { STORAGE_KEYS } from "../config/constants.js";
export const saveState=s=>localStorage.setItem(STORAGE_KEYS.STATE,JSON.stringify(s));
export const loadState=()=>{const raw=localStorage.getItem(STORAGE_KEYS.STATE);return raw?JSON.parse(raw):null;};
export const clearState=()=>localStorage.removeItem(STORAGE_KEYS.STATE);
export function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}
