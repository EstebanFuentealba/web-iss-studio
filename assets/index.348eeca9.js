var pt=Object.defineProperty;var Q=Object.getOwnPropertySymbols;var ft=Object.prototype.hasOwnProperty,dt=Object.prototype.propertyIsEnumerable;var nt=(a,t,e)=>t in a?pt(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e,At=(a,t)=>{for(var e in t||(t={}))ft.call(t,e)&&nt(a,e,t[e]);if(Q)for(var e of Q(t))dt.call(t,e)&&nt(a,e,t[e]);return a};var ht=(a,t)=>{var e={};for(var r in a)ft.call(a,r)&&t.indexOf(r)<0&&(e[r]=a[r]);if(a!=null&&Q)for(var r of Q(a))t.indexOf(r)<0&&dt.call(a,r)&&(e[r]=a[r]);return e};var o=(a,t,e)=>(nt(a,typeof t!="symbol"?t+"":t,e),e);import{u as Rt,r as Nt,c as L,a as Lt,b as S,w as Tt,v as wt,n as It,g as bt,o as T,d as gt,t as ot,F as W,e as Z,f as Ct,h as at,i as Ft,j as yt,k as Pt}from"./vendor.b504d109.js";const Mt=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerpolicy&&(n.referrerPolicy=s.referrerpolicy),s.crossorigin==="use-credentials"?n.credentials="include":s.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}};Mt();var xt=(a,t)=>{const e=a.__vccOpts||a;for(const[r,s]of t)e[r]=s;return e};const Gt={setup(){function a(n,c){}const s=Rt({noClick:!0,accept:[],onDrop:a}),{getRootProps:t,getInputProps:e}=s,r=ht(s,["getRootProps","getInputProps"]);return At({getRootProps:t,getInputProps:e},r)}};function Bt(a,t,e,r,s,n){const c=Nt("router-view");return T(),L("div",null,[Lt(c),S("div",It(bt(r.getRootProps())),[Tt(S("div",null,"drop",512),[[wt,a.isDragActive]])],16)])}var Dt=xt(Gt,[["render",Bt]]);function X(a,t){var e,r=[],s=t>>0||1;if(Array.isArray(a))if(s>=0&&a.length>s)for(e=0;e<a.length;)r.push(a.slice(e,e+s)),e+=s;else r=a.length?[a]:a;return r}function vt(a,t){return a<<8|t<<0}function lt(a,t,e,r){return r|e<<8|t<<16|a<<24}const Ut=[37830,37835,239595,239600,239605,239610,239615,239620,239625,239630],Yt=130,v={P48000:"P48000",P40000:"P40000",P17000:"P17000"};function Et(a,t){return $(a,t,v.P48000)}function $(a,t,e){let r=a.slice(t,t+2);return Ht(r[0],r[1],e)}function kt(a,t){return lt(0,4,t,a)}function Wt(a,t){return lt(0,4,t-128,a)}function zt(a,t){return lt(0,1,t-128,a)}function Ht(a,t,e){switch(e){case v.P48000:return kt(a,t);case v.P40000:return Wt(a,t);case v.P17000:return zt(a,t)}throw new Error("Pointer format"+e)}function jt(a,t){return a.slice(t,t+1)[0]}function Ot(a){return jt(a,Ut[0])==Yt?v.P17000:v.P48000}function mt(a){return new DataView(new Uint8Array([a]).buffer).getInt8()}class h{static printPlayerNames(t){for(let e=0;e<t.length;e++)e%15==0&&console.log(`
`+e/15),console.log(t[e])}static bytes(t,e,r){return t.slice(e,e+r)}static stripAccents(t){return t.normalize("NFD").replace(/\p{Diacritic}/gu,"")}static bytesString(t){let e="";for(let r in t)e+=`0x${r.toString(16)} `;return e}static issText(t){let e=[];for(let r in t){let s=t[r],n=h.issChar(s);e.push(n)}return e.join("")}static unsigned(t){return t&255}static issChar(t){return h.unsigned(t)>=108&&h.unsigned(t)<=133?String.fromCharCode(h.unsigned(t)-108+"A".charCodeAt(0)):h.unsigned(t)>=134&&h.unsigned(t)<=159?String.fromCharCode(h.unsigned(t)-134+"a".charCodeAt(0)):h.unsigned(t)>=98&&h.unsigned(t)<=107?String.fromCharCode(h.unsigned(t)-98+"0".charCodeAt(0)):h.unsigned(t)==0?" ":h.unsigned(t)==84?".":h.unsigned(t)==86?'"':h.unsigned(t)==92?"'":h.unsigned(t)==95?"/":"#"}static charToIss(t){throw new Error("Not implemented")}}class U{}o(U,"ISS",1),o(U,"ISSD",2);const d=class{constructor(t){this.name=t}static getTeams(){return{GERMANY:d.GERMANY,ITALY:d.ITALY,HOLLAND:d.HOLLAND,SPAIN:d.SPAIN,ENGLAND:d.ENGLAND,SCOTLAND:d.SCOTLAND,WALES:d.WALES,FRANCE:d.FRANCE,DENMARK:d.DENMARK,SWEDEN:d.SWEDEN,NORWAY:d.NORWAY,IRELAND:d.IRELAND,BELGIUM:d.BELGIUM,AUSTRIA:d.AUSTRIA,SWISS:d.SWISS,ROMANIA:d.ROMANIA,BULGARIA:d.BULGARIA,RUSSIA:d.RUSSIA,ARGENTINA:d.ARGENTINA,BRAZIL:d.BRAZIL,COLOMBIA:d.COLOMBIA,MEXICO:d.MEXICO,USA:d.USA,NIGERIA:d.NIGERIA,CAMEROON:d.CAMEROON,SKOREA:d.SKOREA,SUPERSTAR:d.SUPERSTAR}}toString(){return String(this.ordinal()).padStart(2,"0")+". "+this.name}ordinal(){return Object.values(d.getTeams()).indexOf(this.name)}getKey(){return Object.keys(d.getTeams())[this.ordinal()]}next(){let t=d.getTeams(),e=Object.keys(t);return new d(t[e[(this.ordinal()+1)%e.length]])}previous(){let t=d.getTeams(),e=Object.keys(t);return new d(t[e[(this.ordinal()+e.length-1)%e.length]])}};let i=d;o(i,"GERMANY","Germany"),o(i,"ITALY","Italy"),o(i,"HOLLAND","Holland"),o(i,"SPAIN","Spain"),o(i,"ENGLAND","England"),o(i,"SCOTLAND","Scotland"),o(i,"WALES","Wales"),o(i,"FRANCE","France"),o(i,"DENMARK","Denmark"),o(i,"SWEDEN","Sweden"),o(i,"NORWAY","Norway"),o(i,"IRELAND","Ireland"),o(i,"BELGIUM","Belgium"),o(i,"AUSTRIA","Austria"),o(i,"SWISS","Swiss"),o(i,"ROMANIA","Romania"),o(i,"BULGARIA","Bulgaria"),o(i,"RUSSIA","Russia"),o(i,"ARGENTINA","Argentina"),o(i,"BRAZIL","Brazil"),o(i,"COLOMBIA","Colombia"),o(i,"MEXICO","Mexico"),o(i,"USA","U.S.A."),o(i,"NIGERIA","Nigeria"),o(i,"CAMEROON","Cameroon"),o(i,"SKOREA","S.Korea"),o(i,"SUPERSTAR","Super Star"),o(i,"PORTUGAL","Portugal"),o(i,"GREECE","Greece"),o(i,"CROATIA","Croatia"),o(i,"IRELANDN","Ireland del Norte"),o(i,"CZECH","Republica Checa"),o(i,"POLAND","Polonia"),o(i,"JAPAN","Japon"),o(i,"TURKEY","Turquia"),o(i,"MOROCCO","Marruecos"),o(i,"URUGUAY","Uruguay");class Kt{constructor(t,e){this.top=t,this.bottom=e}getTop(){return this.top}getBottom(){return this.bottom}getMatrix(){return this.getTop().concat(this.getBottom())}}class Zt{constructor(...t){this.rgbs=t}getRgbs(){return this.rgbs}toString(){return"ColoredPart{rgbs="+Arrays.toString(this.rgbs)+"}"}}class Xt{constructor(t,e,r){this.red=t,this.green=e,this.blue=r}getRed(){return this.red}getGreen(){return this.green}getBlue(){return this.blue}toHex(){let t=this.getRed()*255/31,e=this.getGreen()*255/31,r=this.getBlue()*255/31;const s=t<<16|e<<8|r<<0;return"#"+(16777216+s).toString(16).slice(1)}equals(t,e,r){return this.red==t&&this.green==e&&this.blue==r}toString(){return"RGB{red="+this.red+", green="+this.green+", blue="+this.blue+"}"}}const F=class{constructor(t,e){this.code=t,this.name=e}static forCode(t){return Object.keys(F.getColors()).filter(e=>F[e]==t)[0]}getCode(){return this.code}getName(){return this.name}static getColors(){return{COLOR_1:F.COLOR_1,COLOR_2:F.COLOR_2,COLOR_3:F.COLOR_3,COLOR_4:F.COLOR_4,TRANSPARENT:F.TRANSPARENT}}static at(t){return Object.keys(F.getColors())[t]}};let B=F;o(B,"COLOR_1",12),o(B,"COLOR_2",13),o(B,"COLOR_3",14),o(B,"COLOR_4",15),o(B,"TRANSPARENT",0);class Vt{constructor(t){this.matrix=t}getMatrix(){return this.matrix}}const y=class{constructor(t,e){this.game=e,this.rom=t,this.game==U.ISS?(this.range1=[i.GERMANY,i.ENGLAND,i.ITALY,i.HOLLAND,i.FRANCE,i.SPAIN,i.BELGIUM,i.IRELAND,i.COLOMBIA,i.BRAZIL,i.ARGENTINA,i.MEXICO,i.NIGERIA,i.CAMEROON,i.USA,i.BULGARIA,i.ROMANIA,i.SWEDEN],this.range2=[i.SCOTLAND,i.SKOREA,i.SUPERSTAR,i.RUSSIA,i.SWISS,i.DENMARK,i.AUSTRIA,i.WALES,i.NORWAY]):this.game==U.ISSD&&(this.range1=[i.ITALY,i.HOLLAND,i.ENGLAND,i.NORWAY,i.SPAIN,i.IRELAND,i.PORTUGAL,i.DENMARK,i.GERMANY,i.FRANCE,i.BELGIUM,i.SWEDEN,i.ROMANIA,i.BULGARIA,i.RUSSIA,i.SWISS,i.GREECE,i.CROATIA,i.AUSTRIA,i.WALES,i.SCOTLAND,i.IRELANDN,i.CZECH,i.POLAND,i.JAPAN,i.SKOREA,i.TURKEY,i.NIGERIA,i.CAMEROON,i.MOROCCO,i.BRAZIL,i.ARGENTINA,i.COLOMBIA,i.MEXICO,i.USA,i.URUGUAY])}readFromRomAt(t){console.log("Reading colors of flag ",t);let e=this.getOffset(t),r=this.rom.slice(e,e+y.STEP);return this.parseColors(r,0)}parseRGB(t,e){let r=vt(e,t),s=parseInt(r%32),n=parseInt(r%1024/32),c=parseInt(r%32768/1024);return new Xt(s,n,c)}parseColors(t,e){let r={};for(let s=0;s<y.COLOR_COUNT;s++)r[B.at(s)]=this.parseRGB(t[e+s*2],t[e+s*2+1]);return new Zt(r)}getOffset(t){let e=this.range1.indexOf(t.name);return this.game==U.ISS?e>=0?y.RANGE1_ISS_OFFSET+e*y.STEP:y.RANGE2_ISS_OFFSET+this.range2.indexOf(t.name)*y.STEP:e>=0?y.RANGE1_ISSD_OFFSET+e*y.STEP:null}};let b=y;o(b,"COLOR_BYTE_COUNT",2),o(b,"COLOR_COUNT",4),o(b,"RANGE1_ISS_OFFSET",187793),o(b,"RANGE2_ISS_OFFSET",187983),o(b,"RANGE1_ISSD_OFFSET",187813),o(b,"RANGE2_ISSD_OFFSET",191675),o(b,"STEP",10);const rt=class{constructor(t,e){this.rom=t,this.decompiler=e,this.maximumAddress=297599}async readFromRomAt(t){let e=this.readPointerAt(t),r=Et(this.rom,this.pointerOffset(t)+2),s=await this.readFlagPart(e),n=await this.readFlagPart(r);return new Vt(s.concat(n))}readPointerAt(t){return Et(this.rom,this.pointerOffset(t))}pointerOffset(t){return rt.POINTER_OFFSET+rt.POINTER_STEP*t.ordinal()}async readFlagPart(t){let e=await this.decompiler(`0x${t.toString(16)}`);return this.bytesToMatrix(e)}bytesToMatrix(t){let e=[],r=[],s=new Array(8).fill(new Array),n="",c=0,f=0,u=0,A=0;for(let g=0;g<=64;g+=32){for(let O=g,m=0;O<g+32;O++,m++){r[m]=t.slice(O,O+1);for(let p=0;p<=7;p++){c=r[p*2],f=r[p*2+1],u=r[p*2+16],A=r[p*2+17];for(let G=0;G<=7;G++){n="",(new Uint8Array(A)&1<<G)!=0?n=n+"1":n=n+"0",(new Uint8Array(u)&1<<G)!=0?n=n+"1":n=n+"0",(new Uint8Array(f)&1<<G)!=0?n=n+"1":n=n+"0",(new Uint8Array(c)&1<<G)!=0?n=n+"1":n=n+"0";let St=parseInt(n,2);e[p*8+G]=B.forCode(parseInt(St.toString(10)))}}}X(e,8).forEach((O,m)=>{s[m]=O.concat(s[m])})}return s.map(g=>g.reverse())}};let _=rt;o(_,"POINTER_OFFSET",37914),o(_,"POINTER_STEP",4);const E=class{constructor(t,e){this.code=t,this.name=e}static forCode(t){return Object.keys(E.getColors()).filter(e=>E.getColors()[e]==t)[0]}getCode(){return this.code}getName(){return this.name}static getColors(){return{COLOR_1:E.COLOR_1,COLOR_2:E.COLOR_2,COLOR_3:E.COLOR_3,TRANSPARENT:E.TRANSPARENT}}static at(t){return Object.keys(E.getColors())[t]}ordinal(){return Object.values(E.getColors()).indexOf(this.name)}toString(){if(this.ordinal()==0)return"\xA7";if(this.ordinal()==1)return"~";if(this.ordinal()==2)return" ";if(this.ordinal()==3)return"."}static serialize(t){let e=E.getColors()[t];return e==E.COLOR_1?"\xA7":e==E.COLOR_2?"~":e==E.COLOR_3?" ":e==E.TRANSPARENT?".":""}static deserialize(t){if(t=="\xA7")return E.COLOR_1;if(t=="~")return E.COLOR_2;if(t==" ")return E.COLOR_3;if(t==".")return E.TRANSPARENT;throw new Error("Invalid color for char: "+t)}toHex(){return this.code==E.COLOR_1?"#f7fff7":this.code==E.COLOR_2?"#84a6ef":this.code==E.COLOR_3?"#0051f7":"#94ae5a"}};let Y=E;o(Y,"COLOR_1",1),o(Y,"COLOR_2",2),o(Y,"COLOR_3",3),o(Y,"TRANSPARENT",0);class ct{constructor(t){this.matrix=t}getMatrix(){return this.matrix}toString(){let t="";for(let e in this.matrix){for(let r in this.matrix[e])t+=this.matrix[e][r]+"";t+=`
`}return t.toString()}}o(ct,"ROWS",8),o(ct,"COLS",32);class qt{constructor(t,e){this.address=t,this.size=e}getAddress(){return this.address}getSize(){return this.size}equals(t){if(this==t)return!0;if(t==null||t==null)return!1;let e=t;return!(address!=e.address||size!=e.size)}hashCode(){let t=address;return t=31*t+size,t}toString(){return"SizedAddress{address="+address.toString(16)+", size="+size.toString(16)+"}"}compareTo(t){let e=this.getAddress().localeCompare(t.getAddress());return e==0?this.getSize().localeCompare(t.getSize()):e}}const l=class{constructor(t,e,r,s,n=9){this.letter=t,this.bottom=e,this.b1=r,this.b2=s,this.preferredSize=n}cutLeft(){return this.getText().startsWith("I")?1:this.getText().startsWith(".")?2:0}static topAndBottoms(){if(l._topAndBottoms==null){let t=new Map;for(let r in[...l.tops.keys()]){let s=[...l.tops.keys()][r];if(s=="Z"||s=="9")continue;let n=l.tops.get(s),c=String.fromCharCode(s.charCodeAt(0)+1);t.set(s+c,new l(s+c,n.isBottom(),n.getB1(),22,n.getPreferredSize()+l.tops.get(c).getPreferredSize()-2))}let e=t.get("PQ");t.delete("PQ"),t.set("PA",e),l._topAndBottoms=t}return l._topAndBottoms}hashCode(){let t=bottom?1:0;return t=31*t+b1,t=31*t+b2,t}getPreferredSize(){return this.preferredSize}forLetter(t){let e=[],r=l.topAndBottoms().get(t);if(r!=null)return e.push(r),e;let s=l.bottoms.get(t);s!=null&&e.push(s);let n=l.tops.get(t);return n!=null&&e.push(n),e}equals(t,e){if(t==e)return!0;if(e==null||e==null)return!1;let r=e;return!(t.b1!=r.b1||t.b2!=r.b2||t.bottom!=r.bottom)}getText(){return this.getLetter()}getLetter(){return this.letter}isBottom(){return this.bottom}getB1(){return this.b1}getB2(){return this.b2}static deserialize(t,e){if(t[0]==249)for(let r=0;r<l.bottomOrder.length;r++){let s=l.bottomOrder[r],n=l.bottoms.get(s);if(n.b1==t[2]&&n.b2==t[3])return n}else{for(let r=0;r<l.topAndBottomOrder.length;r++){let s=l.topAndBottomOrder[r],n=l.topAndBottoms().get(s);if(n.getB1()==t[2]&&n.getB2()==t[3])return n}for(let r=0;r<l.topOrder.length;r++){let s=l.topOrder[r],n=l.tops.get(s);if(n.getB1()==t[2]&&n.getB2()==t[3])return e&&e.getLetter()==s&&e.getBottom()!=s.getBottom()?null:n}}return null}toString(){let t=l.topAndBottoms().get(this);if(t!=null)return t+" (top and bottom)";let e=l.tops.get(this);if(e!=null)return e+" (top)";let r=l.bottoms.get(this);return r!=null?r+" (bottom)":""}};let C=l;o(C,"bottomOrder",["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",".","0","1","2","3","4","5","6","7","8","9"]),o(C,"topAndBottomOrder",["HI","BC","89","45","67","01","23","DE","FG","JK","LM","NO","RS","TU","VW","XY","GH","AB","56","78","12","34","CD","EF","IJ","KL","MN","OP","QR","ST","UV","WX","YZ","PA"]),o(C,"topOrder",["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","0","1","2","3","4","5","6","7","8","9"]),o(C,"bottoms",new Map().set("A",new l("A",!0,208,6)).set("B",new l("B",!0,209,6)).set("C",new l("C",!0,210,6)).set("D",new l("D",!0,211,6)).set("E",new l("E",!0,212,6)).set("F",new l("F",!0,213,6)).set("G",new l("G",!0,214,6)).set("H",new l("H",!0,215,6)).set("I",new l("I",!0,216,6,7)).set("J",new l("J",!0,217,6)).set("K",new l("K",!0,218,6)).set("L",new l("L",!0,219,6)).set("M",new l("M",!0,220,6,8)).set("N",new l("N",!0,221,6,8)).set("O",new l("O",!0,222,6)).set("P",new l("P",!0,223,6)).set("Q",new l("Q",!0,240,6)).set("R",new l("R",!0,241,6)).set("S",new l("S",!0,242,6)).set("T",new l("T",!0,243,6,8)).set("U",new l("U",!0,244,6)).set("V",new l("V",!0,245,6)).set("W",new l("W",!0,246,6,8)).set("X",new l("X",!0,247,6)).set("Y",new l("Y",!0,248,6)).set("Z",new l("Z",!0,249,6)).set(".",new l(".",!0,250,6,7)).set("0",new l("0",!0,176,6)).set("1",new l("1",!0,177,6)).set("2",new l("2",!0,178,6)).set("3",new l("3",!0,179,6)).set("4",new l("4",!0,180,6)).set("5",new l("5",!0,181,6)).set("6",new l("6",!0,182,6)).set("7",new l("7",!0,183,6)).set("8",new l("8",!0,184,6)).set("9",new l("9",!0,185,6))),o(C,"_topAndBottoms",null),o(C,"tops",new Map().set("A",new l("A",!1,192,6)).set("B",new l("B",!1,193,6)).set("C",new l("C",!1,194,6)).set("D",new l("D",!1,195,6)).set("E",new l("E",!1,196,6)).set("F",new l("F",!1,197,6)).set("G",new l("G",!1,198,6)).set("H",new l("H",!1,199,6)).set("I",new l("I",!1,200,6,7)).set("J",new l("J",!1,201,6)).set("K",new l("K",!1,202,6)).set("L",new l("L",!1,203,6)).set("M",new l("M",!1,204,6,8)).set("N",new l("N",!1,205,6,8)).set("O",new l("O",!1,206,6)).set("P",new l("P",!1,207,6)).set("Q",new l("Q",!1,224,6)).set("R",new l("R",!1,225,6)).set("S",new l("S",!1,226,6)).set("T",new l("T",!1,227,6,8)).set("U",new l("U",!1,228,6)).set("V",new l("V",!1,229,6)).set("W",new l("W",!1,230,6,8)).set("X",new l("X",!1,231,6)).set("Y",new l("Y",!1,232,6)).set("Z",new l("Z",!1,233,6)).set("0",new l("0",!1,160,6)).set("1",new l("1",!1,161,6)).set("2",new l("2",!1,162,6)).set("3",new l("3",!1,163,6)).set("4",new l("4",!1,164,6)).set("5",new l("5",!1,165,6)).set("6",new l("6",!1,166,6)).set("7",new l("7",!1,167,6)).set("8",new l("8",!1,168,6)).set("9",new l("9",!1,169,6)));class tt{constructor(){this.map=new Map}forText(t){t=h.stripAccents(t).toUpperCase().replace(/[^A-Z0-9\\. ]/g," ");let e=new Map,r=0;for(let u=0;u<t.length;u++)if(t.charAt(u)==" ")r+=3;else{if(u+1<t.length){let x=C.forLetter(t.charAt(u)+t.charAt(u+1));if(x.length>0){let O=x[0];u>0&&(r-=O.cutLeft()),e.set(r,x),r+=O.getPreferredSize(),u++;continue}}let A=C.forLetter(t.charAt(u)),g=A[0];u>0&&(r-=g.cutLeft()),e.set(r,A),r+=g.getPreferredSize()}let s=r-1,n=70;if(s>n){let u=s-n,A=e.keySet().size()-1,g=u/A,x=u%A;e=compress(e,g,x),s=n}let c=s/2,f=new tt;for(let u in e.keys()){let A=u-c;f.map.set(A,e.get(u))}return f}compress(t,e,r){let s=new Map,n=t.keys().sort(),c=0,f=0;for(let u in n){c>0&&(f+=e,r>0&&(f++,r--));let A=u-f;s.set(A,t.get(u)),c++}return s}getText(){let t="",e=127,r=2147483647;return Array.from(this.map.entries()).sort(([s],[n])=>mt(s)-mt(n)).map(([s,n],c)=>{let f="";f=this.map.get(s).getText(),f!=""&&(n>=e+10*r&&(t+=" "),t+=f,e=n,r=f.length)}),t}getByteSize(){return this.map.size()}static deserialize(t){let e=new tt;return X(Array.from(t).slice(1),4).forEach(s=>{let n=C.deserialize(s);n!=null&&e.map.set(s[1],n)}),e}toString(){return this.getText()}}const st=class{constructor(t){this.rom=t}readFromRom(){let t=new Map;for(let e in i.getTeams()){let r=new i(i.getTeams()[e]);t.set(r.name,this.readFromRomAt(r))}return t}readFromRomAt(t){let e=this.readPointerAt(t),r=this.rom.slice(e,e+1)[0]*4,s=this.rom.slice(e,e+r+1);return console.log(t+" name text on address "+e.toString(16)),tt.deserialize(s)}pointerFormat(){return v.P40000}readPointerAt(t){return $(this.rom,this.pointerOffset(t),this.pointerFormat())}pointerOffset(t){return st.POINTER_OFFSET+st.POINTER_STEP*t.ordinal()}readAddressMap(){let t=new Map;for(let e in i.getTeams()){let r=new i(i.getTeams()[e]),s=this.pointerOffset(r),n=$(this.rom,s,this.pointerFormat()),c=this.rom.slice(n,n+1)[0]*4+1;t.set(r,new qt(n,c))}return t}invert(t){let e=new Map;for(let r in[...t.keys()]){let s=[...t.keys()][r];e.set(t.get(s),s)}return e}};let V=st;o(V,"POINTER_OFFSET",236974),o(V,"POINTER_STEP",2),o(V,"maximumAddress",279686);const it=class{constructor(t,e){this.rom=t,this.decompiler=e,this.maximumAddress48=297599,this.maximumAddress17=98303,this._pointerFormat=null}async readFromRomAt(t){let e=this.readPointerAt(t),r=await this.readMatrix(e);return new ct(r)}pointerFormat(){return pointerFormat==null&&(pointerFormat=Ot(this.rom)),pointerFormat}readPointerAt(t){return $(this.rom,this.pointerOffset(t),this.pointerFormat())}pointerOffset(t){return it.POINTER_OFFSET+it.POINTER_STEP*t.ordinal()}pointerFormat(){return this._pointerFormat==null&&(this._pointerFormat=Ot(this.rom)),this._pointerFormat}async readMatrix(t){let e=await this.decompiler(`0x${t.toString(16)}`);return this.bytesToMatrix(e)}bytesToMatrix(t){let e=[],r=[],s=new Array(8),n="",c=0,f=0;for(let u=0;u<=24*2;u+=t.byteLength/4){for(let g=u,x=0;x<24;g++,x++){r[x]=t.slice(g,g+1);for(let O=0;O<8;O++){c=r[O*2],f=r[O*2+1];for(let m=0;m<8;m++){n="",(new Uint8Array(f)&1<<m)!=0?n=n+"1":n=n+"0",(new Uint8Array(c)&1<<m)!=0?n=n+"1":n=n+"0";let p=parseInt(n,2);e[O*8+m]=Y.forCode(parseInt(p.toString(10)))}}}X(e,8).forEach((g,x)=>{s[x]=g.concat(s[x])})}return s.map(u=>u.reverse())}};let et=it;o(et,"POINTER_OFFSET",37837),o(et,"POINTER_STEP",2);const P=class{constructor(t,e=P.OFFSET_ORIGINAL){this.rom=t,this.offset=e,this.teamPositions=[i.GERMANY,i.ITALY,i.HOLLAND,i.SPAIN,i.ENGLAND,i.WALES,i.FRANCE,i.DENMARK,i.SWEDEN,i.NORWAY,i.IRELAND,i.BELGIUM,i.AUSTRIA,i.SWISS,i.ROMANIA,i.BULGARIA,i.RUSSIA,i.ARGENTINA,i.BRAZIL,i.COLOMBIA,i.MEXICO,i.USA,i.NIGERIA,i.CAMEROON,i.SCOTLAND,i.SKOREA,i.SUPERSTAR]}readFromRom(){let t=this.rom.slice(this.offset,this.offset+LENGTH),e=h.issText(t).split("(?<=\\G........)"),r=new Map,s=null;for(let n=0;n<e.length;n++)n%P.PLAYERS_BY_TEAM_COUNT==0&&(s=[],r.set(teamPositions.get(n),s)),s.add(e[n].trim());return r}readFromRomAt(t){let e=this.offset+this.positionOf(t)*P.TEAM_LENGTH,r=this.rom.slice(e,e+P.TEAM_LENGTH),s=X(h.issText(r).split(""),8),n=[];for(let c in s){let f=s[c].join("");n.push(f.trim())}return n}positionOf(t){return this.teamPositions.indexOf(t.name)}};let D=P;o(D,"OFFSET_ORIGINAL",243244),o(D,"TEAM_COUNT",27),o(D,"PLAYERS_BY_TEAM_COUNT",15),o(D,"NAME_LENGTH",8),o(D,"TEAM_LENGTH",P.PLAYERS_BY_TEAM_COUNT*P.NAME_LENGTH),o(D,"LENGTH",P.TEAM_COUNT*P.TEAM_LENGTH);const M=class{constructor(t,e=M.OFFSET_ORIGINAL){this.rom=t,this.offset=e}readFromRom(){let t=new Map,e=this.rom.slice(this.offset,this.offset+M.TEAM_LENGTH*i.getTeams().length);for(let r=0;r<i.getTeams().length;r++){let s=[];for(let n=0;n<M.NUMBER_OF_PLAYERS;n++){let c=h.bytes(e,r*M.TEAM_LENGTH+n*M.PLAYER_LENGTH,1)[0];s.push(this.parsePlayerNumber(c))}t.set(i.at(r),s)}return t}readFromRomAt(t){let e=[],r=this.rom.slice(this.getOffset(t),this.getOffset(t)+M.TEAM_LENGTH);for(let s=0;s<15;s++)e.push(this.parsePlayerNumber(h.bytes(r,s*M.PLAYER_LENGTH,1)[0]));return e}getOffset(t){return this.offset+t.ordinal()*M.TEAM_LENGTH}parsePlayerNumber(t){return h.unsigned(t)%16+1}};let z=M;o(z,"NUMBER_OF_PLAYERS",15),o(z,"OFFSET_ORIGINAL",231407),o(z,"TEAM_LENGTH",90),o(z,"PLAYER_LENGTH",6);const J=class{constructor(t){this.text=t}static getPlayerColors(){return{NORMAL:J.NORMAL,SPECIAL:J.SPECIAL}}static at(t){return Object.keys(J.getPlayerColors())[t]}toString(){return this.text}};let q=J;o(q,"NORMAL","Normal"),o(q,"SPECIAL","Special");const I=class{constructor(t,e=I.OFFSET_ORIGINAL){this.rom=t,this.offset=e}readFromRom(){let t=new Map,e=this.rom.slice(this.offset,this.offset+I.TEAM_LENGTH*i.getTeams().length);for(let r=0;r<i.getTeams().length;r++){let s=[];for(let n=0;n<I.NUMBER_OF_PLAYERS;n++){let c=h.bytes(e,r*I.TEAM_LENGTH+n*I.PLAYER_LENGTH,1)[0];s.push(I.parsePlayerColor(c))}t.set(i.at(r),s)}return t}readFromRomAt(t){let e=[],r=this.rom.slice(this.getOffset(t),this.getOffset(t)+I.TEAM_LENGTH);for(let s=0;s<15;s++)e.push(I.parsePlayerColor(h.bytes(r,s*I.PLAYER_LENGTH,1)[0]));return e}getOffset(t){return this.offset+t.ordinal()*I.TEAM_LENGTH}static parsePlayerColor(t){return t/64>0?q.SPECIAL:q.NORMAL}};let H=I;o(H,"NUMBER_OF_PLAYERS",15),o(H,"OFFSET_ORIGINAL",231409),o(H,"TEAM_LENGTH",90),o(H,"PLAYER_LENGTH",6);const R=class{constructor(t){this.text=t}static getHairStyles(){return{SHORT:R.SHORT,CURLY:R.CURLY,LONG_CURLY:R.LONG_CURLY,LONG_WITH_BEARD:R.LONG_WITH_BEARD,LONG_STRAIGHT:R.LONG_STRAIGHT,DREADLOCKS:R.DREADLOCKS,AFRO:R.AFRO,PONYTAIL:R.PONYTAIL,BALD:R.BALD,MID_LENGTH:R.MID_LENGTH,LONG_WITH_RIBBON:R.LONG_WITH_RIBBON}}static fromByte(t){let e=t%16;for(let r in R.getHairStyles()){let s=new R(R.getHairStyles()[r]);if(s.ordinal()==e)return s}throw new IllegalArgumentException("Hair style code = "+t)}ordinal(){return Object.values(R.getHairStyles()).indexOf(this.text)}toString(){return this.text}};let N=R;o(N,"SHORT","Short hair"),o(N,"CURLY","Curly hair"),o(N,"LONG_CURLY","Long curly"),o(N,"LONG_WITH_BEARD","Long with beard"),o(N,"LONG_STRAIGHT","Long straight"),o(N,"DREADLOCKS","Dreadlocks"),o(N,"AFRO","Afro"),o(N,"PONYTAIL","Ponytail"),o(N,"BALD","Bald"),o(N,"MID_LENGTH","Mid length"),o(N,"LONG_WITH_RIBBON","Long with ribbon");const k=class{constructor(t,e=k.OFFSET_ORIGINAL){this.rom=t,this.offset=e}readFromRomAt(t){let e=[],r=this.rom.slice(this.getOffset(t),this.getOffset(t)+k.TEAM_LENGTH);for(let s=0;s<15;s++)e.push(k.parseHairStyle(h.bytes(r,s*k.PLAYER_LENGTH,1)[0]));return e}getOffset(t){return this.offset+t.ordinal()*k.TEAM_LENGTH}static parseHairStyle(t){return N.fromByte(t)}};let j=k;o(j,"NUMBER_OF_PLAYERS",15),o(j,"OFFSET_ORIGINAL",231409),o(j,"TEAM_LENGTH",90),o(j,"PLAYER_LENGTH",6);const w=class{constructor(t,e=w.OFFSET_ORIGINAL){this.rom=t,this.offset=e}readFromRom(){let t=new Map,e=this.rom.slice(this.offset,this.offset+w.TEAM_LENGTH*Team.getTeams().length);for(let r=0;r<Team.getTeams().length;r++){let s=[];for(let n=0;n<w.NUMBER_OF_PLAYERS;n++){let c=h.bytes(e,r*w.TEAM_LENGTH+n*w.PLAYER_LENGTH,1)[0];s.push(this.parsePlayerNumber(c))}t.set(Team.at(r),s)}return t}readFromRomAt(t){let e=[],r=[1,3,5,7,9,11,13,15],s=this.rom.slice(this.getOffset(t),this.getOffset(t)+w.TEAM_LENGTH);for(let n=0;n<w.NUMBER_OF_PLAYERS;n++){let c=[...h.bytes(s,n*w.PLAYER_LENGTH,w.PLAYER_LENGTH)].map(f=>f.toString(16).padEnd(2,"0")).join("").split("");r[h.unsigned(c[2])%8],h.unsigned(c[4])%16+1,r[h.unsigned(c[5])%8],e.push(this.parsePlayerNumber(h.bytes(s,n*w.PLAYER_LENGTH,1)[0]))}return e}getOffset(t){return this.offset+t.ordinal()*w.TEAM_LENGTH}parsePlayerNumber(t){return h.unsigned(t)%16+1}};let K=w;o(K,"NUMBER_OF_PLAYERS",15),o(K,"OFFSET_ORIGINAL",231404),o(K,"TEAM_LENGTH",90),o(K,"PLAYER_LENGTH",6);class Jt{constructor(){if(this.indexedDB=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB,this.indexedDB===void 0)return console.warn("Storage: IndexedDB not available."),{init:()=>{},get:()=>{},set:()=>{},clear:()=>{}};this.name="web-iss-studio",this.version=1,this.database=void 0}init(t){var e=this.indexedDB.open(this.name,this.version);e.onupgradeneeded=r=>{var s=r.target.result;s.objectStoreNames.contains("states")===!1&&s.createObjectStore("states")},e.onsuccess=r=>{this.database=r.target.result,t()},e.onerror=r=>{console.error("IndexedDB",r)}}get(t){var e=this.database.transaction(["states"],"readwrite"),r=e.objectStore("states"),s=r.get(0);s.onsuccess=n=>{t(n.target.result)}}set(t){var e=performance.now(),r=this.database.transaction(["states"],"readwrite"),s=r.objectStore("states"),n=s.put(t,0);n.onsuccess=()=>{console.log("["+/\d\d\:\d\d\:\d\d/.exec(new Date)[0]+"]","Saved state to IndexedDB. "+(performance.now()-e).toFixed(2)+"ms")}}clear(){if(this.database!==void 0){var t=this.database.transaction(["states"],"readwrite"),e=t.objectStore("states"),r=e.clear();r.onsuccess=()=>{console.log("["+/\d\d\:\d\d\:\d\d/.exec(new Date)[0]+"]","Cleared IndexedDB.")}}}}const Qt={data(){return{TeamNameTilesColor:Y,offsetTop:"0x483e4",offsetBottom:"0x4841a",rom:null,matrix:[],teamMatrix:[],teamName:"",rgbs:[],team:new i(i.GERMANY),storage:new Jt}},mounted(){setTimeout(()=>{this.storage.init(()=>{this.storage.get(async a=>{a&&(this.rom=await this.$core.f(a),this.renderFlag(),this.renderTeamName(),this.renderTeamPlayers())})})},500)},methods:{async findFlag(){console.log("findFlag start");for(let a=0;a<this.rom.length;a++){let t=await this.$core.d(`0x${a.toString(16)}`);t.byteLength==96&&t.filter(e=>e==0).length!=96&&console.log("finded",`0x${a.toString(16)}`,t)}},prev(){this.team=this.team.previous(),this.renderFlag(),this.renderTeamName(),this.renderTeamPlayers()},next(){this.team=this.team.next(),this.renderFlag(),this.renderTeamName(),this.renderTeamPlayers()},async renderTeamPlayers(){let a=new D(this.rom).readFromRomAt(this.team),t=new z(this.rom).readFromRomAt(this.team),e=new H(this.rom).readFromRomAt(this.team),r=new j(this.rom).readFromRomAt(this.team);new K(this.rom).readFromRomAt(this.team),console.log({players:a.reduce((s,n,c)=>(r[c].text==N.DREADLOCKS&&alert("encontrado "+n),s.push({name:n,no:t[c],color:e[c],hair:r[c].text}),s),[])})},async renderTeamName(){let a=new V(this.rom);this.teamName=a.readFromRomAt(this.team).toString();let t=await new et(this.rom,this.$core.d).readFromRomAt(this.team);this.teamMatrix=t.getMatrix()},async renderFlag(){this.rgbs=new b(this.rom,U.ISS).readFromRomAt(this.team).getRgbs(),this.matrix=(await new _(this.rom,this.$core.d).readFromRomAt(this.team)).getMatrix()},async onChangeFile({target:{files:a}}){this.rom=await this.$core.f(a[0]),this.storage.set(a[0]),this.renderFlag(),this.renderTeamName()},readFlagPart(a){return this.bytesToMatrix(a)},bytesToMatrix(a){let t=[],e=[],r=new Array(8).fill(new Array),s="",n=0,c=0,f=0,u=0;for(let A=0;A<=64;A+=32){for(let x=A,O=0;x<A+32;x++,O++){e[O]=a.slice(x,x+1);for(let m=0;m<=7;m++){n=e[m*2],c=e[m*2+1],f=e[m*2+16],u=e[m*2+17];for(let p=0;p<=7;p++){s="",(new Uint8Array(u)&1<<p)!=0?s=s+"1":s=s+"0",(new Uint8Array(f)&1<<p)!=0?s=s+"1":s=s+"0",(new Uint8Array(c)&1<<p)!=0?s=s+"1":s=s+"0",(new Uint8Array(n)&1<<p)!=0?s=s+"1":s=s+"0";let G=parseInt(s,2);t[m*8+p]=B.forCode(parseInt(G.toString(10)))}}}X(t,8).forEach((x,O)=>{r[O]=x.concat(r[O])})}return r.map(A=>A.reverse())},async getFlagPart(a){let t=await this.$core.d(a);return{part:this.readFlagPart(t),decompFile:t}},async decompress(){let{part:a}=await this.getFlagPart(this.offsetTop),{part:t}=await this.getFlagPart(this.offsetBottom),e=new Kt(a,t).getMatrix(),r=new b(this.rom,U.ISS).readFromRomAt(this.team).getRgbs();this.$refs.preview.innerHTML=`<div class="flag flex flex-col">${e.map(s=>`<div class="flex flex-row">${s.map(n=>{let c=r[0][n];return c?`<div class="square" style="background-color: ${c.toHex()}"></div>`:'<div class="square"></div>'}).join(" ")}</div>
            `).join(`
`)}</div>
        <br /><br />
            <div class="flex flex-row">${Object.keys(r[0]).map(s=>`<div class="color-block" style="background-color: ${r[0][s].toHex()};">${s}</div>`).join("")}</div>`}}},$t=S("strong",null,"Open ROM",-1),_t=S("br",null,null,-1),te=S("br",null,null,-1),ee={ref:"preview"},re=gt(") "),se={key:0},ie={class:"flag flex flex-col"},ne=S("br",null,null,-1),oe=S("br",null,null,-1),ae={class:"flag flex flex-col"},le=["data-dev"],ce=S("br",null,null,-1),ue=S("br",null,null,-1),fe={class:"flex flex-row"};function de(a,t,e,r,s,n){var c;return T(),L(W,null,[S("div",null,[$t,S("input",{type:"file",id:"rom",onChange:t[0]||(t[0]=(...f)=>n.onChangeFile&&n.onChangeFile(...f))},null,32)]),_t,te,S("div",ee,[S("button",{type:"button",onClick:t[1]||(t[1]=(...f)=>n.prev&&n.prev(...f))},"Prev"),gt(" "+ot(s.teamName)+" (",1),S("i",null,ot((c=s.team)==null?void 0:c.name),1),re,S("button",{type:"button",onClick:t[2]||(t[2]=(...f)=>n.next&&n.next(...f))},"Next"),s.rgbs.length>0?(T(),L("div",se,[S("div",ie,[(T(!0),L(W,null,Z(s.matrix,(f,u)=>(T(),L("div",{key:`row-${u}`,class:"flex flex-row"},[(T(!0),L(W,null,Z(f,(A,g)=>{var x;return T(),L("div",{key:`col-${g}`,class:"square",style:at({backgroundColor:(x=s.rgbs[0][A])==null?void 0:x.toHex()})},null,4)}),128))]))),128))]),ne,oe,S("div",ae,[(T(!0),L(W,null,Z(s.teamMatrix,(f,u)=>(T(),L("div",{key:`row-${u}`,class:"flex flex-row"},[(T(!0),L(W,null,Z(f,(A,g)=>(T(),L("div",{key:`col-${g}`,class:"square","data-dev":A,style:at({backgroundColor:new s.TeamNameTilesColor(s.TeamNameTilesColor.getColors()[A]).toHex()})},null,12,le))),128))]))),128))]),ce,ue,S("div",fe,[(T(!0),L(W,null,Z(Object.keys(s.rgbs[0]),(f,u)=>{var A;return T(),L("div",{key:`color-${u}`,class:"color-block",style:at({backgroundColor:(A=s.rgbs[0][f])==null?void 0:A.toHex()})},ot(f),5)}),128))])])):Ct("",!0)],512)],64)}var Ae=xt(Qt,[["render",de]]);const he={template:"<div>About</div>"},ge=[{path:"/",name:"Home",component:Ae,children:[]},{path:"/about",name:"About",component:he}],xe=Ft({history:yt(),routes:ge,linkActiveClass:"active"});function Ee(){return new Promise((a,t)=>{let e=document.createElement("script");e.async=!0,e.src="/wasm/iss-studio-core.js",e.type="text/javascript",e.addEventListener("load",r=>{console.log("iss-studio-core.js script loaded"),a(createISSStudioCore)}),e.addEventListener("error",r=>{t(r)}),document.getElementsByTagName("head")[0].appendChild(e)})}function Oe(a){return new Promise((t,e)=>{const r=new FileReader;r.onload=()=>{t(r.result)},r.onerror=({target:{error:{code:s}}})=>{e(Error(`File could not be read! Code=${s}`))},r.readAsArrayBuffer(a)})}async function me(a){let t=a;return typeof a=="undefined"?new Uint8Array:(t=await Oe(a),new Uint8Array(t))}var Se={install:(a,t)=>{Ee().then(async e=>{const r=await e(),s=r.FS;async function n(u){let A=await me(u),g=s.open("iss.sfc","w+");return s.write(g,A,0,A.length,0),s.close(g),A}const c=u=>new Promise((A,g)=>{let x=r.cwrap("decompress","number",["string","string","string"])("iss.sfc",u,"1");x==0?A(s.readFile("decomp.bin")):g(x)}),f=()=>r.cwrap("compress","number",["string","string"])("decomp.bin","1");a.config.globalProperties.$core={d:c,c:f,f:n}}).catch(()=>{console.log(Error("Not supported"))})}};let ut=Pt(Dt);ut.use(xe);ut.use(Se);ut.mount("#app");