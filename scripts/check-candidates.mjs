import { readFileSync, writeFileSync } from 'node:fs';
const raw=readFileSync('data/web-catalog-candidates.tsv','utf8').trim().split(/\r?\n/); const rows=raw.slice(1).map(x=>x.split('\t'));
const timeout=4500, queue=rows.slice(), good=[], bad=[];
async function request(url, method, signal){ return fetch(url,{method,redirect:'follow',signal,headers:{'user-agent':'YuhangCatalog/1.0','accept':'text/html,*/*'}}); }
async function probe(row){const url=row[6]; try{const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);let r=await request(url,'HEAD',c.signal); if(r.status===405||r.status===403) { r=await request(url,'GET',c.signal); } clearTimeout(t); if(r.status>=400||r.status===0) throw Error(String(r.status)); good.push({row,status:r.status,final:r.url});}catch(e){bad.push({row,status:0,error:e.name==='AbortError'?'timeout':e.message});}}
const workers=Array.from({length:20},async()=>{while(queue.length) await probe(queue.shift())}); await Promise.all(workers);
writeFileSync('data/web-catalog-health.json',JSON.stringify({checked:rows.length,good:good.map(x=>({row:x.row,status:x.status,final:x.final})),bad},null,2));
writeFileSync('data/web-catalog-verified.tsv',[raw[0],...good.map(x=>x.row.join('\t'))].join('\n')+'\n'); console.log(`checked=${rows.length} good=${good.length} bad=${bad.length}`);
