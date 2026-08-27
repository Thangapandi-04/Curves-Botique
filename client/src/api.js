const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export async function api(path,options={}){const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(options.headers||{})};const res=await fetch(`${API}${path}`,{credentials:'include',...options,headers});const text=await res.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}if(!res.ok)throw new Error(data.message||'Request failed');return data;}
export const img=(url)=>url?.startsWith('http')?url:`${API.replace('/api','')}${url||''}`;

export { API };
