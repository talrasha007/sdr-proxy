import{d as Z,t as ae,a as y,m as z,s as te,l as ne,f as C,w as U,g as oe}from"./index-571fe8eb.js";function Q(e,n,r){r+=(r+1)%2;for(var a=n/e,t=new Float32Array(r),l=Math.floor(r/2),o=0,v=0;v<r;++v){var u;v==l?u=2*Math.PI*a:(u=Math.sin(2*Math.PI*a*(v-l))/(v-l),u*=.54-.46*Math.cos(2*Math.PI*v/(r-1))),o+=u,t[v]=u}for(var v=0;v<r;++v)t[v]/=o;return t}function le(e,n){e+=(e+1)%2;for(var r=Math.floor(e/2),a=new Float32Array(e),t=0;t<a.length;++t)t%2==0&&(a[t]=2/(Math.PI*(r-t)));return a}function J(e){var n=e,r=n.length-1,a=Math.floor(n.length/2),t=new Float32Array(r);function l(u){var f=new Float32Array(u.length+r);f.set(t.subarray(t.length-r)),f.set(u,r),t=f}function o(u){for(var f=0,s=0;s<n.length;++s)f+=n[s]*t[u+s];return f}function v(u){return t[u+a]}return{get:o,loadSamples:l,getDelayed:v}}function I(e,n,r){var a=new J(r),t=e/n;function l(o){a.loadSamples(o);for(var v=new Float32Array(Math.floor(o.length/t)),u=0,f=0;u<v.length;++u,f+=t)v[u]=a.get(Math.floor(f));return v}return{downsample:l}}function ve(e,n,r,a,t){var l=Q(e,1e4,t),o=new I(e,n,l),v=new I(e,n,l),u=le(t),f=new J(u),s=new J(u),d=Q(n,r,t),c=new J(d),F=a?-1:1,P=new H(n*5),D=new H(n*.5),b=e/n,g=0;function i(A,w){var p=o.downsample(A),M=v.downsample(w),h=0,L=0;f.loadSamples(p),s.loadSamples(M);for(var T=new Float32Array(p.length),m=0;m<T.length;++m)T[m]=f.getDelayed(m)+s.get(m)*F;c.loadSamples(T);for(var B=new Float32Array(p.length),m=0;m<B.length;++m){var E=c.get(m),$=E*E;L+=$;var R=D.add($),ee=P.add($),re=.9*Math.max(1,Math.sqrt(2/Math.min(1/128,Math.max(ee,R))));B[m]=re*c.get(m);var V=Math.floor(m*b),W=A[V],_=w[V];h+=W*W+_*_}return g=L/h,B}function S(){return g}return{demodulateTuned:i,getRelSignalPower:S}}function ue(e,n,r,a){var t=Q(e,r,a),l=new I(e,n,t),o=new I(e,n,t),v=e/n,u=0;function f(d,c){for(var F=l.downsample(d),P=o.downsample(c),D=j(F),b=j(P),g=new Float32Array(F.length),i=0,S=0,A=0,w=0;w<g.length;++w){var p=F[w]-D,M=P[w]-b,h=p*p+M*M,L=Math.sqrt(h);g[w]=L;var T=Math.floor(w*v),m=d[T],B=c[T];i+=m*m+B*B,S+=h,A+=L}for(var E=A/g.length,w=0;w<g.length;++w)g[w]=(g[w]-E)/E;return u=S/i,g}function s(){return u}return{demodulateTuned:f,getRelSignalPower:s}}function x(e,n,r,a,t){var l=n/(2*Math.PI*r),o=Q(e,a,t),v=new I(e,n,o),u=new I(e,n,o),f=0,s=0,d=0;function c(P,D){for(var b=v.downsample(P),g=u.downsample(D),i=new Float32Array(b.length),S=0,A=0,w=0;w<i.length;++w){var p=f*b[w]+s*g[w],M=f*g[w]-b[w]*s,h=1,L=0,T=0,m=1;p<0&&(h=-h,p=-p,L=Math.PI),M<0&&(h=-h,M=-M,L=-L),p>M?m=M/p:p!=M&&(T=-Math.PI/2,m=p/M,h=-h),i[w]=L+h*(T+m/(.9841915835861736+m*(.0934857026296713+m*.19556307900617517)))*l,f=b[w],s=g[w];var B=S-i[w];A+=B*B,S=i[w]}return d=1-Math.sqrt(A/i.length),i}function F(){return d}return{demodulateTuned:c,getRelSignalPower:F}}function fe(e,n){for(var r=400,a=new Float32Array(8001),t=new Float32Array(8001),l=0,o=1,v=new H(9999),u=new H(9999),f=new H(49999,!0),s=0;s<8001;++s){var d=(n+s/100-40)*2*Math.PI/e;a[s]=Math.sin(d),t[s]=Math.cos(d)}function c(F){for(var P=new Float32Array(F),D=0;D<P.length;++D){var b=v.add(P[D]*l),g=u.add(P[D]*o);P[D]*=l*o*2;var i;b>0?i=Math.max(-4,Math.min(4,g/b)):i=g==0?0:g>0?4:-4;var S=Math.round((i+4)*1e3),A=l*t[S]+o*a[S];o=o*t[S]-l*a[S],l=A,f.add(i*10)}return{found:f.getStd()<r,diff:P}}return{separate:c}}function X(e,n){var r=1/(1+e*n/1e6),a=0;function t(l){for(var o=0;o<l.length;++o)a=a+r*(l[o]-a),l[o]=a}return{inPlace:t}}function H(e,n){var r=0,a=0;function t(o){return r=(e*r+o)/(e+1),n&&(a=(e*a+(o-r)*(o-r))/(e+1)),r}function l(){return a}return{add:t,getStd:l}}function j(e){for(var n=0,r=0;r<e.length;++r)n+=e[r];return n/e.length}function de(e,n){for(var r=new Uint8Array(e),a=r.length/2,t=new Float32Array(a),l=new Float32Array(a),o=0;o<a;++o)t[o]=r[2*o]/128-.995,l[o]=r[2*o+1]/128-.995;return[t,l]}function se(e,n,r,a,t){for(var l=Math.cos(2*Math.PI*n/r),o=Math.sin(2*Math.PI*n/r),v=e[0],u=e[1],f=new Float32Array(v.length),s=new Float32Array(u.length),d=0;d<v.length;++d){f[d]=v[d]*a-u[d]*t,s[d]=v[d]*t+u[d]*a;var c=a*o+t*l;a=a*l-t*o,t=c}return[f,s,a,t]}function we(e,n,r){var a=48e3,t=r/2,l=new ue(e,a,t,351),o=Q(a,1e4,41),v=new I(a,n,o);function u(f,s){var d=l.demodulateTuned(f,s),c=v.downsample(d);return{left:c.buffer,right:new Float32Array(c).buffer,stereo:!1,signalLevel:Math.pow(l.getRelSignalPower(),.17)}}return{demodulate:u}}function G(e,n,r,a){var t=48e3,l=new ve(e,t,r,a,151),o=Q(t,1e4,41),v=new I(t,n,o);function u(f,s){var d=l.demodulateTuned(f,s),c=v.downsample(d);return{left:c.buffer,right:new Float32Array(c).buffer,stereo:!1,signalLevel:Math.pow(l.getRelSignalPower(),.17)}}return{demodulate:u}}function ce(e,n,r){var a=1+Math.floor((r-1)*7/75e3),t=48e3*a,l=r*.8,o=new x(e,t,r,l,Math.floor(50*7/a)),v=Q(t,8e3,41),u=new I(t,n,v);function f(s,d){var c=o.demodulateTuned(s,d),F=u.downsample(c);return{left:F.buffer,right:new Float32Array(F).buffer,stereo:!1,signalLevel:o.getRelSignalPower()}}return{demodulate:f}}function K(e,n){var r=336e3,a=75e3,t=a*.8,l=19e3,o=50,v=new x(e,r,a,t,51),u=Q(r,1e4,41),f=new I(r,n,u),s=new I(r,n,u),d=new fe(r,l),c=new X(n,o),F=new X(n,o);function P(D,b,g){var i=v.demodulateTuned(D,b),S=f.downsample(i),A=new Float32Array(S),w=!1;if(g){var p=d.separate(i);if(p.found){w=!0;for(var M=s.downsample(p.diff),h=0;h<M.length;++h)A[h]-=M[h],S[h]+=M[h]}}return c.inPlace(S),F.inPlace(A),{left:S.buffer,right:A.buffer,stereo:w,signalLevel:v.getRelSignalPower()}}return{demodulate:P}}function me(e=1024*1e3,n=48e3){var r=new K(e,n),a=1,t=0;function l(v,u,f,s){var d=de(v);d=se(d,f,e,a,t),a=d[2],t=d[3];var c=r.demodulate(d[0],d[1],u);return[c.left,c.right,c.signalLevel,c.stereo]}function o(v){switch(v){case"AM":r=new we(e,n,6e3);break;case"USB":r=new G(e,n,2700,!0);break;case"LSB":r=new G(e,n,2700,!1);break;case"NFM":r=new ce(e,n,1e4);break;default:r=new K(e,n);break}}return{process:l,setMode:o}}let q=null,Y=null,O=null,N=null;const k=`ws://${location.host}/data`;async function he(){O=O||new me(256*1e3),Y=oe(),N=null,q=new WebSocket(k),q.binaryType="arraybuffer",Z.value=k;let e=0,n=0;q.addEventListener("open",()=>{e=Date.now(),q.send(JSON.stringify({type:"init"}))}),q.addEventListener("error",()=>N=`Connect to ${k} failed.`),q.addEventListener("close",()=>N=`Stream ${k} closed.`),q.addEventListener("message",({data:r})=>{if(r instanceof ArrayBuffer){if(ae.value+=r.byteLength,e===0||Date.now()-e<1e3)return;const a=r.byteLength-8-4,t=r.slice(0,a);let[l,o,v]=O.process(t,!0,-y.value);l=new Float32Array(l),o=new Float32Array(o),Y.play(l,o,v,z.value==="FM"?.15:v/10),te(v);const u=new DataView(r),f=u.getFloat64(a),s=u.getUint32(a+8);ne.value=Date.now()-f+n,C.value===s&&(v>.5&&y.value!==0?(C.value=C.value+y.value,y.value=0):y.value>0?y.value<3e5?y.value+=1e5:(C.value=C.value+y.value,y.value=1e5):y.value<0&&(y.value>-3e5?y.value-=1e5:(C.value=C.value+y.value,y.value=-1e5)))}else{const a=JSON.parse(r);n=Math.round(a.ts-(e+Date.now())/2+(Date.now()-e)/2),z.value=a.mode,C.value=a.frequency,y.value=a.tuningFreq}})}async function ie(){const e=q;q=null,Z.value="",await new Promise(n=>setTimeout(n,100)),e&&e.close()}async function Se(){for(;q;)if(await new Promise(e=>setTimeout(e,100)),N)throw N}U(C,()=>{q.send(JSON.stringify({type:"frequency",frequency:C.value,tuningFreq:y.value}))});U(z,e=>{O.setMode(e),q.send(JSON.stringify({type:"mode",mode:e}))});export{he as connect,ie as disconnect,Se as receive};
