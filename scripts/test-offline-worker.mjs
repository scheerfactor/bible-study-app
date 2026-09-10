import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await readFile('scripts/pwa/worker.js', 'utf8');
const ASSETS = ['/', '/_next/static/app.js', '/api/bible?part=4'];
function harness(fail = '') {
  const handlers = {}, stores = new Map(), fetched = [];
  const caches = { async open(name) { if (!stores.has(name)) stores.set(name,new Map()); const entries=stores.get(name);return { put: async(k,v)=>entries.set(k,v), match:async k=>entries.get(k) }; }, keys:async()=>[...stores.keys()], delete:async k=>stores.delete(k) };
  vm.runInNewContext(source,{CACHE_NAME:'fb-bible-offline-new',ASSETS,caches,URL,Request:class {constructor(url,options){this.url=url;Object.assign(this,options)}},self:{location:{origin:'https://study.test'},clients:{claim:async()=>{}},addEventListener:(k,fn)=>handlers[k]=fn},fetch:async req=>{const key=typeof req==='string'?req:req.url;fetched.push(key);if(key===fail)throw Error('offline');return {ok:true,redirected:false,clone(){return this},json:async()=>({verses:{'2 Corinthians 2:8':'KJV'}})}}});
  return {handlers,stores,caches,fetched};
}
async function run(h,type,data={}){let pending;h.handlers[type]({...data,waitUntil:p=>pending=p});await pending;}
const h=harness();await run(h,'install');assert.equal(h.stores.get('fb-bible-offline-new').size,3);
await h.caches.open('fb-bible-offline-old');await h.caches.open('unrelated-cache');await run(h,'activate');assert.ok(!h.stores.has('fb-bible-offline-old'));assert.ok(h.stores.has('unrelated-cache'));
let reply;await run(h,'message',{data:{type:'OFFLINE_STATUS'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,true);
h.stores.get('fb-bible-offline-new').delete('/api/bible?part=4');await run(h,'message',{data:{type:'OFFLINE_STATUS'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,false);
await run(h,'message',{data:{type:'OFFLINE_REPAIR'},ports:[{postMessage:r=>reply=r}]});assert.equal(reply.ready,true);
for(const [path,mode,method,authorized,expected] of [['/','navigate','GET',false,true],['/api/bible?part=4','cors','GET',false,true],['/api/library','cors','GET',false,false],['/?code=secret','navigate','GET',false,false],['/?_rsc=123','cors','GET',false,false],['/','cors','GET',false,false],['/_next/static/app.js','cors','GET',true,false],['/api/bible?part=4','cors','POST',false,false],['https://backend.test/auth/v1/user','cors','GET',false,false]]) {
 let intercepted=false;h.handlers.fetch({request:{url:new URL(path,'https://study.test').href,mode,method,headers:{has:()=>authorized}},respondWith:()=>intercepted=true});assert.equal(intercepted,expected,path);
}
const failed=harness('/api/bible?part=4');await assert.rejects(run(failed,'install'));assert.ok(!failed.stores.has('fb-bible-offline-new'));
console.log('PASS offline cache: install failure cleanup, readiness, eviction repair, version cleanup, auth/library/query exclusions.');
