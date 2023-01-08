import{d as w,t as p,s as q,m as c,l as h,f as l,a as e,w as f,g as F}from"./index-b83011d9.js";let n=null,y=null,u=null;const r=`ws://${location.host}/data`;async function L(){y=F(),u=null,n=new WebSocket(r),n.binaryType="arraybuffer",w.value=r;let t=0,o=0;n.addEventListener("open",()=>{t=Date.now(),n.send(JSON.stringify({type:"init"}))}),n.addEventListener("error",()=>u=`Connect to ${r} failed.`),n.addEventListener("close",()=>u=`Stream ${r} closed.`),n.addEventListener("message",({data:s})=>{if(s instanceof ArrayBuffer){p.value+=s.byteLength;const a=(s.byteLength-16-4)/2,v=new DataView(s),i=Math.max(0,v.getFloat64(a*2));q(i);const d=new Float32Array(s,0,a/4),g=new Float32Array(s,a,a/4);t>0&&Date.now()-t>1e3&&y.play(d,g,i,c.value==="FM"?.15:i/10),h.value=Date.now()-v.getFloat64(a*2+8)+o;const m=v.getUint32(a*2+16);l.value+e.value===m&&(i>.5&&e.value!==0?(l.value=l.value+e.value,e.value=0):e.value>0?e.value<3e5?e.value+=1e5:(l.value=l.value+e.value,e.value=1e5):e.value<0&&(e.value>-3e5?e.value-=1e5:(l.value=l.value+e.value,e.value=-1e5)))}else{const a=JSON.parse(s);o=Math.round(a.ts-(t+Date.now())/2+(Date.now()-t)/2),c.value=a.mode,l.value=a.frequency,e.value=a.tuningFreq}})}async function D(){const t=n;n=null,w.value="",await new Promise(o=>setTimeout(o,100)),t&&t.close()}async function O(){for(;n;)if(await new Promise(t=>setTimeout(t,100)),u)throw u}f(l,()=>{n.send(JSON.stringify({type:"frequency",frequency:l.value,tuningFreq:e.value}))});f(e,()=>{n.send(JSON.stringify({type:"frequency",frequency:l.value,tuningFreq:e.value}))});f(c,t=>{n.send(JSON.stringify({type:"mode",mode:t}))});export{L as connect,D as disconnect,O as receive};
