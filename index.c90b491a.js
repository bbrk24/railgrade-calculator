class e{constructor(e,t,o,n){this.climbRating=o,this.speed=n,this.cost=1<<e+8,this.upkeep=1<<t+2}}const t={workhorse:new e(1,1,.5,(e=>e<=2?50:e<=4?54-2*e:Math.max(5,70-6*e))),boiler:new e(0,0,.4,(e=>e<6?33-e**4/230:Math.max(3,47.7-3.5*e))),industrial:new e(2,2,.95,(e=>{return t=48-3.5*e,o=3,n=30,Math.max(o,Math.min(t,n));var t,o,n})),spark:new e(3,3,.5,(e=>e<=4.5?75:e<=6?85-2*e:e>=8?112.75-5.5*e:71)),custom:new e(1,1,.75,(e=>e>=2?Math.max(7,97.84-14.6*e):Math.min(75,78.83-5*e))),rescue:new e(3,2,1,(e=>e<=8?27:e<=12?30.75-e/2:41.6-1.4*e))},o=new class{constructor(e){this.backingDict=new Map;for(const t of e)this.set(...t)}get(e){let t=this.backingDict;const o=[...e].sort();for(const e of o){const o=t.get(e);if(void 0===o)return;t=o}return t.get(void 0)}set(e,t){let o=this.backingDict;const n=[...e].sort();for(const e of n){let t=o.get(e);void 0===t&&(t=new Map,o.set(e,t)),o=t}o.set(void 0,t)}}([[[],()=>0],[["workhorse"],e=>e<4?3.5-e/7:Math.max(1/3,4.9-e/2)],[["boiler"],e=>Math.max(1/3,2.59-.024*e**2)],[["industrial"],e=>e<7?4-e/9:Math.max(1/3,5.25-2/7*e)],[["spark"],e=>e>=17?1/3:e>8?8.9-.5*e:e<7?6.2-.17*e:5],[["custom"],e=>e>2?Math.max(1/3,5.76-e):0===e?14/3:e<=1?13/3:4],[["rescue"],e=>e<10?5.04-.106*e:e<=12?4:8-e/3]]),n=(e,t)=>e.reduce(((o,n)=>o+t(n)/e.length),0),r=(e,t)=>e.reduce(((e,o)=>e+t(o)),0),c=(e,c)=>{var l;const[a,s]=(e=>{const t=Object.values(e).reduce(((e,t)=>{for(;t;)[e,t]=[t,e%t];return e})),o=[];for(let[n,r]of Object.entries(e))if(r){if(r/=t,r>13e5)throw new Error("Provided number(s) too large.");for(let e=0;e<r;++e)o.push(n)}return[o,t]})(e),d=c/(a.length*s),i=a.map((e=>t[e])),u=n(i,(e=>e.speed(d))),m=null===(l=o.get(a))||void 0===l?void 0:l(d);let p=0;return m&&(p=u/m),{topSpeed:Math.round(u),hillSpeed:Math.round(u*n(i,(e=>e.climbRating))),cost:16*c+s*r(i,(e=>e.cost)),upkeep:c+s*r(i,(e=>e.upkeep)),accel:m,accelTime:p}},l=e=>{const t=Math.floor(e);return e-t<=1/6?`${t}`:e-t<=.5?(t||"")+"&frac13;":e-t<=5/6?(t||"")+"&frac23;":`${t+1}`},a=e=>{const t=Math.floor(e);return e-t<=.25?`${t}`:e-t<=.75?(t||"")+"&frac12;":`${t+1}`},s=e=>{if(e instanceof Error)return e.toString();if("object"!=typeof e&&"function"!=typeof e||null===e)return`Error: ${e}`;return"cause"in e&&e.cause instanceof Error?e.cause.toString():`Error: ${e}`},d={workhorse:document.getElementById("workhorse"),boiler:document.getElementById("boiler"),industrial:document.getElementById("industrial"),spark:document.getElementById("spark"),custom:document.getElementById("custom"),rescue:document.getElementById("rescue"),cars:document.getElementById("cars"),topSpeed:document.getElementById("top-speed"),hillSpeed:document.getElementById("hill-speed"),cost:document.getElementById("cost"),upkeep:document.getElementById("upkeep"),accelInfo:document.getElementById("accel-info"),noAccelInfo:document.getElementById("no-accel-info"),accel:document.getElementById("accel"),accelTime:document.getElementById("accel-time"),error:document.getElementById("error"),form:document.getElementById("car-counts")},i=()=>{d.error.hidden=!0;try{const e={workhorse:+d.workhorse.value,boiler:+d.boiler.value,industrial:+d.industrial.value,spark:+d.spark.value,custom:+d.custom.value,rescue:+d.rescue.value},t=c(e,+d.cars.value);d.topSpeed.textContent=`${t.topSpeed}`,d.hillSpeed.textContent=`${t.hillSpeed}`,d.cost.textContent=`${t.cost}`,d.upkeep.textContent=`${t.upkeep}`,void 0===t.accel?(d.accelInfo.hidden=!0,d.noAccelInfo.hidden=!1):(d.accelInfo.hidden=!1,d.noAccelInfo.hidden=!0,d.accel.innerHTML=l(t.accel),d.accelTime.innerHTML=a(t.accelTime)),console.log(t)}catch(e){d.error.innerHTML="",d.error.appendChild(document.createTextNode(s(e))),d.error.appendChild(document.createElement("br")),d.error.hidden=!1}};let u;d.form.oninput=()=>{clearTimeout(u),u=setTimeout(i,150)};