const VERSION='studymate-shell-v2';
const SHELL=['/','/offline.html','/manifest.webmanifest','/icons/icon-192.svg','/icons/icon-512.svg','/icons/icon-maskable-512.svg'];
const precache=async()=>{const cache=await caches.open(VERSION);await cache.addAll(SHELL);const response=await fetch('/');const html=await response.text();const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1]).filter(path=>path.startsWith('/')&&(/\.(?:js|css|woff2?)$/.test(path)));await cache.addAll([...new Set(assets)]);};
self.addEventListener('install',event=>{event.waitUntil(precache());});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('studymate-shell-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put('/',response.clone()));return response;}).catch(async()=>await caches.match(request)||await caches.match('/')||await caches.match('/offline.html')));return;}
  if(['script','style','font','image'].includes(request.destination)||url.pathname==='/manifest.webmanifest'){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(VERSION).then(cache=>cache.put(request,response.clone()));return response;})));}
});
