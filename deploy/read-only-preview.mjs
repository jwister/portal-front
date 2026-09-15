import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
const root=path.resolve('dist');
const demo={id:1,username:'preview-demo',displayName:'Preview workspace',email:'demo@example.com',language:'zh-CN'};
const summary={availableQuota:128400000,usedQuota:7600000,requestCount:2841,tokenUsage:8640000,quotaPerUsd:500000};
const days=Array.from({length:30},(_,i)=>({date:`2026-09-${String(i+1).padStart(2,'0')}`,quota:120000+(i%7)*47000,requestCount:60+(i%9)*12,tokenUsage:140000+(i%8)*49000}));
const tokens=Array.from({length:3},(_,i)=>({id:i+1,name:['Production API','Mobile app','A very long development environment token name'][i],enabled:i!==2,remainingQuota:25000000,usedQuota:4200000,unlimited:i===1,expiredTime:-1,maskedKey:'sk-demo…masked'}));
const logs=Array.from({length:6},(_,i)=>({id:i+1,createdAt:1789434000-i*120,type:2,content:'Completed request · synthetic preview data',tokenName:'Production API',modelName:i%2?'claude-sonnet-4-5':'gpt-5',quota:1240,promptTokens:12400,completionTokens:1860,useTime:3.2,stream:true,requestId:'demo-request-'+i,cacheTokens:8200,cacheCreationTokens:0,firstResponseTime:460}));
const orders=Array.from({length:4},(_,i)=>({orderNo:`DEMO-20260915-000000000000${i}`,amountUsdMinor:5000,quotaToCredit:25000000,method:i%2?'USDT_TRC20':'PAYPAL',status:i===0?'WAITING_PAYMENT':'PAID',expiresAt:'2026-09-16T12:00:00Z',confirmedAt:null,creditedAt:null,createdAt:'2026-09-15T12:00:00Z'}));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
const cache=new Map();
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://preview.local');
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 const json=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))};
 if(!['GET','HEAD'].includes(req.method))return json({message:'Read-only preview: changes and payments are disabled.'},405);
 try{
 if(url.pathname.startsWith('/api/')) {
  if(url.pathname==='/api/auth/status')return json({authenticated:true,profile:demo});
  if(url.pathname==='/api/auth/oauth/providers')return json({githubEnabled:true,githubClientId:'',oidcEnabled:true,oidcClientId:'',oidcAuthorizationEndpoint:'',oidcDisplayName:'Google'});
  if(url.pathname==='/api/console/dashboard')return json(summary);
  if(url.pathname==='/api/console/dashboard/analytics'){const d=days.slice(url.searchParams.get('range')==='7d'?-7:0);return json({dailyUsage:d,tokenUsage:d,topModels:[{modelName:'gpt-5',quota:2700000},{modelName:'claude-sonnet-4-5',quota:1900000},{modelName:'__other__',quota:900000}]})}
  if(url.pathname==='/api/console/profile')return json(demo);
  if(url.pathname==='/api/console/tokens')return json({items:tokens,page:1,pageSize:50,total:3});
  if(url.pathname==='/api/console/logs/stats')return json({quota:124000,rpm:42,tpm:18000});
  if(url.pathname==='/api/console/logs')return json({items:logs.filter(x=>!url.searchParams.get('modelName')||x.modelName.includes(url.searchParams.get('modelName'))),page:1,pageSize:50,total:6});
  if(url.pathname==='/api/payments/orders')return json({items:orders,page:1,pageSize:20,total:4});
  // Only public catalog reads. No cookies, credentials, arbitrary targets or account APIs.
  if(['/api/catalog/pricing','/api/catalog/status','/api/catalog/perf-metrics','/api/catalog/perf-metrics/summary'].includes(url.pathname)){
   const key=url.pathname+url.search;let item=cache.get(key);
   if(!item){const response=await fetch('https://pay.ztoken.cc'+key,{signal:AbortSignal.timeout(20000)});item={body:Buffer.from(await response.arrayBuffer()),status:response.status};if(response.ok)cache.set(key,item)}
   res.writeHead(item.status,{'Content-Type':'application/json','Cache-Control':'public,max-age=60'});return res.end(item.body);
  }
  return json({message:'This endpoint is unavailable in the read-only preview.'},403);
 }
 const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');let file=path.resolve(root,relative);
 if(file!==root&&!file.startsWith(root+path.sep))return json({message:'Not found'},404);
 try{if(!(await stat(file)).isFile())file=path.join(root,'index.html')}catch{if(path.extname(file))return json({message:'Not found'},404);file=path.join(root,'index.html')}
 let data=await readFile(file);const ext=path.extname(file);
 if(ext==='.html') data=Buffer.from(data.toString().replace('<body>',`<body><div style="position:fixed;bottom:0;left:0;right:0;z-index:100;background:#183128;color:white;text-align:center;font:11px/1.5 system-ui;padding:3px">只读演示 · 数据为示例 · Read-only preview</div>`));
 res.setHeader('Content-Type',types[ext]||'application/octet-stream');res.setHeader('Cache-Control',ext==='.html'?'no-cache':'public,max-age=31536000,immutable');
 if(/gzip/.test(req.headers['accept-encoding']||'')&&['.js','.css','.html','.svg'].includes(ext)){data=gzipSync(data);res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding')}
 res.setHeader('Content-Length',data.length);res.end(req.method==='HEAD'?undefined:data);
 }catch{json({message:'Preview request unavailable.'},502)}
}).listen(4173,'127.0.0.1',()=>console.log('Read-only production preview: http://127.0.0.1:4173'));
