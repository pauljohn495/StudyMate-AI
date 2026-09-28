const databaseName='studymate-offline-v1';
const storeName='api-responses';
const maxAgeMs=30*24*60*60*1000;

interface OfflineEntry {key:string;userId:string;url:string;data:unknown;storedAt:number}

const openDatabase=()=>new Promise<IDBDatabase>((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('IndexedDB is unavailable.'));return;}const request=indexedDB.open(databaseName,1);request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains(storeName)){const store=database.createObjectStore(storeName,{keyPath:'key'});store.createIndex('userId','userId');store.createIndex('storedAt','storedAt');}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const transactionRequest=<T,>(request:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});

export const currentOfflineUserId=()=>{try{return (JSON.parse(localStorage.getItem('studymate_user')??'null') as {id?:string}|null)?.id??null;}catch{return null;}};
export const isCacheableApiGet=(url='')=>{const path=url.replace(/^https?:\/\/[^/]+/,'').replace(/^\/api/,'');if(path.includes('/download')||path.startsWith('/auth')||path.startsWith('/ai'))return false;return ['/subjects','/lessons','/documents','/reviewers','/summaries','/flashcard-decks','/quizzes','/quiz-attempts','/progress','/dashboard','/tutor','/exams','/study-plans'].some(prefix=>path===prefix||path.startsWith(`${prefix}/`)||path.startsWith(`${prefix}?`));};
const keyFor=(userId:string,url:string)=>`${userId}:${url}`;

export const saveOfflineResponse=async(userId:string,url:string,data:unknown)=>{try{const database=await openDatabase();const transaction=database.transaction(storeName,'readwrite');transaction.objectStore(storeName).put({key:keyFor(userId,url),userId,url,data,storedAt:Date.now()} satisfies OfflineEntry);const cutoff=IDBKeyRange.upperBound(Date.now()-maxAgeMs);const request=transaction.objectStore(storeName).index('storedAt').openCursor(cutoff);request.onsuccess=()=>{const cursor=request.result;if(cursor){cursor.delete();cursor.continue();}};await new Promise<void>((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);});database.close();}catch{/* Offline caching is an enhancement; storage failures must not break requests. */}};

export const readOfflineResponse=async(userId:string,url:string)=>{try{const database=await openDatabase();const entry=await transactionRequest(database.transaction(storeName,'readonly').objectStore(storeName).get(keyFor(userId,url))) as OfflineEntry|undefined;database.close();if(!entry||Date.now()-entry.storedAt>maxAgeMs)return undefined;return entry.data;}catch{return undefined;}};

export const clearOfflineResponses=async(userId:string)=>{try{const database=await openDatabase();const transaction=database.transaction(storeName,'readwrite');const request=transaction.objectStore(storeName).index('userId').openCursor(IDBKeyRange.only(userId));request.onsuccess=()=>{const cursor=request.result;if(cursor){cursor.delete();cursor.continue();}};await new Promise<void>((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);});database.close();}catch{/* Best-effort cleanup on logout. */}};
