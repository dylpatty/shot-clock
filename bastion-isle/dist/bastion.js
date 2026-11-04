(()=>{var Em=0,Ku=1,Tm=2;var Sa=1,Am=2,ni=3,Ci=0,je=1,si=2,Ti=0,Ai=1,ss=2,ju=3,Qu=4,Rm=5,ts=100,Cm=101,Im=102,Pm=103,Lm=104,Dm=200,Um=201,Nm=202,Fm=203,Jl=204,Kl=205,zm=206,Om=207,km=208,Bm=209,Hm=210,Vm=211,Gm=212,Wm=213,Xm=214,jl=0,Ql=1,tc=2,Os=3,ec=4,nc=5,ic=6,sc=7,wh=0,qm=1,Ym=2,Ri=0,$m=1,Zm=2,Jm=3,Eh=4,Km=5,jm=6,Qm=7;var cf=300,ks=301,Bs=302,rc=303,oc=304,wa=306,ac=1e3,ri=1001,lc=1002,ln=1003,t0=1004;var yo=1005;var an=1006,gl=1007;var is=1008;var En=1009,hf=1010,uf=1011,Sr=1012,Th=1013,rs=1014,Fn=1015,kr=1016,Ah=1017,Rh=1018,Hs=1020,df=35902,ff=1021,pf=1022,wn=1023,mf=1024,gf=1025,Ns=1026,Vs=1027,Br=1028,Ch=1029,xf=1030,Ih=1031;var Ph=1033,Yo=33776,$o=33777,Zo=33778,Jo=33779,cc=35840,hc=35841,uc=35842,dc=35843,fc=36196,pc=37492,mc=37496,gc=37808,xc=37809,vc=37810,yc=37811,_c=37812,Mc=37813,bc=37814,Sc=37815,wc=37816,Ec=37817,Tc=37818,Ac=37819,Rc=37820,Cc=37821,Ko=36492,Ic=36494,Pc=36495,vf=36283,Lc=36284,Dc=36285,Uc=36286;var jo=2300,Nc=2301,xl=2302,td=2400,ed=2401,nd=2402;var e0=3200,n0=3201;var yf=0,i0=1,Ei="",Ke="srgb",Xs="srgb-linear",Ea="linear",me="srgb";var vs=7680;var id=519,s0=512,r0=513,o0=514,_f=515,a0=516,l0=517,c0=518,h0=519,sd=35044,qs=35048;var rd="300 es",oi=2e3,Qo=2001,Ii=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let i=this._listeners;return i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let i=this._listeners[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Oe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var vl=Math.PI/180,Fc=180/Math.PI;function Ys(){let n=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Oe[n&255]+Oe[n>>8&255]+Oe[n>>16&255]+Oe[n>>24&255]+"-"+Oe[t&255]+Oe[t>>8&255]+"-"+Oe[t>>16&15|64]+Oe[t>>24&255]+"-"+Oe[e&63|128]+Oe[e>>8&255]+"-"+Oe[e>>16&255]+Oe[e>>24&255]+Oe[i&255]+Oe[i>>8&255]+Oe[i>>16&255]+Oe[i>>24&255]).toLowerCase()}function Be(n,t,e){return Math.max(t,Math.min(e,n))}function u0(n,t){return(n%t+t)%t}function yl(n,t,e){return(1-e)*n+e*t}function hr(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Je(n,t){switch(t.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var ct=class n{constructor(t=0,e=0){n.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,i=this.y,s=t.elements;return this.x=s[0]*e+s[3]*i+s[6],this.y=s[1]*e+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Be(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let i=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*i-o*s+t.x,this.y=r*s+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},jt=class n{constructor(t,e,i,s,r,o,a,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,o,a,l,c)}set(t,e,i,s,r,o,a,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],u=i[7],d=i[2],f=i[5],g=i[8],x=s[0],m=s[3],p=s[6],w=s[1],_=s[4],y=s[7],C=s[2],A=s[5],I=s[8];return r[0]=o*x+a*w+l*C,r[3]=o*m+a*_+l*A,r[6]=o*p+a*y+l*I,r[1]=c*x+h*w+u*C,r[4]=c*m+h*_+u*A,r[7]=c*p+h*y+u*I,r[2]=d*x+f*w+g*C,r[5]=d*m+f*_+g*A,r[8]=d*p+f*y+g*I,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*o*h-e*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=h*o-a*c,d=a*l-h*r,f=c*r-o*l,g=e*u+i*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/g;return t[0]=u*x,t[1]=(s*c-h*i)*x,t[2]=(a*i-s*o)*x,t[3]=d*x,t[4]=(h*e-s*l)*x,t[5]=(s*r-a*e)*x,t[6]=f*x,t[7]=(i*l-c*e)*x,t[8]=(o*e-i*r)*x,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(_l.makeScale(t,e)),this}rotate(t){return this.premultiply(_l.makeRotation(-t)),this}translate(t,e){return this.premultiply(_l.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<9;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},_l=new jt;function Mf(n){for(let t=n.length-1;t>=0;--t)if(n[t]>=65535)return!0;return!1}function ta(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function d0(){let n=ta("canvas");return n.style.display="block",n}var od={};function xr(n){n in od||(od[n]=!0,console.warn(n))}function f0(n,t,e){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(t,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:i()}}setTimeout(r,e)})}function p0(n){let t=n.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function m0(n){let t=n.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var re={enabled:!0,workingColorSpace:Xs,spaces:{},convert:function(n,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===me&&(n.r=li(n.r),n.g=li(n.g),n.b=li(n.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(n.applyMatrix3(this.spaces[t].toXYZ),n.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===me&&(n.r=Fs(n.r),n.g=Fs(n.g),n.b=Fs(n.b))),n},fromWorkingColorSpace:function(n,t){return this.convert(n,this.workingColorSpace,t)},toWorkingColorSpace:function(n,t){return this.convert(n,t,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===Ei?Ea:this.spaces[n].transfer},getLuminanceCoefficients:function(n,t=this.workingColorSpace){return n.fromArray(this.spaces[t].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,t,e){return n.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace}};function li(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Fs(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var ad=[.64,.33,.3,.6,.15,.06],ld=[.2126,.7152,.0722],cd=[.3127,.329],hd=new jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ud=new jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);re.define({[Xs]:{primaries:ad,whitePoint:cd,transfer:Ea,toXYZ:hd,fromXYZ:ud,luminanceCoefficients:ld,workingColorSpaceConfig:{unpackColorSpace:Ke},outputColorSpaceConfig:{drawingBufferColorSpace:Ke}},[Ke]:{primaries:ad,whitePoint:cd,transfer:me,toXYZ:hd,fromXYZ:ud,luminanceCoefficients:ld,outputColorSpaceConfig:{drawingBufferColorSpace:Ke}}});var ys,zc=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{ys===void 0&&(ys=ta("canvas")),ys.width=t.width,ys.height=t.height;let i=ys.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),e=ys}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=ta("canvas");e.width=t.width,e.height=t.height;let i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=li(r[o]/255)*255;return i.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(li(e[i]/255)*255):e[i]=li(e[i]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},g0=0,ea=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:g0++}),this.uuid=Ys(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Ml(s[o].image)):r.push(Ml(s[o]))}else r=Ml(s);i.url=r}return e||(t.images[this.uuid]=i),i}};function Ml(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?zc.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var x0=0,cn=class n extends Ii{constructor(t=n.DEFAULT_IMAGE,e=n.DEFAULT_MAPPING,i=ri,s=ri,r=an,o=is,a=wn,l=En,c=n.DEFAULT_ANISOTROPY,h=Ei){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:x0++}),this.uuid=Ys(),this.name="",this.source=new ea(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ct(0,0),this.repeat=new ct(1,1),this.center=new ct(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==cf)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case ac:t.x=t.x-Math.floor(t.x);break;case ri:t.x=t.x<0?0:1;break;case lc:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case ac:t.y=t.y-Math.floor(t.y);break;case ri:t.y=t.y<0?0:1;break;case lc:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};cn.DEFAULT_IMAGE=null;cn.DEFAULT_MAPPING=cf;cn.DEFAULT_ANISOTROPY=1;var we=class n{constructor(t=0,e=0,i=0,s=1){n.prototype.isVector4=!0,this.x=t,this.y=e,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,s){return this.x=t,this.y=e,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*i+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,s,r,l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],g=l[9],x=l[2],m=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let _=(c+1)/2,y=(f+1)/2,C=(p+1)/2,A=(h+d)/4,I=(u+x)/4,D=(g+m)/4;return _>y&&_>C?_<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(_),s=A/i,r=I/i):y>C?y<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),i=A/s,r=D/s):C<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(C),i=I/r,s=D/r),this.set(i,s,r,e),this}let w=Math.sqrt((m-g)*(m-g)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(u-x)/w,this.z=(d-h)/w,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Oc=class extends Ii{constructor(t=1,e=1,i={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new we(0,0,t,e),this.scissorTest=!1,this.viewport=new we(0,0,t,e);let s={width:t,height:e,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:an,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new cn(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let i=0,s=t.textures.length;i<s;i++)this.textures[i]=t.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new ea(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Tn=class extends Oc{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}},na=class extends cn{constructor(t=null,e=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=ri,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var kc=class extends cn{constructor(t=null,e=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:s},this.magFilter=ln,this.minFilter=ln,this.wrapR=ri,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Qe=class{constructor(t=0,e=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=s}static slerpFlat(t,e,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],u=i[s+3],d=r[o+0],f=r[o+1],g=r[o+2],x=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(a===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=x;return}if(u!==x||l!==d||c!==f||h!==g){let m=1-a,p=l*d+c*f+h*g+u*x,w=p>=0?1:-1,_=1-p*p;if(_>Number.EPSILON){let C=Math.sqrt(_),A=Math.atan2(C,p*w);m=Math.sin(m*A)/C,a=Math.sin(a*A)/C}let y=a*w;if(l=l*m+d*y,c=c*m+f*y,h=h*m+g*y,u=u*m+x*y,m===1-a){let C=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=C,c*=C,h*=C,u*=C}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],u=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return t[e]=a*g+h*u+l*f-c*d,t[e+1]=l*g+h*d+c*u-a*f,t[e+2]=c*g+h*f+a*d-l*u,t[e+3]=h*g-a*u-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,s){return this._x=t,this._y=e,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let i=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),u=a(r/2),d=l(i/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"YZX":this._x=d*h*u+c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u-d*f*g;break;case"XZY":this._x=d*h*u-c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let i=e/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,i=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=i+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(i>a&&i>u){let f=2*Math.sqrt(1+i-a-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>u){let f=2*Math.sqrt(1+a-i-u);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-i-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<Number.EPSILON?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Be(this.dot(t),-1,1)))}rotateTowards(t,e){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,e/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let i=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let i=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+i*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=i,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let f=1-e;return this._w=f*o+e*this._w,this._x=f*i+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,a),u=Math.sin((1-e)*h)/c,d=Math.sin(e*h)/c;return this._w=o*u+this._w*d,this._x=i*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},N=class n{constructor(t=0,e=0,i=0){n.prototype.isVector3=!0,this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(dd.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(dd.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6]*s,this.y=r[1]*e+r[4]*i+r[7]*s,this.z=r[2]*e+r[5]*i+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,i=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,i=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*i),h=2*(a*e-r*s),u=2*(r*i-o*e);return this.x=e+l*c+o*u-a*h,this.y=i+l*h+a*c-r*u,this.z=s+l*u+r*h-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,i=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*s,this.y=r[1]*e+r[5]*i+r[9]*s,this.z=r[2]*e+r[6]*i+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(t,Math.min(e,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let i=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return bl.copy(this).projectOnVector(t),this.sub(bl)}reflect(t){return this.sub(bl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let i=this.dot(t)/e;return Math.acos(Be(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return e*e+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){let s=Math.sin(e)*t;return this.x=s*Math.sin(i),this.y=Math.cos(e)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},bl=new N,dd=new Qe,ci=class{constructor(t=new N(1/0,1/0,1/0),e=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Mn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Mn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let i=Mn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let r=i.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Mn):Mn.fromBufferAttribute(r,o),Mn.applyMatrix4(t.matrixWorld),this.expandByPoint(Mn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),_o.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),_o.copy(i.boundingBox)),_o.applyMatrix4(t.matrixWorld),this.union(_o)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Mn),Mn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ur),Mo.subVectors(this.max,ur),_s.subVectors(t.a,ur),Ms.subVectors(t.b,ur),bs.subVectors(t.c,ur),yi.subVectors(Ms,_s),_i.subVectors(bs,Ms),Yi.subVectors(_s,bs);let e=[0,-yi.z,yi.y,0,-_i.z,_i.y,0,-Yi.z,Yi.y,yi.z,0,-yi.x,_i.z,0,-_i.x,Yi.z,0,-Yi.x,-yi.y,yi.x,0,-_i.y,_i.x,0,-Yi.y,Yi.x,0];return!Sl(e,_s,Ms,bs,Mo)||(e=[1,0,0,0,1,0,0,0,1],!Sl(e,_s,Ms,bs,Mo))?!1:(bo.crossVectors(yi,_i),e=[bo.x,bo.y,bo.z],Sl(e,_s,Ms,bs,Mo))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Mn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Mn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Kn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Kn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Kn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Kn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Kn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Kn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Kn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Kn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Kn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},Kn=[new N,new N,new N,new N,new N,new N,new N,new N],Mn=new N,_o=new ci,_s=new N,Ms=new N,bs=new N,yi=new N,_i=new N,Yi=new N,ur=new N,Mo=new N,bo=new N,$i=new N;function Sl(n,t,e,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){$i.fromArray(n,r);let a=s.x*Math.abs($i.x)+s.y*Math.abs($i.y)+s.z*Math.abs($i.z),l=t.dot($i),c=e.dot($i),h=i.dot($i);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var v0=new ci,dr=new N,wl=new N,Pi=class{constructor(t=new N,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let i=this.center;e!==void 0?i.copy(e):v0.setFromPoints(t).getCenter(i);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,i.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;dr.subVectors(t,this.center);let e=dr.lengthSq();if(e>this.radius*this.radius){let i=Math.sqrt(e),s=(i-this.radius)*.5;this.center.addScaledVector(dr,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(wl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(dr.copy(t.center).add(wl)),this.expandByPoint(dr.copy(t.center).sub(wl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},jn=new N,El=new N,So=new N,Mi=new N,Tl=new N,wo=new N,Al=new N,wr=class{constructor(t=new N,e=new N(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,jn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=jn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(jn.copy(this.origin).addScaledVector(this.direction,e),jn.distanceToSquared(t))}distanceSqToSegment(t,e,i,s){El.copy(t).add(e).multiplyScalar(.5),So.copy(e).sub(t).normalize(),Mi.copy(this.origin).sub(El);let r=t.distanceTo(e)*.5,o=-this.direction.dot(So),a=Mi.dot(this.direction),l=-Mi.dot(So),c=Mi.lengthSq(),h=Math.abs(1-o*o),u,d,f,g;if(h>0)if(u=o*l-a,d=o*a-l,g=r*h,u>=0)if(d>=-g)if(d<=g){let x=1/h;u*=x,d*=x,f=u*(u+o*d+2*a)+d*(o*u+d+2*l)+c}else d=r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(El).addScaledVector(So,d),f}intersectSphere(t,e){jn.subVectors(t.center,this.origin);let i=jn.dot(this.direction),s=jn.dot(jn)-i*i,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){let i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(i=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(i=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),h>=0?(r=(t.min.y-d.y)*h,o=(t.max.y-d.y)*h):(r=(t.max.y-d.y)*h,o=(t.min.y-d.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(a=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,e)}intersectsBox(t){return this.intersectBox(t,jn)!==null}intersectTriangle(t,e,i,s,r){Tl.subVectors(e,t),wo.subVectors(i,t),Al.crossVectors(Tl,wo);let o=this.direction.dot(Al),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Mi.subVectors(this.origin,t);let l=a*this.direction.dot(wo.crossVectors(Mi,wo));if(l<0)return null;let c=a*this.direction.dot(Tl.cross(Mi));if(c<0||l+c>o)return null;let h=-a*Mi.dot(Al);return h<0?null:this.at(h/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},oe=class n{constructor(t,e,i,s,r,o,a,l,c,h,u,d,f,g,x,m){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,s,r,o,a,l,c,h,u,d,f,g,x,m)}set(t,e,i,s,r,o,a,l,c,h,u,d,f,g,x,m){let p=this.elements;return p[0]=t,p[4]=e,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=g,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(t){let e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){let e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,i=t.elements,s=1/Ss.setFromMatrixColumn(t,0).length(),r=1/Ss.setFromMatrixColumn(t,1).length(),o=1/Ss.setFromMatrixColumn(t,2).length();return e[0]=i[0]*s,e[1]=i[1]*s,e[2]=i[2]*s,e[3]=0,e[4]=i[4]*r,e[5]=i[5]*r,e[6]=i[6]*r,e[7]=0,e[8]=i[8]*o,e[9]=i[9]*o,e[10]=i[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,i=t.x,s=t.y,r=t.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let d=o*h,f=o*u,g=a*h,x=a*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=f+g*c,e[5]=d-x*c,e[9]=-a*l,e[2]=x-d*c,e[6]=g+f*c,e[10]=o*l}else if(t.order==="YXZ"){let d=l*h,f=l*u,g=c*h,x=c*u;e[0]=d+x*a,e[4]=g*a-f,e[8]=o*c,e[1]=o*u,e[5]=o*h,e[9]=-a,e[2]=f*a-g,e[6]=x+d*a,e[10]=o*l}else if(t.order==="ZXY"){let d=l*h,f=l*u,g=c*h,x=c*u;e[0]=d-x*a,e[4]=-o*u,e[8]=g+f*a,e[1]=f+g*a,e[5]=o*h,e[9]=x-d*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let d=o*h,f=o*u,g=a*h,x=a*u;e[0]=l*h,e[4]=g*c-f,e[8]=d*c+x,e[1]=l*u,e[5]=x*c+d,e[9]=f*c-g,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let d=o*l,f=o*c,g=a*l,x=a*c;e[0]=l*h,e[4]=x-d*u,e[8]=g*u+f,e[1]=u,e[5]=o*h,e[9]=-a*h,e[2]=-c*h,e[6]=f*u+g,e[10]=d-x*u}else if(t.order==="XZY"){let d=o*l,f=o*c,g=a*l,x=a*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+x,e[5]=o*h,e[9]=f*u-g,e[2]=g*u-f,e[6]=a*h,e[10]=x*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(y0,t,_0)}lookAt(t,e,i){let s=this.elements;return rn.subVectors(t,e),rn.lengthSq()===0&&(rn.z=1),rn.normalize(),bi.crossVectors(i,rn),bi.lengthSq()===0&&(Math.abs(i.z)===1?rn.x+=1e-4:rn.z+=1e-4,rn.normalize(),bi.crossVectors(i,rn)),bi.normalize(),Eo.crossVectors(rn,bi),s[0]=bi.x,s[4]=Eo.x,s[8]=rn.x,s[1]=bi.y,s[5]=Eo.y,s[9]=rn.y,s[2]=bi.z,s[6]=Eo.z,s[10]=rn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let i=t.elements,s=e.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],u=i[5],d=i[9],f=i[13],g=i[2],x=i[6],m=i[10],p=i[14],w=i[3],_=i[7],y=i[11],C=i[15],A=s[0],I=s[4],D=s[8],T=s[12],M=s[1],U=s[5],G=s[9],k=s[13],W=s[2],j=s[6],X=s[10],st=s[14],Y=s[3],dt=s[7],_t=s[11],Rt=s[15];return r[0]=o*A+a*M+l*W+c*Y,r[4]=o*I+a*U+l*j+c*dt,r[8]=o*D+a*G+l*X+c*_t,r[12]=o*T+a*k+l*st+c*Rt,r[1]=h*A+u*M+d*W+f*Y,r[5]=h*I+u*U+d*j+f*dt,r[9]=h*D+u*G+d*X+f*_t,r[13]=h*T+u*k+d*st+f*Rt,r[2]=g*A+x*M+m*W+p*Y,r[6]=g*I+x*U+m*j+p*dt,r[10]=g*D+x*G+m*X+p*_t,r[14]=g*T+x*k+m*st+p*Rt,r[3]=w*A+_*M+y*W+C*Y,r[7]=w*I+_*U+y*j+C*dt,r[11]=w*D+_*G+y*X+C*_t,r[15]=w*T+_*k+y*st+C*Rt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],i=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],f=t[14],g=t[3],x=t[7],m=t[11],p=t[15];return g*(+r*l*u-s*c*u-r*a*d+i*c*d+s*a*f-i*l*f)+x*(+e*l*f-e*c*d+r*o*d-s*o*f+s*c*h-r*l*h)+m*(+e*c*u-e*a*f-r*o*u+i*o*f+r*a*h-i*c*h)+p*(-s*a*h-e*l*u+e*a*d+s*o*u-i*o*d+i*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=i),this}invert(){let t=this.elements,e=t[0],i=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],f=t[11],g=t[12],x=t[13],m=t[14],p=t[15],w=u*m*c-x*d*c+x*l*f-a*m*f-u*l*p+a*d*p,_=g*d*c-h*m*c-g*l*f+o*m*f+h*l*p-o*d*p,y=h*x*c-g*u*c+g*a*f-o*x*f-h*a*p+o*u*p,C=g*u*l-h*x*l-g*a*d+o*x*d+h*a*m-o*u*m,A=e*w+i*_+s*y+r*C;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let I=1/A;return t[0]=w*I,t[1]=(x*d*r-u*m*r-x*s*f+i*m*f+u*s*p-i*d*p)*I,t[2]=(a*m*r-x*l*r+x*s*c-i*m*c-a*s*p+i*l*p)*I,t[3]=(u*l*r-a*d*r-u*s*c+i*d*c+a*s*f-i*l*f)*I,t[4]=_*I,t[5]=(h*m*r-g*d*r+g*s*f-e*m*f-h*s*p+e*d*p)*I,t[6]=(g*l*r-o*m*r-g*s*c+e*m*c+o*s*p-e*l*p)*I,t[7]=(o*d*r-h*l*r+h*s*c-e*d*c-o*s*f+e*l*f)*I,t[8]=y*I,t[9]=(g*u*r-h*x*r-g*i*f+e*x*f+h*i*p-e*u*p)*I,t[10]=(o*x*r-g*a*r+g*i*c-e*x*c-o*i*p+e*a*p)*I,t[11]=(h*a*r-o*u*r-h*i*c+e*u*c+o*i*f-e*a*f)*I,t[12]=C*I,t[13]=(h*x*s-g*u*s+g*i*d-e*x*d-h*i*m+e*u*m)*I,t[14]=(g*a*s-o*x*s-g*i*l+e*x*l+o*i*m-e*a*m)*I,t[15]=(o*u*s-h*a*s+h*i*l-e*u*l-o*i*d+e*a*d)*I,this}scale(t){let e=this.elements,i=t.x,s=t.y,r=t.z;return e[0]*=i,e[4]*=s,e[8]*=r,e[1]*=i,e[5]*=s,e[9]*=r,e[2]*=i,e[6]*=s,e[10]*=r,e[3]*=i,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,s))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let i=Math.cos(e),s=Math.sin(e),r=1-i,o=t.x,a=t.y,l=t.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,s,r,o){return this.set(1,i,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,i){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,h=o+o,u=a+a,d=r*c,f=r*h,g=r*u,x=o*h,m=o*u,p=a*u,w=l*c,_=l*h,y=l*u,C=i.x,A=i.y,I=i.z;return s[0]=(1-(x+p))*C,s[1]=(f+y)*C,s[2]=(g-_)*C,s[3]=0,s[4]=(f-y)*A,s[5]=(1-(d+p))*A,s[6]=(m+w)*A,s[7]=0,s[8]=(g+_)*I,s[9]=(m-w)*I,s[10]=(1-(d+x))*I,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,i){let s=this.elements,r=Ss.set(s[0],s[1],s[2]).length(),o=Ss.set(s[4],s[5],s[6]).length(),a=Ss.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],bn.copy(this);let c=1/r,h=1/o,u=1/a;return bn.elements[0]*=c,bn.elements[1]*=c,bn.elements[2]*=c,bn.elements[4]*=h,bn.elements[5]*=h,bn.elements[6]*=h,bn.elements[8]*=u,bn.elements[9]*=u,bn.elements[10]*=u,e.setFromRotationMatrix(bn),i.x=r,i.y=o,i.z=a,this}makePerspective(t,e,i,s,r,o,a=oi){let l=this.elements,c=2*r/(e-t),h=2*r/(i-s),u=(e+t)/(e-t),d=(i+s)/(i-s),f,g;if(a===oi)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===Qo)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,i,s,r,o,a=oi){let l=this.elements,c=1/(e-t),h=1/(i-s),u=1/(o-r),d=(e+t)*c,f=(i+s)*h,g,x;if(a===oi)g=(o+r)*u,x=-2*u;else if(a===Qo)g=r*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,i=t.elements;for(let s=0;s<16;s++)if(e[s]!==i[s])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){let i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}},Ss=new N,bn=new oe,y0=new N(0,0,0),_0=new N(1,1,1),bi=new N,Eo=new N,rn=new N,fd=new oe,pd=new Qe,Ve=class n{constructor(t=0,e=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,s=this._order){return this._x=t,this._y=e,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Be(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Be(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Be(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Be(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Be(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Be(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return fd.makeRotationFromQuaternion(t),this.setFromRotationMatrix(fd,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return pd.setFromEuler(this),this.setFromQuaternion(pd,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ve.DEFAULT_ORDER="XYZ";var Er=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},M0=0,md=new N,ws=new Qe,Qn=new oe,To=new N,fr=new N,b0=new N,S0=new Qe,gd=new N(1,0,0),xd=new N(0,1,0),vd=new N(0,0,1),yd={type:"added"},w0={type:"removed"},Es={type:"childadded",child:null},Rl={type:"childremoved",child:null},Ge=class n extends Ii{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:M0++}),this.uuid=Ys(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let t=new N,e=new Ve,i=new Qe,s=new N(1,1,1);function r(){i.setFromEuler(e,!1)}function o(){e.setFromQuaternion(i,void 0,!1)}e._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new oe},normalMatrix:{value:new jt}}),this.matrix=new oe,this.matrixWorld=new oe,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Er,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ws.setFromAxisAngle(t,e),this.quaternion.multiply(ws),this}rotateOnWorldAxis(t,e){return ws.setFromAxisAngle(t,e),this.quaternion.premultiply(ws),this}rotateX(t){return this.rotateOnAxis(gd,t)}rotateY(t){return this.rotateOnAxis(xd,t)}rotateZ(t){return this.rotateOnAxis(vd,t)}translateOnAxis(t,e){return md.copy(t).applyQuaternion(this.quaternion),this.position.add(md.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(gd,t)}translateY(t){return this.translateOnAxis(xd,t)}translateZ(t){return this.translateOnAxis(vd,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Qn.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?To.copy(t):To.set(t,e,i);let s=this.parent;this.updateWorldMatrix(!0,!1),fr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qn.lookAt(fr,To,this.up):Qn.lookAt(To,fr,this.up),this.quaternion.setFromRotationMatrix(Qn),s&&(Qn.extractRotation(s.matrixWorld),ws.setFromRotationMatrix(Qn),this.quaternion.premultiply(ws.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(yd),Es.child=t,this.dispatchEvent(Es),Es.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(w0),Rl.child=t,this.dispatchEvent(Rl),Rl.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Qn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Qn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Qn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(yd),Es.child=t,this.dispatchEvent(Es),Es.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fr,t,b0),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fr,S0,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let i=0,s=e.length;i<s;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),h=o(t.images),u=o(t.shapes),d=o(t.skeletons),f=o(t.animations),g=o(t.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}};Ge.DEFAULT_UP=new N(0,1,0);Ge.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ge.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Sn=new N,ti=new N,Cl=new N,ei=new N,Ts=new N,As=new N,_d=new N,Il=new N,Pl=new N,Ll=new N,Dl=new we,Ul=new we,Nl=new we,es=class n{constructor(t=new N,e=new N,i=new N){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,s){s.subVectors(i,e),Sn.subVectors(t,e),s.cross(Sn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,i,s,r){Sn.subVectors(s,e),ti.subVectors(i,e),Cl.subVectors(t,e);let o=Sn.dot(Sn),a=Sn.dot(ti),l=Sn.dot(Cl),c=ti.dot(ti),h=ti.dot(Cl),u=o*c-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(c*l-a*h)*d,g=(o*h-a*l)*d;return r.set(1-f-g,g,f)}static containsPoint(t,e,i,s){return this.getBarycoord(t,e,i,s,ei)===null?!1:ei.x>=0&&ei.y>=0&&ei.x+ei.y<=1}static getInterpolation(t,e,i,s,r,o,a,l){return this.getBarycoord(t,e,i,s,ei)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ei.x),l.addScaledVector(o,ei.y),l.addScaledVector(a,ei.z),l)}static getInterpolatedAttribute(t,e,i,s,r,o){return Dl.setScalar(0),Ul.setScalar(0),Nl.setScalar(0),Dl.fromBufferAttribute(t,e),Ul.fromBufferAttribute(t,i),Nl.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Dl,r.x),o.addScaledVector(Ul,r.y),o.addScaledVector(Nl,r.z),o}static isFrontFacing(t,e,i,s){return Sn.subVectors(i,e),ti.subVectors(t,e),Sn.cross(ti).dot(s)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,s){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,i,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Sn.subVectors(this.c,this.b),ti.subVectors(this.a,this.b),Sn.cross(ti).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return n.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return n.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,s,r){return n.getInterpolation(t,this.a,this.b,this.c,e,i,s,r)}containsPoint(t){return n.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return n.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let i=this.a,s=this.b,r=this.c,o,a;Ts.subVectors(s,i),As.subVectors(r,i),Il.subVectors(t,i);let l=Ts.dot(Il),c=As.dot(Il);if(l<=0&&c<=0)return e.copy(i);Pl.subVectors(t,s);let h=Ts.dot(Pl),u=As.dot(Pl);if(h>=0&&u<=h)return e.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return o=l/(l-h),e.copy(i).addScaledVector(Ts,o);Ll.subVectors(t,r);let f=Ts.dot(Ll),g=As.dot(Ll);if(g>=0&&f<=g)return e.copy(r);let x=f*c-l*g;if(x<=0&&c>=0&&g<=0)return a=c/(c-g),e.copy(i).addScaledVector(As,a);let m=h*g-f*u;if(m<=0&&u-h>=0&&f-g>=0)return _d.subVectors(r,s),a=(u-h)/(u-h+(f-g)),e.copy(s).addScaledVector(_d,a);let p=1/(m+x+d);return o=x*p,a=d*p,e.copy(i).addScaledVector(Ts,o).addScaledVector(As,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},bf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Si={h:0,s:0,l:0},Ao={h:0,s:0,l:0};function Fl(n,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?n+(t-n)*6*e:e<1/2?t:e<2/3?n+(t-n)*6*(2/3-e):n}var Wt=class{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ke){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,re.toWorkingColorSpace(this,e),this}setRGB(t,e,i,s=re.workingColorSpace){return this.r=t,this.g=e,this.b=i,re.toWorkingColorSpace(this,s),this}setHSL(t,e,i,s=re.workingColorSpace){if(t=u0(t,1),e=Be(e,0,1),i=Be(i,0,1),e===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+e):i+e-i*e,o=2*i-r;this.r=Fl(o,r,t+1/3),this.g=Fl(o,r,t),this.b=Fl(o,r,t-1/3)}return re.toWorkingColorSpace(this,s),this}setStyle(t,e=Ke){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ke){let i=bf[t.toLowerCase()];return i!==void 0?this.setHex(i,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=li(t.r),this.g=li(t.g),this.b=li(t.b),this}copyLinearToSRGB(t){return this.r=Fs(t.r),this.g=Fs(t.g),this.b=Fs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ke){return re.fromWorkingColorSpace(ke.copy(this),t),Math.round(Be(ke.r*255,0,255))*65536+Math.round(Be(ke.g*255,0,255))*256+Math.round(Be(ke.b*255,0,255))}getHexString(t=Ke){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=re.workingColorSpace){re.fromWorkingColorSpace(ke.copy(this),e);let i=ke.r,s=ke.g,r=ke.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let u=o-a;switch(c=h<=.5?u/(o+a):u/(2-o-a),o){case i:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-i)/u+2;break;case r:l=(i-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=re.workingColorSpace){return re.fromWorkingColorSpace(ke.copy(this),e),t.r=ke.r,t.g=ke.g,t.b=ke.b,t}getStyle(t=Ke){re.fromWorkingColorSpace(ke.copy(this),t);let e=ke.r,i=ke.g,s=ke.b;return t!==Ke?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,e,i){return this.getHSL(Si),this.setHSL(Si.h+t,Si.s+e,Si.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(Si),t.getHSL(Ao);let i=yl(Si.h,Ao.h,e),s=yl(Si.s,Ao.s,e),r=yl(Si.l,Ao.l,e);return this.setHSL(i,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,i=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*i+r[6]*s,this.g=r[1]*e+r[4]*i+r[7]*s,this.b=r[2]*e+r[5]*i+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ke=new Wt;Wt.NAMES=bf;var E0=0,Li=class extends Ii{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:E0++}),this.uuid=Ys(),this.name="",this.blending=Ai,this.side=Ci,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Jl,this.blendDst=Kl,this.blendEquation=ts,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Wt(0,0,0),this.blendAlpha=0,this.depthFunc=Os,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=id,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=vs,this.stencilZFail=vs,this.stencilZPass=vs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let i=t[e];if(i===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[e]=i}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Ai&&(i.blending=this.blending),this.side!==Ci&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Jl&&(i.blendSrc=this.blendSrc),this.blendDst!==Kl&&(i.blendDst=this.blendDst),this.blendEquation!==ts&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Os&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==id&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==vs&&(i.stencilFail=this.stencilFail),this.stencilZFail!==vs&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==vs&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,i=null;if(e!==null){let s=e.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=e[r].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},zn=class extends Li{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ve,this.combine=wh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var Ce=new N,Ro=new ct,qe=class{constructor(t,e,i=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=sd,this.updateRanges=[],this.gpuType=Fn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Ro.fromBufferAttribute(this,e),Ro.applyMatrix3(t),this.setXY(e,Ro.x,Ro.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)Ce.fromBufferAttribute(this,e),Ce.applyMatrix3(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)Ce.fromBufferAttribute(this,e),Ce.applyMatrix4(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)Ce.fromBufferAttribute(this,e),Ce.applyNormalMatrix(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)Ce.fromBufferAttribute(this,e),Ce.transformDirection(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=hr(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=Je(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=hr(e,this.array)),e}setX(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=hr(e,this.array)),e}setY(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=hr(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=hr(e,this.array)),e}setW(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=Je(e,this.array),i=Je(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,s){return t*=this.itemSize,this.normalized&&(e=Je(e,this.array),i=Je(i,this.array),s=Je(s,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,e,i,s,r){return t*=this.itemSize,this.normalized&&(e=Je(e,this.array),i=Je(i,this.array),s=Je(s,this.array),r=Je(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==sd&&(t.usage=this.usage),t}};var ia=class extends qe{constructor(t,e,i){super(new Uint16Array(t),e,i)}};var sa=class extends qe{constructor(t,e,i){super(new Uint32Array(t),e,i)}};var ae=class extends qe{constructor(t,e,i){super(new Float32Array(t),e,i)}},T0=0,pn=new oe,zl=new Ge,Rs=new N,on=new ci,pr=new ci,De=new N,Ae=class n extends Ii{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:T0++}),this.uuid=Ys(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Mf(t)?sa:ia)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new jt().getNormalMatrix(t);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return pn.makeRotationFromQuaternion(t),this.applyMatrix4(pn),this}rotateX(t){return pn.makeRotationX(t),this.applyMatrix4(pn),this}rotateY(t){return pn.makeRotationY(t),this.applyMatrix4(pn),this}rotateZ(t){return pn.makeRotationZ(t),this.applyMatrix4(pn),this}translate(t,e,i){return pn.makeTranslation(t,e,i),this.applyMatrix4(pn),this}scale(t,e,i){return pn.makeScale(t,e,i),this.applyMatrix4(pn),this}lookAt(t){return zl.lookAt(t),zl.updateMatrix(),this.applyMatrix4(zl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Rs).negate(),this.translate(Rs.x,Rs.y,Rs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let i=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new ae(i,3))}else{for(let i=0,s=e.count;i<s;i++){let r=t[i];e.setXYZ(i,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ci);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,s=e.length;i<s;i++){let r=e[i];on.setFromBufferAttribute(r),this.morphTargetsRelative?(De.addVectors(this.boundingBox.min,on.min),this.boundingBox.expandByPoint(De),De.addVectors(this.boundingBox.max,on.max),this.boundingBox.expandByPoint(De)):(this.boundingBox.expandByPoint(on.min),this.boundingBox.expandByPoint(on.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Pi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(t){let i=this.boundingSphere.center;if(on.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];pr.setFromBufferAttribute(a),this.morphTargetsRelative?(De.addVectors(on.min,pr.min),on.expandByPoint(De),De.addVectors(on.max,pr.max),on.expandByPoint(De)):(on.expandByPoint(pr.min),on.expandByPoint(pr.max))}on.getCenter(i);let s=0;for(let r=0,o=t.count;r<o;r++)De.fromBufferAttribute(t,r),s=Math.max(s,i.distanceToSquared(De));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)De.fromBufferAttribute(a,c),l&&(Rs.fromBufferAttribute(t,c),De.add(Rs)),s=Math.max(s,i.distanceToSquared(De))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new qe(new Float32Array(4*i.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let D=0;D<i.count;D++)a[D]=new N,l[D]=new N;let c=new N,h=new N,u=new N,d=new ct,f=new ct,g=new ct,x=new N,m=new N;function p(D,T,M){c.fromBufferAttribute(i,D),h.fromBufferAttribute(i,T),u.fromBufferAttribute(i,M),d.fromBufferAttribute(r,D),f.fromBufferAttribute(r,T),g.fromBufferAttribute(r,M),h.sub(c),u.sub(c),f.sub(d),g.sub(d);let U=1/(f.x*g.y-g.x*f.y);isFinite(U)&&(x.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(U),m.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(U),a[D].add(x),a[T].add(x),a[M].add(x),l[D].add(m),l[T].add(m),l[M].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:t.count}]);for(let D=0,T=w.length;D<T;++D){let M=w[D],U=M.start,G=M.count;for(let k=U,W=U+G;k<W;k+=3)p(t.getX(k+0),t.getX(k+1),t.getX(k+2))}let _=new N,y=new N,C=new N,A=new N;function I(D){C.fromBufferAttribute(s,D),A.copy(C);let T=a[D];_.copy(T),_.sub(C.multiplyScalar(C.dot(T))).normalize(),y.crossVectors(A,T);let U=y.dot(l[D])<0?-1:1;o.setXYZW(D,_.x,_.y,_.z,U)}for(let D=0,T=w.length;D<T;++D){let M=w[D],U=M.start,G=M.count;for(let k=U,W=U+G;k<W;k+=3)I(t.getX(k+0)),I(t.getX(k+1)),I(t.getX(k+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new qe(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let s=new N,r=new N,o=new N,a=new N,l=new N,c=new N,h=new N,u=new N;if(t)for(let d=0,f=t.count;d<f;d+=3){let g=t.getX(d+0),x=t.getX(d+1),m=t.getX(d+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,x),o.fromBufferAttribute(e,m),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(i,g),l.fromBufferAttribute(i,x),c.fromBufferAttribute(i,m),a.add(h),l.add(h),c.add(h),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(x,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)De.fromBufferAttribute(t,e),De.normalize(),t.setXYZ(e,De.x,De.y,De.z)}toNonIndexed(){function t(a,l){let c=a.array,h=a.itemSize,u=a.normalized,d=new c.constructor(l.length*h),f=0,g=0;for(let x=0,m=l.length;x<m;x++){a.isInterleavedBufferAttribute?f=l[x]*a.data.stride+a.offset:f=l[x]*h;for(let p=0;p<h;p++)d[g++]=c[f++]}return new qe(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,i);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=t(d,i);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Md=new oe,Zi=new wr,Co=new Pi,bd=new N,Io=new N,Po=new N,Lo=new N,Ol=new N,Do=new N,Sd=new N,Uo=new N,Me=class extends Ge{constructor(t=new Ae,e=new zn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){Do.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],u=r[l];h!==0&&(Ol.fromBufferAttribute(u,t),o?Do.addScaledVector(Ol,h):Do.addScaledVector(Ol.sub(e),h))}e.add(Do)}return e}raycast(t,e){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Co.copy(i.boundingSphere),Co.applyMatrix4(r),Zi.copy(t.ray).recast(t.near),!(Co.containsPoint(Zi.origin)===!1&&(Zi.intersectSphere(Co,bd)===null||Zi.origin.distanceToSquared(bd)>(t.far-t.near)**2))&&(Md.copy(r).invert(),Zi.copy(t.ray).applyMatrix4(Md),!(i.boundingBox!==null&&Zi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Zi)))}_computeIntersections(t,e,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){let m=d[g],p=o[m.materialIndex],w=Math.max(m.start,f.start),_=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let y=w,C=_;y<C;y+=3){let A=a.getX(y),I=a.getX(y+1),D=a.getX(y+2);s=No(this,p,t,i,c,h,u,A,I,D),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,f.start),x=Math.min(a.count,f.start+f.count);for(let m=g,p=x;m<p;m+=3){let w=a.getX(m),_=a.getX(m+1),y=a.getX(m+2);s=No(this,o,t,i,c,h,u,w,_,y),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){let m=d[g],p=o[m.materialIndex],w=Math.max(m.start,f.start),_=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let y=w,C=_;y<C;y+=3){let A=y,I=y+1,D=y+2;s=No(this,p,t,i,c,h,u,A,I,D),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let m=g,p=x;m<p;m+=3){let w=m,_=m+1,y=m+2;s=No(this,o,t,i,c,h,u,w,_,y),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}};function A0(n,t,e,i,s,r,o,a){let l;if(t.side===je?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,t.side===Ci,a),l===null)return null;Uo.copy(a),Uo.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Uo);return c<e.near||c>e.far?null:{distance:c,point:Uo.clone(),object:n}}function No(n,t,e,i,s,r,o,a,l,c){n.getVertexPosition(a,Io),n.getVertexPosition(l,Po),n.getVertexPosition(c,Lo);let h=A0(n,t,e,i,Io,Po,Lo,Sd);if(h){let u=new N;es.getBarycoord(Sd,Io,Po,Lo,u),s&&(h.uv=es.getInterpolatedAttribute(s,a,l,c,u,new ct)),r&&(h.uv1=es.getInterpolatedAttribute(r,a,l,c,u,new ct)),o&&(h.normal=es.getInterpolatedAttribute(o,a,l,c,u,new N),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:l,c,normal:new N,materialIndex:0};es.getNormal(Io,Po,Lo,d.normal),h.face=d,h.barycoord=u}return h}var An=class n extends Ae{constructor(t=1,e=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],d=0,f=0;g("z","y","x",-1,-1,i,e,t,o,r,0),g("z","y","x",1,-1,i,e,-t,o,r,1),g("x","z","y",1,1,t,i,e,s,o,2),g("x","z","y",1,-1,t,i,-e,s,o,3),g("x","y","z",1,-1,t,e,i,s,r,4),g("x","y","z",-1,-1,t,e,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new ae(c,3)),this.setAttribute("normal",new ae(h,3)),this.setAttribute("uv",new ae(u,2));function g(x,m,p,w,_,y,C,A,I,D,T){let M=y/I,U=C/D,G=y/2,k=C/2,W=A/2,j=I+1,X=D+1,st=0,Y=0,dt=new N;for(let _t=0;_t<X;_t++){let Rt=_t*U-k;for(let Zt=0;Zt<j;Zt++){let ue=Zt*M-G;dt[x]=ue*w,dt[m]=Rt*_,dt[p]=W,c.push(dt.x,dt.y,dt.z),dt[x]=0,dt[m]=0,dt[p]=A>0?1:-1,h.push(dt.x,dt.y,dt.z),u.push(Zt/I),u.push(1-_t/D),st+=1}}for(let _t=0;_t<D;_t++)for(let Rt=0;Rt<I;Rt++){let Zt=d+Rt+j*_t,ue=d+Rt+j*(_t+1),K=d+(Rt+1)+j*(_t+1),ot=d+(Rt+1)+j*_t;l.push(Zt,ue,ot),l.push(ue,K,ot),Y+=6}a.addGroup(f,Y,T),f+=Y,d+=st}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function Gs(n){let t={};for(let e in n){t[e]={};for(let i in n[e]){let s=n[e][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=s.clone():Array.isArray(s)?t[e][i]=s.slice():t[e][i]=s}}return t}function Xe(n){let t={};for(let e=0;e<n.length;e++){let i=Gs(n[e]);for(let s in i)t[s]=i[s]}return t}function R0(n){let t=[];for(let e=0;e<n.length;e++)t.push(n[e].clone());return t}function Sf(n){let t=n.getRenderTarget();return t===null?n.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:re.workingColorSpace}var C0={clone:Gs,merge:Xe},I0=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,P0=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ye=class extends Li{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=I0,this.fragmentShader=P0,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Gs(t.uniforms),this.uniformsGroups=R0(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}},ra=class extends Ge{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new oe,this.projectionMatrix=new oe,this.projectionMatrixInverse=new oe,this.coordinateSystem=oi}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},wi=new N,wd=new ct,Ed=new ct,He=class extends ra{constructor(t=50,e=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Fc*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(vl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Fc*2*Math.atan(Math.tan(vl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){wi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(wi.x,wi.y).multiplyScalar(-t/wi.z),wi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(wi.x,wi.y).multiplyScalar(-t/wi.z)}getViewSize(t,e){return this.getViewBounds(t,wd,Ed),e.subVectors(Ed,wd)}setViewOffset(t,e,i,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(vl*.5*this.fov)/this.zoom,i=2*e,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-i,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Cs=-90,Is=1,Bc=class extends Ge{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new He(Cs,Is,t,e);s.layers=this.layers,this.add(s);let r=new He(Cs,Is,t,e);r.layers=this.layers,this.add(r);let o=new He(Cs,Is,t,e);o.layers=this.layers,this.add(o);let a=new He(Cs,Is,t,e);a.layers=this.layers,this.add(a);let l=new He(Cs,Is,t,e);l.layers=this.layers,this.add(l);let c=new He(Cs,Is,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[i,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===oi)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Qo)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let x=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,t.setRenderTarget(i,0,s),t.render(e,r),t.setRenderTarget(i,1,s),t.render(e,o),t.setRenderTarget(i,2,s),t.render(e,a),t.setRenderTarget(i,3,s),t.render(e,l),t.setRenderTarget(i,4,s),t.render(e,c),i.texture.generateMipmaps=x,t.setRenderTarget(i,5,s),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},oa=class extends cn{constructor(t,e,i,s,r,o,a,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:ks,super(t,e,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Hc=class extends Tn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new oa(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:an}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new An(5,5,5),r=new Ye({name:"CubemapFromEquirect",uniforms:Gs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:je,blending:Ti});r.uniforms.tEquirect.value=e;let o=new Me(s,r),a=e.minFilter;return e.minFilter===is&&(e.minFilter=an),new Bc(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,i,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,i,s);t.setRenderTarget(r)}},kl=new N,L0=new N,D0=new jt,ii=class{constructor(t=new N(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,s){return this.normal.set(t,e,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){let s=kl.subVectors(i,e).cross(L0.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let i=t.delta(kl),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(i,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let i=e||D0.getNormalMatrix(t),s=this.coplanarPoint(kl).applyMatrix4(t),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ji=new Pi,Fo=new N,Tr=class{constructor(t=new ii,e=new ii,i=new ii,s=new ii,r=new ii,o=new ii){this.planes=[t,e,i,s,r,o]}set(t,e,i,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=oi){let i=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],h=s[5],u=s[6],d=s[7],f=s[8],g=s[9],x=s[10],m=s[11],p=s[12],w=s[13],_=s[14],y=s[15];if(i[0].setComponents(l-r,d-c,m-f,y-p).normalize(),i[1].setComponents(l+r,d+c,m+f,y+p).normalize(),i[2].setComponents(l+o,d+h,m+g,y+w).normalize(),i[3].setComponents(l-o,d-h,m-g,y-w).normalize(),i[4].setComponents(l-a,d-u,m-x,y-_).normalize(),e===oi)i[5].setComponents(l+a,d+u,m+x,y+_).normalize();else if(e===Qo)i[5].setComponents(a,u,x,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ji.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ji.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ji)}intersectsSprite(t){return Ji.center.set(0,0,0),Ji.radius=.7071067811865476,Ji.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ji)}intersectsSphere(t){let e=this.planes,i=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let i=0;i<6;i++){let s=e[i];if(Fo.x=s.normal.x>0?t.max.x:t.min.x,Fo.y=s.normal.y>0?t.max.y:t.min.y,Fo.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Fo)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function wf(){let n=null,t=!1,e=null,i=null;function s(r,o){e(r,o),i=n.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(s),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){n=r}}}function U0(n){let t=new WeakMap;function e(a,l){let c=a.array,h=a.usage,u=c.byteLength,d=n.createBuffer();n.bindBuffer(l,d),n.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:u}}function i(a,l,c){let h=l.array,u=l.updateRanges;if(n.bindBuffer(c,a),u.length===0)n.bufferSubData(c,0,h);else{u.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<u.length;f++){let g=u[d],x=u[f];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,u[d]=x)}u.length=d+1;for(let f=0,g=u.length;f<g;f++){let x=u[f];n.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(n.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var os=class n extends Ae{constructor(t=1,e=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,u=t/a,d=e/l,f=[],g=[],x=[],m=[];for(let p=0;p<h;p++){let w=p*d-o;for(let _=0;_<c;_++){let y=_*u-r;g.push(y,-w,0),x.push(0,0,1),m.push(_/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let w=0;w<a;w++){let _=w+c*p,y=w+c*(p+1),C=w+1+c*(p+1),A=w+1+c*p;f.push(_,y,A),f.push(y,C,A)}this.setIndex(f),this.setAttribute("position",new ae(g,3)),this.setAttribute("normal",new ae(x,3)),this.setAttribute("uv",new ae(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.width,t.height,t.widthSegments,t.heightSegments)}},N0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,F0=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,z0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,O0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,k0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,B0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,H0=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,V0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,G0=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,W0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,X0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,q0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Y0=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,$0=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Z0=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,J0=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,K0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,j0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Q0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,tg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,eg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,ng=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,ig=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,sg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,rg=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,og=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ag=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,lg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,cg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,hg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ug="gl_FragColor = linearToOutputTexel( gl_FragColor );",dg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,fg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,pg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,mg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,gg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,xg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,vg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,yg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,_g=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Mg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,bg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Sg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,wg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Eg=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Tg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Ag=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Rg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Cg=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Ig=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Pg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Lg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Dg=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ug=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ng=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Fg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,zg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Og=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,kg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bg=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Hg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Vg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Gg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Wg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Xg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,qg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Yg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$g=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Zg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Jg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Kg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,jg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Qg=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,tx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ex=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,nx=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,ix=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,sx=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,rx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ox=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ax=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,lx=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,cx=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,hx=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ux=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dx=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,fx=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,px=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,mx=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,gx=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,xx=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,vx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,yx=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,_x=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Mx=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,bx=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Sx=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,wx=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Ex=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Tx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Ax=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Rx=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Cx=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Ix=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Px=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Lx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Dx=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Ux=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Nx=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Fx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,zx=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ox=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Hx=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Vx=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Gx=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Wx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Xx=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,qx=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Yx=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$x=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Zx=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jx=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Kx=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jx=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Qx=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tv=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,ev=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,nv=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,iv=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,sv=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,rv=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ov=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,av=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lv=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,cv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,hv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,uv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,dv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,fv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,te={alphahash_fragment:N0,alphahash_pars_fragment:F0,alphamap_fragment:z0,alphamap_pars_fragment:O0,alphatest_fragment:k0,alphatest_pars_fragment:B0,aomap_fragment:H0,aomap_pars_fragment:V0,batching_pars_vertex:G0,batching_vertex:W0,begin_vertex:X0,beginnormal_vertex:q0,bsdfs:Y0,iridescence_fragment:$0,bumpmap_pars_fragment:Z0,clipping_planes_fragment:J0,clipping_planes_pars_fragment:K0,clipping_planes_pars_vertex:j0,clipping_planes_vertex:Q0,color_fragment:tg,color_pars_fragment:eg,color_pars_vertex:ng,color_vertex:ig,common:sg,cube_uv_reflection_fragment:rg,defaultnormal_vertex:og,displacementmap_pars_vertex:ag,displacementmap_vertex:lg,emissivemap_fragment:cg,emissivemap_pars_fragment:hg,colorspace_fragment:ug,colorspace_pars_fragment:dg,envmap_fragment:fg,envmap_common_pars_fragment:pg,envmap_pars_fragment:mg,envmap_pars_vertex:gg,envmap_physical_pars_fragment:Ag,envmap_vertex:xg,fog_vertex:vg,fog_pars_vertex:yg,fog_fragment:_g,fog_pars_fragment:Mg,gradientmap_pars_fragment:bg,lightmap_pars_fragment:Sg,lights_lambert_fragment:wg,lights_lambert_pars_fragment:Eg,lights_pars_begin:Tg,lights_toon_fragment:Rg,lights_toon_pars_fragment:Cg,lights_phong_fragment:Ig,lights_phong_pars_fragment:Pg,lights_physical_fragment:Lg,lights_physical_pars_fragment:Dg,lights_fragment_begin:Ug,lights_fragment_maps:Ng,lights_fragment_end:Fg,logdepthbuf_fragment:zg,logdepthbuf_pars_fragment:Og,logdepthbuf_pars_vertex:kg,logdepthbuf_vertex:Bg,map_fragment:Hg,map_pars_fragment:Vg,map_particle_fragment:Gg,map_particle_pars_fragment:Wg,metalnessmap_fragment:Xg,metalnessmap_pars_fragment:qg,morphinstance_vertex:Yg,morphcolor_vertex:$g,morphnormal_vertex:Zg,morphtarget_pars_vertex:Jg,morphtarget_vertex:Kg,normal_fragment_begin:jg,normal_fragment_maps:Qg,normal_pars_fragment:tx,normal_pars_vertex:ex,normal_vertex:nx,normalmap_pars_fragment:ix,clearcoat_normal_fragment_begin:sx,clearcoat_normal_fragment_maps:rx,clearcoat_pars_fragment:ox,iridescence_pars_fragment:ax,opaque_fragment:lx,packing:cx,premultiplied_alpha_fragment:hx,project_vertex:ux,dithering_fragment:dx,dithering_pars_fragment:fx,roughnessmap_fragment:px,roughnessmap_pars_fragment:mx,shadowmap_pars_fragment:gx,shadowmap_pars_vertex:xx,shadowmap_vertex:vx,shadowmask_pars_fragment:yx,skinbase_vertex:_x,skinning_pars_vertex:Mx,skinning_vertex:bx,skinnormal_vertex:Sx,specularmap_fragment:wx,specularmap_pars_fragment:Ex,tonemapping_fragment:Tx,tonemapping_pars_fragment:Ax,transmission_fragment:Rx,transmission_pars_fragment:Cx,uv_pars_fragment:Ix,uv_pars_vertex:Px,uv_vertex:Lx,worldpos_vertex:Dx,background_vert:Ux,background_frag:Nx,backgroundCube_vert:Fx,backgroundCube_frag:zx,cube_vert:Ox,cube_frag:kx,depth_vert:Bx,depth_frag:Hx,distanceRGBA_vert:Vx,distanceRGBA_frag:Gx,equirect_vert:Wx,equirect_frag:Xx,linedashed_vert:qx,linedashed_frag:Yx,meshbasic_vert:$x,meshbasic_frag:Zx,meshlambert_vert:Jx,meshlambert_frag:Kx,meshmatcap_vert:jx,meshmatcap_frag:Qx,meshnormal_vert:tv,meshnormal_frag:ev,meshphong_vert:nv,meshphong_frag:iv,meshphysical_vert:sv,meshphysical_frag:rv,meshtoon_vert:ov,meshtoon_frag:av,points_vert:lv,points_frag:cv,shadow_vert:hv,shadow_frag:uv,sprite_vert:dv,sprite_frag:fv},ft={common:{diffuse:{value:new Wt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},envMapRotation:{value:new jt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new ct(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Wt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Wt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new Wt(16777215)},opacity:{value:1},center:{value:new ct(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},Nn={basic:{uniforms:Xe([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:Xe([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new Wt(0)}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:Xe([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new Wt(0)},specular:{value:new Wt(1118481)},shininess:{value:30}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:Xe([ft.common,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.roughnessmap,ft.metalnessmap,ft.fog,ft.lights,{emissive:{value:new Wt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:Xe([ft.common,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.gradientmap,ft.fog,ft.lights,{emissive:{value:new Wt(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:Xe([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:Xe([ft.points,ft.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:Xe([ft.common,ft.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:Xe([ft.common,ft.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:Xe([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:Xe([ft.sprite,ft.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new jt}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distanceRGBA:{uniforms:Xe([ft.common,ft.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distanceRGBA_vert,fragmentShader:te.distanceRGBA_frag},shadow:{uniforms:Xe([ft.lights,ft.fog,{color:{value:new Wt(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};Nn.physical={uniforms:Xe([Nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new ct(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new Wt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new ct},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new Wt(0)},specularColor:{value:new Wt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new ct},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};var zo={r:0,b:0,g:0},Ki=new Ve,pv=new oe;function mv(n,t,e,i,s,r,o){let a=new Wt(0),l=r===!0?0:1,c,h,u=null,d=0,f=null;function g(w){let _=w.isScene===!0?w.background:null;return _&&_.isTexture&&(_=(w.backgroundBlurriness>0?e:t).get(_)),_}function x(w){let _=!1,y=g(w);y===null?p(a,l):y&&y.isColor&&(p(y,1),_=!0);let C=n.xr.getEnvironmentBlendMode();C==="additive"?i.buffers.color.setClear(0,0,0,1,o):C==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||_)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function m(w,_){let y=g(_);y&&(y.isCubeTexture||y.mapping===wa)?(h===void 0&&(h=new Me(new An(1,1,1),new Ye({name:"BackgroundCubeMaterial",uniforms:Gs(Nn.backgroundCube.uniforms),vertexShader:Nn.backgroundCube.vertexShader,fragmentShader:Nn.backgroundCube.fragmentShader,side:je,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(C,A,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Ki.copy(_.backgroundRotation),Ki.x*=-1,Ki.y*=-1,Ki.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Ki.y*=-1,Ki.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=_.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(pv.makeRotationFromEuler(Ki)),h.material.toneMapped=re.getTransfer(y.colorSpace)!==me,(u!==y||d!==y.version||f!==n.toneMapping)&&(h.material.needsUpdate=!0,u=y,d=y.version,f=n.toneMapping),h.layers.enableAll(),w.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new Me(new os(2,2),new Ye({name:"BackgroundMaterial",uniforms:Gs(Nn.background.uniforms),vertexShader:Nn.background.vertexShader,fragmentShader:Nn.background.fragmentShader,side:Ci,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=_.backgroundIntensity,c.material.toneMapped=re.getTransfer(y.colorSpace)!==me,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||d!==y.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,u=y,d=y.version,f=n.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null))}function p(w,_){w.getRGB(zo,Sf(n)),i.buffers.color.setClear(zo.r,zo.g,zo.b,_,o)}return{getClearColor:function(){return a},setClearColor:function(w,_=1){a.set(w),l=_,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,p(a,l)},render:x,addToRenderList:m}}function gv(n,t){let e=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=d(null),r=s,o=!1;function a(M,U,G,k,W){let j=!1,X=u(k,G,U);r!==X&&(r=X,c(r.object)),j=f(M,k,G,W),j&&g(M,k,G,W),W!==null&&t.update(W,n.ELEMENT_ARRAY_BUFFER),(j||o)&&(o=!1,y(M,U,G,k),W!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(W).buffer))}function l(){return n.createVertexArray()}function c(M){return n.bindVertexArray(M)}function h(M){return n.deleteVertexArray(M)}function u(M,U,G){let k=G.wireframe===!0,W=i[M.id];W===void 0&&(W={},i[M.id]=W);let j=W[U.id];j===void 0&&(j={},W[U.id]=j);let X=j[k];return X===void 0&&(X=d(l()),j[k]=X),X}function d(M){let U=[],G=[],k=[];for(let W=0;W<e;W++)U[W]=0,G[W]=0,k[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:G,attributeDivisors:k,object:M,attributes:{},index:null}}function f(M,U,G,k){let W=r.attributes,j=U.attributes,X=0,st=G.getAttributes();for(let Y in st)if(st[Y].location>=0){let _t=W[Y],Rt=j[Y];if(Rt===void 0&&(Y==="instanceMatrix"&&M.instanceMatrix&&(Rt=M.instanceMatrix),Y==="instanceColor"&&M.instanceColor&&(Rt=M.instanceColor)),_t===void 0||_t.attribute!==Rt||Rt&&_t.data!==Rt.data)return!0;X++}return r.attributesNum!==X||r.index!==k}function g(M,U,G,k){let W={},j=U.attributes,X=0,st=G.getAttributes();for(let Y in st)if(st[Y].location>=0){let _t=j[Y];_t===void 0&&(Y==="instanceMatrix"&&M.instanceMatrix&&(_t=M.instanceMatrix),Y==="instanceColor"&&M.instanceColor&&(_t=M.instanceColor));let Rt={};Rt.attribute=_t,_t&&_t.data&&(Rt.data=_t.data),W[Y]=Rt,X++}r.attributes=W,r.attributesNum=X,r.index=k}function x(){let M=r.newAttributes;for(let U=0,G=M.length;U<G;U++)M[U]=0}function m(M){p(M,0)}function p(M,U){let G=r.newAttributes,k=r.enabledAttributes,W=r.attributeDivisors;G[M]=1,k[M]===0&&(n.enableVertexAttribArray(M),k[M]=1),W[M]!==U&&(n.vertexAttribDivisor(M,U),W[M]=U)}function w(){let M=r.newAttributes,U=r.enabledAttributes;for(let G=0,k=U.length;G<k;G++)U[G]!==M[G]&&(n.disableVertexAttribArray(G),U[G]=0)}function _(M,U,G,k,W,j,X){X===!0?n.vertexAttribIPointer(M,U,G,W,j):n.vertexAttribPointer(M,U,G,k,W,j)}function y(M,U,G,k){x();let W=k.attributes,j=G.getAttributes(),X=U.defaultAttributeValues;for(let st in j){let Y=j[st];if(Y.location>=0){let dt=W[st];if(dt===void 0&&(st==="instanceMatrix"&&M.instanceMatrix&&(dt=M.instanceMatrix),st==="instanceColor"&&M.instanceColor&&(dt=M.instanceColor)),dt!==void 0){let _t=dt.normalized,Rt=dt.itemSize,Zt=t.get(dt);if(Zt===void 0)continue;let ue=Zt.buffer,K=Zt.type,ot=Zt.bytesPerElement,It=K===n.INT||K===n.UNSIGNED_INT||dt.gpuType===Th;if(dt.isInterleavedBufferAttribute){let lt=dt.data,kt=lt.stride,qt=dt.offset;if(lt.isInstancedInterleavedBuffer){for(let Gt=0;Gt<Y.locationSize;Gt++)p(Y.location+Gt,lt.meshPerAttribute);M.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=lt.meshPerAttribute*lt.count)}else for(let Gt=0;Gt<Y.locationSize;Gt++)m(Y.location+Gt);n.bindBuffer(n.ARRAY_BUFFER,ue);for(let Gt=0;Gt<Y.locationSize;Gt++)_(Y.location+Gt,Rt/Y.locationSize,K,_t,kt*ot,(qt+Rt/Y.locationSize*Gt)*ot,It)}else{if(dt.isInstancedBufferAttribute){for(let lt=0;lt<Y.locationSize;lt++)p(Y.location+lt,dt.meshPerAttribute);M.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=dt.meshPerAttribute*dt.count)}else for(let lt=0;lt<Y.locationSize;lt++)m(Y.location+lt);n.bindBuffer(n.ARRAY_BUFFER,ue);for(let lt=0;lt<Y.locationSize;lt++)_(Y.location+lt,Rt/Y.locationSize,K,_t,Rt*ot,Rt/Y.locationSize*lt*ot,It)}}else if(X!==void 0){let _t=X[st];if(_t!==void 0)switch(_t.length){case 2:n.vertexAttrib2fv(Y.location,_t);break;case 3:n.vertexAttrib3fv(Y.location,_t);break;case 4:n.vertexAttrib4fv(Y.location,_t);break;default:n.vertexAttrib1fv(Y.location,_t)}}}}w()}function C(){D();for(let M in i){let U=i[M];for(let G in U){let k=U[G];for(let W in k)h(k[W].object),delete k[W];delete U[G]}delete i[M]}}function A(M){if(i[M.id]===void 0)return;let U=i[M.id];for(let G in U){let k=U[G];for(let W in k)h(k[W].object),delete k[W];delete U[G]}delete i[M.id]}function I(M){for(let U in i){let G=i[U];if(G[M.id]===void 0)continue;let k=G[M.id];for(let W in k)h(k[W].object),delete k[W];delete G[M.id]}}function D(){T(),o=!0,r!==s&&(r=s,c(r.object))}function T(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:D,resetDefaultState:T,dispose:C,releaseStatesOfGeometry:A,releaseStatesOfProgram:I,initAttributes:x,enableAttribute:m,disableUnusedAttributes:w}}function xv(n,t,e){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),e.update(h,i,1)}function o(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),e.update(h,i,u))}function a(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];e.update(f,i,1)}function l(c,h,u,d){if(u===0)return;let f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)o(c[g],h[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(i,c,0,h,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=h[x]*d[x];e.update(g,i,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function vv(n,t,e,i){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let I=t.get("EXT_texture_filter_anisotropic");s=n.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(I){return!(I!==wn&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(I){let D=I===kr&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(I!==En&&i.convert(I)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==Fn&&!D)}function l(I){if(I==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),_=n.getParameter(n.MAX_VARYING_VECTORS),y=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),C=g>0,A=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:w,maxVaryings:_,maxFragmentUniforms:y,vertexTextures:C,maxSamples:A}}function yv(n){let t=this,e=null,i=0,s=!1,r=!1,o=new ii,a=new jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||i!==0||s;return s=d,i=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){let g=u.clippingPlanes,x=u.clipIntersection,m=u.clipShadows,p=n.get(u);if(!s||g===null||g.length===0||r&&!m)r?h(null):c();else{let w=r?0:i,_=w*4,y=p.clippingState||null;l.value=y,y=h(g,d,_,f);for(let C=0;C!==_;++C)y[C]=e[C];p.clippingState=y,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=w}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(u,d,f,g){let x=u!==null?u.length:0,m=null;if(x!==0){if(m=l.value,g!==!0||m===null){let p=f+x*4,w=d.matrixWorldInverse;a.getNormalMatrix(w),(m===null||m.length<p)&&(m=new Float32Array(p));for(let _=0,y=f;_!==x;++_,y+=4)o.copy(u[_]).applyMatrix4(w,a),o.normal.toArray(m,y),m[y+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,m}}function _v(n){let t=new WeakMap;function e(o,a){return a===rc?o.mapping=ks:a===oc&&(o.mapping=Bs),o}function i(o){if(o&&o.isTexture){let a=o.mapping;if(a===rc||a===oc)if(t.has(o)){let l=t.get(o).texture;return e(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new Hc(l.height);return c.fromEquirectangularTexture(n,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:i,dispose:r}}var aa=class extends ra{constructor(t=-1,e=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-t,o=i+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Ds=4,Td=[.125,.215,.35,.446,.526,.582],ns=20,Bl=new aa,Ad=new Wt,Hl=null,Vl=0,Gl=0,Wl=!1,Qi=(1+Math.sqrt(5))/2,Ps=1/Qi,Rd=[new N(-Qi,Ps,0),new N(Qi,Ps,0),new N(-Ps,0,Qi),new N(Ps,0,Qi),new N(0,Qi,-Ps),new N(0,Qi,Ps),new N(-1,1,-1),new N(1,1,-1),new N(-1,1,1),new N(1,1,1)],la=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,i=.1,s=100){Hl=this._renderer.getRenderTarget(),Vl=this._renderer.getActiveCubeFace(),Gl=this._renderer.getActiveMipmapLevel(),Wl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,i,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Pd(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Id(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Hl,Vl,Gl),this._renderer.xr.enabled=Wl,t.scissorTest=!1,Oo(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===ks||t.mapping===Bs?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Hl=this._renderer.getRenderTarget(),Vl=this._renderer.getActiveCubeFace(),Gl=this._renderer.getActiveMipmapLevel(),Wl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:an,minFilter:an,generateMipmaps:!1,type:kr,format:wn,colorSpace:Xs,depthBuffer:!1},s=Cd(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Cd(t,e,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Mv(r)),this._blurMaterial=bv(r,t,e)}return s}_compileMaterial(t){let e=new Me(this._lodPlanes[0],t);this._renderer.compile(e,Bl)}_sceneToCubeUV(t,e,i,s){let a=new He(90,1,e,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Ad),h.toneMapping=Ri,h.autoClear=!1;let f=new zn({name:"PMREM.Background",side:je,depthWrite:!1,depthTest:!1}),g=new Me(new An,f),x=!1,m=t.background;m?m.isColor&&(f.color.copy(m),t.background=null,x=!0):(f.color.copy(Ad),x=!0);for(let p=0;p<6;p++){let w=p%3;w===0?(a.up.set(0,l[p],0),a.lookAt(c[p],0,0)):w===1?(a.up.set(0,0,l[p]),a.lookAt(0,c[p],0)):(a.up.set(0,l[p],0),a.lookAt(0,0,c[p]));let _=this._cubeSize;Oo(s,w*_,p>2?_:0,_,_),h.setRenderTarget(s),x&&h.render(g,a),h.render(t,a)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){let i=this._renderer,s=t.mapping===ks||t.mapping===Bs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Pd()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Id());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new Me(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;Oo(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(o,Bl)}_applyPMREM(t){let e=this._renderer,i=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Rd[(s-r-1)%Rd.length];this._blur(t,r-1,r,o,a)}e.autoClear=i}_blur(t,e,i,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,i,s,"latitudinal",r),this._halfBlur(o,t,i,i,s,"longitudinal",r)}_halfBlur(t,e,i,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new Me(this._lodPlanes[s],c),d=c.uniforms,f=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*ns-1),x=r/g,m=isFinite(r)?1+Math.floor(h*x):ns;m>ns&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${ns}`);let p=[],w=0;for(let I=0;I<ns;++I){let D=I/x,T=Math.exp(-D*D/2);p.push(T),I===0?w+=T:I<m&&(w+=2*T)}for(let I=0;I<p.length;I++)p[I]=p[I]/w;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:_}=this;d.dTheta.value=g,d.mipInt.value=_-i;let y=this._sizeLods[s],C=3*y*(s>_-Ds?s-_+Ds:0),A=4*(this._cubeSize-y);Oo(e,C,A,3*y,2*y),l.setRenderTarget(e),l.render(u,Bl)}};function Mv(n){let t=[],e=[],i=[],s=n,r=n-Ds+1+Td.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let l=1/a;o>n-Ds?l=Td[o-n+Ds-1]:o===0&&(l=0),i.push(l);let c=1/(a-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,x=3,m=2,p=1,w=new Float32Array(x*g*f),_=new Float32Array(m*g*f),y=new Float32Array(p*g*f);for(let A=0;A<f;A++){let I=A%3*2/3-1,D=A>2?0:-1,T=[I,D,0,I+2/3,D,0,I+2/3,D+1,0,I,D,0,I+2/3,D+1,0,I,D+1,0];w.set(T,x*g*A),_.set(d,m*g*A);let M=[A,A,A,A,A,A];y.set(M,p*g*A)}let C=new Ae;C.setAttribute("position",new qe(w,x)),C.setAttribute("uv",new qe(_,m)),C.setAttribute("faceIndex",new qe(y,p)),t.push(C),s>Ds&&s--}return{lodPlanes:t,sizeLods:e,sigmas:i}}function Cd(n,t,e){let i=new Tn(n,t,e);return i.texture.mapping=wa,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Oo(n,t,e,i,s){n.viewport.set(t,e,i,s),n.scissor.set(t,e,i,s)}function bv(n,t,e){let i=new Float32Array(ns),s=new N(0,1,0);return new Ye({name:"SphericalGaussianBlur",defines:{n:ns,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Lh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Ti,depthTest:!1,depthWrite:!1})}function Id(){return new Ye({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Lh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Ti,depthTest:!1,depthWrite:!1})}function Pd(){return new Ye({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Lh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ti,depthTest:!1,depthWrite:!1})}function Lh(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Sv(n){let t=new WeakMap,e=null;function i(a){if(a&&a.isTexture){let l=a.mapping,c=l===rc||l===oc,h=l===ks||l===Bs;if(c||h){let u=t.get(a),d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new la(n)),u=c?e.fromEquirectangular(a,u):e.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),u.texture;if(u!==void 0)return u.texture;{let f=a.image;return c&&f&&f.height>0||h&&f&&s(f)?(e===null&&(e=new la(n)),u=c?e.fromEquirectangular(a):e.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,t.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let l=0,c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:i,dispose:o}}function wv(n){let t={};function e(i){if(t[i]!==void 0)return t[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return t[i]=s,s}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){let s=e(i);return s===null&&xr("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function Ev(n,t,e,i){let s={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&t.remove(d.index);for(let g in d.attributes)t.remove(d.attributes[g]);for(let g in d.morphAttributes){let x=d.morphAttributes[g];for(let m=0,p=x.length;m<p;m++)t.remove(x[m])}d.removeEventListener("dispose",o),delete s[d.id];let f=r.get(d);f&&(t.remove(f),r.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(u,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,e.memory.geometries++),d}function l(u){let d=u.attributes;for(let g in d)t.update(d[g],n.ARRAY_BUFFER);let f=u.morphAttributes;for(let g in f){let x=f[g];for(let m=0,p=x.length;m<p;m++)t.update(x[m],n.ARRAY_BUFFER)}}function c(u){let d=[],f=u.index,g=u.attributes.position,x=0;if(f!==null){let w=f.array;x=f.version;for(let _=0,y=w.length;_<y;_+=3){let C=w[_+0],A=w[_+1],I=w[_+2];d.push(C,A,A,I,I,C)}}else if(g!==void 0){let w=g.array;x=g.version;for(let _=0,y=w.length/3-1;_<y;_+=3){let C=_+0,A=_+1,I=_+2;d.push(C,A,A,I,I,C)}}else return;let m=new(Mf(d)?sa:ia)(d,1);m.version=x;let p=r.get(u);p&&t.remove(p),r.set(u,m)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:a,update:l,getWireframeAttribute:h}}function Tv(n,t,e){let i;function s(d){i=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,f){n.drawElements(i,f,r,d*o),e.update(f,i,1)}function c(d,f,g){g!==0&&(n.drawElementsInstanced(i,f,r,d*o,g),e.update(f,i,g))}function h(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];e.update(m,i,1)}function u(d,f,g,x){if(g===0)return;let m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)c(d[p]/o,f[p],x[p]);else{m.multiDrawElementsInstancedWEBGL(i,f,0,r,d,0,x,0,g);let p=0;for(let w=0;w<g;w++)p+=f[w]*x[w];e.update(p,i,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Av(n){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(e.calls++,o){case n.TRIANGLES:e.triangles+=a*(r/3);break;case n.LINES:e.lines+=a*(r/2);break;case n.LINE_STRIP:e.lines+=a*(r-1);break;case n.LINE_LOOP:e.lines+=a*r;break;case n.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:i}}function Rv(n,t,e){let i=new WeakMap,s=new we;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=i.get(a);if(d===void 0||d.count!==u){let T=function(){I.dispose(),i.delete(a),a.removeEventListener("dispose",T)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],w=a.morphAttributes.color||[],_=0;f===!0&&(_=1),g===!0&&(_=2),x===!0&&(_=3);let y=a.attributes.position.count*_,C=1;y>t.maxTextureSize&&(C=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize);let A=new Float32Array(y*C*4*u),I=new na(A,y,C,u);I.type=Fn,I.needsUpdate=!0;let D=_*4;for(let M=0;M<u;M++){let U=m[M],G=p[M],k=w[M],W=y*C*4*M;for(let j=0;j<U.count;j++){let X=j*D;f===!0&&(s.fromBufferAttribute(U,j),A[W+X+0]=s.x,A[W+X+1]=s.y,A[W+X+2]=s.z,A[W+X+3]=0),g===!0&&(s.fromBufferAttribute(G,j),A[W+X+4]=s.x,A[W+X+5]=s.y,A[W+X+6]=s.z,A[W+X+7]=0),x===!0&&(s.fromBufferAttribute(k,j),A[W+X+8]=s.x,A[W+X+9]=s.y,A[W+X+10]=s.z,A[W+X+11]=k.itemSize===4?s.w:1)}}d={count:u,texture:I,size:new ct(y,C)},i.set(a,d),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,e);else{let f=0;for(let x=0;x<c.length;x++)f+=c[x];let g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:r}}function Cv(n,t,e,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}var ca=class extends cn{constructor(t,e,i,s,r,o,a,l,c,h=Ns){if(h!==Ns&&h!==Vs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===Ns&&(i=rs),i===void 0&&h===Vs&&(i=Hs),super(null,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:ln,this.minFilter=l!==void 0?l:ln,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Ef=new cn,Ld=new ca(1,1),Tf=new na,Af=new kc,Rf=new oa,Dd=[],Ud=[],Nd=new Float32Array(16),Fd=new Float32Array(9),zd=new Float32Array(4);function $s(n,t,e){let i=n[0];if(i<=0||i>0)return n;let s=t*e,r=Dd[s];if(r===void 0&&(r=new Float32Array(s),Dd[s]=r),t!==0){i.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,n[o].toArray(r,a)}return r}function Pe(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function Le(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function Ta(n,t){let e=Ud[t];e===void 0&&(e=new Int32Array(t),Ud[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function Iv(n,t){let e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function Pv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;n.uniform2fv(this.addr,t),Le(e,t)}}function Lv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Pe(e,t))return;n.uniform3fv(this.addr,t),Le(e,t)}}function Dv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;n.uniform4fv(this.addr,t),Le(e,t)}}function Uv(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Pe(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),Le(e,t)}else{if(Pe(e,i))return;zd.set(i),n.uniformMatrix2fv(this.addr,!1,zd),Le(e,i)}}function Nv(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Pe(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),Le(e,t)}else{if(Pe(e,i))return;Fd.set(i),n.uniformMatrix3fv(this.addr,!1,Fd),Le(e,i)}}function Fv(n,t){let e=this.cache,i=t.elements;if(i===void 0){if(Pe(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),Le(e,t)}else{if(Pe(e,i))return;Nd.set(i),n.uniformMatrix4fv(this.addr,!1,Nd),Le(e,i)}}function zv(n,t){let e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function Ov(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;n.uniform2iv(this.addr,t),Le(e,t)}}function kv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Pe(e,t))return;n.uniform3iv(this.addr,t),Le(e,t)}}function Bv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;n.uniform4iv(this.addr,t),Le(e,t)}}function Hv(n,t){let e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function Vv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Pe(e,t))return;n.uniform2uiv(this.addr,t),Le(e,t)}}function Gv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Pe(e,t))return;n.uniform3uiv(this.addr,t),Le(e,t)}}function Wv(n,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Pe(e,t))return;n.uniform4uiv(this.addr,t),Le(e,t)}}function Xv(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Ld.compareFunction=_f,r=Ld):r=Ef,e.setTexture2D(t||r,s)}function qv(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture3D(t||Af,s)}function Yv(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTextureCube(t||Rf,s)}function $v(n,t,e){let i=this.cache,s=e.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),e.setTexture2DArray(t||Tf,s)}function Zv(n){switch(n){case 5126:return Iv;case 35664:return Pv;case 35665:return Lv;case 35666:return Dv;case 35674:return Uv;case 35675:return Nv;case 35676:return Fv;case 5124:case 35670:return zv;case 35667:case 35671:return Ov;case 35668:case 35672:return kv;case 35669:case 35673:return Bv;case 5125:return Hv;case 36294:return Vv;case 36295:return Gv;case 36296:return Wv;case 35678:case 36198:case 36298:case 36306:case 35682:return Xv;case 35679:case 36299:case 36307:return qv;case 35680:case 36300:case 36308:case 36293:return Yv;case 36289:case 36303:case 36311:case 36292:return $v}}function Jv(n,t){n.uniform1fv(this.addr,t)}function Kv(n,t){let e=$s(t,this.size,2);n.uniform2fv(this.addr,e)}function jv(n,t){let e=$s(t,this.size,3);n.uniform3fv(this.addr,e)}function Qv(n,t){let e=$s(t,this.size,4);n.uniform4fv(this.addr,e)}function ty(n,t){let e=$s(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function ey(n,t){let e=$s(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function ny(n,t){let e=$s(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function iy(n,t){n.uniform1iv(this.addr,t)}function sy(n,t){n.uniform2iv(this.addr,t)}function ry(n,t){n.uniform3iv(this.addr,t)}function oy(n,t){n.uniform4iv(this.addr,t)}function ay(n,t){n.uniform1uiv(this.addr,t)}function ly(n,t){n.uniform2uiv(this.addr,t)}function cy(n,t){n.uniform3uiv(this.addr,t)}function hy(n,t){n.uniform4uiv(this.addr,t)}function uy(n,t,e){let i=this.cache,s=t.length,r=Ta(e,s);Pe(i,r)||(n.uniform1iv(this.addr,r),Le(i,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Ef,r[o])}function dy(n,t,e){let i=this.cache,s=t.length,r=Ta(e,s);Pe(i,r)||(n.uniform1iv(this.addr,r),Le(i,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||Af,r[o])}function fy(n,t,e){let i=this.cache,s=t.length,r=Ta(e,s);Pe(i,r)||(n.uniform1iv(this.addr,r),Le(i,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||Rf,r[o])}function py(n,t,e){let i=this.cache,s=t.length,r=Ta(e,s);Pe(i,r)||(n.uniform1iv(this.addr,r),Le(i,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Tf,r[o])}function my(n){switch(n){case 5126:return Jv;case 35664:return Kv;case 35665:return jv;case 35666:return Qv;case 35674:return ty;case 35675:return ey;case 35676:return ny;case 5124:case 35670:return iy;case 35667:case 35671:return sy;case 35668:case 35672:return ry;case 35669:case 35673:return oy;case 5125:return ay;case 36294:return ly;case 36295:return cy;case 36296:return hy;case 35678:case 36198:case 36298:case 36306:case 35682:return uy;case 35679:case 36299:case 36307:return dy;case 35680:case 36300:case 36308:case 36293:return fy;case 36289:case 36303:case 36311:case 36292:return py}}var Vc=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=Zv(e.type)}},Gc=class{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=my(e.type)}},Wc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],i)}}},Xl=/(\w+)(\])?(\[|\.)?/g;function Od(n,t){n.seq.push(t),n.map[t.id]=t}function gy(n,t,e){let i=n.name,s=i.length;for(Xl.lastIndex=0;;){let r=Xl.exec(i),o=Xl.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Od(e,c===void 0?new Vc(a,n,t):new Gc(a,n,t));break}else{let u=e.map[a];u===void 0&&(u=new Wc(a),Od(e,u)),e=u}}}var zs=class{constructor(t,e){this.seq=[],this.map={};let i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);gy(r,o,this)}}setValue(t,e,i,s){let r=this.map[e];r!==void 0&&r.setValue(t,i,s)}setOptional(t,e,i){let s=e[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,e,i,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let i=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&i.push(o)}return i}};function kd(n,t,e){let i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}var xy=37297,vy=0;function yy(n,t){let e=n.split(`
`),i=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return i.join(`
`)}var Bd=new jt;function _y(n){re._getMatrix(Bd,re.workingColorSpace,n);let t=`mat3( ${Bd.elements.map(e=>e.toFixed(4))} )`;switch(re.getTransfer(n)){case Ea:return[t,"LinearTransferOETF"];case me:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[t,"LinearTransferOETF"]}}function Hd(n,t,e){let i=n.getShaderParameter(t,n.COMPILE_STATUS),s=n.getShaderInfoLog(t).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+yy(n.getShaderSource(t),o)}else return s}function My(n,t){let e=_y(t);return[`vec4 ${n}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function by(n,t){let e;switch(t){case $m:e="Linear";break;case Zm:e="Reinhard";break;case Jm:e="Cineon";break;case Eh:e="ACESFilmic";break;case jm:e="AgX";break;case Qm:e="Neutral";break;case Km:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var ko=new N;function Sy(){re.getLuminanceCoefficients(ko);let n=ko.x.toFixed(4),t=ko.y.toFixed(4),e=ko.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function wy(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(vr).join(`
`)}function Ey(n){let t=[];for(let e in n){let i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Ty(n,t){let e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(t,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:n.getAttribLocation(t,o),locationSize:a}}return e}function vr(n){return n!==""}function Vd(n,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Gd(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Ay=/^[ \t]*#include +<([\w\d./]+)>/gm;function Xc(n){return n.replace(Ay,Cy)}var Ry=new Map;function Cy(n,t){let e=te[t];if(e===void 0){let i=Ry.get(t);if(i!==void 0)e=te[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return Xc(e)}var Iy=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Wd(n){return n.replace(Iy,Py)}function Py(n,t,e,i){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Xd(n){let t=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Ly(n){let t="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Sa?t="SHADOWMAP_TYPE_PCF":n.shadowMapType===Am?t="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===ni&&(t="SHADOWMAP_TYPE_VSM"),t}function Dy(n){let t="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case ks:case Bs:t="ENVMAP_TYPE_CUBE";break;case wa:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Uy(n){let t="ENVMAP_MODE_REFLECTION";return n.envMap&&n.envMapMode===Bs&&(t="ENVMAP_MODE_REFRACTION"),t}function Ny(n){let t="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case wh:t="ENVMAP_BLENDING_MULTIPLY";break;case qm:t="ENVMAP_BLENDING_MIX";break;case Ym:t="ENVMAP_BLENDING_ADD";break}return t}function Fy(n){let t=n.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:i,maxMip:e}}function zy(n,t,e,i){let s=n.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=Ly(e),c=Dy(e),h=Uy(e),u=Ny(e),d=Fy(e),f=wy(e),g=Ey(r),x=s.createProgram(),m,p,w=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(vr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(vr).join(`
`),p.length>0&&(p+=`
`)):(m=[Xd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(vr).join(`
`),p=[Xd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ri?"#define TONE_MAPPING":"",e.toneMapping!==Ri?te.tonemapping_pars_fragment:"",e.toneMapping!==Ri?by("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,My("linearToOutputTexel",e.outputColorSpace),Sy(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(vr).join(`
`)),o=Xc(o),o=Vd(o,e),o=Gd(o,e),a=Xc(a),a=Vd(a,e),a=Gd(a,e),o=Wd(o),a=Wd(a),e.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===rd?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===rd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let _=w+m+o,y=w+p+a,C=kd(s,s.VERTEX_SHADER,_),A=kd(s,s.FRAGMENT_SHADER,y);s.attachShader(x,C),s.attachShader(x,A),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function I(U){if(n.debug.checkShaderErrors){let G=s.getProgramInfoLog(x).trim(),k=s.getShaderInfoLog(C).trim(),W=s.getShaderInfoLog(A).trim(),j=!0,X=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(j=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,x,C,A);else{let st=Hd(s,C,"vertex"),Y=Hd(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+G+`
`+st+`
`+Y)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(k===""||W==="")&&(X=!1);X&&(U.diagnostics={runnable:j,programLog:G,vertexShader:{log:k,prefix:m},fragmentShader:{log:W,prefix:p}})}s.deleteShader(C),s.deleteShader(A),D=new zs(s,x),T=Ty(s,x)}let D;this.getUniforms=function(){return D===void 0&&I(this),D};let T;this.getAttributes=function(){return T===void 0&&I(this),T};let M=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=s.getProgramParameter(x,xy)),M},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=vy++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=C,this.fragmentShader=A,this}var Oy=0,qc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,i=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){let e=this.shaderCache,i=e.get(t);return i===void 0&&(i=new Yc(t),e.set(t,i)),i}},Yc=class{constructor(t){this.id=Oy++,this.code=t,this.usedTimes=0}};function ky(n,t,e,i,s,r,o){let a=new Er,l=new qc,c=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,f=s.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(T){return c.add(T),T===0?"uv":`uv${T}`}function m(T,M,U,G,k){let W=G.fog,j=k.geometry,X=T.isMeshStandardMaterial?G.environment:null,st=(T.isMeshStandardMaterial?e:t).get(T.envMap||X),Y=st&&st.mapping===wa?st.image.height:null,dt=g[T.type];T.precision!==null&&(f=s.getMaxPrecision(T.precision),f!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",f,"instead."));let _t=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,Rt=_t!==void 0?_t.length:0,Zt=0;j.morphAttributes.position!==void 0&&(Zt=1),j.morphAttributes.normal!==void 0&&(Zt=2),j.morphAttributes.color!==void 0&&(Zt=3);let ue,K,ot,It;if(dt){let pe=Nn[dt];ue=pe.vertexShader,K=pe.fragmentShader}else ue=T.vertexShader,K=T.fragmentShader,l.update(T),ot=l.getVertexShaderID(T),It=l.getFragmentShaderID(T);let lt=n.getRenderTarget(),kt=n.state.buffers.depth.getReversed(),qt=k.isInstancedMesh===!0,Gt=k.isBatchedMesh===!0,se=!!T.map,tt=!!T.matcap,rt=!!st,P=!!T.aoMap,Nt=!!T.lightMap,nt=!!T.bumpMap,St=!!T.normalMap,ht=!!T.displacementMap,Ht=!!T.emissiveMap,Mt=!!T.metalnessMap,R=!!T.roughnessMap,b=T.anisotropy>0,B=T.clearcoat>0,Z=T.dispersion>0,et=T.iridescence>0,J=T.sheen>0,Pt=T.transmission>0,pt=b&&!!T.anisotropyMap,bt=B&&!!T.clearcoatMap,ne=B&&!!T.clearcoatNormalMap,it=B&&!!T.clearcoatRoughnessMap,Tt=et&&!!T.iridescenceMap,Vt=et&&!!T.iridescenceThicknessMap,Xt=J&&!!T.sheenColorMap,At=J&&!!T.sheenRoughnessMap,ie=!!T.specularMap,Qt=!!T.specularColorMap,ge=!!T.specularIntensityMap,F=Pt&&!!T.transmissionMap,gt=Pt&&!!T.thicknessMap,$=!!T.gradientMap,Q=!!T.alphaMap,yt=T.alphaTest>0,xt=!!T.alphaHash,Jt=!!T.extensions,Se=Ri;T.toneMapped&&(lt===null||lt.isXRRenderTarget===!0)&&(Se=n.toneMapping);let ze={shaderID:dt,shaderType:T.type,shaderName:T.name,vertexShader:ue,fragmentShader:K,defines:T.defines,customVertexShaderID:ot,customFragmentShaderID:It,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:f,batching:Gt,batchingColor:Gt&&k._colorsTexture!==null,instancing:qt,instancingColor:qt&&k.instanceColor!==null,instancingMorph:qt&&k.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:lt===null?n.outputColorSpace:lt.isXRRenderTarget===!0?lt.texture.colorSpace:Xs,alphaToCoverage:!!T.alphaToCoverage,map:se,matcap:tt,envMap:rt,envMapMode:rt&&st.mapping,envMapCubeUVHeight:Y,aoMap:P,lightMap:Nt,bumpMap:nt,normalMap:St,displacementMap:d&&ht,emissiveMap:Ht,normalMapObjectSpace:St&&T.normalMapType===i0,normalMapTangentSpace:St&&T.normalMapType===yf,metalnessMap:Mt,roughnessMap:R,anisotropy:b,anisotropyMap:pt,clearcoat:B,clearcoatMap:bt,clearcoatNormalMap:ne,clearcoatRoughnessMap:it,dispersion:Z,iridescence:et,iridescenceMap:Tt,iridescenceThicknessMap:Vt,sheen:J,sheenColorMap:Xt,sheenRoughnessMap:At,specularMap:ie,specularColorMap:Qt,specularIntensityMap:ge,transmission:Pt,transmissionMap:F,thicknessMap:gt,gradientMap:$,opaque:T.transparent===!1&&T.blending===Ai&&T.alphaToCoverage===!1,alphaMap:Q,alphaTest:yt,alphaHash:xt,combine:T.combine,mapUv:se&&x(T.map.channel),aoMapUv:P&&x(T.aoMap.channel),lightMapUv:Nt&&x(T.lightMap.channel),bumpMapUv:nt&&x(T.bumpMap.channel),normalMapUv:St&&x(T.normalMap.channel),displacementMapUv:ht&&x(T.displacementMap.channel),emissiveMapUv:Ht&&x(T.emissiveMap.channel),metalnessMapUv:Mt&&x(T.metalnessMap.channel),roughnessMapUv:R&&x(T.roughnessMap.channel),anisotropyMapUv:pt&&x(T.anisotropyMap.channel),clearcoatMapUv:bt&&x(T.clearcoatMap.channel),clearcoatNormalMapUv:ne&&x(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:it&&x(T.clearcoatRoughnessMap.channel),iridescenceMapUv:Tt&&x(T.iridescenceMap.channel),iridescenceThicknessMapUv:Vt&&x(T.iridescenceThicknessMap.channel),sheenColorMapUv:Xt&&x(T.sheenColorMap.channel),sheenRoughnessMapUv:At&&x(T.sheenRoughnessMap.channel),specularMapUv:ie&&x(T.specularMap.channel),specularColorMapUv:Qt&&x(T.specularColorMap.channel),specularIntensityMapUv:ge&&x(T.specularIntensityMap.channel),transmissionMapUv:F&&x(T.transmissionMap.channel),thicknessMapUv:gt&&x(T.thicknessMap.channel),alphaMapUv:Q&&x(T.alphaMap.channel),vertexTangents:!!j.attributes.tangent&&(St||b),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!j.attributes.uv&&(se||Q),fog:!!W,useFog:T.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:kt,skinning:k.isSkinnedMesh===!0,morphTargets:j.morphAttributes.position!==void 0,morphNormals:j.morphAttributes.normal!==void 0,morphColors:j.morphAttributes.color!==void 0,morphTargetsCount:Rt,morphTextureStride:Zt,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:T.dithering,shadowMapEnabled:n.shadowMap.enabled&&U.length>0,shadowMapType:n.shadowMap.type,toneMapping:Se,decodeVideoTexture:se&&T.map.isVideoTexture===!0&&re.getTransfer(T.map.colorSpace)===me,decodeVideoTextureEmissive:Ht&&T.emissiveMap.isVideoTexture===!0&&re.getTransfer(T.emissiveMap.colorSpace)===me,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===si,flipSided:T.side===je,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Jt&&T.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Jt&&T.extensions.multiDraw===!0||Gt)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return ze.vertexUv1s=c.has(1),ze.vertexUv2s=c.has(2),ze.vertexUv3s=c.has(3),c.clear(),ze}function p(T){let M=[];if(T.shaderID?M.push(T.shaderID):(M.push(T.customVertexShaderID),M.push(T.customFragmentShaderID)),T.defines!==void 0)for(let U in T.defines)M.push(U),M.push(T.defines[U]);return T.isRawShaderMaterial===!1&&(w(M,T),_(M,T),M.push(n.outputColorSpace)),M.push(T.customProgramCacheKey),M.join()}function w(T,M){T.push(M.precision),T.push(M.outputColorSpace),T.push(M.envMapMode),T.push(M.envMapCubeUVHeight),T.push(M.mapUv),T.push(M.alphaMapUv),T.push(M.lightMapUv),T.push(M.aoMapUv),T.push(M.bumpMapUv),T.push(M.normalMapUv),T.push(M.displacementMapUv),T.push(M.emissiveMapUv),T.push(M.metalnessMapUv),T.push(M.roughnessMapUv),T.push(M.anisotropyMapUv),T.push(M.clearcoatMapUv),T.push(M.clearcoatNormalMapUv),T.push(M.clearcoatRoughnessMapUv),T.push(M.iridescenceMapUv),T.push(M.iridescenceThicknessMapUv),T.push(M.sheenColorMapUv),T.push(M.sheenRoughnessMapUv),T.push(M.specularMapUv),T.push(M.specularColorMapUv),T.push(M.specularIntensityMapUv),T.push(M.transmissionMapUv),T.push(M.thicknessMapUv),T.push(M.combine),T.push(M.fogExp2),T.push(M.sizeAttenuation),T.push(M.morphTargetsCount),T.push(M.morphAttributeCount),T.push(M.numDirLights),T.push(M.numPointLights),T.push(M.numSpotLights),T.push(M.numSpotLightMaps),T.push(M.numHemiLights),T.push(M.numRectAreaLights),T.push(M.numDirLightShadows),T.push(M.numPointLightShadows),T.push(M.numSpotLightShadows),T.push(M.numSpotLightShadowsWithMaps),T.push(M.numLightProbes),T.push(M.shadowMapType),T.push(M.toneMapping),T.push(M.numClippingPlanes),T.push(M.numClipIntersection),T.push(M.depthPacking)}function _(T,M){a.disableAll(),M.supportsVertexTextures&&a.enable(0),M.instancing&&a.enable(1),M.instancingColor&&a.enable(2),M.instancingMorph&&a.enable(3),M.matcap&&a.enable(4),M.envMap&&a.enable(5),M.normalMapObjectSpace&&a.enable(6),M.normalMapTangentSpace&&a.enable(7),M.clearcoat&&a.enable(8),M.iridescence&&a.enable(9),M.alphaTest&&a.enable(10),M.vertexColors&&a.enable(11),M.vertexAlphas&&a.enable(12),M.vertexUv1s&&a.enable(13),M.vertexUv2s&&a.enable(14),M.vertexUv3s&&a.enable(15),M.vertexTangents&&a.enable(16),M.anisotropy&&a.enable(17),M.alphaHash&&a.enable(18),M.batching&&a.enable(19),M.dispersion&&a.enable(20),M.batchingColor&&a.enable(21),T.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reverseDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),T.push(a.mask)}function y(T){let M=g[T.type],U;if(M){let G=Nn[M];U=C0.clone(G.uniforms)}else U=T.uniforms;return U}function C(T,M){let U;for(let G=0,k=h.length;G<k;G++){let W=h[G];if(W.cacheKey===M){U=W,++U.usedTimes;break}}return U===void 0&&(U=new zy(n,M,T,r),h.push(U)),U}function A(T){if(--T.usedTimes===0){let M=h.indexOf(T);h[M]=h[h.length-1],h.pop(),T.destroy()}}function I(T){l.remove(T)}function D(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:y,acquireProgram:C,releaseProgram:A,releaseShaderCache:I,programs:h,dispose:D}}function By(){let n=new WeakMap;function t(o){return n.has(o)}function e(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:t,get:e,remove:i,update:s,dispose:r}}function Hy(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.z!==t.z?n.z-t.z:n.id-t.id}function qd(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function Yd(){let n=[],t=0,e=[],i=[],s=[];function r(){t=0,e.length=0,i.length=0,s.length=0}function o(u,d,f,g,x,m){let p=n[t];return p===void 0?(p={id:u.id,object:u,geometry:d,material:f,groupOrder:g,renderOrder:u.renderOrder,z:x,group:m},n[t]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=x,p.group=m),t++,p}function a(u,d,f,g,x,m){let p=o(u,d,f,g,x,m);f.transmission>0?i.push(p):f.transparent===!0?s.push(p):e.push(p)}function l(u,d,f,g,x,m){let p=o(u,d,f,g,x,m);f.transmission>0?i.unshift(p):f.transparent===!0?s.unshift(p):e.unshift(p)}function c(u,d){e.length>1&&e.sort(u||Hy),i.length>1&&i.sort(d||qd),s.length>1&&s.sort(d||qd)}function h(){for(let u=t,d=n.length;u<d;u++){let f=n[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:i,transparent:s,init:r,push:a,unshift:l,finish:h,sort:c}}function Vy(){let n=new WeakMap;function t(i,s){let r=n.get(i),o;return r===void 0?(o=new Yd,n.set(i,[o])):s>=r.length?(o=new Yd,r.push(o)):o=r[s],o}function e(){n=new WeakMap}return{get:t,dispose:e}}function Gy(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new N,color:new Wt};break;case"SpotLight":e={position:new N,direction:new N,color:new Wt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new N,color:new Wt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new N,skyColor:new Wt,groundColor:new Wt};break;case"RectAreaLight":e={color:new Wt,position:new N,halfWidth:new N,halfHeight:new N};break}return n[t.id]=e,e}}}function Wy(){let n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}var Xy=0;function qy(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function Yy(n){let t=new Gy,e=Wy(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new N);let s=new N,r=new oe,o=new oe;function a(c){let h=0,u=0,d=0;for(let T=0;T<9;T++)i.probe[T].set(0,0,0);let f=0,g=0,x=0,m=0,p=0,w=0,_=0,y=0,C=0,A=0,I=0;c.sort(qy);for(let T=0,M=c.length;T<M;T++){let U=c[T],G=U.color,k=U.intensity,W=U.distance,j=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)h+=G.r*k,u+=G.g*k,d+=G.b*k;else if(U.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(U.sh.coefficients[X],k);I++}else if(U.isDirectionalLight){let X=t.get(U);if(X.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let st=U.shadow,Y=e.get(U);Y.shadowIntensity=st.intensity,Y.shadowBias=st.bias,Y.shadowNormalBias=st.normalBias,Y.shadowRadius=st.radius,Y.shadowMapSize=st.mapSize,i.directionalShadow[f]=Y,i.directionalShadowMap[f]=j,i.directionalShadowMatrix[f]=U.shadow.matrix,w++}i.directional[f]=X,f++}else if(U.isSpotLight){let X=t.get(U);X.position.setFromMatrixPosition(U.matrixWorld),X.color.copy(G).multiplyScalar(k),X.distance=W,X.coneCos=Math.cos(U.angle),X.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),X.decay=U.decay,i.spot[x]=X;let st=U.shadow;if(U.map&&(i.spotLightMap[C]=U.map,C++,st.updateMatrices(U),U.castShadow&&A++),i.spotLightMatrix[x]=st.matrix,U.castShadow){let Y=e.get(U);Y.shadowIntensity=st.intensity,Y.shadowBias=st.bias,Y.shadowNormalBias=st.normalBias,Y.shadowRadius=st.radius,Y.shadowMapSize=st.mapSize,i.spotShadow[x]=Y,i.spotShadowMap[x]=j,y++}x++}else if(U.isRectAreaLight){let X=t.get(U);X.color.copy(G).multiplyScalar(k),X.halfWidth.set(U.width*.5,0,0),X.halfHeight.set(0,U.height*.5,0),i.rectArea[m]=X,m++}else if(U.isPointLight){let X=t.get(U);if(X.color.copy(U.color).multiplyScalar(U.intensity),X.distance=U.distance,X.decay=U.decay,U.castShadow){let st=U.shadow,Y=e.get(U);Y.shadowIntensity=st.intensity,Y.shadowBias=st.bias,Y.shadowNormalBias=st.normalBias,Y.shadowRadius=st.radius,Y.shadowMapSize=st.mapSize,Y.shadowCameraNear=st.camera.near,Y.shadowCameraFar=st.camera.far,i.pointShadow[g]=Y,i.pointShadowMap[g]=j,i.pointShadowMatrix[g]=U.shadow.matrix,_++}i.point[g]=X,g++}else if(U.isHemisphereLight){let X=t.get(U);X.skyColor.copy(U.color).multiplyScalar(k),X.groundColor.copy(U.groundColor).multiplyScalar(k),i.hemi[p]=X,p++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ft.LTC_FLOAT_1,i.rectAreaLTC2=ft.LTC_FLOAT_2):(i.rectAreaLTC1=ft.LTC_HALF_1,i.rectAreaLTC2=ft.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;let D=i.hash;(D.directionalLength!==f||D.pointLength!==g||D.spotLength!==x||D.rectAreaLength!==m||D.hemiLength!==p||D.numDirectionalShadows!==w||D.numPointShadows!==_||D.numSpotShadows!==y||D.numSpotMaps!==C||D.numLightProbes!==I)&&(i.directional.length=f,i.spot.length=x,i.rectArea.length=m,i.point.length=g,i.hemi.length=p,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=_,i.pointShadowMap.length=_,i.spotShadow.length=y,i.spotShadowMap.length=y,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=_,i.spotLightMatrix.length=y+C-A,i.spotLightMap.length=C,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=I,D.directionalLength=f,D.pointLength=g,D.spotLength=x,D.rectAreaLength=m,D.hemiLength=p,D.numDirectionalShadows=w,D.numPointShadows=_,D.numSpotShadows=y,D.numSpotMaps=C,D.numLightProbes=I,i.version=Xy++)}function l(c,h){let u=0,d=0,f=0,g=0,x=0,m=h.matrixWorldInverse;for(let p=0,w=c.length;p<w;p++){let _=c[p];if(_.isDirectionalLight){let y=i.directional[u];y.direction.setFromMatrixPosition(_.matrixWorld),s.setFromMatrixPosition(_.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),u++}else if(_.isSpotLight){let y=i.spot[f];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(m),y.direction.setFromMatrixPosition(_.matrixWorld),s.setFromMatrixPosition(_.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),f++}else if(_.isRectAreaLight){let y=i.rectArea[g];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(m),o.identity(),r.copy(_.matrixWorld),r.premultiply(m),o.extractRotation(r),y.halfWidth.set(_.width*.5,0,0),y.halfHeight.set(0,_.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),g++}else if(_.isPointLight){let y=i.point[d];y.position.setFromMatrixPosition(_.matrixWorld),y.position.applyMatrix4(m),d++}else if(_.isHemisphereLight){let y=i.hemi[x];y.direction.setFromMatrixPosition(_.matrixWorld),y.direction.transformDirection(m),x++}}}return{setup:a,setupView:l,state:i}}function $d(n){let t=new Yy(n),e=[],i=[];function s(h){c.camera=h,e.length=0,i.length=0}function r(h){e.push(h)}function o(h){i.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}let c={lightsArray:e,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function $y(n){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new $d(n),t.set(s,[a])):r>=o.length?(a=new $d(n),o.push(a)):a=o[r],a}function i(){t=new WeakMap}return{get:e,dispose:i}}var $c=class extends Li{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=e0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Zc=class extends Li{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},Zy=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Jy=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Ky(n,t,e){let i=new Tr,s=new ct,r=new ct,o=new we,a=new $c({depthPacking:n0}),l=new Zc,c={},h=e.maxTextureSize,u={[Ci]:je,[je]:Ci,[si]:si},d=new Ye({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ct},radius:{value:4}},vertexShader:Zy,fragmentShader:Jy}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let g=new Ae;g.setAttribute("position",new qe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new Me(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Sa;let p=this.type;this.render=function(A,I,D){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;let T=n.getRenderTarget(),M=n.getActiveCubeFace(),U=n.getActiveMipmapLevel(),G=n.state;G.setBlending(Ti),G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);let k=p!==ni&&this.type===ni,W=p===ni&&this.type!==ni;for(let j=0,X=A.length;j<X;j++){let st=A[j],Y=st.shadow;if(Y===void 0){console.warn("THREE.WebGLShadowMap:",st,"has no shadow.");continue}if(Y.autoUpdate===!1&&Y.needsUpdate===!1)continue;s.copy(Y.mapSize);let dt=Y.getFrameExtents();if(s.multiply(dt),r.copy(Y.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/dt.x),s.x=r.x*dt.x,Y.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/dt.y),s.y=r.y*dt.y,Y.mapSize.y=r.y)),Y.map===null||k===!0||W===!0){let Rt=this.type!==ni?{minFilter:ln,magFilter:ln}:{};Y.map!==null&&Y.map.dispose(),Y.map=new Tn(s.x,s.y,Rt),Y.map.texture.name=st.name+".shadowMap",Y.camera.updateProjectionMatrix()}n.setRenderTarget(Y.map),n.clear();let _t=Y.getViewportCount();for(let Rt=0;Rt<_t;Rt++){let Zt=Y.getViewport(Rt);o.set(r.x*Zt.x,r.y*Zt.y,r.x*Zt.z,r.y*Zt.w),G.viewport(o),Y.updateMatrices(st,Rt),i=Y.getFrustum(),y(I,D,Y.camera,st,this.type)}Y.isPointLightShadow!==!0&&this.type===ni&&w(Y,D),Y.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(T,M,U)};function w(A,I){let D=t.update(x);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Tn(s.x,s.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,n.setRenderTarget(A.mapPass),n.clear(),n.renderBufferDirect(I,null,D,d,x,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,n.setRenderTarget(A.map),n.clear(),n.renderBufferDirect(I,null,D,f,x,null)}function _(A,I,D,T){let M=null,U=D.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(U!==void 0)M=U;else if(M=D.isPointLight===!0?l:a,n.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0){let G=M.uuid,k=I.uuid,W=c[G];W===void 0&&(W={},c[G]=W);let j=W[k];j===void 0&&(j=M.clone(),W[k]=j,I.addEventListener("dispose",C)),M=j}if(M.visible=I.visible,M.wireframe=I.wireframe,T===ni?M.side=I.shadowSide!==null?I.shadowSide:I.side:M.side=I.shadowSide!==null?I.shadowSide:u[I.side],M.alphaMap=I.alphaMap,M.alphaTest=I.alphaTest,M.map=I.map,M.clipShadows=I.clipShadows,M.clippingPlanes=I.clippingPlanes,M.clipIntersection=I.clipIntersection,M.displacementMap=I.displacementMap,M.displacementScale=I.displacementScale,M.displacementBias=I.displacementBias,M.wireframeLinewidth=I.wireframeLinewidth,M.linewidth=I.linewidth,D.isPointLight===!0&&M.isMeshDistanceMaterial===!0){let G=n.properties.get(M);G.light=D}return M}function y(A,I,D,T,M){if(A.visible===!1)return;if(A.layers.test(I.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&M===ni)&&(!A.frustumCulled||i.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,A.matrixWorld);let k=t.update(A),W=A.material;if(Array.isArray(W)){let j=k.groups;for(let X=0,st=j.length;X<st;X++){let Y=j[X],dt=W[Y.materialIndex];if(dt&&dt.visible){let _t=_(A,dt,T,M);A.onBeforeShadow(n,A,I,D,k,_t,Y),n.renderBufferDirect(D,null,k,_t,A,Y),A.onAfterShadow(n,A,I,D,k,_t,Y)}}}else if(W.visible){let j=_(A,W,T,M);A.onBeforeShadow(n,A,I,D,k,j,null),n.renderBufferDirect(D,null,k,j,A,null),A.onAfterShadow(n,A,I,D,k,j,null)}}let G=A.children;for(let k=0,W=G.length;k<W;k++)y(G[k],I,D,T,M)}function C(A){A.target.removeEventListener("dispose",C);for(let D in c){let T=c[D],M=A.target.uuid;M in T&&(T[M].dispose(),delete T[M])}}}var jy={[jl]:Ql,[tc]:ic,[ec]:sc,[Os]:nc,[Ql]:jl,[ic]:tc,[sc]:ec,[nc]:Os};function Qy(n,t){function e(){let F=!1,gt=new we,$=null,Q=new we(0,0,0,0);return{setMask:function(yt){$!==yt&&!F&&(n.colorMask(yt,yt,yt,yt),$=yt)},setLocked:function(yt){F=yt},setClear:function(yt,xt,Jt,Se,ze){ze===!0&&(yt*=Se,xt*=Se,Jt*=Se),gt.set(yt,xt,Jt,Se),Q.equals(gt)===!1&&(n.clearColor(yt,xt,Jt,Se),Q.copy(gt))},reset:function(){F=!1,$=null,Q.set(-1,0,0,0)}}}function i(){let F=!1,gt=!1,$=null,Q=null,yt=null;return{setReversed:function(xt){if(gt!==xt){let Jt=t.get("EXT_clip_control");gt?Jt.clipControlEXT(Jt.LOWER_LEFT_EXT,Jt.ZERO_TO_ONE_EXT):Jt.clipControlEXT(Jt.LOWER_LEFT_EXT,Jt.NEGATIVE_ONE_TO_ONE_EXT);let Se=yt;yt=null,this.setClear(Se)}gt=xt},getReversed:function(){return gt},setTest:function(xt){xt?lt(n.DEPTH_TEST):kt(n.DEPTH_TEST)},setMask:function(xt){$!==xt&&!F&&(n.depthMask(xt),$=xt)},setFunc:function(xt){if(gt&&(xt=jy[xt]),Q!==xt){switch(xt){case jl:n.depthFunc(n.NEVER);break;case Ql:n.depthFunc(n.ALWAYS);break;case tc:n.depthFunc(n.LESS);break;case Os:n.depthFunc(n.LEQUAL);break;case ec:n.depthFunc(n.EQUAL);break;case nc:n.depthFunc(n.GEQUAL);break;case ic:n.depthFunc(n.GREATER);break;case sc:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Q=xt}},setLocked:function(xt){F=xt},setClear:function(xt){yt!==xt&&(gt&&(xt=1-xt),n.clearDepth(xt),yt=xt)},reset:function(){F=!1,$=null,Q=null,yt=null,gt=!1}}}function s(){let F=!1,gt=null,$=null,Q=null,yt=null,xt=null,Jt=null,Se=null,ze=null;return{setTest:function(pe){F||(pe?lt(n.STENCIL_TEST):kt(n.STENCIL_TEST))},setMask:function(pe){gt!==pe&&!F&&(n.stencilMask(pe),gt=pe)},setFunc:function(pe,yn,Zn){($!==pe||Q!==yn||yt!==Zn)&&(n.stencilFunc(pe,yn,Zn),$=pe,Q=yn,yt=Zn)},setOp:function(pe,yn,Zn){(xt!==pe||Jt!==yn||Se!==Zn)&&(n.stencilOp(pe,yn,Zn),xt=pe,Jt=yn,Se=Zn)},setLocked:function(pe){F=pe},setClear:function(pe){ze!==pe&&(n.clearStencil(pe),ze=pe)},reset:function(){F=!1,gt=null,$=null,Q=null,yt=null,xt=null,Jt=null,Se=null,ze=null}}}let r=new e,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},u={},d=new WeakMap,f=[],g=null,x=!1,m=null,p=null,w=null,_=null,y=null,C=null,A=null,I=new Wt(0,0,0),D=0,T=!1,M=null,U=null,G=null,k=null,W=null,j=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),X=!1,st=0,Y=n.getParameter(n.VERSION);Y.indexOf("WebGL")!==-1?(st=parseFloat(/^WebGL (\d)/.exec(Y)[1]),X=st>=1):Y.indexOf("OpenGL ES")!==-1&&(st=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),X=st>=2);let dt=null,_t={},Rt=n.getParameter(n.SCISSOR_BOX),Zt=n.getParameter(n.VIEWPORT),ue=new we().fromArray(Rt),K=new we().fromArray(Zt);function ot(F,gt,$,Q){let yt=new Uint8Array(4),xt=n.createTexture();n.bindTexture(F,xt),n.texParameteri(F,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(F,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Jt=0;Jt<$;Jt++)F===n.TEXTURE_3D||F===n.TEXTURE_2D_ARRAY?n.texImage3D(gt,0,n.RGBA,1,1,Q,0,n.RGBA,n.UNSIGNED_BYTE,yt):n.texImage2D(gt+Jt,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,yt);return xt}let It={};It[n.TEXTURE_2D]=ot(n.TEXTURE_2D,n.TEXTURE_2D,1),It[n.TEXTURE_CUBE_MAP]=ot(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),It[n.TEXTURE_2D_ARRAY]=ot(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),It[n.TEXTURE_3D]=ot(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),lt(n.DEPTH_TEST),o.setFunc(Os),nt(!1),St(Ku),lt(n.CULL_FACE),P(Ti);function lt(F){h[F]!==!0&&(n.enable(F),h[F]=!0)}function kt(F){h[F]!==!1&&(n.disable(F),h[F]=!1)}function qt(F,gt){return u[F]!==gt?(n.bindFramebuffer(F,gt),u[F]=gt,F===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=gt),F===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=gt),!0):!1}function Gt(F,gt){let $=f,Q=!1;if(F){$=d.get(gt),$===void 0&&($=[],d.set(gt,$));let yt=F.textures;if($.length!==yt.length||$[0]!==n.COLOR_ATTACHMENT0){for(let xt=0,Jt=yt.length;xt<Jt;xt++)$[xt]=n.COLOR_ATTACHMENT0+xt;$.length=yt.length,Q=!0}}else $[0]!==n.BACK&&($[0]=n.BACK,Q=!0);Q&&n.drawBuffers($)}function se(F){return g!==F?(n.useProgram(F),g=F,!0):!1}let tt={[ts]:n.FUNC_ADD,[Cm]:n.FUNC_SUBTRACT,[Im]:n.FUNC_REVERSE_SUBTRACT};tt[Pm]=n.MIN,tt[Lm]=n.MAX;let rt={[Dm]:n.ZERO,[Um]:n.ONE,[Nm]:n.SRC_COLOR,[Jl]:n.SRC_ALPHA,[Hm]:n.SRC_ALPHA_SATURATE,[km]:n.DST_COLOR,[zm]:n.DST_ALPHA,[Fm]:n.ONE_MINUS_SRC_COLOR,[Kl]:n.ONE_MINUS_SRC_ALPHA,[Bm]:n.ONE_MINUS_DST_COLOR,[Om]:n.ONE_MINUS_DST_ALPHA,[Vm]:n.CONSTANT_COLOR,[Gm]:n.ONE_MINUS_CONSTANT_COLOR,[Wm]:n.CONSTANT_ALPHA,[Xm]:n.ONE_MINUS_CONSTANT_ALPHA};function P(F,gt,$,Q,yt,xt,Jt,Se,ze,pe){if(F===Ti){x===!0&&(kt(n.BLEND),x=!1);return}if(x===!1&&(lt(n.BLEND),x=!0),F!==Rm){if(F!==m||pe!==T){if((p!==ts||y!==ts)&&(n.blendEquation(n.FUNC_ADD),p=ts,y=ts),pe)switch(F){case Ai:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ss:n.blendFunc(n.ONE,n.ONE);break;case ju:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Qu:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}else switch(F){case Ai:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ss:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case ju:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Qu:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",F);break}w=null,_=null,C=null,A=null,I.set(0,0,0),D=0,m=F,T=pe}return}yt=yt||gt,xt=xt||$,Jt=Jt||Q,(gt!==p||yt!==y)&&(n.blendEquationSeparate(tt[gt],tt[yt]),p=gt,y=yt),($!==w||Q!==_||xt!==C||Jt!==A)&&(n.blendFuncSeparate(rt[$],rt[Q],rt[xt],rt[Jt]),w=$,_=Q,C=xt,A=Jt),(Se.equals(I)===!1||ze!==D)&&(n.blendColor(Se.r,Se.g,Se.b,ze),I.copy(Se),D=ze),m=F,T=!1}function Nt(F,gt){F.side===si?kt(n.CULL_FACE):lt(n.CULL_FACE);let $=F.side===je;gt&&($=!$),nt($),F.blending===Ai&&F.transparent===!1?P(Ti):P(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),o.setFunc(F.depthFunc),o.setTest(F.depthTest),o.setMask(F.depthWrite),r.setMask(F.colorWrite);let Q=F.stencilWrite;a.setTest(Q),Q&&(a.setMask(F.stencilWriteMask),a.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),a.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),Ht(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?lt(n.SAMPLE_ALPHA_TO_COVERAGE):kt(n.SAMPLE_ALPHA_TO_COVERAGE)}function nt(F){M!==F&&(F?n.frontFace(n.CW):n.frontFace(n.CCW),M=F)}function St(F){F!==Em?(lt(n.CULL_FACE),F!==U&&(F===Ku?n.cullFace(n.BACK):F===Tm?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):kt(n.CULL_FACE),U=F}function ht(F){F!==G&&(X&&n.lineWidth(F),G=F)}function Ht(F,gt,$){F?(lt(n.POLYGON_OFFSET_FILL),(k!==gt||W!==$)&&(n.polygonOffset(gt,$),k=gt,W=$)):kt(n.POLYGON_OFFSET_FILL)}function Mt(F){F?lt(n.SCISSOR_TEST):kt(n.SCISSOR_TEST)}function R(F){F===void 0&&(F=n.TEXTURE0+j-1),dt!==F&&(n.activeTexture(F),dt=F)}function b(F,gt,$){$===void 0&&(dt===null?$=n.TEXTURE0+j-1:$=dt);let Q=_t[$];Q===void 0&&(Q={type:void 0,texture:void 0},_t[$]=Q),(Q.type!==F||Q.texture!==gt)&&(dt!==$&&(n.activeTexture($),dt=$),n.bindTexture(F,gt||It[F]),Q.type=F,Q.texture=gt)}function B(){let F=_t[dt];F!==void 0&&F.type!==void 0&&(n.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function Z(){try{n.compressedTexImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function et(){try{n.compressedTexImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function J(){try{n.texSubImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Pt(){try{n.texSubImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function pt(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function bt(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function ne(){try{n.texStorage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function it(){try{n.texStorage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Tt(){try{n.texImage2D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Vt(){try{n.texImage3D.apply(n,arguments)}catch(F){console.error("THREE.WebGLState:",F)}}function Xt(F){ue.equals(F)===!1&&(n.scissor(F.x,F.y,F.z,F.w),ue.copy(F))}function At(F){K.equals(F)===!1&&(n.viewport(F.x,F.y,F.z,F.w),K.copy(F))}function ie(F,gt){let $=c.get(gt);$===void 0&&($=new WeakMap,c.set(gt,$));let Q=$.get(F);Q===void 0&&(Q=n.getUniformBlockIndex(gt,F.name),$.set(F,Q))}function Qt(F,gt){let Q=c.get(gt).get(F);l.get(gt)!==Q&&(n.uniformBlockBinding(gt,Q,F.__bindingPointIndex),l.set(gt,Q))}function ge(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},dt=null,_t={},u={},d=new WeakMap,f=[],g=null,x=!1,m=null,p=null,w=null,_=null,y=null,C=null,A=null,I=new Wt(0,0,0),D=0,T=!1,M=null,U=null,G=null,k=null,W=null,ue.set(0,0,n.canvas.width,n.canvas.height),K.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:lt,disable:kt,bindFramebuffer:qt,drawBuffers:Gt,useProgram:se,setBlending:P,setMaterial:Nt,setFlipSided:nt,setCullFace:St,setLineWidth:ht,setPolygonOffset:Ht,setScissorTest:Mt,activeTexture:R,bindTexture:b,unbindTexture:B,compressedTexImage2D:Z,compressedTexImage3D:et,texImage2D:Tt,texImage3D:Vt,updateUBOMapping:ie,uniformBlockBinding:Qt,texStorage2D:ne,texStorage3D:it,texSubImage2D:J,texSubImage3D:Pt,compressedTexSubImage2D:pt,compressedTexSubImage3D:bt,scissor:Xt,viewport:At,reset:ge}}function Zd(n,t,e,i){let s=t_(i);switch(e){case ff:return n*t;case mf:return n*t;case gf:return n*t*2;case Br:return n*t/s.components*s.byteLength;case Ch:return n*t/s.components*s.byteLength;case xf:return n*t*2/s.components*s.byteLength;case Ih:return n*t*2/s.components*s.byteLength;case pf:return n*t*3/s.components*s.byteLength;case wn:return n*t*4/s.components*s.byteLength;case Ph:return n*t*4/s.components*s.byteLength;case Yo:case $o:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case Zo:case Jo:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case hc:case dc:return Math.max(n,16)*Math.max(t,8)/4;case cc:case uc:return Math.max(n,8)*Math.max(t,8)/2;case fc:case pc:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*8;case mc:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case gc:return Math.floor((n+3)/4)*Math.floor((t+3)/4)*16;case xc:return Math.floor((n+4)/5)*Math.floor((t+3)/4)*16;case vc:return Math.floor((n+4)/5)*Math.floor((t+4)/5)*16;case yc:return Math.floor((n+5)/6)*Math.floor((t+4)/5)*16;case _c:return Math.floor((n+5)/6)*Math.floor((t+5)/6)*16;case Mc:return Math.floor((n+7)/8)*Math.floor((t+4)/5)*16;case bc:return Math.floor((n+7)/8)*Math.floor((t+5)/6)*16;case Sc:return Math.floor((n+7)/8)*Math.floor((t+7)/8)*16;case wc:return Math.floor((n+9)/10)*Math.floor((t+4)/5)*16;case Ec:return Math.floor((n+9)/10)*Math.floor((t+5)/6)*16;case Tc:return Math.floor((n+9)/10)*Math.floor((t+7)/8)*16;case Ac:return Math.floor((n+9)/10)*Math.floor((t+9)/10)*16;case Rc:return Math.floor((n+11)/12)*Math.floor((t+9)/10)*16;case Cc:return Math.floor((n+11)/12)*Math.floor((t+11)/12)*16;case Ko:case Ic:case Pc:return Math.ceil(n/4)*Math.ceil(t/4)*16;case vf:case Lc:return Math.ceil(n/4)*Math.ceil(t/4)*8;case Dc:case Uc:return Math.ceil(n/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function t_(n){switch(n){case En:case hf:return{byteLength:1,components:1};case Sr:case uf:case kr:return{byteLength:2,components:1};case Ah:case Rh:return{byteLength:2,components:4};case rs:case Th:case Fn:return{byteLength:4,components:1};case df:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function e_(n,t,e,i,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ct,h=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,b){return f?new OffscreenCanvas(R,b):ta("canvas")}function x(R,b,B){let Z=1,et=Mt(R);if((et.width>B||et.height>B)&&(Z=B/Math.max(et.width,et.height)),Z<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){let J=Math.floor(Z*et.width),Pt=Math.floor(Z*et.height);u===void 0&&(u=g(J,Pt));let pt=b?g(J,Pt):u;return pt.width=J,pt.height=Pt,pt.getContext("2d").drawImage(R,0,0,J,Pt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+et.width+"x"+et.height+") to ("+J+"x"+Pt+")."),pt}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+et.width+"x"+et.height+")."),R;return R}function m(R){return R.generateMipmaps}function p(R){n.generateMipmap(R)}function w(R){return R.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?n.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function _(R,b,B,Z,et=!1){if(R!==null){if(n[R]!==void 0)return n[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let J=b;if(b===n.RED&&(B===n.FLOAT&&(J=n.R32F),B===n.HALF_FLOAT&&(J=n.R16F),B===n.UNSIGNED_BYTE&&(J=n.R8)),b===n.RED_INTEGER&&(B===n.UNSIGNED_BYTE&&(J=n.R8UI),B===n.UNSIGNED_SHORT&&(J=n.R16UI),B===n.UNSIGNED_INT&&(J=n.R32UI),B===n.BYTE&&(J=n.R8I),B===n.SHORT&&(J=n.R16I),B===n.INT&&(J=n.R32I)),b===n.RG&&(B===n.FLOAT&&(J=n.RG32F),B===n.HALF_FLOAT&&(J=n.RG16F),B===n.UNSIGNED_BYTE&&(J=n.RG8)),b===n.RG_INTEGER&&(B===n.UNSIGNED_BYTE&&(J=n.RG8UI),B===n.UNSIGNED_SHORT&&(J=n.RG16UI),B===n.UNSIGNED_INT&&(J=n.RG32UI),B===n.BYTE&&(J=n.RG8I),B===n.SHORT&&(J=n.RG16I),B===n.INT&&(J=n.RG32I)),b===n.RGB_INTEGER&&(B===n.UNSIGNED_BYTE&&(J=n.RGB8UI),B===n.UNSIGNED_SHORT&&(J=n.RGB16UI),B===n.UNSIGNED_INT&&(J=n.RGB32UI),B===n.BYTE&&(J=n.RGB8I),B===n.SHORT&&(J=n.RGB16I),B===n.INT&&(J=n.RGB32I)),b===n.RGBA_INTEGER&&(B===n.UNSIGNED_BYTE&&(J=n.RGBA8UI),B===n.UNSIGNED_SHORT&&(J=n.RGBA16UI),B===n.UNSIGNED_INT&&(J=n.RGBA32UI),B===n.BYTE&&(J=n.RGBA8I),B===n.SHORT&&(J=n.RGBA16I),B===n.INT&&(J=n.RGBA32I)),b===n.RGB&&B===n.UNSIGNED_INT_5_9_9_9_REV&&(J=n.RGB9_E5),b===n.RGBA){let Pt=et?Ea:re.getTransfer(Z);B===n.FLOAT&&(J=n.RGBA32F),B===n.HALF_FLOAT&&(J=n.RGBA16F),B===n.UNSIGNED_BYTE&&(J=Pt===me?n.SRGB8_ALPHA8:n.RGBA8),B===n.UNSIGNED_SHORT_4_4_4_4&&(J=n.RGBA4),B===n.UNSIGNED_SHORT_5_5_5_1&&(J=n.RGB5_A1)}return(J===n.R16F||J===n.R32F||J===n.RG16F||J===n.RG32F||J===n.RGBA16F||J===n.RGBA32F)&&t.get("EXT_color_buffer_float"),J}function y(R,b){let B;return R?b===null||b===rs||b===Hs?B=n.DEPTH24_STENCIL8:b===Fn?B=n.DEPTH32F_STENCIL8:b===Sr&&(B=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===rs||b===Hs?B=n.DEPTH_COMPONENT24:b===Fn?B=n.DEPTH_COMPONENT32F:b===Sr&&(B=n.DEPTH_COMPONENT16),B}function C(R,b){return m(R)===!0||R.isFramebufferTexture&&R.minFilter!==ln&&R.minFilter!==an?Math.log2(Math.max(b.width,b.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?b.mipmaps.length:1}function A(R){let b=R.target;b.removeEventListener("dispose",A),D(b),b.isVideoTexture&&h.delete(b)}function I(R){let b=R.target;b.removeEventListener("dispose",I),M(b)}function D(R){let b=i.get(R);if(b.__webglInit===void 0)return;let B=R.source,Z=d.get(B);if(Z){let et=Z[b.__cacheKey];et.usedTimes--,et.usedTimes===0&&T(R),Object.keys(Z).length===0&&d.delete(B)}i.remove(R)}function T(R){let b=i.get(R);n.deleteTexture(b.__webglTexture);let B=R.source,Z=d.get(B);delete Z[b.__cacheKey],o.memory.textures--}function M(R){let b=i.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),i.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(b.__webglFramebuffer[Z]))for(let et=0;et<b.__webglFramebuffer[Z].length;et++)n.deleteFramebuffer(b.__webglFramebuffer[Z][et]);else n.deleteFramebuffer(b.__webglFramebuffer[Z]);b.__webglDepthbuffer&&n.deleteRenderbuffer(b.__webglDepthbuffer[Z])}else{if(Array.isArray(b.__webglFramebuffer))for(let Z=0;Z<b.__webglFramebuffer.length;Z++)n.deleteFramebuffer(b.__webglFramebuffer[Z]);else n.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&n.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&n.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let Z=0;Z<b.__webglColorRenderbuffer.length;Z++)b.__webglColorRenderbuffer[Z]&&n.deleteRenderbuffer(b.__webglColorRenderbuffer[Z]);b.__webglDepthRenderbuffer&&n.deleteRenderbuffer(b.__webglDepthRenderbuffer)}let B=R.textures;for(let Z=0,et=B.length;Z<et;Z++){let J=i.get(B[Z]);J.__webglTexture&&(n.deleteTexture(J.__webglTexture),o.memory.textures--),i.remove(B[Z])}i.remove(R)}let U=0;function G(){U=0}function k(){let R=U;return R>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+s.maxTextures),U+=1,R}function W(R){let b=[];return b.push(R.wrapS),b.push(R.wrapT),b.push(R.wrapR||0),b.push(R.magFilter),b.push(R.minFilter),b.push(R.anisotropy),b.push(R.internalFormat),b.push(R.format),b.push(R.type),b.push(R.generateMipmaps),b.push(R.premultiplyAlpha),b.push(R.flipY),b.push(R.unpackAlignment),b.push(R.colorSpace),b.join()}function j(R,b){let B=i.get(R);if(R.isVideoTexture&&ht(R),R.isRenderTargetTexture===!1&&R.version>0&&B.__version!==R.version){let Z=R.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(B,R,b);return}}e.bindTexture(n.TEXTURE_2D,B.__webglTexture,n.TEXTURE0+b)}function X(R,b){let B=i.get(R);if(R.version>0&&B.__version!==R.version){K(B,R,b);return}e.bindTexture(n.TEXTURE_2D_ARRAY,B.__webglTexture,n.TEXTURE0+b)}function st(R,b){let B=i.get(R);if(R.version>0&&B.__version!==R.version){K(B,R,b);return}e.bindTexture(n.TEXTURE_3D,B.__webglTexture,n.TEXTURE0+b)}function Y(R,b){let B=i.get(R);if(R.version>0&&B.__version!==R.version){ot(B,R,b);return}e.bindTexture(n.TEXTURE_CUBE_MAP,B.__webglTexture,n.TEXTURE0+b)}let dt={[ac]:n.REPEAT,[ri]:n.CLAMP_TO_EDGE,[lc]:n.MIRRORED_REPEAT},_t={[ln]:n.NEAREST,[t0]:n.NEAREST_MIPMAP_NEAREST,[yo]:n.NEAREST_MIPMAP_LINEAR,[an]:n.LINEAR,[gl]:n.LINEAR_MIPMAP_NEAREST,[is]:n.LINEAR_MIPMAP_LINEAR},Rt={[s0]:n.NEVER,[h0]:n.ALWAYS,[r0]:n.LESS,[_f]:n.LEQUAL,[o0]:n.EQUAL,[c0]:n.GEQUAL,[a0]:n.GREATER,[l0]:n.NOTEQUAL};function Zt(R,b){if(b.type===Fn&&t.has("OES_texture_float_linear")===!1&&(b.magFilter===an||b.magFilter===gl||b.magFilter===yo||b.magFilter===is||b.minFilter===an||b.minFilter===gl||b.minFilter===yo||b.minFilter===is)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(R,n.TEXTURE_WRAP_S,dt[b.wrapS]),n.texParameteri(R,n.TEXTURE_WRAP_T,dt[b.wrapT]),(R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY)&&n.texParameteri(R,n.TEXTURE_WRAP_R,dt[b.wrapR]),n.texParameteri(R,n.TEXTURE_MAG_FILTER,_t[b.magFilter]),n.texParameteri(R,n.TEXTURE_MIN_FILTER,_t[b.minFilter]),b.compareFunction&&(n.texParameteri(R,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(R,n.TEXTURE_COMPARE_FUNC,Rt[b.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===ln||b.minFilter!==yo&&b.minFilter!==is||b.type===Fn&&t.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||i.get(b).__currentAnisotropy){let B=t.get("EXT_texture_filter_anisotropic");n.texParameterf(R,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,s.getMaxAnisotropy())),i.get(b).__currentAnisotropy=b.anisotropy}}}function ue(R,b){let B=!1;R.__webglInit===void 0&&(R.__webglInit=!0,b.addEventListener("dispose",A));let Z=b.source,et=d.get(Z);et===void 0&&(et={},d.set(Z,et));let J=W(b);if(J!==R.__cacheKey){et[J]===void 0&&(et[J]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,B=!0),et[J].usedTimes++;let Pt=et[R.__cacheKey];Pt!==void 0&&(et[R.__cacheKey].usedTimes--,Pt.usedTimes===0&&T(b)),R.__cacheKey=J,R.__webglTexture=et[J].texture}return B}function K(R,b,B){let Z=n.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(Z=n.TEXTURE_2D_ARRAY),b.isData3DTexture&&(Z=n.TEXTURE_3D);let et=ue(R,b),J=b.source;e.bindTexture(Z,R.__webglTexture,n.TEXTURE0+B);let Pt=i.get(J);if(J.version!==Pt.__version||et===!0){e.activeTexture(n.TEXTURE0+B);let pt=re.getPrimaries(re.workingColorSpace),bt=b.colorSpace===Ei?null:re.getPrimaries(b.colorSpace),ne=b.colorSpace===Ei||pt===bt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,b.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,b.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ne);let it=x(b.image,!1,s.maxTextureSize);it=Ht(b,it);let Tt=r.convert(b.format,b.colorSpace),Vt=r.convert(b.type),Xt=_(b.internalFormat,Tt,Vt,b.colorSpace,b.isVideoTexture);Zt(Z,b);let At,ie=b.mipmaps,Qt=b.isVideoTexture!==!0,ge=Pt.__version===void 0||et===!0,F=J.dataReady,gt=C(b,it);if(b.isDepthTexture)Xt=y(b.format===Vs,b.type),ge&&(Qt?e.texStorage2D(n.TEXTURE_2D,1,Xt,it.width,it.height):e.texImage2D(n.TEXTURE_2D,0,Xt,it.width,it.height,0,Tt,Vt,null));else if(b.isDataTexture)if(ie.length>0){Qt&&ge&&e.texStorage2D(n.TEXTURE_2D,gt,Xt,ie[0].width,ie[0].height);for(let $=0,Q=ie.length;$<Q;$++)At=ie[$],Qt?F&&e.texSubImage2D(n.TEXTURE_2D,$,0,0,At.width,At.height,Tt,Vt,At.data):e.texImage2D(n.TEXTURE_2D,$,Xt,At.width,At.height,0,Tt,Vt,At.data);b.generateMipmaps=!1}else Qt?(ge&&e.texStorage2D(n.TEXTURE_2D,gt,Xt,it.width,it.height),F&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,it.width,it.height,Tt,Vt,it.data)):e.texImage2D(n.TEXTURE_2D,0,Xt,it.width,it.height,0,Tt,Vt,it.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){Qt&&ge&&e.texStorage3D(n.TEXTURE_2D_ARRAY,gt,Xt,ie[0].width,ie[0].height,it.depth);for(let $=0,Q=ie.length;$<Q;$++)if(At=ie[$],b.format!==wn)if(Tt!==null)if(Qt){if(F)if(b.layerUpdates.size>0){let yt=Zd(At.width,At.height,b.format,b.type);for(let xt of b.layerUpdates){let Jt=At.data.subarray(xt*yt/At.data.BYTES_PER_ELEMENT,(xt+1)*yt/At.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,xt,At.width,At.height,1,Tt,Jt)}b.clearLayerUpdates()}else e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,0,At.width,At.height,it.depth,Tt,At.data)}else e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,$,Xt,At.width,At.height,it.depth,0,At.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Qt?F&&e.texSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,0,At.width,At.height,it.depth,Tt,Vt,At.data):e.texImage3D(n.TEXTURE_2D_ARRAY,$,Xt,At.width,At.height,it.depth,0,Tt,Vt,At.data)}else{Qt&&ge&&e.texStorage2D(n.TEXTURE_2D,gt,Xt,ie[0].width,ie[0].height);for(let $=0,Q=ie.length;$<Q;$++)At=ie[$],b.format!==wn?Tt!==null?Qt?F&&e.compressedTexSubImage2D(n.TEXTURE_2D,$,0,0,At.width,At.height,Tt,At.data):e.compressedTexImage2D(n.TEXTURE_2D,$,Xt,At.width,At.height,0,At.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Qt?F&&e.texSubImage2D(n.TEXTURE_2D,$,0,0,At.width,At.height,Tt,Vt,At.data):e.texImage2D(n.TEXTURE_2D,$,Xt,At.width,At.height,0,Tt,Vt,At.data)}else if(b.isDataArrayTexture)if(Qt){if(ge&&e.texStorage3D(n.TEXTURE_2D_ARRAY,gt,Xt,it.width,it.height,it.depth),F)if(b.layerUpdates.size>0){let $=Zd(it.width,it.height,b.format,b.type);for(let Q of b.layerUpdates){let yt=it.data.subarray(Q*$/it.data.BYTES_PER_ELEMENT,(Q+1)*$/it.data.BYTES_PER_ELEMENT);e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Q,it.width,it.height,1,Tt,Vt,yt)}b.clearLayerUpdates()}else e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,Tt,Vt,it.data)}else e.texImage3D(n.TEXTURE_2D_ARRAY,0,Xt,it.width,it.height,it.depth,0,Tt,Vt,it.data);else if(b.isData3DTexture)Qt?(ge&&e.texStorage3D(n.TEXTURE_3D,gt,Xt,it.width,it.height,it.depth),F&&e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,Tt,Vt,it.data)):e.texImage3D(n.TEXTURE_3D,0,Xt,it.width,it.height,it.depth,0,Tt,Vt,it.data);else if(b.isFramebufferTexture){if(ge)if(Qt)e.texStorage2D(n.TEXTURE_2D,gt,Xt,it.width,it.height);else{let $=it.width,Q=it.height;for(let yt=0;yt<gt;yt++)e.texImage2D(n.TEXTURE_2D,yt,Xt,$,Q,0,Tt,Vt,null),$>>=1,Q>>=1}}else if(ie.length>0){if(Qt&&ge){let $=Mt(ie[0]);e.texStorage2D(n.TEXTURE_2D,gt,Xt,$.width,$.height)}for(let $=0,Q=ie.length;$<Q;$++)At=ie[$],Qt?F&&e.texSubImage2D(n.TEXTURE_2D,$,0,0,Tt,Vt,At):e.texImage2D(n.TEXTURE_2D,$,Xt,Tt,Vt,At);b.generateMipmaps=!1}else if(Qt){if(ge){let $=Mt(it);e.texStorage2D(n.TEXTURE_2D,gt,Xt,$.width,$.height)}F&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,Tt,Vt,it)}else e.texImage2D(n.TEXTURE_2D,0,Xt,Tt,Vt,it);m(b)&&p(Z),Pt.__version=J.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function ot(R,b,B){if(b.image.length!==6)return;let Z=ue(R,b),et=b.source;e.bindTexture(n.TEXTURE_CUBE_MAP,R.__webglTexture,n.TEXTURE0+B);let J=i.get(et);if(et.version!==J.__version||Z===!0){e.activeTexture(n.TEXTURE0+B);let Pt=re.getPrimaries(re.workingColorSpace),pt=b.colorSpace===Ei?null:re.getPrimaries(b.colorSpace),bt=b.colorSpace===Ei||Pt===pt?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,b.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,b.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,bt);let ne=b.isCompressedTexture||b.image[0].isCompressedTexture,it=b.image[0]&&b.image[0].isDataTexture,Tt=[];for(let Q=0;Q<6;Q++)!ne&&!it?Tt[Q]=x(b.image[Q],!0,s.maxCubemapSize):Tt[Q]=it?b.image[Q].image:b.image[Q],Tt[Q]=Ht(b,Tt[Q]);let Vt=Tt[0],Xt=r.convert(b.format,b.colorSpace),At=r.convert(b.type),ie=_(b.internalFormat,Xt,At,b.colorSpace),Qt=b.isVideoTexture!==!0,ge=J.__version===void 0||Z===!0,F=et.dataReady,gt=C(b,Vt);Zt(n.TEXTURE_CUBE_MAP,b);let $;if(ne){Qt&&ge&&e.texStorage2D(n.TEXTURE_CUBE_MAP,gt,ie,Vt.width,Vt.height);for(let Q=0;Q<6;Q++){$=Tt[Q].mipmaps;for(let yt=0;yt<$.length;yt++){let xt=$[yt];b.format!==wn?Xt!==null?Qt?F&&e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,0,0,xt.width,xt.height,Xt,xt.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,ie,xt.width,xt.height,0,xt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Qt?F&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,0,0,xt.width,xt.height,Xt,At,xt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,ie,xt.width,xt.height,0,Xt,At,xt.data)}}}else{if($=b.mipmaps,Qt&&ge){$.length>0&&gt++;let Q=Mt(Tt[0]);e.texStorage2D(n.TEXTURE_CUBE_MAP,gt,ie,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(it){Qt?F&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,Tt[Q].width,Tt[Q].height,Xt,At,Tt[Q].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,ie,Tt[Q].width,Tt[Q].height,0,Xt,At,Tt[Q].data);for(let yt=0;yt<$.length;yt++){let Jt=$[yt].image[Q].image;Qt?F&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,0,0,Jt.width,Jt.height,Xt,At,Jt.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,ie,Jt.width,Jt.height,0,Xt,At,Jt.data)}}else{Qt?F&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,Xt,At,Tt[Q]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,ie,Xt,At,Tt[Q]);for(let yt=0;yt<$.length;yt++){let xt=$[yt];Qt?F&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,0,0,Xt,At,xt.image[Q]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,ie,Xt,At,xt.image[Q])}}}m(b)&&p(n.TEXTURE_CUBE_MAP),J.__version=et.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function It(R,b,B,Z,et,J){let Pt=r.convert(B.format,B.colorSpace),pt=r.convert(B.type),bt=_(B.internalFormat,Pt,pt,B.colorSpace),ne=i.get(b),it=i.get(B);if(it.__renderTarget=b,!ne.__hasExternalTextures){let Tt=Math.max(1,b.width>>J),Vt=Math.max(1,b.height>>J);et===n.TEXTURE_3D||et===n.TEXTURE_2D_ARRAY?e.texImage3D(et,J,bt,Tt,Vt,b.depth,0,Pt,pt,null):e.texImage2D(et,J,bt,Tt,Vt,0,Pt,pt,null)}e.bindFramebuffer(n.FRAMEBUFFER,R),St(b)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Z,et,it.__webglTexture,0,nt(b)):(et===n.TEXTURE_2D||et>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&et<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Z,et,it.__webglTexture,J),e.bindFramebuffer(n.FRAMEBUFFER,null)}function lt(R,b,B){if(n.bindRenderbuffer(n.RENDERBUFFER,R),b.depthBuffer){let Z=b.depthTexture,et=Z&&Z.isDepthTexture?Z.type:null,J=y(b.stencilBuffer,et),Pt=b.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pt=nt(b);St(b)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,pt,J,b.width,b.height):B?n.renderbufferStorageMultisample(n.RENDERBUFFER,pt,J,b.width,b.height):n.renderbufferStorage(n.RENDERBUFFER,J,b.width,b.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Pt,n.RENDERBUFFER,R)}else{let Z=b.textures;for(let et=0;et<Z.length;et++){let J=Z[et],Pt=r.convert(J.format,J.colorSpace),pt=r.convert(J.type),bt=_(J.internalFormat,Pt,pt,J.colorSpace),ne=nt(b);B&&St(b)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,ne,bt,b.width,b.height):St(b)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ne,bt,b.width,b.height):n.renderbufferStorage(n.RENDERBUFFER,bt,b.width,b.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function kt(R,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(n.FRAMEBUFFER,R),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Z=i.get(b.depthTexture);Z.__renderTarget=b,(!Z.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),j(b.depthTexture,0);let et=Z.__webglTexture,J=nt(b);if(b.depthTexture.format===Ns)St(b)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,et,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,et,0);else if(b.depthTexture.format===Vs)St(b)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,et,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,et,0);else throw new Error("Unknown depthTexture format")}function qt(R){let b=i.get(R),B=R.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==R.depthTexture){let Z=R.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),Z){let et=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,Z.removeEventListener("dispose",et)};Z.addEventListener("dispose",et),b.__depthDisposeCallback=et}b.__boundDepthTexture=Z}if(R.depthTexture&&!b.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");kt(b.__webglFramebuffer,R)}else if(B){b.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(e.bindFramebuffer(n.FRAMEBUFFER,b.__webglFramebuffer[Z]),b.__webglDepthbuffer[Z]===void 0)b.__webglDepthbuffer[Z]=n.createRenderbuffer(),lt(b.__webglDepthbuffer[Z],R,!1);else{let et=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,J=b.__webglDepthbuffer[Z];n.bindRenderbuffer(n.RENDERBUFFER,J),n.framebufferRenderbuffer(n.FRAMEBUFFER,et,n.RENDERBUFFER,J)}}else if(e.bindFramebuffer(n.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=n.createRenderbuffer(),lt(b.__webglDepthbuffer,R,!1);else{let Z=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,et=b.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,et),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,et)}e.bindFramebuffer(n.FRAMEBUFFER,null)}function Gt(R,b,B){let Z=i.get(R);b!==void 0&&It(Z.__webglFramebuffer,R,R.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),B!==void 0&&qt(R)}function se(R){let b=R.texture,B=i.get(R),Z=i.get(b);R.addEventListener("dispose",I);let et=R.textures,J=R.isWebGLCubeRenderTarget===!0,Pt=et.length>1;if(Pt||(Z.__webglTexture===void 0&&(Z.__webglTexture=n.createTexture()),Z.__version=b.version,o.memory.textures++),J){B.__webglFramebuffer=[];for(let pt=0;pt<6;pt++)if(b.mipmaps&&b.mipmaps.length>0){B.__webglFramebuffer[pt]=[];for(let bt=0;bt<b.mipmaps.length;bt++)B.__webglFramebuffer[pt][bt]=n.createFramebuffer()}else B.__webglFramebuffer[pt]=n.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){B.__webglFramebuffer=[];for(let pt=0;pt<b.mipmaps.length;pt++)B.__webglFramebuffer[pt]=n.createFramebuffer()}else B.__webglFramebuffer=n.createFramebuffer();if(Pt)for(let pt=0,bt=et.length;pt<bt;pt++){let ne=i.get(et[pt]);ne.__webglTexture===void 0&&(ne.__webglTexture=n.createTexture(),o.memory.textures++)}if(R.samples>0&&St(R)===!1){B.__webglMultisampledFramebuffer=n.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let pt=0;pt<et.length;pt++){let bt=et[pt];B.__webglColorRenderbuffer[pt]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,B.__webglColorRenderbuffer[pt]);let ne=r.convert(bt.format,bt.colorSpace),it=r.convert(bt.type),Tt=_(bt.internalFormat,ne,it,bt.colorSpace,R.isXRRenderTarget===!0),Vt=nt(R);n.renderbufferStorageMultisample(n.RENDERBUFFER,Vt,Tt,R.width,R.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pt,n.RENDERBUFFER,B.__webglColorRenderbuffer[pt])}n.bindRenderbuffer(n.RENDERBUFFER,null),R.depthBuffer&&(B.__webglDepthRenderbuffer=n.createRenderbuffer(),lt(B.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(J){e.bindTexture(n.TEXTURE_CUBE_MAP,Z.__webglTexture),Zt(n.TEXTURE_CUBE_MAP,b);for(let pt=0;pt<6;pt++)if(b.mipmaps&&b.mipmaps.length>0)for(let bt=0;bt<b.mipmaps.length;bt++)It(B.__webglFramebuffer[pt][bt],R,b,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+pt,bt);else It(B.__webglFramebuffer[pt],R,b,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0);m(b)&&p(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Pt){for(let pt=0,bt=et.length;pt<bt;pt++){let ne=et[pt],it=i.get(ne);e.bindTexture(n.TEXTURE_2D,it.__webglTexture),Zt(n.TEXTURE_2D,ne),It(B.__webglFramebuffer,R,ne,n.COLOR_ATTACHMENT0+pt,n.TEXTURE_2D,0),m(ne)&&p(n.TEXTURE_2D)}e.unbindTexture()}else{let pt=n.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(pt=R.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(pt,Z.__webglTexture),Zt(pt,b),b.mipmaps&&b.mipmaps.length>0)for(let bt=0;bt<b.mipmaps.length;bt++)It(B.__webglFramebuffer[bt],R,b,n.COLOR_ATTACHMENT0,pt,bt);else It(B.__webglFramebuffer,R,b,n.COLOR_ATTACHMENT0,pt,0);m(b)&&p(pt),e.unbindTexture()}R.depthBuffer&&qt(R)}function tt(R){let b=R.textures;for(let B=0,Z=b.length;B<Z;B++){let et=b[B];if(m(et)){let J=w(R),Pt=i.get(et).__webglTexture;e.bindTexture(J,Pt),p(J),e.unbindTexture()}}}let rt=[],P=[];function Nt(R){if(R.samples>0){if(St(R)===!1){let b=R.textures,B=R.width,Z=R.height,et=n.COLOR_BUFFER_BIT,J=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Pt=i.get(R),pt=b.length>1;if(pt)for(let bt=0;bt<b.length;bt++)e.bindFramebuffer(n.FRAMEBUFFER,Pt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,Pt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,Pt.__webglMultisampledFramebuffer),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,Pt.__webglFramebuffer);for(let bt=0;bt<b.length;bt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(et|=n.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(et|=n.STENCIL_BUFFER_BIT)),pt){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Pt.__webglColorRenderbuffer[bt]);let ne=i.get(b[bt]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ne,0)}n.blitFramebuffer(0,0,B,Z,0,0,B,Z,et,n.NEAREST),l===!0&&(rt.length=0,P.length=0,rt.push(n.COLOR_ATTACHMENT0+bt),R.depthBuffer&&R.resolveDepthBuffer===!1&&(rt.push(J),P.push(J),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,P)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,rt))}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),pt)for(let bt=0;bt<b.length;bt++){e.bindFramebuffer(n.FRAMEBUFFER,Pt.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.RENDERBUFFER,Pt.__webglColorRenderbuffer[bt]);let ne=i.get(b[bt]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,Pt.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+bt,n.TEXTURE_2D,ne,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,Pt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){let b=R.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[b])}}}function nt(R){return Math.min(s.maxSamples,R.samples)}function St(R){let b=i.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function ht(R){let b=o.render.frame;h.get(R)!==b&&(h.set(R,b),R.update())}function Ht(R,b){let B=R.colorSpace,Z=R.format,et=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||B!==Xs&&B!==Ei&&(re.getTransfer(B)===me?(Z!==wn||et!==En)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),b}function Mt(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=k,this.resetTextureUnits=G,this.setTexture2D=j,this.setTexture2DArray=X,this.setTexture3D=st,this.setTextureCube=Y,this.rebindTextures=Gt,this.setupRenderTarget=se,this.updateRenderTargetMipmap=tt,this.updateMultisampleRenderTarget=Nt,this.setupDepthRenderbuffer=qt,this.setupFrameBufferTexture=It,this.useMultisampledRTT=St}function n_(n,t){function e(i,s=Ei){let r,o=re.getTransfer(s);if(i===En)return n.UNSIGNED_BYTE;if(i===Ah)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Rh)return n.UNSIGNED_SHORT_5_5_5_1;if(i===df)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===hf)return n.BYTE;if(i===uf)return n.SHORT;if(i===Sr)return n.UNSIGNED_SHORT;if(i===Th)return n.INT;if(i===rs)return n.UNSIGNED_INT;if(i===Fn)return n.FLOAT;if(i===kr)return n.HALF_FLOAT;if(i===ff)return n.ALPHA;if(i===pf)return n.RGB;if(i===wn)return n.RGBA;if(i===mf)return n.LUMINANCE;if(i===gf)return n.LUMINANCE_ALPHA;if(i===Ns)return n.DEPTH_COMPONENT;if(i===Vs)return n.DEPTH_STENCIL;if(i===Br)return n.RED;if(i===Ch)return n.RED_INTEGER;if(i===xf)return n.RG;if(i===Ih)return n.RG_INTEGER;if(i===Ph)return n.RGBA_INTEGER;if(i===Yo||i===$o||i===Zo||i===Jo)if(o===me)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===Yo)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===$o)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Zo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Jo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===Yo)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===$o)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Zo)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Jo)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===cc||i===hc||i===uc||i===dc)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===cc)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===hc)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===uc)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===dc)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===fc||i===pc||i===mc)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(i===fc||i===pc)return o===me?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===mc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===gc||i===xc||i===vc||i===yc||i===_c||i===Mc||i===bc||i===Sc||i===wc||i===Ec||i===Tc||i===Ac||i===Rc||i===Cc)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(i===gc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===xc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===vc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===yc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===_c)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Mc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===bc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Sc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===wc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ec)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Tc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Ac)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Rc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Cc)return o===me?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Ko||i===Ic||i===Pc)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(i===Ko)return o===me?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ic)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Pc)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===vf||i===Lc||i===Dc||i===Uc)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(i===Ko)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Lc)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Dc)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Uc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Hs?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:e}}var Jc=class extends He{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},ai=class extends Ge{constructor(){super(),this.isGroup=!0,this.type="Group"}},i_={type:"move"},yr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ai,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ai,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ai,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let x of t.hand.values()){let m=e.getJointPose(x,i),p=this._getHandJoint(c,x);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(i_)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let i=new ai;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}},s_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,r_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Kc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,i){if(this.texture===null){let s=new cn,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=i.depthNear||e.depthFar!=i.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,i=new Ye({vertexShader:s_,fragmentShader:r_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Me(new os(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},jc=class extends Ii{constructor(t,e){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,g=null,x=new Kc,m=e.getContextAttributes(),p=null,w=null,_=[],y=[],C=new ct,A=null,I=new He;I.viewport=new we;let D=new He;D.viewport=new we;let T=[I,D],M=new Jc,U=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let ot=_[K];return ot===void 0&&(ot=new yr,_[K]=ot),ot.getTargetRaySpace()},this.getControllerGrip=function(K){let ot=_[K];return ot===void 0&&(ot=new yr,_[K]=ot),ot.getGripSpace()},this.getHand=function(K){let ot=_[K];return ot===void 0&&(ot=new yr,_[K]=ot),ot.getHandSpace()};function k(K){let ot=y.indexOf(K.inputSource);if(ot===-1)return;let It=_[ot];It!==void 0&&(It.update(K.inputSource,K.frame,c||o),It.dispatchEvent({type:K.type,data:K.inputSource}))}function W(){s.removeEventListener("select",k),s.removeEventListener("selectstart",k),s.removeEventListener("selectend",k),s.removeEventListener("squeeze",k),s.removeEventListener("squeezestart",k),s.removeEventListener("squeezeend",k),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",j);for(let K=0;K<_.length;K++){let ot=y[K];ot!==null&&(y[K]=null,_[K].disconnect(ot))}U=null,G=null,x.reset(),t.setRenderTarget(p),f=null,d=null,u=null,s=null,w=null,ue.stop(),i.isPresenting=!1,t.setPixelRatio(A),t.setSize(C.width,C.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",k),s.addEventListener("selectstart",k),s.addEventListener("selectend",k),s.addEventListener("squeeze",k),s.addEventListener("squeezestart",k),s.addEventListener("squeezeend",k),s.addEventListener("end",W),s.addEventListener("inputsourceschange",j),m.xrCompatible!==!0&&await e.makeXRCompatible(),A=t.getPixelRatio(),t.getSize(C),s.renderState.layers===void 0){let ot={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,ot),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),w=new Tn(f.framebufferWidth,f.framebufferHeight,{format:wn,type:En,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let ot=null,It=null,lt=null;m.depth&&(lt=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,ot=m.stencil?Vs:Ns,It=m.stencil?Hs:rs);let kt={colorFormat:e.RGBA8,depthFormat:lt,scaleFactor:r};u=new XRWebGLBinding(s,e),d=u.createProjectionLayer(kt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),w=new Tn(d.textureWidth,d.textureHeight,{format:wn,type:En,depthTexture:new ca(d.textureWidth,d.textureHeight,It,void 0,void 0,void 0,void 0,void 0,void 0,ot),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),ue.setContext(s),ue.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function j(K){for(let ot=0;ot<K.removed.length;ot++){let It=K.removed[ot],lt=y.indexOf(It);lt>=0&&(y[lt]=null,_[lt].disconnect(It))}for(let ot=0;ot<K.added.length;ot++){let It=K.added[ot],lt=y.indexOf(It);if(lt===-1){for(let qt=0;qt<_.length;qt++)if(qt>=y.length){y.push(It),lt=qt;break}else if(y[qt]===null){y[qt]=It,lt=qt;break}if(lt===-1)break}let kt=_[lt];kt&&kt.connect(It)}}let X=new N,st=new N;function Y(K,ot,It){X.setFromMatrixPosition(ot.matrixWorld),st.setFromMatrixPosition(It.matrixWorld);let lt=X.distanceTo(st),kt=ot.projectionMatrix.elements,qt=It.projectionMatrix.elements,Gt=kt[14]/(kt[10]-1),se=kt[14]/(kt[10]+1),tt=(kt[9]+1)/kt[5],rt=(kt[9]-1)/kt[5],P=(kt[8]-1)/kt[0],Nt=(qt[8]+1)/qt[0],nt=Gt*P,St=Gt*Nt,ht=lt/(-P+Nt),Ht=ht*-P;if(ot.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Ht),K.translateZ(ht),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),kt[10]===-1)K.projectionMatrix.copy(ot.projectionMatrix),K.projectionMatrixInverse.copy(ot.projectionMatrixInverse);else{let Mt=Gt+ht,R=se+ht,b=nt-Ht,B=St+(lt-Ht),Z=tt*se/R*Mt,et=rt*se/R*Mt;K.projectionMatrix.makePerspective(b,B,Z,et,Mt,R),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function dt(K,ot){ot===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(ot.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let ot=K.near,It=K.far;x.texture!==null&&(x.depthNear>0&&(ot=x.depthNear),x.depthFar>0&&(It=x.depthFar)),M.near=D.near=I.near=ot,M.far=D.far=I.far=It,(U!==M.near||G!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),U=M.near,G=M.far),I.layers.mask=K.layers.mask|2,D.layers.mask=K.layers.mask|4,M.layers.mask=I.layers.mask|D.layers.mask;let lt=K.parent,kt=M.cameras;dt(M,lt);for(let qt=0;qt<kt.length;qt++)dt(kt[qt],lt);kt.length===2?Y(M,I,D):M.projectionMatrix.copy(I.projectionMatrix),_t(K,M,lt)};function _t(K,ot,It){It===null?K.matrix.copy(ot.matrixWorld):(K.matrix.copy(It.matrixWorld),K.matrix.invert(),K.matrix.multiply(ot.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(ot.projectionMatrix),K.projectionMatrixInverse.copy(ot.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Fc*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(K){l=K,d!==null&&(d.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(M)};let Rt=null;function Zt(K,ot){if(h=ot.getViewerPose(c||o),g=ot,h!==null){let It=h.views;f!==null&&(t.setRenderTargetFramebuffer(w,f.framebuffer),t.setRenderTarget(w));let lt=!1;It.length!==M.cameras.length&&(M.cameras.length=0,lt=!0);for(let qt=0;qt<It.length;qt++){let Gt=It[qt],se=null;if(f!==null)se=f.getViewport(Gt);else{let rt=u.getViewSubImage(d,Gt);se=rt.viewport,qt===0&&(t.setRenderTargetTextures(w,rt.colorTexture,d.ignoreDepthValues?void 0:rt.depthStencilTexture),t.setRenderTarget(w))}let tt=T[qt];tt===void 0&&(tt=new He,tt.layers.enable(qt),tt.viewport=new we,T[qt]=tt),tt.matrix.fromArray(Gt.transform.matrix),tt.matrix.decompose(tt.position,tt.quaternion,tt.scale),tt.projectionMatrix.fromArray(Gt.projectionMatrix),tt.projectionMatrixInverse.copy(tt.projectionMatrix).invert(),tt.viewport.set(se.x,se.y,se.width,se.height),qt===0&&(M.matrix.copy(tt.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),lt===!0&&M.cameras.push(tt)}let kt=s.enabledFeatures;if(kt&&kt.includes("depth-sensing")){let qt=u.getDepthInformation(It[0]);qt&&qt.isValid&&qt.texture&&x.init(t,qt,s.renderState)}}for(let It=0;It<_.length;It++){let lt=y[It],kt=_[It];lt!==null&&kt!==void 0&&kt.update(lt,ot,c||o)}Rt&&Rt(K,ot),ot.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ot}),g=null}let ue=new wf;ue.setAnimationLoop(Zt),this.setAnimationLoop=function(K){Rt=K},this.dispose=function(){}}},ji=new Ve,o_=new oe;function a_(n,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,Sf(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,w,_,y){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,y)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),x(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,w,_):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===je&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===je&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let w=t.get(p),_=w.envMap,y=w.envMapRotation;_&&(m.envMap.value=_,ji.copy(y),ji.x*=-1,ji.y*=-1,ji.z*=-1,_.isCubeTexture&&_.isRenderTargetTexture===!1&&(ji.y*=-1,ji.z*=-1),m.envMapRotation.value.setFromMatrix4(o_.makeRotationFromEuler(ji)),m.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,w,_){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*w,m.scale.value=_*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,w){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===je&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function x(m,p){let w=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function l_(n,t,e,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,_){let y=_.program;i.uniformBlockBinding(w,y)}function c(w,_){let y=s[w.id];y===void 0&&(g(w),y=h(w),s[w.id]=y,w.addEventListener("dispose",m));let C=_.program;i.updateUBOMapping(w,C);let A=t.render.frame;r[w.id]!==A&&(d(w),r[w.id]=A)}function h(w){let _=u();w.__bindingPointIndex=_;let y=n.createBuffer(),C=w.__size,A=w.usage;return n.bindBuffer(n.UNIFORM_BUFFER,y),n.bufferData(n.UNIFORM_BUFFER,C,A),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,_,y),y}function u(){for(let w=0;w<a;w++)if(o.indexOf(w)===-1)return o.push(w),w;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(w){let _=s[w.id],y=w.uniforms,C=w.__cache;n.bindBuffer(n.UNIFORM_BUFFER,_);for(let A=0,I=y.length;A<I;A++){let D=Array.isArray(y[A])?y[A]:[y[A]];for(let T=0,M=D.length;T<M;T++){let U=D[T];if(f(U,A,T,C)===!0){let G=U.__offset,k=Array.isArray(U.value)?U.value:[U.value],W=0;for(let j=0;j<k.length;j++){let X=k[j],st=x(X);typeof X=="number"||typeof X=="boolean"?(U.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,G+W,U.__data)):X.isMatrix3?(U.__data[0]=X.elements[0],U.__data[1]=X.elements[1],U.__data[2]=X.elements[2],U.__data[3]=0,U.__data[4]=X.elements[3],U.__data[5]=X.elements[4],U.__data[6]=X.elements[5],U.__data[7]=0,U.__data[8]=X.elements[6],U.__data[9]=X.elements[7],U.__data[10]=X.elements[8],U.__data[11]=0):(X.toArray(U.__data,W),W+=st.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,G,U.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(w,_,y,C){let A=w.value,I=_+"_"+y;if(C[I]===void 0)return typeof A=="number"||typeof A=="boolean"?C[I]=A:C[I]=A.clone(),!0;{let D=C[I];if(typeof A=="number"||typeof A=="boolean"){if(D!==A)return C[I]=A,!0}else if(D.equals(A)===!1)return D.copy(A),!0}return!1}function g(w){let _=w.uniforms,y=0,C=16;for(let I=0,D=_.length;I<D;I++){let T=Array.isArray(_[I])?_[I]:[_[I]];for(let M=0,U=T.length;M<U;M++){let G=T[M],k=Array.isArray(G.value)?G.value:[G.value];for(let W=0,j=k.length;W<j;W++){let X=k[W],st=x(X),Y=y%C,dt=Y%st.boundary,_t=Y+dt;y+=dt,_t!==0&&C-_t<st.storage&&(y+=C-_t),G.__data=new Float32Array(st.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=y,y+=st.storage}}}let A=y%C;return A>0&&(y+=C-A),w.__size=y,w.__cache={},this}function x(w){let _={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(_.boundary=4,_.storage=4):w.isVector2?(_.boundary=8,_.storage=8):w.isVector3||w.isColor?(_.boundary=16,_.storage=12):w.isVector4?(_.boundary=16,_.storage=16):w.isMatrix3?(_.boundary=48,_.storage=48):w.isMatrix4?(_.boundary=64,_.storage=64):w.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",w),_}function m(w){let _=w.target;_.removeEventListener("dispose",m);let y=o.indexOf(_.__bindingPointIndex);o.splice(y,1),n.deleteBuffer(s[_.id]),delete s[_.id],delete r[_.id]}function p(){for(let w in s)n.deleteBuffer(s[w]);o=[],s={},r={}}return{bind:l,update:c,dispose:p}}var ha=class{constructor(t={}){let{canvas:e=d0(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=i.getContextAttributes().alpha}else f=o;let g=new Uint32Array(4),x=new Int32Array(4),m=null,p=null,w=[],_=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Ke,this.toneMapping=Ri,this.toneMappingExposure=1;let y=this,C=!1,A=0,I=0,D=null,T=-1,M=null,U=new we,G=new we,k=null,W=new Wt(0),j=0,X=e.width,st=e.height,Y=1,dt=null,_t=null,Rt=new we(0,0,X,st),Zt=new we(0,0,X,st),ue=!1,K=new Tr,ot=!1,It=!1,lt=new oe,kt=new oe,qt=new N,Gt=new we,se={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},tt=!1;function rt(){return D===null?Y:1}let P=i;function Nt(E,z){return e.getContext(E,z)}try{let E={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine","three.js r170"),e.addEventListener("webglcontextlost",Q,!1),e.addEventListener("webglcontextrestored",yt,!1),e.addEventListener("webglcontextcreationerror",xt,!1),P===null){let z="webgl2";if(P=Nt(z,E),P===null)throw Nt(z)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let nt,St,ht,Ht,Mt,R,b,B,Z,et,J,Pt,pt,bt,ne,it,Tt,Vt,Xt,At,ie,Qt,ge,F;function gt(){nt=new wv(P),nt.init(),Qt=new n_(P,nt),St=new vv(P,nt,t,Qt),ht=new Qy(P,nt),St.reverseDepthBuffer&&d&&ht.buffers.depth.setReversed(!0),Ht=new Av(P),Mt=new By,R=new e_(P,nt,ht,Mt,St,Qt,Ht),b=new _v(y),B=new Sv(y),Z=new U0(P),ge=new gv(P,Z),et=new Ev(P,Z,Ht,ge),J=new Cv(P,et,Z,Ht),Xt=new Rv(P,St,R),it=new yv(Mt),Pt=new ky(y,b,B,nt,St,ge,it),pt=new a_(y,Mt),bt=new Vy,ne=new $y(nt),Vt=new mv(y,b,B,ht,J,f,l),Tt=new Ky(y,J,St),F=new l_(P,Ht,St,ht),At=new xv(P,nt,Ht),ie=new Tv(P,nt,Ht),Ht.programs=Pt.programs,y.capabilities=St,y.extensions=nt,y.properties=Mt,y.renderLists=bt,y.shadowMap=Tt,y.state=ht,y.info=Ht}gt();let $=new jc(y,P);this.xr=$,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){let E=nt.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=nt.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(E){E!==void 0&&(Y=E,this.setSize(X,st,!1))},this.getSize=function(E){return E.set(X,st)},this.setSize=function(E,z,H=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}X=E,st=z,e.width=Math.floor(E*Y),e.height=Math.floor(z*Y),H===!0&&(e.style.width=E+"px",e.style.height=z+"px"),this.setViewport(0,0,E,z)},this.getDrawingBufferSize=function(E){return E.set(X*Y,st*Y).floor()},this.setDrawingBufferSize=function(E,z,H){X=E,st=z,Y=H,e.width=Math.floor(E*H),e.height=Math.floor(z*H),this.setViewport(0,0,E,z)},this.getCurrentViewport=function(E){return E.copy(U)},this.getViewport=function(E){return E.copy(Rt)},this.setViewport=function(E,z,H,V){E.isVector4?Rt.set(E.x,E.y,E.z,E.w):Rt.set(E,z,H,V),ht.viewport(U.copy(Rt).multiplyScalar(Y).round())},this.getScissor=function(E){return E.copy(Zt)},this.setScissor=function(E,z,H,V){E.isVector4?Zt.set(E.x,E.y,E.z,E.w):Zt.set(E,z,H,V),ht.scissor(G.copy(Zt).multiplyScalar(Y).round())},this.getScissorTest=function(){return ue},this.setScissorTest=function(E){ht.setScissorTest(ue=E)},this.setOpaqueSort=function(E){dt=E},this.setTransparentSort=function(E){_t=E},this.getClearColor=function(E){return E.copy(Vt.getClearColor())},this.setClearColor=function(){Vt.setClearColor.apply(Vt,arguments)},this.getClearAlpha=function(){return Vt.getClearAlpha()},this.setClearAlpha=function(){Vt.setClearAlpha.apply(Vt,arguments)},this.clear=function(E=!0,z=!0,H=!0){let V=0;if(E){let O=!1;if(D!==null){let at=D.texture.format;O=at===Ph||at===Ih||at===Ch}if(O){let at=D.texture.type,vt=at===En||at===rs||at===Sr||at===Hs||at===Ah||at===Rh,Lt=Vt.getClearColor(),Dt=Vt.getClearAlpha(),Yt=Lt.r,Kt=Lt.g,Ut=Lt.b;vt?(g[0]=Yt,g[1]=Kt,g[2]=Ut,g[3]=Dt,P.clearBufferuiv(P.COLOR,0,g)):(x[0]=Yt,x[1]=Kt,x[2]=Ut,x[3]=Dt,P.clearBufferiv(P.COLOR,0,x))}else V|=P.COLOR_BUFFER_BIT}z&&(V|=P.DEPTH_BUFFER_BIT),H&&(V|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),P.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Q,!1),e.removeEventListener("webglcontextrestored",yt,!1),e.removeEventListener("webglcontextcreationerror",xt,!1),bt.dispose(),ne.dispose(),Mt.dispose(),b.dispose(),B.dispose(),J.dispose(),ge.dispose(),F.dispose(),Pt.dispose(),$.dispose(),$.removeEventListener("sessionstart",Gu),$.removeEventListener("sessionend",Wu),qi.stop()};function Q(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),C=!0}function yt(){console.log("THREE.WebGLRenderer: Context Restored."),C=!1;let E=Ht.autoReset,z=Tt.enabled,H=Tt.autoUpdate,V=Tt.needsUpdate,O=Tt.type;gt(),Ht.autoReset=E,Tt.enabled=z,Tt.autoUpdate=H,Tt.needsUpdate=V,Tt.type=O}function xt(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Jt(E){let z=E.target;z.removeEventListener("dispose",Jt),Se(z)}function Se(E){ze(E),Mt.remove(E)}function ze(E){let z=Mt.get(E).programs;z!==void 0&&(z.forEach(function(H){Pt.releaseProgram(H)}),E.isShaderMaterial&&Pt.releaseShaderCache(E))}this.renderBufferDirect=function(E,z,H,V,O,at){z===null&&(z=se);let vt=O.isMesh&&O.matrixWorld.determinant()<0,Lt=bm(E,z,H,V,O);ht.setMaterial(V,vt);let Dt=H.index,Yt=1;if(V.wireframe===!0){if(Dt=et.getWireframeAttribute(H),Dt===void 0)return;Yt=2}let Kt=H.drawRange,Ut=H.attributes.position,ce=Kt.start*Yt,xe=(Kt.start+Kt.count)*Yt;at!==null&&(ce=Math.max(ce,at.start*Yt),xe=Math.min(xe,(at.start+at.count)*Yt)),Dt!==null?(ce=Math.max(ce,0),xe=Math.min(xe,Dt.count)):Ut!=null&&(ce=Math.max(ce,0),xe=Math.min(xe,Ut.count));let ve=xe-ce;if(ve<0||ve===1/0)return;ge.setup(O,V,Lt,H,Dt);let Ze,de=At;if(Dt!==null&&(Ze=Z.get(Dt),de=ie,de.setIndex(Ze)),O.isMesh)V.wireframe===!0?(ht.setLineWidth(V.wireframeLinewidth*rt()),de.setMode(P.LINES)):de.setMode(P.TRIANGLES);else if(O.isLine){let Ft=V.linewidth;Ft===void 0&&(Ft=1),ht.setLineWidth(Ft*rt()),O.isLineSegments?de.setMode(P.LINES):O.isLineLoop?de.setMode(P.LINE_LOOP):de.setMode(P.LINE_STRIP)}else O.isPoints?de.setMode(P.POINTS):O.isSprite&&de.setMode(P.TRIANGLES);if(O.isBatchedMesh)if(O._multiDrawInstances!==null)de.renderMultiDrawInstances(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount,O._multiDrawInstances);else if(nt.get("WEBGL_multi_draw"))de.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let Ft=O._multiDrawStarts,Jn=O._multiDrawCounts,fe=O._multiDrawCount,_n=Dt?Z.get(Dt).bytesPerElement:1,xs=Mt.get(V).currentProgram.getUniforms();for(let sn=0;sn<fe;sn++)xs.setValue(P,"_gl_DrawID",sn),de.render(Ft[sn]/_n,Jn[sn])}else if(O.isInstancedMesh)de.renderInstances(ce,ve,O.count);else if(H.isInstancedBufferGeometry){let Ft=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,Jn=Math.min(H.instanceCount,Ft);de.renderInstances(ce,ve,Jn)}else de.render(ce,ve)};function pe(E,z,H){E.transparent===!0&&E.side===si&&E.forceSinglePass===!1?(E.side=je,E.needsUpdate=!0,vo(E,z,H),E.side=Ci,E.needsUpdate=!0,vo(E,z,H),E.side=si):vo(E,z,H)}this.compile=function(E,z,H=null){H===null&&(H=E),p=ne.get(H),p.init(z),_.push(p),H.traverseVisible(function(O){O.isLight&&O.layers.test(z.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),E!==H&&E.traverseVisible(function(O){O.isLight&&O.layers.test(z.layers)&&(p.pushLight(O),O.castShadow&&p.pushShadow(O))}),p.setupLights();let V=new Set;return E.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let at=O.material;if(at)if(Array.isArray(at))for(let vt=0;vt<at.length;vt++){let Lt=at[vt];pe(Lt,H,O),V.add(Lt)}else pe(at,H,O),V.add(at)}),_.pop(),p=null,V},this.compileAsync=function(E,z,H=null){let V=this.compile(E,z,H);return new Promise(O=>{function at(){if(V.forEach(function(vt){Mt.get(vt).currentProgram.isReady()&&V.delete(vt)}),V.size===0){O(E);return}setTimeout(at,10)}nt.get("KHR_parallel_shader_compile")!==null?at():setTimeout(at,10)})};let yn=null;function Zn(E){yn&&yn(E)}function Gu(){qi.stop()}function Wu(){qi.start()}let qi=new wf;qi.setAnimationLoop(Zn),typeof self<"u"&&qi.setContext(self),this.setAnimationLoop=function(E){yn=E,$.setAnimationLoop(E),E===null?qi.stop():qi.start()},$.addEventListener("sessionstart",Gu),$.addEventListener("sessionend",Wu),this.render=function(E,z){if(z!==void 0&&z.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(z),z=$.getCamera()),E.isScene===!0&&E.onBeforeRender(y,E,z,D),p=ne.get(E,_.length),p.init(z),_.push(p),kt.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),K.setFromProjectionMatrix(kt),It=this.localClippingEnabled,ot=it.init(this.clippingPlanes,It),m=bt.get(E,w.length),m.init(),w.push(m),$.enabled===!0&&$.isPresenting===!0){let at=y.xr.getDepthSensingMesh();at!==null&&ml(at,z,-1/0,y.sortObjects)}ml(E,z,0,y.sortObjects),m.finish(),y.sortObjects===!0&&m.sort(dt,_t),tt=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,tt&&Vt.addToRenderList(m,E),this.info.render.frame++,ot===!0&&it.beginShadows();let H=p.state.shadowsArray;Tt.render(H,E,z),ot===!0&&it.endShadows(),this.info.autoReset===!0&&this.info.reset();let V=m.opaque,O=m.transmissive;if(p.setupLights(),z.isArrayCamera){let at=z.cameras;if(O.length>0)for(let vt=0,Lt=at.length;vt<Lt;vt++){let Dt=at[vt];qu(V,O,E,Dt)}tt&&Vt.render(E);for(let vt=0,Lt=at.length;vt<Lt;vt++){let Dt=at[vt];Xu(m,E,Dt,Dt.viewport)}}else O.length>0&&qu(V,O,E,z),tt&&Vt.render(E),Xu(m,E,z);D!==null&&(R.updateMultisampleRenderTarget(D),R.updateRenderTargetMipmap(D)),E.isScene===!0&&E.onAfterRender(y,E,z),ge.resetDefaultState(),T=-1,M=null,_.pop(),_.length>0?(p=_[_.length-1],ot===!0&&it.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,w.pop(),w.length>0?m=w[w.length-1]:m=null};function ml(E,z,H,V){if(E.visible===!1)return;if(E.layers.test(z.layers)){if(E.isGroup)H=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(z);else if(E.isLight)p.pushLight(E),E.castShadow&&p.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||K.intersectsSprite(E)){V&&Gt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(kt);let vt=J.update(E),Lt=E.material;Lt.visible&&m.push(E,vt,Lt,H,Gt.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||K.intersectsObject(E))){let vt=J.update(E),Lt=E.material;if(V&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Gt.copy(E.boundingSphere.center)):(vt.boundingSphere===null&&vt.computeBoundingSphere(),Gt.copy(vt.boundingSphere.center)),Gt.applyMatrix4(E.matrixWorld).applyMatrix4(kt)),Array.isArray(Lt)){let Dt=vt.groups;for(let Yt=0,Kt=Dt.length;Yt<Kt;Yt++){let Ut=Dt[Yt],ce=Lt[Ut.materialIndex];ce&&ce.visible&&m.push(E,vt,ce,H,Gt.z,Ut)}}else Lt.visible&&m.push(E,vt,Lt,H,Gt.z,null)}}let at=E.children;for(let vt=0,Lt=at.length;vt<Lt;vt++)ml(at[vt],z,H,V)}function Xu(E,z,H,V){let O=E.opaque,at=E.transmissive,vt=E.transparent;p.setupLightsView(H),ot===!0&&it.setGlobalState(y.clippingPlanes,H),V&&ht.viewport(U.copy(V)),O.length>0&&xo(O,z,H),at.length>0&&xo(at,z,H),vt.length>0&&xo(vt,z,H),ht.buffers.depth.setTest(!0),ht.buffers.depth.setMask(!0),ht.buffers.color.setMask(!0),ht.setPolygonOffset(!1)}function qu(E,z,H,V){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[V.id]===void 0&&(p.state.transmissionRenderTarget[V.id]=new Tn(1,1,{generateMipmaps:!0,type:nt.has("EXT_color_buffer_half_float")||nt.has("EXT_color_buffer_float")?kr:En,minFilter:is,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:re.workingColorSpace}));let at=p.state.transmissionRenderTarget[V.id],vt=V.viewport||U;at.setSize(vt.z,vt.w);let Lt=y.getRenderTarget();y.setRenderTarget(at),y.getClearColor(W),j=y.getClearAlpha(),j<1&&y.setClearColor(16777215,.5),y.clear(),tt&&Vt.render(H);let Dt=y.toneMapping;y.toneMapping=Ri;let Yt=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),p.setupLightsView(V),ot===!0&&it.setGlobalState(y.clippingPlanes,V),xo(E,H,V),R.updateMultisampleRenderTarget(at),R.updateRenderTargetMipmap(at),nt.has("WEBGL_multisampled_render_to_texture")===!1){let Kt=!1;for(let Ut=0,ce=z.length;Ut<ce;Ut++){let xe=z[Ut],ve=xe.object,Ze=xe.geometry,de=xe.material,Ft=xe.group;if(de.side===si&&ve.layers.test(V.layers)){let Jn=de.side;de.side=je,de.needsUpdate=!0,Yu(ve,H,V,Ze,de,Ft),de.side=Jn,de.needsUpdate=!0,Kt=!0}}Kt===!0&&(R.updateMultisampleRenderTarget(at),R.updateRenderTargetMipmap(at))}y.setRenderTarget(Lt),y.setClearColor(W,j),Yt!==void 0&&(V.viewport=Yt),y.toneMapping=Dt}function xo(E,z,H){let V=z.isScene===!0?z.overrideMaterial:null;for(let O=0,at=E.length;O<at;O++){let vt=E[O],Lt=vt.object,Dt=vt.geometry,Yt=V===null?vt.material:V,Kt=vt.group;Lt.layers.test(H.layers)&&Yu(Lt,z,H,Dt,Yt,Kt)}}function Yu(E,z,H,V,O,at){E.onBeforeRender(y,z,H,V,O,at),E.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),O.onBeforeRender(y,z,H,V,E,at),O.transparent===!0&&O.side===si&&O.forceSinglePass===!1?(O.side=je,O.needsUpdate=!0,y.renderBufferDirect(H,z,V,O,E,at),O.side=Ci,O.needsUpdate=!0,y.renderBufferDirect(H,z,V,O,E,at),O.side=si):y.renderBufferDirect(H,z,V,O,E,at),E.onAfterRender(y,z,H,V,O,at)}function vo(E,z,H){z.isScene!==!0&&(z=se);let V=Mt.get(E),O=p.state.lights,at=p.state.shadowsArray,vt=O.state.version,Lt=Pt.getParameters(E,O.state,at,z,H),Dt=Pt.getProgramCacheKey(Lt),Yt=V.programs;V.environment=E.isMeshStandardMaterial?z.environment:null,V.fog=z.fog,V.envMap=(E.isMeshStandardMaterial?B:b).get(E.envMap||V.environment),V.envMapRotation=V.environment!==null&&E.envMap===null?z.environmentRotation:E.envMapRotation,Yt===void 0&&(E.addEventListener("dispose",Jt),Yt=new Map,V.programs=Yt);let Kt=Yt.get(Dt);if(Kt!==void 0){if(V.currentProgram===Kt&&V.lightsStateVersion===vt)return Zu(E,Lt),Kt}else Lt.uniforms=Pt.getUniforms(E),E.onBeforeCompile(Lt,y),Kt=Pt.acquireProgram(Lt,Dt),Yt.set(Dt,Kt),V.uniforms=Lt.uniforms;let Ut=V.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ut.clippingPlanes=it.uniform),Zu(E,Lt),V.needsLights=wm(E),V.lightsStateVersion=vt,V.needsLights&&(Ut.ambientLightColor.value=O.state.ambient,Ut.lightProbe.value=O.state.probe,Ut.directionalLights.value=O.state.directional,Ut.directionalLightShadows.value=O.state.directionalShadow,Ut.spotLights.value=O.state.spot,Ut.spotLightShadows.value=O.state.spotShadow,Ut.rectAreaLights.value=O.state.rectArea,Ut.ltc_1.value=O.state.rectAreaLTC1,Ut.ltc_2.value=O.state.rectAreaLTC2,Ut.pointLights.value=O.state.point,Ut.pointLightShadows.value=O.state.pointShadow,Ut.hemisphereLights.value=O.state.hemi,Ut.directionalShadowMap.value=O.state.directionalShadowMap,Ut.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Ut.spotShadowMap.value=O.state.spotShadowMap,Ut.spotLightMatrix.value=O.state.spotLightMatrix,Ut.spotLightMap.value=O.state.spotLightMap,Ut.pointShadowMap.value=O.state.pointShadowMap,Ut.pointShadowMatrix.value=O.state.pointShadowMatrix),V.currentProgram=Kt,V.uniformsList=null,Kt}function $u(E){if(E.uniformsList===null){let z=E.currentProgram.getUniforms();E.uniformsList=zs.seqWithValue(z.seq,E.uniforms)}return E.uniformsList}function Zu(E,z){let H=Mt.get(E);H.outputColorSpace=z.outputColorSpace,H.batching=z.batching,H.batchingColor=z.batchingColor,H.instancing=z.instancing,H.instancingColor=z.instancingColor,H.instancingMorph=z.instancingMorph,H.skinning=z.skinning,H.morphTargets=z.morphTargets,H.morphNormals=z.morphNormals,H.morphColors=z.morphColors,H.morphTargetsCount=z.morphTargetsCount,H.numClippingPlanes=z.numClippingPlanes,H.numIntersection=z.numClipIntersection,H.vertexAlphas=z.vertexAlphas,H.vertexTangents=z.vertexTangents,H.toneMapping=z.toneMapping}function bm(E,z,H,V,O){z.isScene!==!0&&(z=se),R.resetTextureUnits();let at=z.fog,vt=V.isMeshStandardMaterial?z.environment:null,Lt=D===null?y.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:Xs,Dt=(V.isMeshStandardMaterial?B:b).get(V.envMap||vt),Yt=V.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Kt=!!H.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ut=!!H.morphAttributes.position,ce=!!H.morphAttributes.normal,xe=!!H.morphAttributes.color,ve=Ri;V.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(ve=y.toneMapping);let Ze=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,de=Ze!==void 0?Ze.length:0,Ft=Mt.get(V),Jn=p.state.lights;if(ot===!0&&(It===!0||E!==M)){let fn=E===M&&V.id===T;it.setState(V,E,fn)}let fe=!1;V.version===Ft.__version?(Ft.needsLights&&Ft.lightsStateVersion!==Jn.state.version||Ft.outputColorSpace!==Lt||O.isBatchedMesh&&Ft.batching===!1||!O.isBatchedMesh&&Ft.batching===!0||O.isBatchedMesh&&Ft.batchingColor===!0&&O.colorTexture===null||O.isBatchedMesh&&Ft.batchingColor===!1&&O.colorTexture!==null||O.isInstancedMesh&&Ft.instancing===!1||!O.isInstancedMesh&&Ft.instancing===!0||O.isSkinnedMesh&&Ft.skinning===!1||!O.isSkinnedMesh&&Ft.skinning===!0||O.isInstancedMesh&&Ft.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Ft.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Ft.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Ft.instancingMorph===!1&&O.morphTexture!==null||Ft.envMap!==Dt||V.fog===!0&&Ft.fog!==at||Ft.numClippingPlanes!==void 0&&(Ft.numClippingPlanes!==it.numPlanes||Ft.numIntersection!==it.numIntersection)||Ft.vertexAlphas!==Yt||Ft.vertexTangents!==Kt||Ft.morphTargets!==Ut||Ft.morphNormals!==ce||Ft.morphColors!==xe||Ft.toneMapping!==ve||Ft.morphTargetsCount!==de)&&(fe=!0):(fe=!0,Ft.__version=V.version);let _n=Ft.currentProgram;fe===!0&&(_n=vo(V,z,O));let xs=!1,sn=!1,lr=!1,ye=_n.getUniforms(),Un=Ft.uniforms;if(ht.useProgram(_n.program)&&(xs=!0,sn=!0,lr=!0),V.id!==T&&(T=V.id,sn=!0),xs||M!==E){ht.buffers.depth.getReversed()?(lt.copy(E.projectionMatrix),p0(lt),m0(lt),ye.setValue(P,"projectionMatrix",lt)):ye.setValue(P,"projectionMatrix",E.projectionMatrix),ye.setValue(P,"viewMatrix",E.matrixWorldInverse);let xi=ye.map.cameraPosition;xi!==void 0&&xi.setValue(P,qt.setFromMatrixPosition(E.matrixWorld)),St.logarithmicDepthBuffer&&ye.setValue(P,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&ye.setValue(P,"isOrthographic",E.isOrthographicCamera===!0),M!==E&&(M=E,sn=!0,lr=!0)}if(O.isSkinnedMesh){ye.setOptional(P,O,"bindMatrix"),ye.setOptional(P,O,"bindMatrixInverse");let fn=O.skeleton;fn&&(fn.boneTexture===null&&fn.computeBoneTexture(),ye.setValue(P,"boneTexture",fn.boneTexture,R))}O.isBatchedMesh&&(ye.setOptional(P,O,"batchingTexture"),ye.setValue(P,"batchingTexture",O._matricesTexture,R),ye.setOptional(P,O,"batchingIdTexture"),ye.setValue(P,"batchingIdTexture",O._indirectTexture,R),ye.setOptional(P,O,"batchingColorTexture"),O._colorsTexture!==null&&ye.setValue(P,"batchingColorTexture",O._colorsTexture,R));let cr=H.morphAttributes;if((cr.position!==void 0||cr.normal!==void 0||cr.color!==void 0)&&Xt.update(O,H,_n),(sn||Ft.receiveShadow!==O.receiveShadow)&&(Ft.receiveShadow=O.receiveShadow,ye.setValue(P,"receiveShadow",O.receiveShadow)),V.isMeshGouraudMaterial&&V.envMap!==null&&(Un.envMap.value=Dt,Un.flipEnvMap.value=Dt.isCubeTexture&&Dt.isRenderTargetTexture===!1?-1:1),V.isMeshStandardMaterial&&V.envMap===null&&z.environment!==null&&(Un.envMapIntensity.value=z.environmentIntensity),sn&&(ye.setValue(P,"toneMappingExposure",y.toneMappingExposure),Ft.needsLights&&Sm(Un,lr),at&&V.fog===!0&&pt.refreshFogUniforms(Un,at),pt.refreshMaterialUniforms(Un,V,Y,st,p.state.transmissionRenderTarget[E.id]),zs.upload(P,$u(Ft),Un,R)),V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(zs.upload(P,$u(Ft),Un,R),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&ye.setValue(P,"center",O.center),ye.setValue(P,"modelViewMatrix",O.modelViewMatrix),ye.setValue(P,"normalMatrix",O.normalMatrix),ye.setValue(P,"modelMatrix",O.matrixWorld),V.isShaderMaterial||V.isRawShaderMaterial){let fn=V.uniformsGroups;for(let xi=0,vi=fn.length;xi<vi;xi++){let Ju=fn[xi];F.update(Ju,_n),F.bind(Ju,_n)}}return _n}function Sm(E,z){E.ambientLightColor.needsUpdate=z,E.lightProbe.needsUpdate=z,E.directionalLights.needsUpdate=z,E.directionalLightShadows.needsUpdate=z,E.pointLights.needsUpdate=z,E.pointLightShadows.needsUpdate=z,E.spotLights.needsUpdate=z,E.spotLightShadows.needsUpdate=z,E.rectAreaLights.needsUpdate=z,E.hemisphereLights.needsUpdate=z}function wm(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return I},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(E,z,H){Mt.get(E.texture).__webglTexture=z,Mt.get(E.depthTexture).__webglTexture=H;let V=Mt.get(E);V.__hasExternalTextures=!0,V.__autoAllocateDepthBuffer=H===void 0,V.__autoAllocateDepthBuffer||nt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),V.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,z){let H=Mt.get(E);H.__webglFramebuffer=z,H.__useDefaultFramebuffer=z===void 0},this.setRenderTarget=function(E,z=0,H=0){D=E,A=z,I=H;let V=!0,O=null,at=!1,vt=!1;if(E){let Dt=Mt.get(E);if(Dt.__useDefaultFramebuffer!==void 0)ht.bindFramebuffer(P.FRAMEBUFFER,null),V=!1;else if(Dt.__webglFramebuffer===void 0)R.setupRenderTarget(E);else if(Dt.__hasExternalTextures)R.rebindTextures(E,Mt.get(E.texture).__webglTexture,Mt.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let Ut=E.depthTexture;if(Dt.__boundDepthTexture!==Ut){if(Ut!==null&&Mt.has(Ut)&&(E.width!==Ut.image.width||E.height!==Ut.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(E)}}let Yt=E.texture;(Yt.isData3DTexture||Yt.isDataArrayTexture||Yt.isCompressedArrayTexture)&&(vt=!0);let Kt=Mt.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Kt[z])?O=Kt[z][H]:O=Kt[z],at=!0):E.samples>0&&R.useMultisampledRTT(E)===!1?O=Mt.get(E).__webglMultisampledFramebuffer:Array.isArray(Kt)?O=Kt[H]:O=Kt,U.copy(E.viewport),G.copy(E.scissor),k=E.scissorTest}else U.copy(Rt).multiplyScalar(Y).floor(),G.copy(Zt).multiplyScalar(Y).floor(),k=ue;if(ht.bindFramebuffer(P.FRAMEBUFFER,O)&&V&&ht.drawBuffers(E,O),ht.viewport(U),ht.scissor(G),ht.setScissorTest(k),at){let Dt=Mt.get(E.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+z,Dt.__webglTexture,H)}else if(vt){let Dt=Mt.get(E.texture),Yt=z||0;P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,Dt.__webglTexture,H||0,Yt)}T=-1},this.readRenderTargetPixels=function(E,z,H,V,O,at,vt){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Lt=Mt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&vt!==void 0&&(Lt=Lt[vt]),Lt){ht.bindFramebuffer(P.FRAMEBUFFER,Lt);try{let Dt=E.texture,Yt=Dt.format,Kt=Dt.type;if(!St.textureFormatReadable(Yt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!St.textureTypeReadable(Kt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=E.width-V&&H>=0&&H<=E.height-O&&P.readPixels(z,H,V,O,Qt.convert(Yt),Qt.convert(Kt),at)}finally{let Dt=D!==null?Mt.get(D).__webglFramebuffer:null;ht.bindFramebuffer(P.FRAMEBUFFER,Dt)}}},this.readRenderTargetPixelsAsync=async function(E,z,H,V,O,at,vt){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Lt=Mt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&vt!==void 0&&(Lt=Lt[vt]),Lt){let Dt=E.texture,Yt=Dt.format,Kt=Dt.type;if(!St.textureFormatReadable(Yt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!St.textureTypeReadable(Kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(z>=0&&z<=E.width-V&&H>=0&&H<=E.height-O){ht.bindFramebuffer(P.FRAMEBUFFER,Lt);let Ut=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,Ut),P.bufferData(P.PIXEL_PACK_BUFFER,at.byteLength,P.STREAM_READ),P.readPixels(z,H,V,O,Qt.convert(Yt),Qt.convert(Kt),0);let ce=D!==null?Mt.get(D).__webglFramebuffer:null;ht.bindFramebuffer(P.FRAMEBUFFER,ce);let xe=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await f0(P,xe,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,Ut),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,at),P.deleteBuffer(Ut),P.deleteSync(xe),at}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,z=null,H=0){E.isTexture!==!0&&(xr("WebGLRenderer: copyFramebufferToTexture function signature has changed."),z=arguments[0]||null,E=arguments[1]);let V=Math.pow(2,-H),O=Math.floor(E.image.width*V),at=Math.floor(E.image.height*V),vt=z!==null?z.x:0,Lt=z!==null?z.y:0;R.setTexture2D(E,0),P.copyTexSubImage2D(P.TEXTURE_2D,H,0,0,vt,Lt,O,at),ht.unbindTexture()},this.copyTextureToTexture=function(E,z,H=null,V=null,O=0){E.isTexture!==!0&&(xr("WebGLRenderer: copyTextureToTexture function signature has changed."),V=arguments[0]||null,E=arguments[1],z=arguments[2],O=arguments[3]||0,H=null);let at,vt,Lt,Dt,Yt,Kt,Ut,ce,xe,ve=E.isCompressedTexture?E.mipmaps[O]:E.image;H!==null?(at=H.max.x-H.min.x,vt=H.max.y-H.min.y,Lt=H.isBox3?H.max.z-H.min.z:1,Dt=H.min.x,Yt=H.min.y,Kt=H.isBox3?H.min.z:0):(at=ve.width,vt=ve.height,Lt=ve.depth||1,Dt=0,Yt=0,Kt=0),V!==null?(Ut=V.x,ce=V.y,xe=V.z):(Ut=0,ce=0,xe=0);let Ze=Qt.convert(z.format),de=Qt.convert(z.type),Ft;z.isData3DTexture?(R.setTexture3D(z,0),Ft=P.TEXTURE_3D):z.isDataArrayTexture||z.isCompressedArrayTexture?(R.setTexture2DArray(z,0),Ft=P.TEXTURE_2D_ARRAY):(R.setTexture2D(z,0),Ft=P.TEXTURE_2D),P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,z.flipY),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),P.pixelStorei(P.UNPACK_ALIGNMENT,z.unpackAlignment);let Jn=P.getParameter(P.UNPACK_ROW_LENGTH),fe=P.getParameter(P.UNPACK_IMAGE_HEIGHT),_n=P.getParameter(P.UNPACK_SKIP_PIXELS),xs=P.getParameter(P.UNPACK_SKIP_ROWS),sn=P.getParameter(P.UNPACK_SKIP_IMAGES);P.pixelStorei(P.UNPACK_ROW_LENGTH,ve.width),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,ve.height),P.pixelStorei(P.UNPACK_SKIP_PIXELS,Dt),P.pixelStorei(P.UNPACK_SKIP_ROWS,Yt),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Kt);let lr=E.isDataArrayTexture||E.isData3DTexture,ye=z.isDataArrayTexture||z.isData3DTexture;if(E.isRenderTargetTexture||E.isDepthTexture){let Un=Mt.get(E),cr=Mt.get(z),fn=Mt.get(Un.__renderTarget),xi=Mt.get(cr.__renderTarget);ht.bindFramebuffer(P.READ_FRAMEBUFFER,fn.__webglFramebuffer),ht.bindFramebuffer(P.DRAW_FRAMEBUFFER,xi.__webglFramebuffer);for(let vi=0;vi<Lt;vi++)lr&&P.framebufferTextureLayer(P.READ_FRAMEBUFFER,P.COLOR_ATTACHMENT0,Mt.get(E).__webglTexture,O,Kt+vi),E.isDepthTexture?(ye&&P.framebufferTextureLayer(P.DRAW_FRAMEBUFFER,P.COLOR_ATTACHMENT0,Mt.get(z).__webglTexture,O,xe+vi),P.blitFramebuffer(Dt,Yt,at,vt,Ut,ce,at,vt,P.DEPTH_BUFFER_BIT,P.NEAREST)):ye?P.copyTexSubImage3D(Ft,O,Ut,ce,xe+vi,Dt,Yt,at,vt):P.copyTexSubImage2D(Ft,O,Ut,ce,xe+vi,Dt,Yt,at,vt);ht.bindFramebuffer(P.READ_FRAMEBUFFER,null),ht.bindFramebuffer(P.DRAW_FRAMEBUFFER,null)}else ye?E.isDataTexture||E.isData3DTexture?P.texSubImage3D(Ft,O,Ut,ce,xe,at,vt,Lt,Ze,de,ve.data):z.isCompressedArrayTexture?P.compressedTexSubImage3D(Ft,O,Ut,ce,xe,at,vt,Lt,Ze,ve.data):P.texSubImage3D(Ft,O,Ut,ce,xe,at,vt,Lt,Ze,de,ve):E.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,O,Ut,ce,at,vt,Ze,de,ve.data):E.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,O,Ut,ce,ve.width,ve.height,Ze,ve.data):P.texSubImage2D(P.TEXTURE_2D,O,Ut,ce,at,vt,Ze,de,ve);P.pixelStorei(P.UNPACK_ROW_LENGTH,Jn),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,fe),P.pixelStorei(P.UNPACK_SKIP_PIXELS,_n),P.pixelStorei(P.UNPACK_SKIP_ROWS,xs),P.pixelStorei(P.UNPACK_SKIP_IMAGES,sn),O===0&&z.generateMipmaps&&P.generateMipmap(Ft),ht.unbindTexture()},this.copyTextureToTexture3D=function(E,z,H=null,V=null,O=0){return E.isTexture!==!0&&(xr("WebGLRenderer: copyTextureToTexture3D function signature has changed."),H=arguments[0]||null,V=arguments[1]||null,E=arguments[2],z=arguments[3],O=arguments[4]||0),xr('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(E,z,H,V,O)},this.initRenderTarget=function(E){Mt.get(E).__webglFramebuffer===void 0&&R.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?R.setTextureCube(E,0):E.isData3DTexture?R.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?R.setTexture2DArray(E,0):R.setTexture2D(E,0),ht.unbindTexture()},this.resetState=function(){A=0,I=0,D=null,ht.reset(),ge.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return oi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=re._getDrawingBufferColorSpace(t),e.unpackColorSpace=re._getUnpackColorSpace()}};var ua=class n{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new Wt(t),this.near=e,this.far=i}clone(){return new n(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Ar=class extends Ge{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ve,this.environmentIntensity=1,this.environmentRotation=new Ve,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var Rr=class extends cn{constructor(t=null,e=1,i=1,s,r,o,a,l,c=ln,h=ln,u,d){super(null,o,a,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Di=class extends qe{constructor(t,e,i,s=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Ls=new oe,Jd=new oe,Bo=[],Kd=new ci,c_=new oe,mr=new Me,gr=new Pi,Cr=class extends Me{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Di(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<i;s++)this.setMatrixAt(s,c_)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new ci),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,Ls),Kd.copy(t.boundingBox).applyMatrix4(Ls),this.boundingBox.union(Kd)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Pi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,Ls),gr.copy(t.boundingSphere).applyMatrix4(Ls),this.boundingSphere.union(gr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let i=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=i.length+1,o=t*r+1;for(let a=0;a<i.length;a++)i[a]=s[o+a]}raycast(t,e){let i=this.matrixWorld,s=this.count;if(mr.geometry=this.geometry,mr.material=this.material,mr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),gr.copy(this.boundingSphere),gr.applyMatrix4(i),t.ray.intersectsSphere(gr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ls),Jd.multiplyMatrices(i,Ls),mr.matrixWorld=Jd,mr.raycast(t,Bo);for(let o=0,a=Bo.length;o<a;o++){let l=Bo[o];l.instanceId=r,l.object=this,e.push(l)}Bo.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Di(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){let i=e.morphTargetInfluences,s=i.length+1;this.morphTexture===null&&(this.morphTexture=new Rr(new Float32Array(s*this.count),s,this.count,Br,Fn));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<i.length;c++)o+=i[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Qc=class extends Li{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Wt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},jd=new oe,th=new wr,Ho=new Pi,Vo=new N,da=class extends Ge{constructor(t=new Ae,e=new Qc){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let i=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Ho.copy(i.boundingSphere),Ho.applyMatrix4(s),Ho.radius+=r,t.ray.intersectsSphere(Ho)===!1)return;jd.copy(s).invert(),th.copy(t.ray).applyMatrix4(jd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,u=i.attributes.position;if(c!==null){let d=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let g=d,x=f;g<x;g++){let m=c.getX(g);Vo.fromBufferAttribute(u,m),Qd(Vo,m,l,s,t,e,this)}}else{let d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let g=d,x=f;g<x;g++)Vo.fromBufferAttribute(u,g),Qd(Vo,g,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){let s=e[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Qd(n,t,e,i,s,r,o){let a=th.distanceSqToPoint(n);if(a<e){let l=new N;th.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var mn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){let i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){let e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){let e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],i,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)i=this.getPoint(o/t),r+=i.distanceTo(s),e.push(r),s=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){let i=this.getLengths(),s=0,r=i.length,o;e?o=e:o=t*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],d=i[s+1]-h,f=(o-h)/d;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new ct:new N);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){let i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e){let i=new N,s=[],r=[],o=[],a=new N,l=new oe;for(let f=0;f<=t;f++){let g=f/t;s[f]=this.getTangentAt(g,new N)}r[0]=new N,o[0]=new N;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),d<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(Be(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(Be(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(f=-f);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}},Ir=class extends mn{constructor(t=0,e=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(t,e=new ct){let i=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+t*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return i.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},eh=class extends Ir{constructor(t,e,i,s,r,o){super(t,e,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Dh(){let n=0,t=0,e=0,i=0;function s(r,o,a,l){n=r,t=a,e=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,u){let d=(o-r)/c-(a-r)/(c+h)+(a-o)/h,f=(a-o)/h-(l-o)/(h+u)+(l-a)/u;d*=h,f*=h,s(o,a,d,f)},calc:function(r){let o=r*r,a=o*r;return n+t*r+e*o+i*a}}}var Go=new N,ql=new Dh,Yl=new Dh,$l=new Dh,nh=class extends mn{constructor(t=[],e=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=i,this.tension=s}getPoint(t,e=new N){let i=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Go.subVectors(s[0],s[1]).add(s[0]),c=Go);let u=s[a%r],d=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Go.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Go),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(u),f),x=Math.pow(u.distanceToSquared(d),f),m=Math.pow(d.distanceToSquared(h),f);x<1e-4&&(x=1),g<1e-4&&(g=x),m<1e-4&&(m=x),ql.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,g,x,m),Yl.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,g,x,m),$l.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,g,x,m)}else this.curveType==="catmullrom"&&(ql.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),Yl.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),$l.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return i.set(ql.calc(l),Yl.calc(l),$l.calc(l)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(new N().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function tf(n,t,e,i,s){let r=(i-t)*.5,o=(s-e)*.5,a=n*n,l=n*a;return(2*e-2*i+r+o)*l+(-3*e+3*i-2*r-o)*a+r*n+e}function h_(n,t){let e=1-n;return e*e*t}function u_(n,t){return 2*(1-n)*n*t}function d_(n,t){return n*n*t}function _r(n,t,e,i){return h_(n,t)+u_(n,e)+d_(n,i)}function f_(n,t){let e=1-n;return e*e*e*t}function p_(n,t){let e=1-n;return 3*e*e*n*t}function m_(n,t){return 3*(1-n)*n*n*t}function g_(n,t){return n*n*n*t}function Mr(n,t,e,i,s){return f_(n,t)+p_(n,e)+m_(n,i)+g_(n,s)}var fa=class extends mn{constructor(t=new ct,e=new ct,i=new ct,s=new ct){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=i,this.v3=s}getPoint(t,e=new ct){let i=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Mr(t,s.x,r.x,o.x,a.x),Mr(t,s.y,r.y,o.y,a.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},ih=class extends mn{constructor(t=new N,e=new N,i=new N,s=new N){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=i,this.v3=s}getPoint(t,e=new N){let i=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Mr(t,s.x,r.x,o.x,a.x),Mr(t,s.y,r.y,o.y,a.y),Mr(t,s.z,r.z,o.z,a.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},pa=class extends mn{constructor(t=new ct,e=new ct){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ct){let i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ct){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},sh=class extends mn{constructor(t=new N,e=new N){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new N){let i=e;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new N){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},ma=class extends mn{constructor(t=new ct,e=new ct,i=new ct){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new ct){let i=e,s=this.v0,r=this.v1,o=this.v2;return i.set(_r(t,s.x,r.x,o.x),_r(t,s.y,r.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},rh=class extends mn{constructor(t=new N,e=new N,i=new N){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new N){let i=e,s=this.v0,r=this.v1,o=this.v2;return i.set(_r(t,s.x,r.x,o.x),_r(t,s.y,r.y,o.y),_r(t,s.z,r.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},ga=class extends mn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ct){let i=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],u=s[o>s.length-3?s.length-1:o+2];return i.set(tf(a,l.x,c.x,h.x,u.x),tf(a,l.y,c.y,h.y,u.y)),i}copy(t){super.copy(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,i=this.points.length;e<i;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,i=t.points.length;e<i;e++){let s=t.points[e];this.points.push(new ct().fromArray(s))}return this}},oh=Object.freeze({__proto__:null,ArcCurve:eh,CatmullRomCurve3:nh,CubicBezierCurve:fa,CubicBezierCurve3:ih,EllipseCurve:Ir,LineCurve:pa,LineCurve3:sh,QuadraticBezierCurve:ma,QuadraticBezierCurve3:rh,SplineCurve:ga}),ah=class extends mn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new oh[i](e,t))}return this}getPoint(t,e){let i=t*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let i=0,s=this.curves.length;i<s;i++)e+=this.curves[i].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(e.push(h),i=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){let s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,i=this.curves.length;e<i;e++){let s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,i=t.curves.length;e<i;e++){let s=t.curves[e];this.curves.push(new oh[s.type]().fromJSON(s))}return this}},xa=class extends ah{constructor(t){super(),this.type="Path",this.currentPoint=new ct,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,i=t.length;e<i;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let i=new pa(this.currentPoint.clone(),new ct(t,e));return this.curves.push(i),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,i,s){let r=new ma(this.currentPoint.clone(),new ct(t,e),new ct(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(t,e,i,s,r,o){let a=new fa(this.currentPoint.clone(),new ct(t,e),new ct(i,s),new ct(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),i=new ga(e);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+a,e+l,i,s,r,o),this}absarc(t,e,i,s,r,o){return this.absellipse(t,e,i,i,s,r,o),this}ellipse(t,e,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,i,s,r,o,a,l),this}absellipse(t,e,i,s,r,o,a,l){let c=new Ir(t,e,i,s,r,o,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}};var va=class n extends Ae{constructor(t=1,e=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:s},e=Math.max(3,e);let r=[],o=[],a=[],l=[],c=new N,h=new ct;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=e;u++,d+=3){let f=i+u/e*s;c.x=t*Math.cos(f),c.y=t*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[d]/t+1)/2,h.y=(o[d+1]/t+1)/2,l.push(h.x,h.y)}for(let u=1;u<=e;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new ae(o,3)),this.setAttribute("normal",new ae(a,3)),this.setAttribute("uv",new ae(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.radius,t.segments,t.thetaStart,t.thetaLength)}},Rn=class n extends Ae{constructor(t=1,e=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],f=[],g=0,x=[],m=i/2,p=0;w(),o===!1&&(t>0&&_(!0),e>0&&_(!1)),this.setIndex(h),this.setAttribute("position",new ae(u,3)),this.setAttribute("normal",new ae(d,3)),this.setAttribute("uv",new ae(f,2));function w(){let y=new N,C=new N,A=0,I=(e-t)/i;for(let D=0;D<=r;D++){let T=[],M=D/r,U=M*(e-t)+t;for(let G=0;G<=s;G++){let k=G/s,W=k*l+a,j=Math.sin(W),X=Math.cos(W);C.x=U*j,C.y=-M*i+m,C.z=U*X,u.push(C.x,C.y,C.z),y.set(j,I,X).normalize(),d.push(y.x,y.y,y.z),f.push(k,1-M),T.push(g++)}x.push(T)}for(let D=0;D<s;D++)for(let T=0;T<r;T++){let M=x[T][D],U=x[T+1][D],G=x[T+1][D+1],k=x[T][D+1];(t>0||T!==0)&&(h.push(M,U,k),A+=3),(e>0||T!==r-1)&&(h.push(U,G,k),A+=3)}c.addGroup(p,A,0),p+=A}function _(y){let C=g,A=new ct,I=new N,D=0,T=y===!0?t:e,M=y===!0?1:-1;for(let G=1;G<=s;G++)u.push(0,m*M,0),d.push(0,M,0),f.push(.5,.5),g++;let U=g;for(let G=0;G<=s;G++){let W=G/s*l+a,j=Math.cos(W),X=Math.sin(W);I.x=T*X,I.y=m*M,I.z=T*j,u.push(I.x,I.y,I.z),d.push(0,M,0),A.x=j*.5+.5,A.y=X*.5*M+.5,f.push(A.x,A.y),g++}for(let G=0;G<s;G++){let k=C+G,W=U+G;y===!0?h.push(W,W+1,k):h.push(W+1,W,k),D+=3}c.addGroup(p,D,y===!0?1:2),p+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},On=class n extends Rn{constructor(t=1,e=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new n(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},lh=class n extends Ae{constructor(t=[],e=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:s};let r=[],o=[];a(s),c(i),h(),this.setAttribute("position",new ae(r,3)),this.setAttribute("normal",new ae(r.slice(),3)),this.setAttribute("uv",new ae(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(w){let _=new N,y=new N,C=new N;for(let A=0;A<e.length;A+=3)f(e[A+0],_),f(e[A+1],y),f(e[A+2],C),l(_,y,C,w)}function l(w,_,y,C){let A=C+1,I=[];for(let D=0;D<=A;D++){I[D]=[];let T=w.clone().lerp(y,D/A),M=_.clone().lerp(y,D/A),U=A-D;for(let G=0;G<=U;G++)G===0&&D===A?I[D][G]=T:I[D][G]=T.clone().lerp(M,G/U)}for(let D=0;D<A;D++)for(let T=0;T<2*(A-D)-1;T++){let M=Math.floor(T/2);T%2===0?(d(I[D][M+1]),d(I[D+1][M]),d(I[D][M])):(d(I[D][M+1]),d(I[D+1][M+1]),d(I[D+1][M]))}}function c(w){let _=new N;for(let y=0;y<r.length;y+=3)_.x=r[y+0],_.y=r[y+1],_.z=r[y+2],_.normalize().multiplyScalar(w),r[y+0]=_.x,r[y+1]=_.y,r[y+2]=_.z}function h(){let w=new N;for(let _=0;_<r.length;_+=3){w.x=r[_+0],w.y=r[_+1],w.z=r[_+2];let y=m(w)/2/Math.PI+.5,C=p(w)/Math.PI+.5;o.push(y,1-C)}g(),u()}function u(){for(let w=0;w<o.length;w+=6){let _=o[w+0],y=o[w+2],C=o[w+4],A=Math.max(_,y,C),I=Math.min(_,y,C);A>.9&&I<.1&&(_<.2&&(o[w+0]+=1),y<.2&&(o[w+2]+=1),C<.2&&(o[w+4]+=1))}}function d(w){r.push(w.x,w.y,w.z)}function f(w,_){let y=w*3;_.x=t[y+0],_.y=t[y+1],_.z=t[y+2]}function g(){let w=new N,_=new N,y=new N,C=new N,A=new ct,I=new ct,D=new ct;for(let T=0,M=0;T<r.length;T+=9,M+=6){w.set(r[T+0],r[T+1],r[T+2]),_.set(r[T+3],r[T+4],r[T+5]),y.set(r[T+6],r[T+7],r[T+8]),A.set(o[M+0],o[M+1]),I.set(o[M+2],o[M+3]),D.set(o[M+4],o[M+5]),C.copy(w).add(_).add(y).divideScalar(3);let U=m(C);x(A,M+0,w,U),x(I,M+2,_,U),x(D,M+4,y,U)}}function x(w,_,y,C){C<0&&w.x===1&&(o[_]=w.x-1),y.x===0&&y.z===0&&(o[_]=C/2/Math.PI+.5)}function m(w){return Math.atan2(w.z,-w.x)}function p(w){return Math.atan2(-w.y,Math.sqrt(w.x*w.x+w.z*w.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.vertices,t.indices,t.radius,t.details)}},Pr=class n extends lh{constructor(t=1,e=0){let i=(1+Math.sqrt(5))/2,s=1/i,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-i,0,-s,i,0,s,-i,0,s,i,-s,-i,0,-s,i,0,s,-i,0,s,i,0,-i,0,-s,i,0,-s,-i,0,s,i,0,s],o=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,o,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new n(t.radius,t.detail)}};var Lr=class extends xa{constructor(t){super(t),this.uuid=Ys(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let i=0,s=this.holes.length;i<s;i++)e[i]=this.holes[i].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){let s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,i=this.holes.length;e<i;e++){let s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,i=t.holes.length;e<i;e++){let s=t.holes[e];this.holes.push(new xa().fromJSON(s))}return this}},x_={triangulate:function(n,t,e=2){let i=t&&t.length,s=i?t[0]*e:n.length,r=Cf(n,0,s,e,!0),o=[];if(!r||r.next===r.prev)return o;let a,l,c,h,u,d,f;if(i&&(r=b_(n,t,r,e)),n.length>80*e){a=c=n[0],l=h=n[1];for(let g=e;g<s;g+=e)u=n[g],d=n[g+1],u<a&&(a=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);f=Math.max(c-a,h-l),f=f!==0?32767/f:0}return Dr(r,o,e,a,l,f,0),o}};function Cf(n,t,e,i,s){let r,o;if(s===D_(n,t,e,i)>0)for(r=t;r<e;r+=i)o=ef(r,n[r],n[r+1],o);else for(r=e-i;r>=t;r-=i)o=ef(r,n[r],n[r+1],o);return o&&Aa(o,o.next)&&(Nr(o),o=o.next),o}function as(n,t){if(!n)return n;t||(t=n);let e=n,i;do if(i=!1,!e.steiner&&(Aa(e,e.next)||be(e.prev,e,e.next)===0)){if(Nr(e),e=t=e.prev,e===e.next)break;i=!0}else e=e.next;while(i||e!==t);return t}function Dr(n,t,e,i,s,r,o){if(!n)return;!o&&r&&A_(n,i,s,r);let a=n,l,c;for(;n.prev!==n.next;){if(l=n.prev,c=n.next,r?y_(n,i,s,r):v_(n)){t.push(l.i/e|0),t.push(n.i/e|0),t.push(c.i/e|0),Nr(n),n=c.next,a=c.next;continue}if(n=c,n===a){o?o===1?(n=__(as(n),t,e),Dr(n,t,e,i,s,r,2)):o===2&&M_(n,t,e,i,s,r):Dr(as(n),t,e,i,s,r,1);break}}}function v_(n){let t=n.prev,e=n,i=n.next;if(be(t,e,i)>=0)return!1;let s=t.x,r=e.x,o=i.x,a=t.y,l=e.y,c=i.y,h=s<r?s<o?s:o:r<o?r:o,u=a<l?a<c?a:c:l<c?l:c,d=s>r?s>o?s:o:r>o?r:o,f=a>l?a>c?a:c:l>c?l:c,g=i.next;for(;g!==t;){if(g.x>=h&&g.x<=d&&g.y>=u&&g.y<=f&&Us(s,a,r,l,o,c,g.x,g.y)&&be(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function y_(n,t,e,i){let s=n.prev,r=n,o=n.next;if(be(s,r,o)>=0)return!1;let a=s.x,l=r.x,c=o.x,h=s.y,u=r.y,d=o.y,f=a<l?a<c?a:c:l<c?l:c,g=h<u?h<d?h:d:u<d?u:d,x=a>l?a>c?a:c:l>c?l:c,m=h>u?h>d?h:d:u>d?u:d,p=ch(f,g,t,e,i),w=ch(x,m,t,e,i),_=n.prevZ,y=n.nextZ;for(;_&&_.z>=p&&y&&y.z<=w;){if(_.x>=f&&_.x<=x&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&Us(a,h,l,u,c,d,_.x,_.y)&&be(_.prev,_,_.next)>=0||(_=_.prevZ,y.x>=f&&y.x<=x&&y.y>=g&&y.y<=m&&y!==s&&y!==o&&Us(a,h,l,u,c,d,y.x,y.y)&&be(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;_&&_.z>=p;){if(_.x>=f&&_.x<=x&&_.y>=g&&_.y<=m&&_!==s&&_!==o&&Us(a,h,l,u,c,d,_.x,_.y)&&be(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;y&&y.z<=w;){if(y.x>=f&&y.x<=x&&y.y>=g&&y.y<=m&&y!==s&&y!==o&&Us(a,h,l,u,c,d,y.x,y.y)&&be(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function __(n,t,e){let i=n;do{let s=i.prev,r=i.next.next;!Aa(s,r)&&If(s,i,i.next,r)&&Ur(s,r)&&Ur(r,s)&&(t.push(s.i/e|0),t.push(i.i/e|0),t.push(r.i/e|0),Nr(i),Nr(i.next),i=n=r),i=i.next}while(i!==n);return as(i)}function M_(n,t,e,i,s,r){let o=n;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&I_(o,a)){let l=Pf(o,a);o=as(o,o.next),l=as(l,l.next),Dr(o,t,e,i,s,r,0),Dr(l,t,e,i,s,r,0);return}a=a.next}o=o.next}while(o!==n)}function b_(n,t,e,i){let s=[],r,o,a,l,c;for(r=0,o=t.length;r<o;r++)a=t[r]*i,l=r<o-1?t[r+1]*i:n.length,c=Cf(n,a,l,i,!1),c===c.next&&(c.steiner=!0),s.push(C_(c));for(s.sort(S_),r=0;r<s.length;r++)e=w_(s[r],e);return e}function S_(n,t){return n.x-t.x}function w_(n,t){let e=E_(n,t);if(!e)return t;let i=Pf(e,n);return as(i,i.next),as(e,e.next)}function E_(n,t){let e=t,i=-1/0,s,r=n.x,o=n.y;do{if(o<=e.y&&o>=e.next.y&&e.next.y!==e.y){let d=e.x+(o-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=r&&d>i&&(i=d,s=e.x<e.next.x?e:e.next,d===r))return s}e=e.next}while(e!==t);if(!s)return null;let a=s,l=s.x,c=s.y,h=1/0,u;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&Us(o<c?r:i,o,l,c,o<c?i:r,o,e.x,e.y)&&(u=Math.abs(o-e.y)/(r-e.x),Ur(e,n)&&(u<h||u===h&&(e.x>s.x||e.x===s.x&&T_(s,e)))&&(s=e,h=u)),e=e.next;while(e!==a);return s}function T_(n,t){return be(n.prev,n,t.prev)<0&&be(t.next,n,n.next)<0}function A_(n,t,e,i){let s=n;do s.z===0&&(s.z=ch(s.x,s.y,t,e,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==n);s.prevZ.nextZ=null,s.prevZ=null,R_(s)}function R_(n){let t,e,i,s,r,o,a,l,c=1;do{for(e=n,n=null,r=null,o=0;e;){for(o++,i=e,a=0,t=0;t<c&&(a++,i=i.nextZ,!!i);t++);for(l=c;a>0||l>0&&i;)a!==0&&(l===0||!i||e.z<=i.z)?(s=e,e=e.nextZ,a--):(s=i,i=i.nextZ,l--),r?r.nextZ=s:n=s,s.prevZ=r,r=s;e=i}r.nextZ=null,c*=2}while(o>1);return n}function ch(n,t,e,i,s){return n=(n-e)*s|0,t=(t-i)*s|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,n|t<<1}function C_(n){let t=n,e=n;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==n);return e}function Us(n,t,e,i,s,r,o,a){return(s-o)*(t-a)>=(n-o)*(r-a)&&(n-o)*(i-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(i-a)}function I_(n,t){return n.next.i!==t.i&&n.prev.i!==t.i&&!P_(n,t)&&(Ur(n,t)&&Ur(t,n)&&L_(n,t)&&(be(n.prev,n,t.prev)||be(n,t.prev,t))||Aa(n,t)&&be(n.prev,n,n.next)>0&&be(t.prev,t,t.next)>0)}function be(n,t,e){return(t.y-n.y)*(e.x-t.x)-(t.x-n.x)*(e.y-t.y)}function Aa(n,t){return n.x===t.x&&n.y===t.y}function If(n,t,e,i){let s=Xo(be(n,t,e)),r=Xo(be(n,t,i)),o=Xo(be(e,i,n)),a=Xo(be(e,i,t));return!!(s!==r&&o!==a||s===0&&Wo(n,e,t)||r===0&&Wo(n,i,t)||o===0&&Wo(e,n,i)||a===0&&Wo(e,t,i))}function Wo(n,t,e){return t.x<=Math.max(n.x,e.x)&&t.x>=Math.min(n.x,e.x)&&t.y<=Math.max(n.y,e.y)&&t.y>=Math.min(n.y,e.y)}function Xo(n){return n>0?1:n<0?-1:0}function P_(n,t){let e=n;do{if(e.i!==n.i&&e.next.i!==n.i&&e.i!==t.i&&e.next.i!==t.i&&If(e,e.next,n,t))return!0;e=e.next}while(e!==n);return!1}function Ur(n,t){return be(n.prev,n,n.next)<0?be(n,t,n.next)>=0&&be(n,n.prev,t)>=0:be(n,t,n.prev)<0||be(n,n.next,t)<0}function L_(n,t){let e=n,i=!1,s=(n.x+t.x)/2,r=(n.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(i=!i),e=e.next;while(e!==n);return i}function Pf(n,t){let e=new hh(n.i,n.x,n.y),i=new hh(t.i,t.x,t.y),s=n.next,r=t.prev;return n.next=t,t.prev=n,e.next=s,s.prev=e,i.next=e,e.prev=i,r.next=i,i.prev=r,i}function ef(n,t,e,i){let s=new hh(n,t,e);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function Nr(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function hh(n,t,e){this.i=n,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function D_(n,t,e,i){let s=0;for(let r=t,o=e-i;r<e;r+=i)s+=(n[o]-n[r])*(n[r+1]+n[o+1]),o=r;return s}var br=class n{static area(t){let e=t.length,i=0;for(let s=e-1,r=0;r<e;s=r++)i+=t[s].x*t[r].y-t[r].x*t[s].y;return i*.5}static isClockWise(t){return n.area(t)<0}static triangulateShape(t,e){let i=[],s=[],r=[];nf(t),sf(i,t);let o=t.length;e.forEach(nf);for(let l=0;l<e.length;l++)s.push(o),o+=e[l].length,sf(i,e[l]);let a=x_.triangulate(i,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}};function nf(n){let t=n.length;t>2&&n[t-1].equals(n[0])&&n.pop()}function sf(n,t){for(let e=0;e<t.length;e++)n.push(t[e].x),n.push(t[e].y)}var ya=class n extends Ae{constructor(t=new Lr([new ct(.5,.5),new ct(-.5,.5),new ct(-.5,-.5),new ct(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];let i=this,s=[],r=[];for(let a=0,l=t.length;a<l;a++){let c=t[a];o(c)}this.setAttribute("position",new ae(s,3)),this.setAttribute("uv",new ae(r,2)),this.computeVertexNormals();function o(a){let l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1,d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:f-.1,x=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3,p=e.extrudePath,w=e.UVGenerator!==void 0?e.UVGenerator:U_,_,y=!1,C,A,I,D;p&&(_=p.getSpacedPoints(h),y=!0,d=!1,C=p.computeFrenetFrames(h,!1),A=new N,I=new N,D=new N),d||(m=0,f=0,g=0,x=0);let T=a.extractPoints(c),M=T.shape,U=T.holes;if(!br.isClockWise(M)){M=M.reverse();for(let tt=0,rt=U.length;tt<rt;tt++){let P=U[tt];br.isClockWise(P)&&(U[tt]=P.reverse())}}let k=br.triangulateShape(M,U),W=M;for(let tt=0,rt=U.length;tt<rt;tt++){let P=U[tt];M=M.concat(P)}function j(tt,rt,P){return rt||console.error("THREE.ExtrudeGeometry: vec does not exist"),tt.clone().addScaledVector(rt,P)}let X=M.length,st=k.length;function Y(tt,rt,P){let Nt,nt,St,ht=tt.x-rt.x,Ht=tt.y-rt.y,Mt=P.x-tt.x,R=P.y-tt.y,b=ht*ht+Ht*Ht,B=ht*R-Ht*Mt;if(Math.abs(B)>Number.EPSILON){let Z=Math.sqrt(b),et=Math.sqrt(Mt*Mt+R*R),J=rt.x-Ht/Z,Pt=rt.y+ht/Z,pt=P.x-R/et,bt=P.y+Mt/et,ne=((pt-J)*R-(bt-Pt)*Mt)/(ht*R-Ht*Mt);Nt=J+ht*ne-tt.x,nt=Pt+Ht*ne-tt.y;let it=Nt*Nt+nt*nt;if(it<=2)return new ct(Nt,nt);St=Math.sqrt(it/2)}else{let Z=!1;ht>Number.EPSILON?Mt>Number.EPSILON&&(Z=!0):ht<-Number.EPSILON?Mt<-Number.EPSILON&&(Z=!0):Math.sign(Ht)===Math.sign(R)&&(Z=!0),Z?(Nt=-Ht,nt=ht,St=Math.sqrt(b)):(Nt=ht,nt=Ht,St=Math.sqrt(b/2))}return new ct(Nt/St,nt/St)}let dt=[];for(let tt=0,rt=W.length,P=rt-1,Nt=tt+1;tt<rt;tt++,P++,Nt++)P===rt&&(P=0),Nt===rt&&(Nt=0),dt[tt]=Y(W[tt],W[P],W[Nt]);let _t=[],Rt,Zt=dt.concat();for(let tt=0,rt=U.length;tt<rt;tt++){let P=U[tt];Rt=[];for(let Nt=0,nt=P.length,St=nt-1,ht=Nt+1;Nt<nt;Nt++,St++,ht++)St===nt&&(St=0),ht===nt&&(ht=0),Rt[Nt]=Y(P[Nt],P[St],P[ht]);_t.push(Rt),Zt=Zt.concat(Rt)}for(let tt=0;tt<m;tt++){let rt=tt/m,P=f*Math.cos(rt*Math.PI/2),Nt=g*Math.sin(rt*Math.PI/2)+x;for(let nt=0,St=W.length;nt<St;nt++){let ht=j(W[nt],dt[nt],Nt);lt(ht.x,ht.y,-P)}for(let nt=0,St=U.length;nt<St;nt++){let ht=U[nt];Rt=_t[nt];for(let Ht=0,Mt=ht.length;Ht<Mt;Ht++){let R=j(ht[Ht],Rt[Ht],Nt);lt(R.x,R.y,-P)}}}let ue=g+x;for(let tt=0;tt<X;tt++){let rt=d?j(M[tt],Zt[tt],ue):M[tt];y?(I.copy(C.normals[0]).multiplyScalar(rt.x),A.copy(C.binormals[0]).multiplyScalar(rt.y),D.copy(_[0]).add(I).add(A),lt(D.x,D.y,D.z)):lt(rt.x,rt.y,0)}for(let tt=1;tt<=h;tt++)for(let rt=0;rt<X;rt++){let P=d?j(M[rt],Zt[rt],ue):M[rt];y?(I.copy(C.normals[tt]).multiplyScalar(P.x),A.copy(C.binormals[tt]).multiplyScalar(P.y),D.copy(_[tt]).add(I).add(A),lt(D.x,D.y,D.z)):lt(P.x,P.y,u/h*tt)}for(let tt=m-1;tt>=0;tt--){let rt=tt/m,P=f*Math.cos(rt*Math.PI/2),Nt=g*Math.sin(rt*Math.PI/2)+x;for(let nt=0,St=W.length;nt<St;nt++){let ht=j(W[nt],dt[nt],Nt);lt(ht.x,ht.y,u+P)}for(let nt=0,St=U.length;nt<St;nt++){let ht=U[nt];Rt=_t[nt];for(let Ht=0,Mt=ht.length;Ht<Mt;Ht++){let R=j(ht[Ht],Rt[Ht],Nt);y?lt(R.x,R.y+_[h-1].y,_[h-1].x+P):lt(R.x,R.y,u+P)}}}K(),ot();function K(){let tt=s.length/3;if(d){let rt=0,P=X*rt;for(let Nt=0;Nt<st;Nt++){let nt=k[Nt];kt(nt[2]+P,nt[1]+P,nt[0]+P)}rt=h+m*2,P=X*rt;for(let Nt=0;Nt<st;Nt++){let nt=k[Nt];kt(nt[0]+P,nt[1]+P,nt[2]+P)}}else{for(let rt=0;rt<st;rt++){let P=k[rt];kt(P[2],P[1],P[0])}for(let rt=0;rt<st;rt++){let P=k[rt];kt(P[0]+X*h,P[1]+X*h,P[2]+X*h)}}i.addGroup(tt,s.length/3-tt,0)}function ot(){let tt=s.length/3,rt=0;It(W,rt),rt+=W.length;for(let P=0,Nt=U.length;P<Nt;P++){let nt=U[P];It(nt,rt),rt+=nt.length}i.addGroup(tt,s.length/3-tt,1)}function It(tt,rt){let P=tt.length;for(;--P>=0;){let Nt=P,nt=P-1;nt<0&&(nt=tt.length-1);for(let St=0,ht=h+m*2;St<ht;St++){let Ht=X*St,Mt=X*(St+1),R=rt+Nt+Ht,b=rt+nt+Ht,B=rt+nt+Mt,Z=rt+Nt+Mt;qt(R,b,B,Z)}}}function lt(tt,rt,P){l.push(tt),l.push(rt),l.push(P)}function kt(tt,rt,P){Gt(tt),Gt(rt),Gt(P);let Nt=s.length/3,nt=w.generateTopUV(i,s,Nt-3,Nt-2,Nt-1);se(nt[0]),se(nt[1]),se(nt[2])}function qt(tt,rt,P,Nt){Gt(tt),Gt(rt),Gt(Nt),Gt(rt),Gt(P),Gt(Nt);let nt=s.length/3,St=w.generateSideWallUV(i,s,nt-6,nt-3,nt-2,nt-1);se(St[0]),se(St[1]),se(St[3]),se(St[1]),se(St[2]),se(St[3])}function Gt(tt){s.push(l[tt*3+0]),s.push(l[tt*3+1]),s.push(l[tt*3+2])}function se(tt){r.push(tt.x),r.push(tt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes,i=this.parameters.options;return N_(e,i,t)}static fromJSON(t,e){let i=[];for(let r=0,o=t.shapes.length;r<o;r++){let a=e[t.shapes[r]];i.push(a)}let s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new oh[s.type]().fromJSON(s)),new n(i,t.options)}},U_={generateTopUV:function(n,t,e,i,s){let r=t[e*3],o=t[e*3+1],a=t[i*3],l=t[i*3+1],c=t[s*3],h=t[s*3+1];return[new ct(r,o),new ct(a,l),new ct(c,h)]},generateSideWallUV:function(n,t,e,i,s,r){let o=t[e*3],a=t[e*3+1],l=t[e*3+2],c=t[i*3],h=t[i*3+1],u=t[i*3+2],d=t[s*3],f=t[s*3+1],g=t[s*3+2],x=t[r*3],m=t[r*3+1],p=t[r*3+2];return Math.abs(a-h)<Math.abs(o-c)?[new ct(o,1-l),new ct(c,1-u),new ct(d,1-g),new ct(x,1-p)]:[new ct(a,1-l),new ct(h,1-u),new ct(f,1-g),new ct(m,1-p)]}};function N_(n,t,e){if(e.shapes=[],Array.isArray(n))for(let i=0,s=n.length;i<s;i++){let r=n[i];e.shapes.push(r.uuid)}else e.shapes.push(n.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}var Fr=class n extends Ae{constructor(t=.5,e=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],u=t,d=(e-t)/s,f=new N,g=new ct;for(let x=0;x<=s;x++){for(let m=0;m<=i;m++){let p=r+m/i*o;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,h.push(g.x,g.y)}u+=d}for(let x=0;x<s;x++){let m=x*(i+1);for(let p=0;p<i;p++){let w=p+m,_=w,y=w+i+1,C=w+i+2,A=w+1;a.push(_,y,A),a.push(y,C,A)}}this.setIndex(a),this.setAttribute("position",new ae(l,3)),this.setAttribute("normal",new ae(c,3)),this.setAttribute("uv",new ae(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}};var ls=class n extends Ae{constructor(t=1,e=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],u=new N,d=new N,f=[],g=[],x=[],m=[];for(let p=0;p<=i;p++){let w=[],_=p/i,y=0;p===0&&o===0?y=.5/e:p===i&&l===Math.PI&&(y=-.5/e);for(let C=0;C<=e;C++){let A=C/e;u.x=-t*Math.cos(s+A*r)*Math.sin(o+_*a),u.y=t*Math.cos(o+_*a),u.z=t*Math.sin(s+A*r)*Math.sin(o+_*a),g.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),m.push(A+y,1-_),w.push(c++)}h.push(w)}for(let p=0;p<i;p++)for(let w=0;w<e;w++){let _=h[p][w+1],y=h[p][w],C=h[p+1][w],A=h[p+1][w+1];(p!==0||o>0)&&f.push(_,y,A),(p!==i-1||l<Math.PI)&&f.push(y,C,A)}this.setIndex(f),this.setAttribute("position",new ae(g,3)),this.setAttribute("normal",new ae(x,3)),this.setAttribute("uv",new ae(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new n(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var Ui=class extends Li{static get type(){return"MeshLambertMaterial"}constructor(t){super(),this.isMeshLambertMaterial=!0,this.color=new Wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Wt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=yf,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ve,this.combine=wh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function qo(n,t,e){return!n||!e&&n.constructor===t?n:typeof t.BYTES_PER_ELEMENT=="number"?new t(n):Array.prototype.slice.call(n)}function F_(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Ws=class{constructor(t,e,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(i),this.sampleValues=e,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,i=this._cachedIndex,s=e[i],r=e[i-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=i+2;;){if(s===void 0){if(t<r)break i;return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=e[++i],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=e[--i-1],t>=r)break t}o=i,i=0;break e}break n}for(;i<o;){let a=i+o>>>1;t<e[a]?o=a:i=a+1}if(s=e[i],r=e[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=e.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=i[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},uh=class extends Ws{constructor(t,e,i,s){super(t,e,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:td,endingEnd:td}}intervalChanged_(t,e,i){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case ed:r=t,a=2*e-i;break;case nd:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case ed:o=t,l=2*i-e;break;case nd:o=1,l=i+s[1]-s[0];break;default:o=t-1,l=e}let c=(i-e)*.5,h=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(i-e)/(s-e),x=g*g,m=x*g,p=-d*m+2*d*x-d*g,w=(1+d)*m+(-1.5-2*d)*x+(-.5+d)*g+1,_=(-1-f)*m+(1.5+f)*x+.5*g,y=f*m-f*x;for(let C=0;C!==a;++C)r[C]=p*o[h+C]+w*o[c+C]+_*o[l+C]+y*o[u+C];return r}},dh=class extends Ws{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,h=(i-e)/(s-e),u=1-h;for(let d=0;d!==a;++d)r[d]=o[c+d]*u+o[l+d]*h;return r}},fh=class extends Ws{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Cn=class{constructor(t,e,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=qo(e,this.TimeBufferType),this.values=qo(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,i;if(e.toJSON!==this.toJSON)i=e.toJSON(t);else{i={name:t.name,times:qo(t.times,Array),values:qo(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s)}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new fh(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new dh(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new uh(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case jo:e=this.InterpolantFactoryMethodDiscrete;break;case Nc:e=this.InterpolantFactoryMethodLinear;break;case xl:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return jo;case this.InterpolantFactoryMethodLinear:return Nc;case this.InterpolantFactoryMethodSmooth:return xl}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let i=0,s=e.length;i!==s;++i)e[i]*=t}return this}trim(t,e){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<t;)++r;for(;o!==-1&&i[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&F_(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===xl,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],h=t[a+1];if(c!==h&&(a!==1||c!==t[0]))if(s)l=!0;else{let u=a*i,d=u-i,f=u+i;for(let g=0;g!==i;++g){let x=e[u+g];if(x!==e[d+g]||x!==e[f+g]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let u=a*i,d=o*i;for(let f=0;f!==i;++f)e[d+f]=e[u+f]}++o}}if(r>0){t[o]=t[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*i)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),i=this.constructor,s=new i(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};Cn.prototype.TimeBufferType=Float32Array;Cn.prototype.ValueBufferType=Float32Array;Cn.prototype.DefaultInterpolation=Nc;var cs=class extends Cn{constructor(t,e,i){super(t,e,i)}};cs.prototype.ValueTypeName="bool";cs.prototype.ValueBufferType=Array;cs.prototype.DefaultInterpolation=jo;cs.prototype.InterpolantFactoryMethodLinear=void 0;cs.prototype.InterpolantFactoryMethodSmooth=void 0;var ph=class extends Cn{};ph.prototype.ValueTypeName="color";var mh=class extends Cn{};mh.prototype.ValueTypeName="number";var gh=class extends Ws{constructor(t,e,i,s){super(t,e,i,s)}interpolate_(t,e,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-e)/(s-e),c=t*a;for(let h=c+a;c!==h;c+=4)Qe.slerpFlat(r,0,o,c-a,o,c,l);return r}},_a=class extends Cn{InterpolantFactoryMethodLinear(t){return new gh(this.times,this.values,this.getValueSize(),t)}};_a.prototype.ValueTypeName="quaternion";_a.prototype.InterpolantFactoryMethodSmooth=void 0;var hs=class extends Cn{constructor(t,e,i){super(t,e,i)}};hs.prototype.ValueTypeName="string";hs.prototype.ValueBufferType=Array;hs.prototype.DefaultInterpolation=jo;hs.prototype.InterpolantFactoryMethodLinear=void 0;hs.prototype.InterpolantFactoryMethodSmooth=void 0;var xh=class extends Cn{};xh.prototype.ValueTypeName="vector";var vh=class{constructor(t,e,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=i,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],g=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null}}},z_=new vh,yh=class{constructor(t){this.manager=t!==void 0?t:z_,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let i=this;return new Promise(function(s,r){i.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};yh.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ma=class extends Ge{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Wt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}},zr=class extends Ma{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ge.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Wt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}},Zl=new oe,rf=new N,of=new N,_h=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ct(512,512),this.map=null,this.mapPass=null,this.matrix=new oe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Tr,this._frameExtents=new ct(1,1),this._viewportCount=1,this._viewports=[new we(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,i=this.matrix;rf.setFromMatrixPosition(t.matrixWorld),e.position.copy(rf),of.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(of),e.updateMatrixWorld(),Zl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Zl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Zl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var Mh=class extends _h{constructor(){super(new aa(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Or=class extends Ma{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ge.DEFAULT_UP),this.updateMatrix(),this.target=new Ge,this.shadow=new Mh}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}};var Uh="\\[\\]\\.:\\/",O_=new RegExp("["+Uh+"]","g"),Nh="[^"+Uh+"]",k_="[^"+Uh.replace("\\.","")+"]",B_=/((?:WC+[\/:])*)/.source.replace("WC",Nh),H_=/(WCOD+)?/.source.replace("WCOD",k_),V_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Nh),G_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Nh),W_=new RegExp("^"+B_+H_+V_+G_+"$"),X_=["material","materials","bones","map"],bh=class{constructor(t,e,i){let s=i||_e.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,e)}setValue(t,e){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,i=t.length;e!==i;++e)t[e].unbind()}},_e=class n{constructor(t,e,i){this.path=e,this.parsedPath=i||n.parseTrackName(e),this.node=n.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,i){return t&&t.isAnimationObjectGroup?new n.Composite(t,e,i):new n(t,e,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(O_,"")}static parseTrackName(t){let e=W_.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);X_.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(e);if(i!==void 0)return i}if(t.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=i(a.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)t[e++]=i[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,i=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=n.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=e.objectIndex;switch(i){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};_e.Composite=bh;_e.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};_e.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};_e.prototype.GetterByBindingType=[_e.prototype._getValue_direct,_e.prototype._getValue_array,_e.prototype._getValue_arrayElement,_e.prototype._getValue_toArray];_e.prototype.SetterByBindingTypeAndVersioning=[[_e.prototype._setValue_direct,_e.prototype._setValue_direct_setNeedsUpdate,_e.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[_e.prototype._setValue_array,_e.prototype._setValue_array_setNeedsUpdate,_e.prototype._setValue_array_setMatrixWorldNeedsUpdate],[_e.prototype._setValue_arrayElement,_e.prototype._setValue_arrayElement_setNeedsUpdate,_e.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[_e.prototype._setValue_fromArray,_e.prototype._setValue_fromArray_setNeedsUpdate,_e.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Nb=new Float32Array(1);var af=new oe,ba=class{constructor(t,e,i=0,s=1/0){this.ray=new wr(t,e),this.near=i,this.far=s,this.camera=null,this.layers=new Er,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return af.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(af),this}intersectObject(t,e=!0,i=[]){return Sh(t,this,i,e),i.sort(lf),i}intersectObjects(t,e=!0,i=[]){for(let s=0,r=t.length;s<r;s++)Sh(t[s],this,i,e);return i.sort(lf),i}};function lf(n,t){return n.distance-t.distance}function Sh(n,t,e,i){let s=!0;if(n.layers.test(t.layers)&&n.raycast(t,e)===!1&&(s=!1),s===!0&&i===!0){let r=n.children;for(let o=0,a=r.length;o<a;o++)Sh(r[o],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var Zs=Math.sqrt(3);var Vr=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],Fh=(n,t)=>Zs*(n+t/2),zh=(n,t)=>1.5*t,Ra=Vr.map(([n,t])=>Fh(n,t)/Zs),Ca=Vr.map(([n,t])=>zh(n,t)/Zs);function kn(n,t,e,i){let s=n-e,r=t-i;return(Math.abs(s)+Math.abs(r)+Math.abs(s+r))/2}var q_={q:0,r:0};function Lf(n,t,e=q_){let i=Zs/3*n-t/3,s=2/3*t,r=-i-s,o=Math.round(i),a=Math.round(s),l=Math.round(r),c=Math.abs(o-i),h=Math.abs(a-s),u=Math.abs(l-r);return c>h&&c>u?o=-a-l:h>u&&(a=-o-l),e.q=o,e.r=a,e}function hi(n,t){let e=n-t;for(;e>Math.PI;)e-=Math.PI*2;for(;e<-Math.PI;)e+=Math.PI*2;return e}var Ie=(n,t,e)=>n<t?t:n>e?e:n,Ue=(n,t,e)=>n+(t-n)*e;function Uf(n){let t=n>>>0;return function(){t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function We(n,t){let e=Math.imul(n|0,374761393)+Math.imul(t|0,668265263)|0;return e=Math.imul(e^e>>>13,1274126177),((e^e>>>16)>>>0)/4294967296}var Df=n=>n*n*n*(n*(n*6-15)+10);function Gr(n){let t=new Uint8Array(256);for(let r=0;r<256;r++)t[r]=r;for(let r=255;r>0;r--){let o=Math.floor(n()*(r+1)),a=t[r];t[r]=t[o],t[o]=a}let e=new Uint8Array(512);for(let r=0;r<512;r++)e[r]=t[r&255];let i=new Float32Array(256),s=new Float32Array(256);for(let r=0;r<256;r++){let o=n()*Math.PI*2;i[r]=Math.cos(o),s[r]=Math.sin(o)}return function(r,o){let a=Math.floor(r),l=Math.floor(o),c=r-a,h=o-l,u=a&255,d=l&255,f=e[u+e[d]],g=e[u+1+e[d]],x=e[u+e[d+1]],m=e[u+1+e[d+1]],p=i[f]*c+s[f]*h,w=i[g]*(c-1)+s[g]*h,_=i[x]*c+s[x]*(h-1),y=i[m]*(c-1)+s[m]*(h-1),C=Df(c),A=Df(h),I=p+(w-p)*C,D=_+(y-_)*C;return(I+(D-I)*A)*1.41}}function Js(n,t,e,i=4){let s=0,r=1,o=1,a=0;for(let l=0;l<i;l++)s+=n(t*o,e*o)*r,a+=r,r*=.5,o*=2.03;return s/a}var mt={DEEP:0,SHALLOW:1,SAND:2,GRASS:3,FOREST:4,HILLS:5,MOUNTAIN:6},Ks=[{name:"Deep Sea",color:1925002},{name:"Shallows",color:5224644},{name:"Beach",color:15324832},{name:"Grassland",color:9223506},{name:"Forest",color:6987586},{name:"Hills",color:11641466},{name:"Mountain",color:9407108}],In=n=>n<=mt.SHALLOW,Re=n=>n>=mt.SAND,Bn=n=>n>=mt.SAND&&n!==mt.MOUNTAIN,S={R:0,count:0,seed:0,q:null,r:null,x:null,z:null,h:null,type:null,bld:null,road:null,conn:null,ruin:null,nbr:null,lookup:null,center:0,land:[],coast:[],edge:[],landing:[],shore:[],version:0};function kh(n,t){let e=S.R;return n<-e||n>e||t<-e||t>e||n+t<-e||n+t>e?-1:S.lookup[(n+e)*(2*e+1)+(t+e)]}var Oh={q:0,r:0};function tn(n,t){return Lf(n,t,Oh),kh(Oh.q,Oh.r)}function js(n,t){let e=tn(n,t);return e<0?0:Re(S.type[e])?S.h[e]:0}function Wr(n,t){let e=0;for(let i=0;i<6;i++){let s=S.nbr[n*6+i];s>=0&&t(S.type[s],s)&&e++}return e}function Bh(n,t=24){S.R=t,S.seed=n;let e=[];for(let C=-t;C<=t;C++)for(let A=-t;A<=t;A++)Math.abs(C+A)<=t&&e.push(C,A);let i=e.length/2;S.count=i,S.q=new Int16Array(i),S.r=new Int16Array(i),S.x=new Float32Array(i),S.z=new Float32Array(i),S.h=new Float32Array(i),S.type=new Uint8Array(i),S.bld=new Int32Array(i),S.road=new Uint8Array(i),S.conn=new Uint8Array(i),S.ruin=new Uint8Array(i),S.nbr=new Int32Array(i*6),S.lookup=new Int32Array((2*t+1)*(2*t+1)).fill(-1);for(let C=0;C<i;C++){let A=e[C*2],I=e[C*2+1];S.q[C]=A,S.r[C]=I,S.x[C]=Fh(A,I),S.z[C]=zh(A,I),S.lookup[(A+t)*(2*t+1)+(I+t)]=C}for(let C=0;C<i;C++)for(let A=0;A<6;A++)S.nbr[C*6+A]=kh(S.q[C]+Vr[A][0],S.r[C]+Vr[A][1]);S.center=kh(0,0);let s=Uf(n),r=Gr(s),o=Gr(s),a=Gr(s),l=Gr(s),c=new Float32Array(i),h=new Float32Array(i),u=new Float32Array(i),d=t*1.5*.6,f=0;for(let C=0;C<6;C++){f=0;for(let A=0;A<i;A++){let I=S.x[A],D=S.z[A],T=I+Js(l,I*.045,D*.045,2)*7,M=D+Js(l,I*.045+31.7,D*.045-12.3,2)*7,U=Math.hypot(T,M)/d;c[A]=1-U*U*.9-U*.15+Js(r,T*.085,M*.085,4)*.45,h[A]=Js(o,I*.1+5.1,D*.1-3.3,3),u[A]=1-Math.abs(Js(a,I*.065,D*.065,4))*2.2,c[A]>0&&f++}if(f<420)d*=1.08;else if(f>900)d*=.93;else break}let g=.12,x=.8,m=.93;for(let C=0;C<8;C++){let A=0,I=0,D=0,T=0;for(let U=0;U<i;U++){if(c[U]<=0){S.type[U]=mt.DEEP;continue}T++;let G=kn(S.q[U],S.r[U],0,0)<=2,k=mt.GRASS;G||(u[U]>m&&c[U]>.42?k=mt.MOUNTAIN:u[U]>x&&c[U]>.22?k=mt.HILLS:h[U]>g&&(k=mt.FOREST)),S.type[U]=k,k===mt.FOREST?A++:k===mt.HILLS?I++:k===mt.MOUNTAIN&&D++}let M=!0;if(A<T*.16?(g-=.07,M=!1):A>T*.34&&(g+=.06,M=!1),I<T*.07?(x-=.05,M=!1):I>T*.18&&(x+=.03,M=!1),D<T*.02?(m-=.025,M=!1):D>T*.07&&(m+=.015,M=!1),M)break}let p=new Uint8Array(i),w=[S.center];for(p[S.center]=1,S.type[S.center]=mt.GRASS;w.length;){let C=w.pop();for(let A=0;A<6;A++){let I=S.nbr[C*6+A];I>=0&&!p[I]&&Re(S.type[I])&&(p[I]=1,w.push(I))}}for(let C=0;C<i;C++)Re(S.type[C])&&!p[C]&&(S.type[C]=mt.DEEP);for(let C=0;C<i;C++)kn(S.q[C],S.r[C],0,0)>=t-4&&(S.type[C]=mt.DEEP);for(let C=0;C<i;C++){if(!Re(S.type[C])||S.type[C]===mt.MOUNTAIN||kn(S.q[C],S.r[C],0,0)<=2)continue;let A=0;for(let I=0;I<6;I++){let D=S.nbr[C*6+I];(D<0||!Re(S.type[D]))&&A++}A>0&&(c[C]<.3||S.type[C]!==mt.HILLS)&&We(C,n)<.82&&(S.type[C]=mt.SAND)}let _=new Int16Array(i).fill(999),y=[];for(let C=0;C<i;C++)Re(S.type[C])&&(_[C]=0,y.push(C));for(let C=0;C<y.length;C++){let A=y[C];for(let I=0;I<6;I++){let D=S.nbr[A*6+I];D>=0&&_[D]>_[A]+1&&(_[D]=_[A]+1,y.push(D))}}for(let C=0;C<i;C++)Re(S.type[C])||(S.type[C]=_[C]<=2?mt.SHALLOW:mt.DEEP);for(let C=0;C<i;C++){let A=S.type[C],I=We(C,n+7)-.5,D;switch(A){case mt.DEEP:D=-1.4;break;case mt.SHALLOW:D=-.5;break;case mt.SAND:D=.16+I*.04;break;case mt.GRASS:D=.3+Math.max(0,c[C]-.3)*.22+I*.05;break;case mt.FOREST:D=.32+Math.max(0,c[C]-.3)*.22+I*.05;break;case mt.HILLS:D=.62+Math.max(0,u[C]-x)*2+I*.08;break;case mt.MOUNTAIN:D=1.05+Math.max(0,u[C]-m)*9+I*.15;break}A>=mt.SAND&&A<=mt.HILLS&&(D=Math.round(D/.06)*.06),S.h[C]=Math.min(D,2.4)}Y_(),S.version++}function Y_(){S.land=[],S.coast=[],S.edge=[],S.landing=[],S.shore=[];for(let n=0;n<S.count;n++){let t=S.type[n];if(Re(t)){S.land.push(n);for(let e=0;e<6;e++){let i=S.nbr[n*6+e];if(i>=0&&In(S.type[i])){S.coast.push(n);break}}}else{kn(S.q[n],S.r[n],0,0)===S.R&&S.edge.push(n);for(let e=0;e<6;e++){let i=S.nbr[n*6+e];if(i>=0&&Re(S.type[i])){S.shore.push(n);break}}for(let e=0;e<6;e++){let i=S.nbr[n*6+e];if(i>=0&&Bn(S.type[i])){S.landing.push(n);break}}}}}function Nf(n,t){let e=3+Math.floor(We(n,11)*3);for(let i=0;i<e;i++){let s=We(n,20+i)*Math.PI*2,r=.18+We(n,40+i)*.5;t.push(S.x[n]+Math.cos(s)*r,S.h[n],S.z[n]+Math.sin(s)*r,.75+We(n,60+i)*.55,We(n,80+i))}}var Ff=new oe,zf=new Qe,Of=new Ve,Xr=new N,$_=new N,Ia=new Wt,L={wall:15853523,wall2:14733488,brick:10111546,roofRed:11817018,roofDark:7223854,roofBlue:4154280,roofGreen:5208644,wood:9660479,wood2:10976335,woodDark:6045479,stone:12433064,stoneDark:9143932,plaza:14076850,concrete:11448488,concreteDark:8356476,metal:5067351,metalDark:3093303,metalLight:10134443,olive:7305798,oliveDark:5133874,gun:6253391,sandbag:12890236,soil:8018490,field:14926684,fieldG:10275676,white:15987694,red:12728878,blue:3829720,glass:10474220,dark:2237738,copper:7319188,snow:16054010,rock:9341572,rockDark:7301990,leaf:4164154,leaf2:5742917,trunk:7031342,asphalt:4869456,yellow:15253568,skin:14726284,eHull:4935767,eDeck:8027519,eCabin:9277845,eRed:11743274,eOlive:5857343,eTroop:9386544,ePlane:8141616,ePlane2:6053731,aPlane:5076164,aPlane2:14212582,aTroop:3957429},ee=class{constructor(){this.p=[],this.c=[]}add(t,e,i=0,s=0,r=0,o=0,a=0,l=0,c=1,h=1,u=1){let d=t.index?t.toNonIndexed():t,f=d.attributes.position;Of.set(o,a,l,"YXZ"),zf.setFromEuler(Of),Ff.compose(Xr.set(i,s,r),zf,$_.set(c,h,u)),Ia.setHex(e);for(let g=0;g<f.count;g++)Xr.fromBufferAttribute(f,g).applyMatrix4(Ff),this.p.push(Xr.x,Xr.y,Xr.z),this.c.push(Ia.r,Ia.g,Ia.b);return d!==t&&d.dispose(),t.dispose(),this}box(t,e,i,s,r=0,o=0,a=0,l=0,c=0,h=0){return this.add(new An(t,e,i),s,r,o+e/2,a,c,l,h)}boxC(t,e,i,s,r,o,a,l=0,c=0,h=0){return this.add(new An(t,e,i),s,r,o,a,l,c,h)}cyl(t,e,i,s,r,o=0,a=0,l=0,c=0){return this.add(new Rn(t,e,i,s),r,o,a+i/2,l,0,c,0)}cylC(t,e,i,s,r,o,a,l,c=0,h=0,u=0){return this.add(new Rn(t,e,i,s),r,o,a,l,c,h,u)}cone(t,e,i,s,r=0,o=0,a=0,l=0){return this.add(new On(t,e,i),s,r,o+e/2,a,0,l,0)}sphere(t,e,i,s,r,o=8,a=6,l=1,c=1,h=1){return this.add(new ls(t,o,a),e,i,s,r,0,0,0,l,c,h)}dome(t,e,i,s,r,o=10){return this.add(new ls(t,o,4,0,Math.PI*2,0,Math.PI/2),e,i,s,r)}raw(t,e,i=0,s=0,r=0,o=0,a=0,l=0){let c=new Ae;return c.setAttribute("position",new ae(t,3)),this.add(c,e,i,s,r,o,a,l)}gable(t,e,i,s,r=0,o=0,a=0,l=0){let c=t/2,h=e/2,u=i,d=[-c,0,-h],f=[c,0,-h],g=[c,0,h],x=[-c,0,h],m=[-c,u,0],p=[c,u,0],w=[...d,...p,...f,...d,...m,...p,...x,...g,...p,...x,...p,...m,...d,...x,...m,...f,...p,...g];return this.raw(w,s,r,o,a,0,l,0)}pyramid(t,e,i,s,r=0,o=0,a=0,l=0){let c=t/2,h=e/2,u=[-c,0,-h],d=[c,0,-h],f=[c,0,h],g=[-c,0,h],x=[0,i,0],m=[...u,...x,...d,...d,...x,...f,...f,...x,...g,...g,...x,...u];return this.raw(m,s,r,o,a,0,l,0)}geo(){let t=new Ae;return t.setAttribute("position",new ae(this.p,3)),t.setAttribute("color",new ae(this.c,3)),t.computeVertexNormals(),t.computeBoundingSphere(),t}};function Pa(n,t,e,i=.28){let s=n/2,r=t/2,o=new Lr;o.moveTo(-r*.78,s),o.lineTo(r*.78,s),o.lineTo(r,s*.55),o.lineTo(r,-s*(1-2*i)),o.lineTo(r*.5,-s*.86),o.lineTo(0,-s),o.lineTo(-r*.5,-s*.86),o.lineTo(-r,-s*(1-2*i)),o.lineTo(-r,s*.55),o.closePath();let a=new ya(o,{depth:e,bevelEnabled:!1});return a.rotateX(-Math.PI/2),a}function Hh(n,t,e,i,s=-1){for(let r=0;r<i;r++){if(r===s)continue;let o=r/i*Math.PI*2;n.box(t*.75,.13,.11,L.sandbag,Math.cos(o)*t,e,Math.sin(o)*t,-o-Math.PI/2)}}function La(n,t,e,i,s,r=1){n.box(.1*r,.15*r,.07*r,t,e,i,s),n.sphere(.045*r,L.skin,e,i+.19*r,s,6,4),n.dome(.05*r,t,e,i+.2*r,s,6)}function Vh(n,t,e,i=1){n.cyl(.025*i,.035*i,.1*i,5,L.trunk,t,0,e),n.cone(.13*i,.26*i,6,L.leaf,t,.08*i,e)}function Z_(){let n=new ee;n.cyl(.84,.88,.12,6,L.stone),n.box(1,.42,.6,L.wall,.06,.12,.08),n.gable(1.1,.72,.3,L.roofBlue,.06,.54,.08),n.box(.16,.24,.02,L.woodDark,.06,.12,.39);for(let t of[-.3,-.12,.24,.42])n.box(.1,.13,.02,L.glass,t,.28,.39);return n.box(.34,.04,.16,L.stoneDark,.06,.12,.46),n.box(.3,.95,.3,L.wall2,-.36,.12,-.3),n.box(.34,.06,.34,L.stoneDark,-.36,1.07,-.3),n.pyramid(.36,.36,.32,L.roofBlue,-.36,1.13,-.3),n.cylC(.08,.08,.02,10,L.white,-.36,.85,-.14,Math.PI/2),n.cylC(.012,.012,.5,4,L.metalDark,-.36,1.66,-.3),n.box(.24,.14,.012,L.blue,-.23,1.72,-.3),n.geo()}function kf(n){let t=new ee,e=n===2?.56:.34;return t.box(.58,e,.44,L.wall,-.1,0,-.06),t.gable(.68,.56,.26,n===2?L.roofBlue:L.roofRed,-.1,e,-.06),t.box(.08,.22,.08,L.brick,.08,e+.06,-.14),t.box(.12,.2,.02,L.woodDark,-.1,0,.165),t.box(.1,.1,.02,L.glass,-.3,.14,.165),t.box(.1,.1,.02,L.glass,.1,.14,.165),n===2&&(t.box(.1,.1,.02,L.glass,-.3,.38,.165),t.box(.1,.1,.02,L.glass,.1,.38,.165),t.box(.1,.1,.02,L.glass,-.1,.38,.165)),t.box(.26,.22,.26,L.wall2,.36,0,.28),t.gable(.3,.32,.14,L.roofDark,.36,.22,.28,Math.PI/2),t.box(.3,.06,.04,L.wood,-.42,0,.42,.5),Vh(t,-.46,.3,.9),t.geo()}function J_(){let n=new ee;n.box(.78,.02,1.02,L.soil,.26,0,0);for(let t=0;t<4;t++)n.box(.14,.05,.94-(t===3?.3:0),t%2?L.fieldG:L.field,0+t*.18,.02,0);return n.box(.38,.3,.46,L.red,-.42,0,-.18),n.gable(.54,.44,.18,L.roofDark,-.42,.3,-.18,Math.PI/2),n.box(.16,.18,.02,L.white,-.42,0,.055),n.cyl(.1,.1,.52,8,L.metalLight,-.45,0,.3),n.dome(.1,L.roofDark,-.45,.52,.3,8),n.geo()}function K_(){let n=new ee;n.box(.7,.06,.5,L.wood,0,-.02,.05),n.box(.26,.05,1.25,L.wood2,.05,-.02,.9);for(let t of[.6,1.05,1.45])for(let e of[-.08,.18])n.cyl(.025,.025,.55,5,L.woodDark,e,-.55,t);return n.box(.36,.26,.3,L.wood,-.24,.04,-.3),n.gable(.42,.38,.14,L.roofRed,-.24,.3,-.3),n.box(.12,.12,.12,L.woodDark,.25,.04,-.25),n.cyl(.05,.05,.12,6,L.wood,.3,.04,-.05),n.add(Pa(.5,.18,.09),L.white,.38,-.25,1.1),n.box(.1,.08,.12,L.red,.38,-.16,1.05),n.geo()}function j_(){let n=new ee;n.box(.42,.28,.34,L.woodDark,-.22,0,-.22),n.gable(.5,.42,.16,L.roofGreen,-.22,.28,-.22);for(let[t,e]of[[.08,0],[.22,0],[.36,0],[.15,.12],[.29,.12]])n.cylC(.065,.065,.62,7,L.wood2,.12,e+.065,t,0,0,Math.PI/2);return n.cyl(.08,.09,.1,7,L.wood,-.35,0,.3),n.box(.02,.16,.02,L.metalDark,-.33,.1,.3,0,.4),Vh(n,.45,-.35,1.1),Vh(n,.25,-.5,.9),n.geo()}function Q_(){let n=new ee;n.box(.8,.1,.7,L.stoneDark,.05,0,0),n.box(.58,.14,.5,L.stone,.12,.1,-.06),n.box(.36,.14,.32,L.stoneDark,.18,.24,-.12);for(let[t,e,i]of[[-.4,.3,1],[-.25,.42,.8],[.45,.4,.9],[-.45,.1,.7]])n.box(.13*i,.11*i,.13*i,L.stone,t,0,e,t*3);return n.box(.04,.6,.04,L.woodDark,-.3,0,-.32),n.boxC(.5,.035,.035,L.wood,-.1,.58,-.32,0,0,-.25),n.cylC(.006,.006,.3,3,L.dark,.12,.38,-.32),n.box(.08,.08,.08,L.stone,.12,.18,-.32),n.box(.3,.2,.24,L.wood,-.38,0,-.05),n.geo()}function tM(){let n=new ee;return n.sphere(.5,L.rockDark,-.05,.02,-.15,7,4,1.1,.55,.9),n.box(.28,.26,.12,L.dark,0,0,.3),n.box(.05,.3,.05,L.wood,-.17,0,.36),n.box(.05,.3,.05,L.wood,.17,0,.36),n.box(.42,.06,.06,L.wood,0,.28,.36),n.box(.03,.02,.5,L.metal,-.06,0,.6),n.box(.03,.02,.5,L.metal,.06,0,.6),n.box(.2,.12,.16,L.metalLight,0,.03,.62),n.cone(.1,.1,5,L.dark,0,.15,.62),n.box(.04,.7,.04,L.woodDark,.32,0,-.1,0,0,.12),n.box(.04,.7,.04,L.woodDark,.5,0,-.1,0,0,-.12),n.cylC(.1,.1,.03,10,L.metal,.41,.66,-.1,Math.PI/2),n.cone(.12,.12,5,L.rockDark,-.42,0,.35),n.geo()}function eM(){let n=new ee;n.cyl(.8,.82,.04,6,L.plaza);let t=[[-.35,-.25,L.red],[.35,-.2,L.yellow],[0,.38,L.blue]];for(let[e,i,s]of t){for(let r of[-.15,.15])for(let o of[-.12,.12])n.box(.025,.24,.025,L.woodDark,e+r,.04,i+o);n.pyramid(.42,.34,.14,s,e,.28,i),n.box(.3,.1,.2,L.wood2,e,.04,i)}return n.cyl(.08,.1,.12,8,L.stoneDark,.05,.04,-.02),n.box(.1,.1,.1,L.wood,-.55,.04,.2),n.cyl(.05,.05,.12,6,L.wood,.55,.04,.2),n.geo()}function nM(){let n=new ee;n.box(1.08,.08,.86,L.stone,0,0,0),n.box(.92,.44,.52,L.wall,0,.08,-.08);for(let t=0;t<6;t++)n.cyl(.035,.04,.4,6,L.white,-.38+t*.152,.08,.28);return n.box(.96,.05,.22,L.wall2,0,.48,.24),n.gable(.98,.7,.16,L.roofDark,0,.52,-.05),n.cyl(.2,.2,.14,10,L.wall2,0,.62,-.08),n.dome(.21,L.copper,0,.76,-.08,12),n.cyl(.015,.015,.2,4,L.metalDark,0,.95,-.08),n.box(.14,.2,.02,L.woodDark,0,.08,.19),n.geo()}function iM(){let n=new ee;n.box(.95,.3,.42,L.olive,0,0,-.18),n.gable(1.02,.52,.18,L.oliveDark,0,.3,-.18),n.box(.14,.2,.02,L.woodDark,.1,0,.035);for(let t of[-.35,-.15,.32])n.box(.1,.08,.02,L.glass,t,.14,.035);n.box(.95,.02,.5,L.sandbag,0,0,.3);for(let t of[-.36,-.12,.12,.36])n.box(.2,.1,.1,L.sandbag,t,.02,.55);return n.cyl(.012,.012,.8,4,L.metalDark,-.42,0,.3),n.box(.22,.13,.012,L.blue,-.3,.64,.3),n.box(.12,.1,.1,L.wood,.4,.02,.3),n.geo()}function sM(){let n=new ee;return n.cyl(.42,.46,.06,8,L.soil),Hh(n,.37,.06,9),Hh(n,.37,.19,9,0),n.box(.12,.08,.08,L.olive,-.15,.06,-.12),n.geo()}function rM(){let n=new ee;return n.cyl(.02,.03,.1,5,L.metalDark,0,0,0),n.box(.07,.07,.24,L.metalDark,0,.1,.04),n.cylC(.016,.016,.24,5,L.metal,0,.135,.27,Math.PI/2),n.box(.18,.12,.02,L.gun,0,.06,.12),La(n,L.aTroop,0,-.02,-.14,.9),n.geo()}function oM(){let n=new ee;return n.cyl(.6,.68,.3,8,L.concrete),n.cyl(.5,.5,.04,8,L.concreteDark,0,.3,0,Math.PI/8),n.box(.2,.1,.14,L.olive,-.42,.3,.1),n.box(.28,.16,.06,L.dark,0,.08,.62),n.geo()}function aM(){let n=new ee;return n.box(.44,.22,.5,L.gun,0,0,-.06),n.box(.36,.14,.1,L.gun,0,.02,.22),n.box(.16,.06,.16,L.oliveDark,-.08,.22,-.12),n.cylC(.055,.068,.76,8,L.metal,0,.11,.56,Math.PI/2),n.cylC(.078,.078,.08,8,L.metalDark,0,.11,.92,Math.PI/2),n.geo()}function lM(){let n=new ee;return n.cyl(.52,.56,.14,10,L.concrete),Hh(n,.48,.14,11),n.box(.14,.1,.1,L.olive,.3,.14,-.25),n.box(.14,.1,.1,L.olive,-.3,.14,-.25),n.geo()}function cM(){let n=new ee;n.cyl(.16,.2,.12,8,L.gun),n.box(.3,.14,.22,L.gun,0,.1,0);for(let t of[-.07,.07])n.cylC(.03,.036,.62,6,L.metal,t,.4,.22,Math.PI/4);return n.box(.08,.06,.08,L.metalDark,.18,.12,-.06),La(n,L.aTroop,-.18,0,-.14,.9),n.geo()}function hM(){let n=new ee;return n.cyl(.6,.64,.08,6,L.concrete),n.box(.3,.18,.18,L.olive,-.35,.08,-.3),n.cylC(.07,.07,.36,8,L.white,.38,.17,-.3,0,0,Math.PI/2),n.cylC(.07,.07,.36,8,L.white,.38,.17,-.12,0,0,Math.PI/2),n.geo()}function uM(){let n=new ee;n.cyl(.18,.22,.1,8,L.olive),n.boxC(.42,.26,.6,L.olive,0,.3,.05,-Math.PI/6);for(let t of[-.1,.1])for(let e of[-.06,.06])n.add(new On(.05,.12,6),L.red,t,.45+e*.87,.34-e*.5,Math.PI/3);return n.geo()}function dM(){let n=new ee;return n.box(.42,.28,.4,L.wall2,-.25,0,.2),n.box(.46,.04,.44,L.concreteDark,-.25,.28,.2),n.cyl(.05,.12,.56,4,L.metal,.05,0,-.1,Math.PI/4),n.box(.1,.1,.1,L.metalDark,.05,.5,-.1),n.geo()}function fM(){let n=new ee;return n.cylC(.34,.06,.1,12,L.white,0,.18,0,Math.PI/2-.35),n.cylC(.012,.012,.3,4,L.metalDark,0,.2,.16,Math.PI/2-.35),n.box(.06,.12,.06,L.metalDark,0,0,0),n.geo()}function pM(){let n=new ee;n.cyl(.84,.86,.025,6,L.concreteDark),n.box(.48,.035,1.62,L.asphalt,.18,0,0);for(let t=0;t<5;t++)n.box(.04,.04,.15,L.white,.18,0,-.64+t*.32);return n.add(new Rn(.25,.25,.52,9,1,!1,0,Math.PI),L.metalLight,-.4,.02,.18,0,Math.PI/2,Math.PI/2),n.box(.12,.42,.12,L.wall2,-.42,0,-.42),n.box(.18,.1,.18,L.glass,-.42,.42,-.42),n.box(.2,.03,.2,L.metalDark,-.42,.52,-.42),n.geo()}function mM(){let n=new ee;return n.add(Pa(1,.36,.17),L.eHull,0,-.07,0),n.box(.26,.02,.62,L.eDeck,0,.1,-.05),n.box(.22,.15,.26,L.eCabin,0,.1,-.12),n.box(.18,.05,.02,L.glass,0,.18,.015),n.cyl(.045,.06,.06,6,L.metalDark,0,.1,.24),n.cylC(.018,.02,.24,5,L.metalDark,0,.16,.36,Math.PI/2),n.cylC(.008,.008,.3,3,L.metalDark,0,.36,-.2),n.box(.12,.07,.01,L.eRed,.06,.44,-.2),n.geo()}function gM(){let n=new ee;n.box(.5,.17,.92,L.eOlive,0,-.08,0),n.box(.46,.04,.84,L.eDeck,0,.06,0),n.box(.04,.1,.84,L.eOlive,-.23,.09,0),n.box(.04,.1,.84,L.eOlive,.23,.09,0),n.boxC(.5,.18,.04,L.eOlive,0,.12,.47,-.25),n.box(.2,.16,.16,L.eCabin,0,.09,-.36);for(let t of[-.1,.1])for(let e of[-.1,.1,.28])La(n,L.eTroop,t,.1,e,.75);return n.geo()}function xM(){let n=new ee;return n.add(Pa(2,.44,.2),L.eHull,0,-.08,0),n.box(.36,.02,1.5,L.eDeck,0,.12,-.12),n.box(.3,.2,.46,L.eCabin,0,.12,.18),n.box(.22,.14,.26,L.eCabin,0,.32,.22),n.box(.2,.04,.02,L.glass,0,.4,.35),n.cyl(.08,.09,.3,8,L.eHull,0,.14,-.22),n.box(.17,.03,.17,L.dark,0,.44,-.22),n.cylC(.012,.012,.6,4,L.metalDark,0,.6,.12),n.box(.2,.02,.02,L.metalDark,0,.75,.12),Bf(n,.62,1.1),Bf(n,-.62,1.1,Math.PI),n.box(.12,.08,.01,L.eRed,.06,.82,.12),n.geo()}function Bf(n,t,e,i=0){n.cyl(.08*e,.1*e,.05*e,7,L.eCabin,0,.12,t),n.box(.16*e,.09*e,.18*e,L.eCabin,0,.16,t);for(let s of[-.03,.03])n.cylC(.016*e,.02*e,.26*e,5,L.metalDark,s*e,.21,t+Math.cos(i)*.2*e,Math.PI/2)}function vM(){let n=new ee;n.add(Pa(3,.68,.26),L.eHull,0,-.1,0),n.box(.58,.02,2.3,L.eDeck,0,.16,-.15),n.box(.46,.22,.9,L.eCabin,0,.16,-.05),n.box(.32,.26,.36,L.eCabin,0,.38,.12),n.box(.22,.2,.2,L.eCabin,0,.64,.14),n.box(.24,.04,.02,L.glass,0,.74,.25),n.cyl(.1,.11,.42,8,L.eHull,0,.38,-.25),n.cyl(.09,.1,.36,8,L.eHull,0,.38,-.52),n.cylC(.015,.015,.7,4,L.metalDark,0,1.05,.1),n.box(.3,.025,.025,L.metalDark,0,1.2,.1),n.box(.16,.1,.01,L.eRed,.08,1.3,.1);for(let[t,e]of[[.9,0],[.55,0],[-.95,Math.PI]]){n.cyl(.15,.17,.06,8,L.eCabin,0,.16,t),n.box(.28,.13,.3,L.eCabin,0,.21,t);for(let i of[-.07,0,.07])n.cylC(.022,.028,.42,5,L.metalDark,i,.28,t+Math.cos(e)*.32,Math.PI/2)}return n.geo()}function Wf(n,t,e=.12,i=0,s=0){n.cylC(e,e,.012,8,L.dark,i,s,t,Math.PI/2)}function Hf(n,t,e){let i=new ee;i.cylC(.075,.05,.8,7,n,0,0,0,Math.PI/2),i.cylC(.06,.075,.12,7,t,0,0,.44,Math.PI/2),i.box(1.04,.026,.2,n,0,-.04,.05),i.box(.38,.02,.1,n,0,0,-.36),i.box(.02,.15,.13,n,0,.02,-.36),i.box(.1,.06,.18,L.glass,0,.06,.04);for(let s of[-.36,.36])i.cylC(.055,.055,.03,8,e,s,-.035,.05);return Wf(i,.5,.13),i.geo()}function yM(){let n=new ee;n.cylC(.14,.09,1.55,8,L.ePlane2,0,0,0,Math.PI/2),n.sphere(.13,L.glass,0,0,.76,7,5,1,1,1.2),n.box(2.3,.045,.34,L.ePlane2,0,.02,.15),n.box(.8,.03,.18,L.ePlane2,0,.05,-.68),n.box(.03,.32,.24,L.ePlane2,0,.05,-.68);for(let t of[-.85,-.45,.45,.85])n.cylC(.065,.06,.28,7,L.eHull,t,0,.3,Math.PI/2),Wf(n,.45,.13,t,0);for(let t of[-.7,.7])n.cylC(.08,.08,.05,8,L.eRed,t,-0,.1);return n.geo()}function _M(){let n=new ee;n.cylC(.05,.1,1.1,7,L.ePlane2,0,0,0,Math.PI/2),n.add(new On(.05,.22,7),L.ePlane2,0,0,.66,Math.PI/2);let t=[0,0,.28,.62,0,-.42,-.62,0,-.42],e=[0,0,.28,-.62,0,-.42,.62,0,-.42];n.raw(t,L.ePlane,0,0,0),n.raw(e,L.ePlane,0,-.01,0),n.box(.02,.24,.24,L.ePlane,0,.04,-.42),n.box(.08,.06,.2,L.glass,0,.07,.22);for(let i of[-.32,.32])n.cylC(.05,.05,.02,8,L.eRed,i,.005,-.2);return n.geo()}function Vf(n){let t=new ee;return La(t,n,0,0,0,1.25),t.box(.02,.02,.2,L.dark,.06,.12,.06),t.geo()}function MM(){let n=new ee;return n.cyl(.035,.05,.14,5,L.trunk),n.cone(.22,.34,6,L.leaf,0,.1,0),n.cone(.16,.26,6,L.leaf2,0,.29,0),n.geo()}function bM(){let n=new ee;return n.add(new Pr(.17,0),L.rock,0,.06,0,0,0,0,1,.65,1),n.add(new Pr(.1,0),L.rockDark,.18,.03,.1,0,.5,0,1,.7,1),n.geo()}function SM(){let n=new ee;return n.add(new Rn(.34,.86,.8,6),L.rock,0,.4,0),n.add(new On(.34,.45,6),L.snow,0,1.02,0),n.geo()}function wM(){let n=new ee;n.cyl(.7,.72,.02,6,3814964);for(let t=0;t<9;t++){let e=t*2.4,i=.12+t%3*.17;n.boxC(.14+t%2*.08,.07,.12,t%3?L.stoneDark:L.woodDark,Math.cos(e)*i,.05,Math.sin(e)*i,.3*t,e,.2*t)}return n.geo()}function EM(){let n=new ee;return n.add(new On(.12,.26,4),L.red,0,.13,0,Math.PI,0,0),n.sphere(.12,L.red,0,.3,0,8,6),n.sphere(.05,L.white,0,.3,.1,6,4),n.geo()}function TM(){let n=new ee;return n.box(.5,.06,1.4,L.red,0,0,-.5),n.raw([0,.06,1,.7,.06,.2,-.7,.06,.2],L.red),n.geo()}function AM(){let n=new ee;return n.cylC(.045,.045,.2,6,L.dark,0,0,0,Math.PI/2),n.add(new On(.045,.08,6),L.dark,0,0,.14,Math.PI/2),n.box(.12,.012,.04,L.dark,0,0,-.1),n.geo()}function Gf(n){let t=new ee;return t.cylC(.035,.035,.38,6,L.white,0,0,0,Math.PI/2),t.add(new On(.035,.1,6),n,0,0,.24,Math.PI/2),t.box(.13,.01,.06,n,0,0,-.16),t.box(.01,.13,.06,n,0,0,-.16),t.geo()}function Xf(){return{hq:Z_(),house:kf(1),house2:kf(2),farm:J_(),dock:K_(),lumber:j_(),quarry:Q_(),mine:tM(),market:eM(),college:nM(),barracks:iM(),mg:sM(),mg_head:rM(),coastal:oM(),coastal_head:aM(),flak:lM(),flak_head:cM(),missile:hM(),missile_head:uM(),radar:dM(),radar_head:fM(),airfield:pM(),gunboat:mM(),landing:gM(),destroyer:xM(),battleship:vM(),fighter:Hf(L.ePlane,L.ePlane2,L.eRed),bomber:yM(),jet:_M(),infantry:Vf(L.eTroop),soldier:Vf(L.aTroop),ally_fighter:Hf(L.aPlane,L.aPlane2,L.white),tree:MM(),rock:bM(),peak:SM(),rubble:wM(),marker:EM(),arrow:TM(),bomb:AM(),missileP:Gf(L.blue),rocketP:Gf(L.red)}}var qr=["food","wood","stone","iron","gold"],Da={food:"Food",wood:"Wood",stone:"Stone",iron:"Iron",gold:"Gold"},gn=[mt.SAND,mt.GRASS,mt.FOREST,mt.HILLS],RM=[mt.SAND,mt.GRASS,mt.FOREST],le={hq:{name:"Town Hall",icon:"hq",hp:2200,housing:10,jobs:0,terrain:gn,maxLevel:3,upgradeCost:n=>({wood:80*n,stone:120*n,gold:150*n}),weapon:{kind:"mg",range:6.5,dmg:3,rate:4,acc:.8,targets:{ground:1,sea:.8,air:.5},muzzleY:1.05},desc:"The heart of your colony. If it falls, the island is lost. Its rooftop gun gives a little cover."},house:{name:"House",cat:"city",cost:{wood:10,gold:10},hp:150,housing:6,terrain:gn,maxLevel:3,upgradeCost:n=>({wood:20*n,stone:15*n,gold:10*n}),desc:"Homes for 6 citizens (+4 per upgrade). Residents pay taxes and eat food. Needs a road."},farm:{name:"Farm",cat:"city",cost:{wood:15,gold:10},hp:120,jobs:4,terrain:[mt.GRASS],maxLevel:3,upgradeCost:n=>({wood:30*n,stone:10*n,gold:15*n}),desc:"Grows 30 food a minute. Grassland only."},dock:{name:"Fishing Dock",cat:"city",cost:{wood:15,gold:10},hp:120,jobs:2,terrain:[mt.SAND,mt.GRASS],coastal:!0,maxLevel:3,upgradeCost:n=>({wood:25*n,gold:15*n}),desc:"Catches 16 food a minute, plus 2 for each water tile beside it. Must touch the sea."},lumber:{name:"Lumber Camp",cat:"city",cost:{wood:5,gold:15},hp:130,jobs:3,terrain:gn,needsAdj:"forest",maxLevel:3,upgradeCost:n=>({wood:20*n,stone:15*n,gold:10*n}),desc:"Cuts 6 wood a minute plus 6 for each forest tile beside it."},quarry:{name:"Quarry",cat:"city",cost:{wood:20,gold:15},hp:180,jobs:3,terrain:gn,needsAdj:"rock",maxLevel:3,upgradeCost:n=>({wood:30*n,gold:15*n}),desc:"Cuts 4 stone a minute, plus 5 per hill and 7 per mountain beside it, plus 6 if built on hills."},mine:{name:"Iron Mine",cat:"city",cost:{wood:25,stone:15,gold:20},hp:200,jobs:4,terrain:[mt.HILLS],maxLevel:3,upgradeCost:n=>({wood:30*n,stone:30*n,gold:20*n}),desc:"Digs 10 iron a minute, plus 4 per mountain and 2 per hill beside it. Hills only."},market:{name:"Market",cat:"city",cost:{wood:30,stone:20,gold:40},hp:200,jobs:2,terrain:gn,radius:7.5,desc:"Houses within reach pay 50% more tax. Traders here sell wood, stone, iron and food for gold."},college:{name:"War College",cat:"city",cost:{wood:50,stone:50,gold:120},hp:400,jobs:3,terrain:gn,unique:!0,desc:"Unlocks military research (press T). Only one can be built."},mg:{name:"MG Nest",cat:"military",cost:{wood:10,stone:10,gold:25},hp:220,jobs:1,terrain:gn,maxLevel:3,upgradeCost:n=>({wood:15*n,stone:20*n,gold:25*n}),weapon:{kind:"mg",range:6.5,dmg:3.2,rate:6,acc:.8,targets:{ground:1,sea:1,air:.55},headY:.2,muzzle:.32},desc:"Rapid fire at short range. Shreds landing troops and small boats, and can harass low aircraft."},coastal:{name:"Coastal Gun",cat:"military",cost:{wood:10,stone:35,gold:50},hp:420,jobs:2,terrain:gn,maxLevel:3,upgradeCost:n=>({stone:40*n,iron:15*n,gold:40*n}),weapon:{kind:"shell",range:13,dmg:70,rate:1/3,splash:1.6,targets:{sea:1,ground:.8},headY:.32,muzzle:.85,aim:.25},desc:"Heavy artillery. Long range shells that hit ships and troops on the beach. Cannot hit aircraft."},flak:{name:"Flak Cannon",cat:"military",cost:{stone:30,iron:15,gold:40},hp:300,jobs:2,terrain:gn,maxLevel:3,upgradeCost:n=>({stone:30*n,iron:25*n,gold:40*n}),weapon:{kind:"flak",range:11,dmg:22,rate:1.1,splash:2.1,targets:{air:1},headY:.3,muzzle:.5,aim:.5},desc:"Anti-aircraft gun. Its airburst shells damage every plane caught in the blast."},barracks:{name:"Barracks",cat:"military",cost:{wood:30,stone:25,gold:50},hp:420,jobs:4,terrain:gn,maxLevel:3,upgradeCost:n=>({wood:30*n,stone:30*n,gold:40*n}),units:4,guard:15,desc:"Trains marines (4, +2 per upgrade) that hunt down enemy landing parties near the barracks."},radar:{name:"Radar Station",cat:"military",cost:{stone:40,iron:30,gold:60},hp:250,jobs:2,terrain:gn,requires:"radar",radius:11,weapon:null,spin:!0,headY:.55,desc:"Weapons within reach get +20% range. Reveals what every raid is bringing and where it will come from."},missile:{name:"Missile Battery",cat:"military",cost:{stone:40,iron:60,gold:120},hp:360,jobs:3,terrain:gn,requires:"rocketry",maxLevel:3,upgradeCost:n=>({stone:30*n,iron:50*n,gold:80*n}),weapon:{kind:"missile",range:17,dmg:130,rate:.25,splash:1.2,targets:{air:1,sea:1},headY:.28,muzzle:.3,aim:.6},desc:"Guided missiles with the longest reach on the island. Hits ships and aircraft."},airfield:{name:"Airfield",cat:"military",cost:{wood:60,stone:80,iron:50,gold:150},hp:520,jobs:6,terrain:RM,requires:"aviation",maxLevel:3,upgradeCost:n=>({stone:60*n,iron:60*n,gold:100*n}),units:3,desc:"Home to interceptor fighters (3, +1 per upgrade) that chase down bombers and strafe ships."}},Gh={city:["house","farm","dock","lumber","quarry","mine","market","college"],military:["mg","coastal","flak","barracks","radar","missile","airfield"]},us=Object.keys(le),ui={gold:2},Pn={gunboat:{name:"Gunboat",domain:"sea",hp:80,speed:2.6,turn:1.6,range:7,dmg:8,rate:.7,splash:.7,bounty:8,cost:6,minWave:1,weight:3,radius:.6},landing:{name:"Landing Craft",domain:"sea",hp:110,speed:2.2,turn:1.4,troops:3,bounty:10,cost:8,minWave:1,weight:2.2,radius:.6},destroyer:{name:"Destroyer",domain:"sea",hp:460,speed:1.8,turn:.9,range:11,dmg:32,rate:.33,splash:1.1,bounty:30,cost:22,minWave:5,weight:1.6,radius:1},battleship:{name:"Battleship",domain:"sea",hp:2e3,speed:1.1,turn:.5,range:15,dmg:55,rate:.5,splash:1.5,bounty:200,cost:110,minWave:10,weight:0,radius:1.5},fighter:{name:"Dive Bomber",domain:"air",hp:70,speed:7,turn:1.4,alt:5,bombs:2,bombDmg:55,splash:1.3,bounty:12,cost:8,minWave:3,weight:2.4,radius:.6},bomber:{name:"Heavy Bomber",domain:"air",hp:340,speed:4.4,turn:.5,alt:8,bombs:8,bombDmg:36,splash:1.4,bounty:40,cost:30,minWave:7,weight:1.1,radius:1.2},jet:{name:"Strike Jet",domain:"air",hp:150,speed:12,turn:1.3,alt:6,rockets:4,rocketDmg:40,splash:1,bounty:30,cost:26,minWave:12,weight:1.3,radius:.6},infantry:{name:"Marine Raider",domain:"ground",hp:35,speed:1.3,range:2.4,dmg:5,rate:1,bounty:2,radius:.3}},Yr={soldier:{hp:70,speed:1.7,range:2.6,dmg:7,rate:1},fighter:{hp:110,speed:8,turn:2.3,range:3.4,dmg:4,rate:8,acc:.65}},Qs=25,qf=150,Yf=75,Wh=[{id:"ballistics",name:"Ballistics",max:3,cost:n=>({gold:60+60*n,iron:15+20*n}),desc:"+20% damage for every weapon, per level."},{id:"optics",name:"Rangefinders",max:2,cost:n=>({gold:90+80*n,iron:25+25*n}),desc:"+12% range for every weapon, per level."},{id:"loaders",name:"Autoloaders",max:3,cost:n=>({gold:70+60*n,iron:20+20*n}),desc:"+15% rate of fire, per level."},{id:"concrete",name:"Reinforced Concrete",max:2,cost:n=>({gold:50+50*n,stone:60+60*n}),desc:"+35% building health per level, and faster repairs."},{id:"fuzes",name:"Proximity Fuzes",max:1,cost:()=>({gold:150,iron:60}),desc:"Flak hits 30% harder with a 50% wider burst."},{id:"radar",name:"Radar",max:1,cost:()=>({gold:120,iron:40}),desc:"Unlocks the Radar Station."},{id:"rocketry",name:"Rocketry",max:1,req:"radar",cost:()=>({gold:220,iron:90}),desc:"Unlocks the Missile Battery."},{id:"aviation",name:"Aviation",max:1,cost:()=>({gold:250,iron:80,wood:60}),desc:"Unlocks the Airfield and its interceptors."},{id:"jets",name:"Jet Engines",max:1,req:"aviation",cost:()=>({gold:300,iron:120}),desc:"Your fighters fly 40% faster and hit 50% harder."},{id:"drills",name:"Marine Drills",max:2,cost:n=>({gold:60+60*n,food:40+40*n}),desc:"Marines get +40% health and damage per level; barracks hold 2 more."},{id:"crops",name:"Crop Rotation",max:2,cost:n=>({gold:40+40*n,wood:40+30*n}),desc:"+25% food from farms and docks, per level."},{id:"tools",name:"Steel Tools",max:2,cost:n=>({gold:50+50*n,iron:20+20*n}),desc:"+20% wood, stone and iron, per level."},{id:"taxes",name:"Civic Administration",max:2,cost:n=>({gold:80+80*n,stone:40+40*n}),desc:"+20% tax income, per level."},{id:"tenements",name:"Tenements",max:1,cost:()=>({wood:120,stone:80,gold:100}),desc:"Every house holds 3 more residents."}],di=Object.fromEntries(Wh.map(n=>[n.id,n]));function tr(n){let t=e=>n[e]||0;return{dmg:1+.2*t("ballistics"),range:1+.12*t("optics"),rate:1+.15*t("loaders"),bhp:1+.35*t("concrete"),repair:1+.6*t("concrete"),flakDmg:t("fuzes")?1.3:1,flakSplash:t("fuzes")?1.5:1,soldier:1+.4*t("drills"),barracksCap:2*t("drills"),fighterSpeed:t("jets")?1.4:1,fighterDmg:t("jets")?1.5:1,food:1+.25*t("crops"),prod:1+.2*t("tools"),tax:1+.2*t("taxes"),housing:t("tenements")?3:0,unlock:{radar:!!t("radar"),missile:!!t("rocketry"),airfield:!!t("aviation")}}}var v={mode:"menu",time:0,speed:1,paused:!1,seed:1,res:{food:0,wood:0,stone:0,iron:0,gold:0},rates:{food:0,wood:0,stone:0,iron:0,gold:0},pop:0,housing:0,jobs:0,eff:1,effFood:1,starving:!1,growT:0,econT:0,buildings:[],byId:new Map,nextId:1,hq:null,enemies:[],allies:[],projectiles:[],wave:{n:1,state:"prep",timer:0,elapsed:0,plan:null,queue:[],current:0},research:{},mod:tr({}),stats:{kills:0,built:0,lost:0,waves:0,shots:0},victory:!1,selected:null,tool:null,dirty:{connect:!0,roads:!0,trees:!0,terrainColors:!0,minimap:!0}},$f="bastion.settings.v1",he={renderScale:1,shadows:2,msaa:!0,showFps:!1,edgeScroll:!1,volume:.6,...(()=>{try{return JSON.parse(localStorage.getItem($f)||"{}")}catch{return{}}})()};function Ni(){try{localStorage.setItem($f,JSON.stringify(he))}catch{}}var Ua=[];function Fi(n,t="info"){Ua.push({text:n,kind:t})}var q={renderer:null,scene:null,camera:null,sun:null,M:null,pools:{},terrain:null,water:null,ghosts:{},waterTex:null,width:1,height:1,pixelScale:1},Na=class{constructor(t,e,i,s={}){let r=new Cr(t,e,i);r.count=0,r.frustumCulled=!1,r.castShadow=s.cast!==!1,r.receiveShadow=s.receive!==!1,r.instanceMatrix.setUsage(qs),this.hasColor=s.colors!==!1,this.hasColor&&(r.instanceColor=new Di(new Float32Array(i*3).fill(1),3),r.instanceColor.setUsage(qs)),s.order!=null&&(r.renderOrder=s.order),this.mesh=r,this.max=i,this.n=0,this.mArr=r.instanceMatrix.array,this.cArr=this.hasColor?r.instanceColor.array:null,this.extra=null}begin(){this.n=0}put(t,e,i,s=0,r=1,o=1,a=1,l=1,c=1,h=1){if(this.n>=this.max)return-1;let u=this.n*16,d=this.mArr,f=Math.cos(s),g=Math.sin(s);if(d[u]=f*r,d[u+1]=0,d[u+2]=-g*r,d[u+3]=0,d[u+4]=0,d[u+5]=o,d[u+6]=0,d[u+7]=0,d[u+8]=g*a,d[u+9]=0,d[u+10]=f*a,d[u+11]=0,d[u+12]=t,d[u+13]=e,d[u+14]=i,d[u+15]=1,this.cArr){let x=this.n*3;this.cArr[x]=l,this.cArr[x+1]=c,this.cArr[x+2]=h}return this.n++}putMatrix(t,e=1,i=1,s=1){if(this.n>=this.max)return-1;if(t.toArray(this.mArr,this.n*16),this.cArr){let r=this.n*3;this.cArr[r]=e,this.cArr[r+1]=i,this.cArr[r+2]=s}return this.n++}end(){let t=this.mesh;if(t.count=this.n,t.visible=this.n>0,!this.n)return;let e=t.instanceMatrix;if(e.clearUpdateRanges(),e.addUpdateRange(0,this.n*16),e.needsUpdate=!0,this.cArr){let i=t.instanceColor;i.clearUpdateRanges(),i.addUpdateRange(0,this.n*3),i.needsUpdate=!0}if(this.extra){let i=this.extra;i.clearUpdateRanges(),i.addUpdateRange(0,this.n*i.itemSize),i.needsUpdate=!0}}};function jf(n=.08,t=.05,e=4){let i=[],s=[],r=[],o=[],a=[];for(let u=0;u<6;u++){let d=Math.PI/3*u-Math.PI/6,f=Math.cos(d),g=Math.sin(d);r.push([f*(1-n),0,g*(1-n)]),o.push([f,-t,g]),a.push([f,-e,g])}let l=(u,d,f,g,x,m)=>{i.push(...u,...d,...f),s.push(g,g,g,x,x,x,m,m,m)},c=[0,0,0];for(let u=0;u<6;u++){let d=(u+1)%6;l(c,r[d],r[u],1,1,1),l(r[u],r[d],o[d],1,1,.9),l(r[u],o[d],o[u],1,.9,.9),l(o[u],o[d],a[d],.72,.72,.38),l(o[u],a[d],a[u],.72,.38,.38)}let h=new Ae;return h.setAttribute("position",new ae(i,3)),h.setAttribute("color",new ae(s,3)),h.computeVertexNormals(),h}function Zf(n,t){let e=new Fr(n,t,6,1,Math.PI/2,Math.PI*2);return e.rotateX(-Math.PI/2),e}var CM=`
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,IM=`
uniform float uTime;
uniform sampler2D uDist;
uniform vec2 uMapMin;
uniform float uMapSize;
uniform float uMaxDist;
uniform vec3 uShallow, uDeep, uSky, uFoam, uFogColor, uSunDir;
uniform float uFogNear, uFogFar;
varying vec3 vWorld;
void main() {
  vec2 uv = (vWorld.xz - uMapMin) / uMapSize;
  float d = texture2D(uDist, uv).r * uMaxDist;
  float t = uTime;
  vec2 p = vWorld.xz;
  float nx = sin(p.x * 1.7 + t * 1.3) * 0.5 + sin(p.y * 2.3 - t * 1.1 + p.x * 0.7) * 0.35 + sin((p.x + p.y) * 4.1 + t * 2.2) * 0.15;
  float nz = cos(p.y * 1.5 - t * 1.2) * 0.5 + cos(p.x * 2.1 + t * 0.9 - p.y * 0.6) * 0.35 + cos((p.x - p.y) * 3.7 - t * 2.0) * 0.15;
  vec3 N = normalize(vec3(nx * 0.09, 1.0, nz * 0.09));
  vec3 V = normalize(cameraPosition - vWorld);
  float depthMix = smoothstep(0.0, 7.0, d);
  vec3 col = mix(uShallow, uDeep, depthMix);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col = mix(col, uSky, fres * 0.55);
  vec3 H = normalize(V + uSunDir);
  col += pow(max(dot(N, H), 0.0), 180.0) * 0.9 * vec3(1.0, 0.95, 0.85);
  float wave = 0.5 + 0.5 * sin(d * 7.0 - t * 2.4 + nx * 1.5);
  float foam = (1.0 - smoothstep(0.0, 0.5, d)) * 0.85 + (1.0 - smoothstep(0.35, 1.3, d)) * smoothstep(0.62, 0.95, wave) * 0.5;
  col = mix(col, uFoam, clamp(foam, 0.0, 1.0));
  float fogD = length(vWorld - cameraPosition);
  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, fogD));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,zi=-52,Qf=104,ds=9,Hn=256;function tp(){let n=new Uint8Array(Hn*Hn).fill(255),t=new Float32Array(Hn*Hn).fill(ds),e=Qf/Hn;for(let s of S.coast){let r=S.x[s],o=S.z[s],a=Math.max(0,Math.floor((r-ds-1-zi)/e)),l=Math.min(Hn-1,Math.ceil((r+ds+1-zi)/e)),c=Math.max(0,Math.floor((o-ds-1-zi)/e)),h=Math.min(Hn-1,Math.ceil((o+ds+1-zi)/e));for(let u=c;u<=h;u++){let d=zi+(u+.5)*e-o;for(let f=a;f<=l;f++){let g=zi+(f+.5)*e-r,x=Math.abs(g),m=Math.abs(d),p=Math.max(x,x*.5+m*.866)-.866,w=Math.max(0,p),_=u*Hn+f;w<t[_]&&(t[_]=w)}}}for(let s=0;s<t.length;s++)n[s]=Math.round(t[s]/ds*255);q.waterTex&&q.waterTex.dispose();let i=new Rr(n,Hn,Hn,Br,En);i.magFilter=an,i.minFilter=an,i.wrapS=i.wrapT=ri,i.needsUpdate=!0,q.waterTex=i,q.water&&(q.water.material.uniforms.uDist.value=i)}var PM=`
attribute float aHp;
varying vec2 vUv;
varying float vHp;
void main() {
  vUv = uv; vHp = aHp;
  vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float s = length(instanceMatrix[0].xyz);
  c.xy += position.xy * vec2(0.9, 0.12) * s;
  gl_Position = projectionMatrix * c;
}`,LM=`
varying vec2 vUv;
varying float vHp;
void main() {
  float hp = abs(vHp);
  vec3 full = vHp < 0.0 ? vec3(0.95, 0.28, 0.22) : vec3(0.35, 0.9, 0.35);
  vec3 low = vHp < 0.0 ? vec3(0.95, 0.28, 0.22) : vec3(0.95, 0.35, 0.2);
  vec3 col = vUv.x < hp ? mix(low, full, smoothstep(0.2, 0.6, hp)) : vec3(0.1, 0.1, 0.12);
  if (vUv.x < 0.025 || vUv.x > 0.975 || vUv.y < 0.16 || vUv.y > 0.84) col = vec3(0.03);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`,Xh=class extends Na{constructor(t){let e=new Ye({vertexShader:PM,fragmentShader:LM,depthTest:!1,depthWrite:!1,transparent:!0}),i=new os(1,1),s=new Di(new Float32Array(t),1);s.setUsage(qs),i.setAttribute("aHp",s),super(i,e,t,{cast:!1,receive:!1,colors:!1,order:20}),this.extra=s}bar(t,e,i,s,r=1){let o=this.put(t,e,i,0,r,r,r);o>=0&&(this.extra.array[o]=s)}};function ep(n){let t=new ha({canvas:n,antialias:!!he.msaa,powerPreference:"high-performance",stencil:!1});t.setPixelRatio(1),t.shadowMap.enabled=!0,t.shadowMap.type=Sa,t.toneMapping=Eh,t.toneMappingExposure=1.05,t.info.autoReset=!1,q.renderer=t;let e=new Ar,i=new Wt(11064552);e.background=i,e.fog=new ua(i,95,270),q.scene=e;let s=new He(42,1,.5,900);q.camera=s;let r=new zr(14085375,8219730,1.55);e.add(r);let o=new Or(16773336,2.7);o.position.set(-30,52,24),o.target.position.set(0,0,0),o.castShadow=!0;let a=o.shadow.camera;a.left=-46,a.right=46,a.top=46,a.bottom=-46,a.near=5,a.far=140,o.shadow.bias=-4e-4,o.shadow.normalBias=.035,e.add(o,o.target),q.sun=o,Yh(),q.M=Xf();let l=q.M,c=new Ui({vertexColors:!0});q.lit=c;let h=new zn({color:16777215,toneMapped:!1}),u=new zn({color:16777215,transparent:!0,blending:ss,depthWrite:!1,toneMapped:!1}),d=new Cr(jf(),new Ui({vertexColors:!0}),4e3);d.count=0,d.frustumCulled=!1,d.receiveShadow=!0,d.castShadow=!0,d.instanceColor=new Di(new Float32Array(4e3*3).fill(1),3),e.add(d),q.terrain=d;let f=new Me(new os(1600,1600).rotateX(-Math.PI/2),new Ye({vertexShader:CM,fragmentShader:IM,uniforms:{uTime:{value:0},uDist:{value:null},uMapMin:{value:new ct(zi,zi)},uMapSize:{value:Qf},uMaxDist:{value:ds},uShallow:{value:new Wt(4637380)},uDeep:{value:new Wt(1728398)},uSky:{value:new Wt(12575988)},uFoam:{value:new Wt(16055291)},uFogColor:{value:i},uFogNear:{value:95},uFogFar:{value:270},uSunDir:{value:o.position.clone().normalize()}}}));f.position.y=-.02,f.renderOrder=1,e.add(f),q.water=f;let g=q.pools,x=(_,y,C,A=c,I)=>{g[_]=new Na(y,A,C,I),e.add(g[_].mesh)};x("tree",l.tree,6e3),x("rock",l.rock,1500),x("peak",l.peak,600);let m=new Ui({color:16777215});x("roadC",new Rn(.3,.3,.05,6),3e3,m,{cast:!1}),x("roadS",new An(1,.05,1).translate(0,0,.5),12e3,m,{cast:!1}),x("rubble",l.rubble,400,c,{cast:!1});for(let _ of Object.keys(le))x("b_"+_,l[_],_==="house"?600:_==="hq"?2:200);x("b_house2",l.house2,600);for(let _ of["mg","coastal","flak","missile","radar"])x("h_"+_,l[_+"_head"],200);for(let _ of["gunboat","landing","destroyer","battleship","fighter","bomber","jet"])x("u_"+_,l[_],120);x("u_infantry",l.infantry,400),x("u_soldier",l.soldier,300),x("u_ally_fighter",l.ally_fighter,80),x("marker",l.marker,300,c,{cast:!1}),x("arrow",l.arrow,8,new zn({color:16777215,transparent:!0,opacity:.8,depthWrite:!1}),{cast:!1,receive:!1}),x("shell",new ls(.075,6,4),500,h,{cast:!1,receive:!1}),x("bomb",l.bomb,300,c,{receive:!1}),x("missileP",l.missileP,200,c,{receive:!1}),x("rocketP",l.rocketP,200,c,{receive:!1}),x("tracer",new An(1,1,1).translate(0,0,.5),600,u,{cast:!1,receive:!1}),q.hb=new Xh(800),e.add(q.hb.mesh);let p=(_,y)=>new zn({color:_,transparent:!0,opacity:y,depthTest:!1,depthWrite:!1,toneMapped:!1});q.hover=new Me(Zf(.84,1),p(16777215,.85)),q.hover.renderOrder=15,q.select=new Me(Zf(.8,1),p(16767050,.95)),q.select.renderOrder=16,q.rangeRing=new Me(new Fr(.975,1,120).rotateX(-Math.PI/2),p(16777215,.75)),q.rangeRing.renderOrder=14,q.rangeFill=new Me(new va(1,120).rotateX(-Math.PI/2),p(16777215,.07)),q.rangeFill.renderOrder=13;for(let _ of[q.hover,q.select,q.rangeRing,q.rangeFill])_.visible=!1,e.add(_);x("ghostRoad",new Rn(.92,.92,.06,6),400,new zn({color:16777215,transparent:!0,opacity:.45,depthWrite:!1,toneMapped:!1}),{cast:!1,receive:!1}),g.ghostRoad.mesh.renderOrder=12;let w=new Ui({vertexColors:!0,transparent:!0,opacity:.62,depthWrite:!1,emissive:0});q.ghostMat=w;for(let _ of Object.keys(le)){let y=new ai;if(y.add(new Me(l[_],w)),l[_+"_head"]){let C=new Me(l[_+"_head"],w);C.position.y=le[_].weapon&&le[_].weapon.headY||le[_].headY||0,y.add(C)}y.visible=!1,y.renderOrder=11,e.add(y),q.ghosts[_]=y}window.addEventListener("resize",Fa),Fa()}function Yh(){let n=he.shadows|0;q.sun.castShadow=n>0;let t=n>=2?4096:2048;q.sun.shadow.mapSize.x!==t&&(q.sun.shadow.mapSize.set(t,t),q.sun.shadow.map&&(q.sun.shadow.map.dispose(),q.sun.shadow.map=null)),q.renderer.shadowMap.needsUpdate=!0}function Fa(){let n=window.devicePixelRatio||1,t=Math.max(.4,Math.min(1,he.renderScale||1)),e=Math.max(1,Math.floor(window.innerWidth*n*t)),i=Math.max(1,Math.floor(window.innerHeight*n*t));q.width=e,q.height=i,q.pixelScale=n*t,q.renderer.setSize(e,i,!1),q.camera.aspect=e/i,q.camera.updateProjectionMatrix()}var Oi=new Wt,za=new oe,Jf=new Qe,Kf=new Ve,DM=new N,UM=new N,qh=null;function np(){let n=q.terrain,t=n.instanceMatrix.array;qh=new Int32Array(S.count).fill(-1);let e=0;for(let i of S.land)qh[i]=e,za.makeTranslation(S.x[i],S.h[i],S.z[i]),za.toArray(t,e*16),e++;n.count=e,n.instanceMatrix.needsUpdate=!0,$r(null)}function $r(n){let t=q.terrain,e=t.instanceColor.array;for(let i of S.land){let s=qh[i]*3;Oi.setHex(Ks[S.type[i]].color);let r=.92+We(i,3)*.16;S.ruin[i]&&(r*=.7),n&&(r*=n(i)),e[s]=Oi.r*r,e[s+1]=Oi.g*r,e[s+2]=Oi.b*r*(S.type[i]===mt.FOREST?.9:1)}t.instanceColor.needsUpdate=!0}var Vn=[];function $h(){let n=q.pools;n.tree.begin(),n.rock.begin(),n.peak.begin();for(let t of S.land){let e=S.type[t];if(e===mt.FOREST&&!S.bld[t]&&!S.road[t]){Vn.length=0,Nf(t,Vn);for(let i=0;i<Vn.length;i+=5){let s=Vn[i+3],r=.85+Vn[i+4]*.3;n.tree.put(Vn[i],Vn[i+1],Vn[i+2],Vn[i+4]*6,s,s*(.9+Vn[i+4]*.3),s,r,r,r)}}else if(e===mt.HILLS&&!S.bld[t]&&!S.road[t]){let i=We(t,5)*6.28;n.rock.put(S.x[t]+Math.cos(i)*.35,S.h[t],S.z[t]+Math.sin(i)*.35,i,1+We(t,6)*.6,1+We(t,9),1+We(t,6)*.6)}else if(e===mt.MOUNTAIN){let i=.85+We(t,7)*.4;n.peak.put(S.x[t],S.h[t],S.z[t],0,i,i*(.8+We(t,8)*.9),i)}}n.tree.end(),n.rock.end(),n.peak.end()}function Zh(){let n=q.pools;n.roadC.begin(),n.roadS.begin(),Oi.setHex(13350539);let t=Oi.r,e=Oi.g,i=Oi.b;for(let s=0;s<S.count;s++){if(!S.road[s])continue;let r=S.conn[s]?1:.7,o=S.h[s]+.012;n.roadC.put(S.x[s],o,S.z[s],0,1,1,1,t*r,e*r,i*r);for(let a=0;a<6;a++){let l=S.nbr[s*6+a];if(l<0||!(S.road[l]||S.bld[l]))continue;let h=(S.h[s]+S.h[l])/2+.012-o,u=Math.hypot(Zs/2,h),d=Math.atan2(Ra[a],Ca[a]);Kf.set(-Math.asin(h/u),d,0,"YXZ"),Jf.setFromEuler(Kf),za.compose(DM.set(S.x[s],o,S.z[s]),Jf,UM.set(.36,1,u)),n.roadS.putMatrix(za,t*r*.96,e*r*.96,i*r*.96)}}n.roadC.end(),n.roadS.end()}function ip(n){let t={},i=new Tn(128,128,{samples:4});i.texture.colorSpace=Ke;let s=new Ar;s.add(new zr(15135487,7101510,2.2));let r=new Or(16777215,2.6);r.position.set(-2,4,3),s.add(r);let o=new He(30,1,.1,50),a=q.lit,l=new Me(jf(.08,.05,.3),new Ui({vertexColors:!0,color:9223506}));s.add(l);let c=new Uint8Array(16384*4),h=document.createElement("canvas");h.width=h.height=128;let u=h.getContext("2d"),d=u.createImageData(128,128),f=q.renderer.getRenderTarget();for(let g of n){let x=q.M[g];if(!x)continue;let m=new ai;m.add(new Me(x,a));let p=le[g];if(q.M[g+"_head"]){let w=new Me(q.M[g+"_head"],a);w.position.y=p&&p.weapon&&p.weapon.headY||p&&p.headY||0,w.rotation.y=.5,m.add(w)}m.rotation.y=-.5,s.add(m),l.material.color.setHex(Ks[g==="mine"?mt.HILLS:mt.GRASS].color),o.position.set(2.2,2.3,2.9),o.lookAt(0,.35,0),q.renderer.setRenderTarget(i),q.renderer.setClearColor(0,0),q.renderer.clear(),q.renderer.render(s,o),q.renderer.readRenderTargetPixels(i,0,0,128,128,c);for(let w=0;w<128;w++){let _=(127-w)*128*4,y=w*128*4;d.data.set(c.subarray(_,_+512),y)}u.putImageData(d,0,0),t[g]=h.toDataURL(),s.remove(m)}return q.renderer.setRenderTarget(f),q.renderer.setClearColor(q.scene.background,1),i.dispose(),t}var NM=`
attribute vec3 aVel;
attribute vec4 aTime;   // start, life, size0, size1
attribute vec4 aCol0;   // rgb, alpha
attribute vec4 aCol1;   // rgb, gravity
uniform float uTime;
uniform float uScale;
uniform float uDrag;
varying vec4 vCol;
void main() {
  float age = uTime - aTime.x;
  float k = age / aTime.y;
  if (k < 0.0 || k > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  float dt = (1.0 - exp(-uDrag * age)) / uDrag;
  vec3 p = position + aVel * dt;
  p.y -= 0.5 * aCol1.w * age * age;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(mix(aTime.z, aTime.w, k) * uScale / -mv.z, 280.0);
  float a = aCol0.a * smoothstep(0.0, 0.06, k) * (1.0 - k * k);
  vCol = vec4(mix(aCol0.rgb, aCol1.rgb, k), a);
}`,FM=`
varying vec4 vCol;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c) * 4.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(vCol.rgb, vCol.a * (1.0 - d));
  #include <colorspace_fragment>
}`,Oa=class{constructor(t,e,i){this.max=t,this.head=0,this.lo=t,this.hi=-1;let s=new Ae,r=(o,a)=>{let l=new qe(new Float32Array(t*a),a);return l.setUsage(qs),s.setAttribute(o,l),l};this.aP=r("position",3),this.aV=r("aVel",3),this.aT=r("aTime",4),this.aC0=r("aCol0",4),this.aC1=r("aCol1",4),this.aT.array.fill(-1e3);for(let o=0;o<t;o++)this.aT.array[o*4+1]=.001;this.mat=new Ye({vertexShader:NM,fragmentShader:FM,uniforms:{uTime:{value:0},uScale:{value:400},uDrag:{value:i}},transparent:!0,depthWrite:!1,blending:e}),this.points=new da(s,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=e===ss?9:8}emit(t,e,i,s,r,o,a,l,c,h,u,d,f,g,x,m,p){let w=this.head;this.head=(w+1)%this.max;let _=this.aP.array,y=this.aV.array,C=this.aT.array,A=this.aC0.array,I=this.aC1.array;_[w*3]=t,_[w*3+1]=e,_[w*3+2]=i,y[w*3]=s,y[w*3+1]=r,y[w*3+2]=o,C[w*4]=v.time,C[w*4+1]=a,C[w*4+2]=l,C[w*4+3]=c,A[w*4]=h,A[w*4+1]=u,A[w*4+2]=d,A[w*4+3]=f,I[w*4]=g,I[w*4+1]=x,I[w*4+2]=m,I[w*4+3]=p,w<this.lo&&(this.lo=w),w>this.hi&&(this.hi=w)}flush(t,e){if(this.mat.uniforms.uTime.value=t,this.mat.uniforms.uScale.value=e,!(this.hi<this.lo)){for(let[i,s]of[[this.aP,3],[this.aV,3],[this.aT,4],[this.aC0,4],[this.aC1,4]])i.clearUpdateRanges(),i.addUpdateRange(this.lo*s,(this.hi-this.lo+1)*s),i.needsUpdate=!0;this.lo=this.max,this.hi=-1}}clear(){this.aT.array.fill(-1e3);for(let t=0;t<this.max;t++)this.aT.array[t*4+1]=.001;this.lo=0,this.hi=this.max-1}},xn,hn;function sp(){xn=new Oa(9e3,ss,2.2),hn=new Oa(9e3,Ai,1.1),q.scene.add(xn.points,hn.points)}function Zr(){let n=q.height*q.camera.projectionMatrix.elements[5]*.5;xn.flush(v.time,n),hn.flush(v.time,n)}function rp(){xn.clear(),hn.clear()}var Bt=(n,t)=>n+Math.random()*(t-n),Ct=n=>Math.pow(n,2.2);function en(n,t,e,i=1,s=!1){let r=i;xn.emit(n,t+.2*r,e,0,.5,0,.18,2.8*r,4.2*r,1,.9,.6,1,1,.5,.2,0);let o=Math.round(10*Math.min(2,r));for(let l=0;l<o;l++){let c=Math.random()*6.283,h=Bt(1.5,4)*r;xn.emit(n,t+.15,e,Math.cos(c)*h,Bt(1.5,4.5)*r,Math.sin(c)*h,Bt(.35,.65),Bt(.8,1.3)*r,.25*r,1,Ct(.75),Ct(.3),.95,Ct(.7),Ct(.12),Ct(.03),-1.5)}let a=Math.round(8*Math.min(2,r));for(let l=0;l<a;l++){let c=Math.random()*6.283,h=Bt(.4,1.4)*r,u=s?.85:.22;hn.emit(n,t+.3,e,Math.cos(c)*h,Bt(.8,2.2)*r,Math.sin(c)*h,Bt(1.4,2.6),Bt(.6,.9)*r,Bt(1.6,2.4)*r,Ct(u),Ct(u),Ct(u),s?.6:.75,Ct(u*1.4),Ct(u*1.4),Ct(u*1.4),-.4)}for(let l=0;l<6*r;l++){let c=Math.random()*6.283,h=Bt(2,5)*r;xn.emit(n,t+.2,e,Math.cos(c)*h,Bt(3,7),Math.sin(c)*h,Bt(.5,1),.18,.08,1,Ct(.85),Ct(.5),1,1,Ct(.3),0,9)}s&&zM(n,e,r)}function zM(n,t,e=1){for(let i=0;i<14*e;i++){let s=Math.random()*6.283,r=Bt(.3,1.4)*e;hn.emit(n,.05,t,Math.cos(s)*r,Bt(3,6)*e,Math.sin(s)*r,Bt(.7,1.1),Bt(.35,.6)*e,Bt(.6,.9)*e,.92,.97,1,.85,.85,.95,1,9)}hn.emit(n,.05,t,0,.2,0,1.4,.8*e,2.6*e,.9,.97,1,.5,.9,.97,1,0)}function er(n,t,e,i=1){xn.emit(n,t,e,0,.2,0,.07,.7*i,.4*i,1,Ct(.85),Ct(.45),1,1,Ct(.5),Ct(.1),0),hn.emit(n,t,e,Bt(-.2,.2),.5,Bt(-.2,.2),.8,.25*i,.7*i,Ct(.7),Ct(.7),Ct(.7),.35,Ct(.8),Ct(.8),Ct(.8),-.3)}function op(n,t,e,i=1){xn.emit(n,t,e,0,0,0,.12,1.8*i,2.4*i,1,Ct(.85),Ct(.5),1,1,Ct(.5),0,0);for(let s=0;s<5;s++)hn.emit(n+Bt(-.3,.3),t+Bt(-.3,.3),e+Bt(-.3,.3),Bt(-.4,.4),Bt(-.2,.4),Bt(-.4,.4),Bt(1.4,2),.7*i,1.5*i,Ct(.16),Ct(.16),Ct(.17),.85,Ct(.3),Ct(.3),Ct(.3),.15);for(let s=0;s<6;s++){let r=Math.random()*6.283,o=Bt(-1,1);xn.emit(n,t,e,Math.cos(r)*4,o*4,Math.sin(r)*4,.25,.14,.05,1,Ct(.8),Ct(.4),1,1,Ct(.4),0,4)}}function ka(n,t,e,i=1,s=!1){let r=s?.15:.8;hn.emit(n,t,e,Bt(-.1,.1),Bt(0,.2),Bt(-.1,.1),s?1.6:1,.2*i,.7*i,Ct(r),Ct(r),Ct(r),s?.7:.5,Ct(r+.1),Ct(r+.1),Ct(r+.1),-.2),s||xn.emit(n,t,e,0,0,0,.08,.35*i,.1,1,Ct(.7),Ct(.3),1,1,Ct(.4),0,0)}function Ba(n,t,e,i=1){xn.emit(n+Bt(-.2,.2)*i,t,e+Bt(-.2,.2)*i,Bt(-.1,.1),Bt(.8,1.6),Bt(-.1,.1),Bt(.4,.7),.6*i,.15*i,1,Ct(.6),Ct(.15),.9,Ct(.7),Ct(.1),0,-.5)}function Jh(n,t,e,i=1,s=.2){hn.emit(n+Bt(-.2,.2)*i,t,e+Bt(-.2,.2)*i,Bt(-.15,.15),Bt(.6,1.1),Bt(-.15,.15),Bt(2.2,3.2),.4*i,1.6*i,Ct(s),Ct(s),Ct(s),.6,Ct(s+.25),Ct(s+.25),Ct(s+.25),-.15)}function ap(n,t,e=1){hn.emit(n+Bt(-.08,.08),.04,t+Bt(-.08,.08),Bt(-.15,.15),0,Bt(-.15,.15),Bt(1.4,2),.3*e,.9*e,.95,.98,1,.5,.9,.97,1,0)}function Gn(n,t,e,i=1){for(let s=0;s<10*i;s++){let r=Math.random()*6.283,o=Bt(.5,1.6);hn.emit(n,t+.05,e,Math.cos(r)*o,Bt(.2,.8),Math.sin(r)*o,Bt(.8,1.4),.3*i,.9*i,Ct(.72),Ct(.62),Ct(.48),.6,Ct(.8),Ct(.72),Ct(.6),.5)}}var Jr,Ha,Va,Ga,nn,Ne,Wn=0,ki=0;function jh(){let n=S.count;Jr=new Float32Array(n),Ha=new Int32Array(n),Va=new Uint32Array(n),Ga=new Uint32Array(n),nn=new Int32Array(n*8),Ne=new Float32Array(n*8),ki=0}function lp(n,t){if(Wn>=nn.length)return;let e=Wn++;for(nn[e]=n,Ne[e]=t;e>0;){let i=e-1>>1;if(Ne[i]<=Ne[e])break;let s=nn[i],r=Ne[i];nn[i]=nn[e],Ne[i]=Ne[e],nn[e]=s,Ne[e]=r,e=i}}function OM(){let n=nn[0];if(Wn--,Wn>0){nn[0]=nn[Wn],Ne[0]=Ne[Wn];let t=0;for(;;){let e=t*2+1,i=e+1,s=t;if(e<Wn&&Ne[e]<Ne[s]&&(s=e),i<Wn&&Ne[i]<Ne[s]&&(s=i),s===t)break;let r=nn[s],o=Ne[s];nn[s]=nn[t],Ne[s]=Ne[t],nn[t]=r,Ne[t]=o,t=s}}return n}function Bi(n,t,e,i,s=5e3){if(n<0)return null;ki++,Wn=0,Jr[n]=0,Va[n]=ki,Ha[n]=-1,lp(n,i(n));let r=0;for(;Wn>0&&r++<s;){let o=OM();if(Ga[o]===ki)continue;if(Ga[o]=ki,e(o)){let l=[];for(let c=o;c!==-1;c=Ha[c])l.push(c);return l.reverse(),l}let a=Jr[o];for(let l=0;l<6;l++){let c=S.nbr[o*6+l];if(c<0||Ga[c]===ki)continue;let h=t(c,o);if(h<=0)continue;let u=a+h;(Va[c]!==ki||u<Jr[c])&&(Va[c]=ki,Jr[c]=u,Ha[c]=o,lp(c,u+i(c)))}}return null}function un(n){for(let t in n)if((v.res[t]||0)<n[t]-1e-6)return!1;return!0}function jr(n){for(let t in n)v.res[t]-=n[t]}function kM(n,t){for(let e in n)v.res[e]+=Math.floor(n[e]*t)}function Qr(n,t){let e={};for(let i in n)e[i]=Math.ceil(n[i]*t);return e}var Qh=class{constructor(t,e){let i=le[t];this.id=v.nextId++,this.type=t,this.def=i,this.tile=e,this.x=S.x[e],this.y=S.h[e],this.z=S.z[e],this.level=1,this.maxHp=i.hp*v.mod.bhp,this.hp=this.maxHp,this.alive=!0,this.connected=!1,this.yaw=Math.floor(Math.random()*6)*(Math.PI/3)+Math.PI/6,this.headYaw=Math.random()*Math.PI*2,this.cool=Math.random(),this.scan=Math.random()*.2,this.target=null,this.flash=0,this.lastHit=-99,this.born=v.time,this.kills=0,this.prod=null,this.ws=null,this.units=[],this.trainT=0,this.radarBoost=!1,this.marketBoost=!1,this.burnT=Math.random()}};function tu(n){return!n.def.upgradeCost||n.level>=(n.def.maxLevel||1)?null:n.def.upgradeCost(n.level)}function to(n){let t=le[n].requires;return!t||(v.research[t]||0)>0}function Xn(n,t){if(t<0)return"Off the map";let e=le[n],i=S.type[t];return Re(i)?i===mt.MOUNTAIN?"Too steep: mountains cannot be built on":S.bld[t]?"Tile is occupied":S.road[t]?"Tile has a road (bulldoze it first)":e.terrain.includes(i)?to(n)?e.unique&&v.buildings.some(s=>s.type===n)?"Only one can be built":e.coastal&&!Wr(t,s=>In(s))?"Must touch the sea":e.needsAdj==="forest"&&!Wr(t,s=>s===mt.FOREST)?"Needs a forest beside it":e.needsAdj==="rock"&&i!==mt.HILLS&&!Wr(t,s=>s===mt.HILLS||s===mt.MOUNTAIN)?"Needs hills or mountains beside it":null:`Requires research: ${di[e.requires].name}`:n==="farm"?"Farms need grassland":n==="mine"?"Iron mines must be built on hills":n==="airfield"?"Airfields need flat ground (not hills)":n==="dock"?"Docks go on beach or grass":"Wrong terrain":"Must be built on land"}function Ln(n){if(n<0)return"Off the map";let t=S.type[n];return Re(t)?t===mt.MOUNTAIN?"Too steep for a road":S.bld[n]?"Tile is occupied":S.road[n]?"Already a road":null:"Roads must be on land"}function cp(n){S.type[n]===mt.FOREST&&(S.type[n]=mt.GRASS,v.res.wood+=5,v.dirty.terrainColors=!0),S.ruin[n]&&(S.ruin[n]=0,v.dirty.terrainColors=!0),v.dirty.trees=!0}function nr(n,t,e=!1){let i=le[n];e||jr(i.cost),cp(t);let s=new Qh(n,t);if(n==="dock")for(let r=0;r<6;r++){let o=S.nbr[t*6+r];if(o>=0&&In(S.type[o])){s.yaw=Math.atan2(Ra[r],Ca[r]);break}}return n==="airfield"&&(s.yaw=Math.floor(Math.random()*3)*(Math.PI/3)),S.bld[t]=s.id,v.buildings.push(s),v.byId.set(s.id,s),n==="hq"&&(v.hq=s),v.stats.built++,Kr(),s}function qa(n,t){let e=Xn(n,t);return e||(un(le[n].cost)?(nr(n,t),null):"Not enough resources")}function Ya(n){let t=Ln(n);return t||(un(ui)?(jr(ui),cp(n),S.road[n]=1,Kr(),null):"Not enough gold")}function $a(n,t){n.alive=!1,S.bld[n.tile]=0;let e=v.buildings.indexOf(n);e>=0&&v.buildings.splice(e,1),v.byId.delete(n.id),t&&(S.ruin[n.tile]=us.indexOf(n.type)+1),v.selected===n&&(v.selected=t?{ruin:n.tile}:null);for(let i of n.units)i.home=null;Kr()}function eo(n){if(n<0)return"Off the map";if(S.bld[n]){let t=v.byId.get(S.bld[n]);return t?t.type==="hq"?"The Town Hall cannot be demolished":(kM(t.def.cost,.5),$a(t,!1),null):null}return S.road[n]?(S.road[n]=0,v.res.gold+=1,Kr(),null):S.ruin[n]?(S.ruin[n]=0,v.dirty.terrainColors=!0,Kr(),null):"Nothing to clear"}function hp(n){let t=us[S.ruin[n]-1];if(!t)return"Nothing to rebuild";let e=Qr(le[t].cost,.6);S.ruin[n]=0;let i=Xn(t,n);if(i)return S.ruin[n]=us.indexOf(t)+1,i;if(!un(e))return S.ruin[n]=us.indexOf(t)+1,"Not enough resources";jr(e);let s=nr(t,n,!0);return v.dirty.terrainColors=!0,s}function up(n){let t=tu(n);if(!t)return"Already at the top level";if(!un(t))return"Not enough resources";jr(t),n.level++;let e=n.maxHp;return n.maxHp=n.def.hp*v.mod.bhp*(1+.3*(n.level-1)),n.hp+=n.maxHp-e,n.born=v.time-.25,nu(),null}function eu(n,t){if(!(!n.alive||v.mode!=="play")&&(n.hp-=t,n.flash=1,n.lastHit=v.time,n.hp<=0)){if(n.hp=0,v.stats.lost++,n.type==="hq"){n.alive=!1,v.onHQDestroyed&&v.onHQDestroyed();return}Fi(`${n.def.name} destroyed!`,"bad"),v.onBuildingDestroyed&&v.onBuildingDestroyed(n),$a(n,!0)}}function Kr(){v.dirty.connect=!0,v.dirty.roads=!0,v.dirty.minimap=!0,S.version++}var Hi=null;function no(){if((!Hi||Hi.length!==S.count)&&(Hi=new Uint8Array(S.count)),Hi.fill(0),S.conn.fill(0),!v.hq)return;let n=[v.hq.tile];Hi[v.hq.tile]=1;for(let t=0;t<n.length;t++){let e=n[t];for(let i=0;i<6;i++){let s=S.nbr[e*6+i];s>=0&&!Hi[s]&&S.road[s]&&(Hi[s]=1,S.conn[s]=1,n.push(s))}}for(let t of v.buildings){if(t.type==="hq"){t.connected=!0;continue}let e=!1;for(let i=0;i<6&&!e;i++){let s=S.nbr[t.tile*6+i];s>=0&&Hi[s]&&(e=!0)}t.connected=e}nu()}function nu(){v.mod=tr(v.research);let n=v.buildings.filter(e=>e.type==="radar"&&e.connected),t=v.buildings.filter(e=>e.type==="market"&&e.connected);for(let e of v.buildings)e.radarBoost=n.some(i=>Math.hypot(i.x-e.x,i.z-e.z)<=i.def.radius),e.marketBoost=e.type==="house"&&t.some(i=>Math.hypot(i.x-e.x,i.z-e.z)<=i.def.radius),e.prod=pp(e),e.ws=e.def.weapon?dp(e):null}function dp(n){let t=n.def.weapon,e=v.mod,i=n.level-1,s=t.dmg*e.dmg*(1+.35*i),r=t.range*e.range*(1+.08*i),o=t.rate*e.rate*(1+.1*i),a=t.splash||0;return t.kind==="flak"&&(s*=e.flakDmg,a*=e.flakSplash),n.radarBoost&&(r*=1.2),n.type!=="hq"&&(o*=Math.max(.5,Math.min(1,v.eff))),{dmg:s,range:r,rate:o,splash:a}}function Wa(n){return n.type==="hq"?10+5*(n.level-1):n.type!=="house"?0:n.def.housing+4*(n.level-1)+v.mod.housing}function Xa(n){let t=n.def.jobs||0;return t?t+(n.level-1):0}function fp(n,t){return pp({type:n,tile:t,level:1})}function pp(n){let t=v.mod,e=n.tile,i=1+.35*(n.level-1),s=r=>Wr(e,r);switch(n.type){case"hq":return{food:8};case"farm":return{food:30*i*t.food};case"dock":return{food:(16+2*s(r=>In(r)))*i*t.food};case"lumber":return{wood:(6+6*s(r=>r===mt.FOREST))*i*t.prod};case"quarry":return{stone:(4+5*s(r=>r===mt.HILLS)+7*s(r=>r===mt.MOUNTAIN)+(S.type[e]===mt.HILLS?6:0))*i*t.prod};case"mine":return{iron:(10+4*s(r=>r===mt.MOUNTAIN)+2*s(r=>r===mt.HILLS))*i*t.prod};default:return null}}var BM=1.8,HM=.6,mp=n=>n.type==="farm"||n.type==="dock",Za=n=>n.type==="hq"?1:mp(n)?v.effFood:v.eff;function gp(){let n=0,t=0,e=0;for(let a of v.buildings)a.connected&&(n+=Wa(a),mp(a)?t+=Xa(a):e+=Xa(a));v.housing=n,v.jobs=t+e;let i=v.eff;v.effFood=t>0?Math.min(1,v.pop/t):1,v.eff=e>0?Math.min(1,Math.max(0,v.pop-t)/e):1;let s={food:0,wood:0,stone:0,iron:0,gold:0};for(let a of v.buildings){if(!a.connected||!a.prod)continue;let l=Za(a);for(let c in a.prod)s[c]+=a.prod[c]*l}let r=n>0?Math.min(1,v.pop/n):0,o=0;for(let a of v.buildings){if(!a.connected)continue;let l=Wa(a);l&&(o+=l*r*BM*(a.marketBoost?1.5:1))}s.gold+=o*v.mod.tax,s.food-=v.pop*HM,v.rates=s;for(let a of qr)v.res[a]=Math.max(0,v.res[a]+s[a]/60);if(v.starving=v.res.food<=.01&&s.food<0,v.pop>n)v.pop=Math.max(n,v.pop-1);else if(v.starving)v.growT+=1,v.growT>=4&&(v.growT=0,v.pop=Math.max(Math.min(4,n),v.pop-1),Fi("Your people are starving! Build farms or docks.","bad"));else if(v.pop<n&&v.res.food>1){v.growT+=1;let a=Math.max(.6,2.2-n/120);for(;v.growT>=a&&v.pop<n;)v.growT-=a,v.pop++}else v.growT=0;Math.abs(i-v.eff)>.001&&VM()}function VM(){for(let n of v.buildings)n.def.weapon&&(n.ws=dp(n))}var iu=[{res:"wood",amt:25,gold:55},{res:"stone",amt:25,gold:70},{res:"iron",amt:15,gold:80},{res:"food",amt:40,gold:45}];function xp(n){let t=iu[n];return t?v.buildings.some(e=>e.type==="market"&&e.connected)?v.res.gold<t.gold?"Not enough gold":(v.res.gold-=t.gold,v.res[t.res]+=t.amt,null):"Needs a Market connected by road":"Unknown trade"}function vp(n){let t=di[n],e=v.research[n]||0;if(e>=t.max)return"Fully researched";if(t.req&&!(v.research[t.req]>0))return`Requires ${di[t.req].name}`;if(!v.buildings.some(r=>r.type==="college"&&r.connected))return"Build a War College connected by road";let i=t.cost(e);if(!un(i))return"Not enough resources";jr(i),v.research[n]=e+1;let s=v.mod.bhp;if(nu(),v.mod.bhp!==s)for(let r of v.buildings){let o=v.mod.bhp/s;r.maxHp*=o,r.hp*=o}return Fi(`Research complete: ${t.name}${t.max>1?" "+["I","II","III"][e]:""}`,"good"),null}function yp(n){v.seed=n,v.time=0,v.speed=1,v.paused=!1,v.res={food:80,wood:150,stone:80,iron:0,gold:200},v.rates={food:0,wood:0,stone:0,iron:0,gold:0},v.pop=8,v.housing=10,v.jobs=0,v.eff=1,v.effFood=1,v.starving=!1,v.growT=0,v.econT=0,v.buildings=[],v.byId=new Map,v.nextId=1,v.hq=null,v.enemies=[],v.allies=[],v.projectiles=[],v.research={},v.mod=tr({}),v.stats={kills:0,built:0,lost:0,waves:0,shots:0},v.victory=!1,v.selected=null,v.tool=null}function su(n,t){Bh(n),jh(),yp(n),nr("hq",S.center,!0),v.stats.built=0,v.wave={n:1,state:"prep",timer:qf,elapsed:0,plan:t(1),queue:[],current:0},no();for(let e in v.dirty)v.dirty[e]=!0}var Ja="bastion.save.v1";function _p(){try{return!!localStorage.getItem(Ja)}catch{return!1}}function io(){if(v.mode!=="play"||v.wave.state!=="prep")return!1;let n=[],t=[],e=[];for(let s=0;s<S.count;s++)S.road[s]&&n.push(s),S.ruin[s]&&t.push(s,S.ruin[s]);for(let s=0;s<S.count;s++)S.type[s]===mt.GRASS&&S._origForest&&S._origForest[s]&&e.push(s);let i={v:1,seed:v.seed,time:v.time,res:v.res,pop:v.pop,research:v.research,stats:v.stats,victory:v.victory,wave:{n:v.wave.n,timer:v.wave.timer,plan:v.wave.plan},buildings:v.buildings.map(s=>[s.type,s.tile,s.level,Math.round(s.hp/s.maxHp*1e3)/1e3,Math.round(s.yaw*1e3)/1e3]),roads:n,ruins:t,cleared:e};try{return localStorage.setItem(Ja,JSON.stringify(i)),!0}catch{return!1}}function Mp(){let n;try{n=JSON.parse(localStorage.getItem(Ja)||"null")}catch{n=null}if(!n||n.v!==1)return!1;Bh(n.seed),jh(),Ka(),yp(n.seed),v.time=n.time||0;for(let t of n.cleared||[])S.type[t]===mt.FOREST&&(S.type[t]=mt.GRASS);for(let t of n.roads||[])S.road[t]=1;for(let t=0;t<(n.ruins||[]).length;t+=2)S.ruin[n.ruins[t]]=n.ruins[t+1];for(let[t,e,i,s,r]of n.buildings){if(!le[t])continue;let o=nr(t,e,!0);o.level=i,o.maxHp=o.def.hp*tr(n.research).bhp*(1+.3*(i-1)),o.hp=o.maxHp*s,o.yaw=r,o.born=-10}v.res={...v.res,...n.res},v.pop=n.pop,v.research=n.research||{},v.stats={...v.stats,...n.stats},v.victory=!!n.victory,v.wave={n:n.wave.n,state:"prep",timer:n.wave.timer,elapsed:0,plan:n.wave.plan,queue:[],current:0},no();for(let t in v.dirty)v.dirty[t]=!0;return!0}function Ka(){S._origForest=new Uint8Array(S.count);for(let n=0;n<S.count;n++)S.type[n]===mt.FOREST&&(S._origForest[n]=1)}function bp(){try{localStorage.removeItem(Ja)}catch{}}var Ee=null,ir=null,so=null,au=null,ru=0,ou={},fi={x:0,z:0,yaw:0,dist:40};function Sp(){if(Ee){Ee.state==="suspended"&&Ee.resume();return}try{Ee=new(window.AudioContext||window.webkitAudioContext)}catch{Ee=null;return}so=Ee.createDynamicsCompressor(),so.threshold.value=-14,so.ratio.value=4,ir=Ee.createGain(),ir.gain.value=he.volume,ir.connect(so),so.connect(Ee.destination);let n=Ee.sampleRate;au=Ee.createBuffer(1,n,Ee.sampleRate);let t=au.getChannelData(0);for(let e=0;e<n;e++)t[e]=Math.random()*2-1}function wp(n){ir&&(ir.gain.value=n)}function Ep(n,t,e,i){fi.x=n,fi.z=t,fi.yaw=e,fi.dist=i}function Tp(n,t,e,i,s){n.gain.setValueAtTime(1e-4,t),n.gain.exponentialRampToValueAtTime(i,t+e),n.gain.exponentialRampToValueAtTime(1e-4,t+s)}function dn(n,t,e,i,s,r,o,a=.8){let l=Ee.createBufferSource();l.buffer=au,l.playbackRate.value=.8+Math.random()*.4;let c=Ee.createBiquadFilter();c.type=i,c.Q.value=a,c.frequency.setValueAtTime(s,t),c.frequency.exponentialRampToValueAtTime(Math.max(20,r),t+e);let h=Ee.createGain();return Tp(h,t,.004,o,e),l.connect(c),c.connect(h),h.connect(n),l.start(t,Math.random()*.5,e+.05),l}function Fe(n,t,e,i,s,r,o,a=.005){let l=Ee.createOscillator();l.type=i,l.frequency.setValueAtTime(s,t),l.frequency.exponentialRampToValueAtTime(Math.max(20,r),t+e);let c=Ee.createGain();return Tp(c,t,a,o,e),l.connect(c),c.connect(n),l.start(t),l.stop(t+e+.05),l}var GM={mg:{gap:.045,vol:.18,play:(n,t,e)=>{dn(n,t,.05,"highpass",1400,900,e),Fe(n,t,.04,"square",160,90,e*.4)}},rifle:{gap:.07,vol:.12,play:(n,t,e)=>dn(n,t,.06,"bandpass",2400,1200,e,1.2)},gun:{gap:.1,vol:.4,play:(n,t,e)=>{dn(n,t,.2,"lowpass",2e3,300,e),Fe(n,t,.15,"sine",140,50,e)}},cannon:{gap:.08,vol:.7,play:(n,t,e)=>{dn(n,t,.7,"lowpass",1200,80,e),Fe(n,t,.4,"sine",90,30,e*1.2)}},flak:{gap:.06,vol:.4,play:(n,t,e)=>{dn(n,t,.22,"lowpass",1800,200,e),Fe(n,t,.12,"sine",120,45,e*.8)}},flakBurst:{gap:.05,vol:.3,play:(n,t,e)=>dn(n,t,.4,"bandpass",900,250,e,.6)},missile:{gap:.1,vol:.35,play:(n,t,e)=>{dn(n,t,.9,"bandpass",500,2600,e,2),dn(n,t,.25,"lowpass",900,200,e*.8)}},boom:{gap:.04,vol:.55,play:(n,t,e)=>{dn(n,t,.9,"lowpass",700,60,e),Fe(n,t,.5,"sine",70,28,e)}},boomBig:{gap:.15,vol:.9,play:(n,t,e)=>{dn(n,t,2,"lowpass",500,40,e),Fe(n,t,1,"sine",55,22,e*1.2)}},splash:{gap:.05,vol:.4,play:(n,t,e)=>{dn(n,t,.6,"bandpass",1400,300,e,.7),Fe(n,t,.2,"sine",90,40,e*.6)}},bombDrop:{gap:.25,vol:.12,play:(n,t,e)=>Fe(n,t,.9,"sine",1400,500,e,.05)},plane:{gap:1.2,vol:.2,play:(n,t,e)=>{let i=Fe(n,t,2.2,"sawtooth",95,80,e,.4),s=Ee.createOscillator(),r=Ee.createGain();s.frequency.value=18,r.gain.value=12,s.connect(r),r.connect(i.frequency),s.start(t),s.stop(t+2.3)}},landing:{gap:1,vol:.2,play:(n,t,e)=>{Fe(n,t,.5,"square",196,190,e,.05)}},alarm:{gap:2,vol:.28,ui:!0,play:(n,t,e)=>{for(let i=0;i<3;i++)Fe(n,t+i*.8,.4,"sine",620,900,e,.05),Fe(n,t+i*.8+.4,.4,"sine",900,620,e,.02)}},victory:{gap:1,vol:.22,ui:!0,play:(n,t,e)=>{[523,659,784,1046].forEach((i,s)=>Fe(n,t+s*.11,.5,"triangle",i,i,e,.01))}},build:{gap:.05,vol:.35,ui:!0,play:(n,t,e)=>{Fe(n,t,.18,"sine",220,70,e),dn(n,t,.1,"lowpass",2500,400,e*.6)}},upgrade:{gap:.1,vol:.25,ui:!0,play:(n,t,e)=>{[392,523,659].forEach((i,s)=>Fe(n,t+s*.07,.25,"triangle",i,i,e,.01))}},click:{gap:.03,vol:.12,ui:!0,play:(n,t,e)=>Fe(n,t,.05,"sine",1100,800,e)},error:{gap:.15,vol:.18,ui:!0,play:(n,t,e)=>{Fe(n,t,.16,"square",160,120,e)}},demolish:{gap:.1,vol:.35,ui:!0,play:(n,t,e)=>{dn(n,t,.5,"lowpass",1500,100,e)}}};function Ot(n,t,e){if(!Ee||Ee.state!=="running"||he.volume<=0)return;let i=GM[n];if(!i)return;let s=Ee.currentTime;if(ou[n]&&s-ou[n]<i.gap||ru>32)return;let r=i.vol,o=0;if(t!==void 0&&!i.ui){let l=t-fi.x,c=e-fi.z,h=Math.hypot(l,c);if(r*=1/(1+(h/16)**2)*Math.min(1.4,32/Math.max(12,fi.dist)),r<.01)return;o=Math.max(-.9,Math.min(.9,(l*Math.cos(fi.yaw)-c*Math.sin(fi.yaw))/(h+6)))}ou[n]=s;let a=Ee.createStereoPanner();a.pan.value=o,a.connect(ir),ru++,setTimeout(()=>{ru--,a.disconnect()},2600),i.play(a,s,r)}var el=6,$t=(n,t)=>n+Math.random()*(t-n),hu=3;function fs(){return hu<=0?!1:(hu--,!0)}function oo(n){let t=14+8*n+.75*n*n,e=[];if(n>=10&&n%5===0){let h=1+Math.floor((n-10)/10);for(let u=0;u<h;u++)e.push("battleship");t-=110*h}let i=Object.entries(Pn).filter(([,h])=>h.cost&&h.weight&&n>=h.minWave);for(n<=2&&(e.push("landing"),t-=Pn.landing.cost);t>=6;){let h=i.filter(([,g])=>g.cost<=t);if(!h.length)break;let u=0;for(let[,g]of h)u+=g.weight;let d=Math.random()*u,f=h[0][0];for(let[g,x]of h)if(d-=x.weight,d<=0){f=g;break}e.push(f),t-=Pn[f].cost}let s=n<3?1:n<8?2:3,r=[],o=Math.random()*Math.PI*2;for(let h=0;h<s;h++)r.push(o+h*Math.PI*2/s+$t(-.5,.5));for(let h=e.length-1;h>0;h--){let u=Math.floor(Math.random()*(h+1));[e[h],e[u]]=[e[u],e[h]]}let a=0,l=e.map((h,u)=>(a+=$t(.5,1.8)*(Pn[h].domain==="air"?1.4:1),{t:a,type:h,dir:r[u%s]+$t(-.22,.22)})),c={};for(let h of e)c[h]=(c[h]||0)+1;return{n,queue:l,dirs:r,counts:c}}var Cp=n=>1+.05*(n-1)+.0025*(n-1)*(n-1),Ip=n=>1+.04*(n-1);function WM(n){let t=v.wave;if(t.state==="prep")t.timer-=n,t.timer<=0&&XM();else{for(t.elapsed+=n;t.queue.length&&t.queue[0].t<=t.elapsed;){let e=t.queue.shift();xu(e.type,e.dir,t.current),t.lastSpawn=t.elapsed}if(!t.queue.length){let e=0;for(let i of v.enemies)i.team==="E"&&!i.gone&&e++;if(e&&t.elapsed>(t.lastSpawn||0)+240){for(let i of v.enemies)i.gone=!0;Fi("The last raiders have withdrawn.","good"),e=0}e===0&&qM()}}}function XM(){let n=v.wave;n.state="active",n.current=n.n,n.elapsed=0,n.queue=n.plan.queue.map(t=>({...t})),n.total=n.queue.length,Fi(`Wave ${n.current} is here! ${$M(n.plan.dirs)}`,"alert"),Ot("alarm")}function qM(){let n=v.wave,t=30+12*n.current;v.res.gold+=t,v.stats.waves=n.current,Fi(`Wave ${n.current} repelled. +${t} gold`,"good"),Ot("victory"),n.n=n.current+1,n.state="prep",n.timer=Yf,n.plan=oo(n.n),n.current===Qs&&!v.victory&&(v.victory=!0,v.onVictory&&v.onVictory()),io()}function Pp(){let n=v.wave;if(n.state!=="prep")return 0;let t=Math.floor(n.timer*.6);return v.res.gold+=t,n.timer=0,t}var YM=["north","north-east","east","south-east","south","south-west","west","north-west"];function gu(n){let t=(Math.atan2(Math.sin(n),-Math.cos(n))/(Math.PI*2)*8+8.5)%8;return YM[Math.floor(t)]}function $M(n){return"Incoming from the "+[...new Set(n.map(gu))].join(", ").replace(/, ([^,]*)$/," and $1")+"."}function ZM(n){let t=S.edge[0],e=9;for(let i of S.edge){let s=Math.abs(hi(Math.atan2(S.x[i],S.z[i]),n));s<e&&(e=s,t=i)}return t}function nl(n,t,e){return{type:n,def:t,team:e,domain:t.domain||"ground",x:0,y:0,z:0,yaw:0,bank:0,pitch:0,vx:0,vy:0,vz:0,hp:t.hp,maxHp:t.hp,alive:!0,dying:0,gone:!1,state:"approach",path:null,pi:0,target:null,foe:null,cool:$t(.5,2),think:$t(0,.5),phase:$t(0,6.28),ox:$t(-.3,.3),oz:$t(-.3,.3),born:v.time}}function xu(n,t,e){let i=Pn[n],s=nl(n,i,"E");if(s.hp=s.maxHp=i.hp*Cp(e),s.dm=Ip(e),s.wave=e,i.domain==="sea"){let r=ZM(t);s.x=S.x[r],s.z=S.z[r],s.yaw=Math.atan2(-s.x,-s.z),i.troops&&(s.troops=i.troops+Math.floor((e-1)/4))}else{if(s.x=Math.sin(t)*72,s.z=Math.cos(t)*72,s.alt=i.alt+$t(0,1.5),s.y=s.alt,s.yaw=t+Math.PI,s.bombs=i.bombs||0,s.rockets=i.rockets||0,s.passes=0,n==="bomber"){let o=Dp(s)||v.hq||{x:0,z:0},a=o.x+$t(-2.5,2.5),l=o.z+$t(-2.5,2.5),c=a-s.x,h=l-s.z,u=Math.hypot(c,h);s.wpx=a,s.wpz=l,s.exx=a+c/u*90,s.exz=l+h/u*90,s.gcool=0}Ot("plane",s.x,s.z)}return v.enemies.push(s),s}function vu(n,t,e){let i=Pn.infantry,s=nl("infantry",i,"E");s.hp=s.maxHp=i.hp*Cp(e),s.dm=Ip(e),s.x=n+$t(-.35,.35),s.z=t+$t(-.35,.35),s.y=js(s.x,s.z),s.yaw=Math.atan2(-s.x,-s.z),v.enemies.push(s)}function JM(n){let t=Yr.soldier,e=nl("soldier",t,"A");e.hp=e.maxHp=t.hp*v.mod.soldier,e.home=n;let i=$t(0,6.28);e.postX=n.x+Math.cos(i)*$t(.9,1.6),e.postZ=n.z+Math.sin(i)*$t(.9,1.6),e.x=n.x,e.z=n.z,e.y=n.y,n.units.push(e),v.allies.push(e),Gn(e.x,e.y,e.z,.4)}function KM(n,t){let e=Yr.fighter,i=nl("ally_fighter",e,"A");i.domain="air",i.hp=i.maxHp=e.hp,i.home=n,i.slot=t,i.alt=4.5,i.state="parked",uu(i),n.units.push(i),v.allies.push(i)}function uu(n){let t=n.home,e=-.55+n.slot*.42;n.x=t.x+Math.cos(t.yaw)*.18+Math.sin(t.yaw)*e,n.z=t.z-Math.sin(t.yaw)*.18+Math.cos(t.yaw)*e,n.y=t.y+.1,n.yaw=t.yaw,n.bank=0,n.pitch=0,n.speed=0,n.vx=n.vy=n.vz=0}function Gi(n,t,e){if(n.alive&&(n.hp-=t,n.hitT=.12,n.hp<=0)){if(n.hp=0,n.alive=!1,n.team==="E"){v.stats.kills++;let i=Math.round((n.def.bounty||0)*(1+.03*(n.wave||1)));v.res.gold+=i,e&&e.kills!=null&&e.kills++}if(n.domain==="sea"?(n.dying=3.5,en(n.x,.3,n.z,n.def.radius*1.3,!0),Ot("boomBig",n.x,n.z),ps(n.x,n.z,.3*n.def.radius)):n.domain==="air"?(n.dying=6,n.vy=0,en(n.x,n.y,n.z,.6,!1),Ot("boom",n.x,n.z)):(n.dying=.01,Gn(n.x,n.y,n.z,.5)),n.team==="A"&&n.home&&n.home.units){let i=n.home.units.indexOf(n);i>=0&&n.home.units.splice(i,1),n.type==="ally_fighter"&&(n.home.respawn=(n.home.respawn||[]).concat(v.time+22))}}}function ps(n,t,e){v.shakeReq=Math.max(v.shakeReq||0,e,0),v.shakeAt={x:n,z:t}}function lu(n,t,e,i){let s=e*e;for(let r=v.buildings.length-1;r>=0;r--){let o=v.buildings[r],a=o.x-n,l=o.z-t,c=a*a+l*l;if(c>s+.5)continue;let h=1-.5*Math.min(1,Math.sqrt(c)/(e+.7));eu(o,i*h)}for(let r of v.allies){if(!r.alive||r.domain!=="ground")continue;let o=r.x-n,a=r.z-t;o*o+a*a<=s&&Gi(r,i*.5)}}function cu(n,t,e,i,s,r,o){let a=i*i;for(let l of v.enemies){if(!l.alive)continue;let c=r[l.domain];if(!c)continue;let h=l.x-n,u=l.z-e,d=l.domain==="air"?l.y-t:0,f=l.def.radius||.4,g=h*h+u*u+d*d;if(g>(i+f)*(i+f))continue;let x=1-.5*Math.min(1,Math.sqrt(g)/(i+f));Gi(l,s*c*x,o)}}function sr(n){return v.projectiles.push(n),n}function ao(n,t,e,i,s,r,o=!1){sr({kind:"tracer",sx:n,sy:t,sz:e,ex:i,ey:s,ez:r,t:0,T:.09,enemy:o})}function Lp(n,t,e,i,s,r,o,a,l,c,h=16){let u=Math.hypot(i-n,s-e),d=tn(i,s),f=d>=0&&Re(S.type[d])?S.h[d]:0;return sr({kind:"shell",sx:n,sy:t,sz:e,ex:i,ey:f,ez:s,x:n,y:t,z:e,t:0,T:.45+u/h,apex:.5+u*.16,dmg:r,splash:o,team:a,hits:l,src:c,water:f===0})}function jM(n){let t=v.projectiles;for(let e=t.length-1;e>=0;e--){let i=t[e],s=!1;switch(i.kind){case"tracer":i.t+=n,s=i.t>=i.T;break;case"shell":{i.t+=n;let r=Math.min(1,i.t/i.T);i.x=Ue(i.sx,i.ex,r),i.z=Ue(i.sz,i.ez,r),i.y=Ue(i.sy,i.ey,r)+i.apex*4*r*(1-r),r>=1&&(s=!0,i.team==="P"?cu(i.x,i.y,i.z,i.splash,i.dmg,i.hits,i.src):lu(i.x,i.z,i.splash,i.dmg),en(i.x,i.y,i.z,.45+i.splash*.3,i.water),Ot(i.water?"splash":"boom",i.x,i.z),i.water||ps(i.x,i.z,.08));break}case"flak":{i.t+=n;let r=Math.min(1,i.t/i.T);i.x=Ue(i.sx,i.ex,r),i.y=Ue(i.sy,i.ey,r),i.z=Ue(i.sz,i.ez,r),r>=1&&(s=!0,cu(i.x,i.y,i.z,i.splash,i.dmg,{air:1},i.src),op(i.x,i.y,i.z,.6+i.splash*.2),Ot("flakBurst",i.x,i.z));break}case"bomb":{i.vy-=el*n,i.x+=i.vx*n,i.y+=i.vy*n,i.z+=i.vz*n;let r=js(i.x,i.z);if(i.y<=r){s=!0;let o=r===0;lu(i.x,i.z,i.splash,i.dmg),en(i.x,r,i.z,.9,o),Ot(o?"splash":"boom",i.x,i.z),ps(i.x,i.z,.18)}break}case"rocket":{i.t+=n;let r=Math.min(1,i.t/i.T);i.x=Ue(i.sx,i.ex,r),i.y=Ue(i.sy,i.ey,r),i.z=Ue(i.sz,i.ez,r),i.trailT=(i.trailT||0)-n,i.trailT<=0&&(i.trailT=.025,ka(i.x,i.y,i.z,.8)),r>=1&&(s=!0,lu(i.x,i.z,i.splash,i.dmg),en(i.x,i.y,i.z,.8,i.ey===0),Ot("boom",i.x,i.z),ps(i.x,i.z,.15));break}case"missile":{i.t+=n;let r=i.target;if(!r||!r.alive){i.target=null;let l=null,c=64;for(let h of v.enemies){if(!h.alive||!i.hits[h.domain])continue;let u=(h.x-i.x)**2+(h.z-i.z)**2;u<c&&(c=u,l=h)}i.target=l}let o=15;if(i.target){let l=i.target,c=l.domain==="air"?l.y:.3,h=l.x-i.x,u=c-i.y,d=l.z-i.z,f=Math.hypot(h,u,d)||1;if(f<.7){s=!0,Gi(l,i.dmg*(i.hits[l.domain]||1),i.src),cu(i.x,i.y,i.z,i.splash,i.dmg*.4,i.hits,i.src),en(i.x,i.y,i.z,.8,l.domain==="sea"),Ot("boom",i.x,i.z);break}let g=Math.min(1,n*(i.t<.35?2:7));i.vx+=(h/f*o-i.vx)*g,i.vy+=(u/f*o-i.vy)*g,i.vz+=(d/f*o-i.vz)*g}let a=Math.hypot(i.vx,i.vy,i.vz)||1;i.vx*=o/a,i.vy*=o/a,i.vz*=o/a,i.x+=i.vx*n,i.y+=i.vy*n,i.z+=i.vz*n,i.trailT=(i.trailT||0)-n,i.trailT<=0&&(i.trailT=.02,ka(i.x,i.y,i.z,1)),(i.t>5||i.y<js(i.x,i.z)-.1)&&(s=!0,en(i.x,Math.max(i.y,0),i.z,.5,i.y<=.05));break}}s&&(t[e]=t[t.length-1],t.pop())}}function QM(n,t,e){let i=null,s=1/0,r=t*t;for(let o of v.enemies){if(!o.alive)continue;let a=e[o.domain];if(!a)continue;let l=o.x-n.x,c=o.z-n.z,h=l*l+c*c;if(h>r)continue;let u=h/a;u<s&&(s=u,i=o)}return i}function tb(n,t,e,i){let s,r,o;if(n.type==="hq")s=n.x-.3,r=n.y+1.2,o=n.z-.3;else{let l=i.muzzle||.3;s=n.x+Math.sin(n.headYaw)*l,r=n.y+(i.headY||.2)+.12,o=n.z+Math.cos(n.headYaw)*l}let a=Math.hypot(t.x-n.x,t.z-n.z);switch(v.stats.shots++,i.kind){case"mg":{let l=(i.acc||.8)*(t.domain==="air"?.75:1),c=Math.random()<l,h=t.domain==="air"?t.y:t.y+(t.domain==="ground"?.18:.2),u=c?.12:.7;ao(s,r,o,t.x+$t(-u,u),h+$t(-u,u)*.5,t.z+$t(-u,u)),c&&Gi(t,e.dmg*i.targets[t.domain],n),Math.random()<.5&&er(s,r,o,.6),Ot("mg",n.x,n.z);break}case"shell":{let l=.45+a/16,c=.25+a*.03,h=t.x+t.vx*l+$t(-c,c),u=t.z+t.vz*l+$t(-c,c);Lp(s,r,o,h,u,e.dmg,e.splash,"P",i.targets,n),er(s,r,o,1.6),Ot("cannon",n.x,n.z);break}case"flak":{let l=Math.hypot(t.x-s,t.y-r,t.z-o)/28,c=t.x+t.vx*l,h=t.y+t.vy*l,u=t.z+t.vz*l;l=Math.hypot(c-s,h-r,u-o)/28;let d=.55;sr({kind:"flak",sx:s,sy:r,sz:o,ex:t.x+t.vx*l+$t(-d,d),ey:t.y+t.vy*l+$t(-d,d),ez:t.z+t.vz*l+$t(-d,d),x:s,y:r,z:o,t:0,T:l,dmg:e.dmg,splash:e.splash,src:n}),er(s,r,o,1.1),Ot("flak",n.x,n.z);break}case"missile":{sr({kind:"missile",x:s,y:r,z:o,vx:Math.sin(n.headYaw)*6,vy:8,vz:Math.cos(n.headYaw)*6,t:0,target:t,dmg:e.dmg,splash:e.splash,hits:i.targets,src:n}),er(s,r,o,1.3),Ot("missile",n.x,n.z);break}}}function eb(n,t){let e=n.def.weapon,i=n.ws;if(!n.connected||!i){n.target=null,n.headYaw+=t*.1;return}n.cool-=t,n.scan-=t;let s=n.target;if(s&&(!s.alive||(s.x-n.x)**2+(s.z-n.z)**2>i.range*i.range)&&(s=n.target=null),!s&&n.scan<=0&&(n.scan=.12+Math.random()*.1,s=n.target=QM(n,i.range,e.targets)),s){let r=hi(Math.atan2(s.x-n.x,s.z-n.z),n.headYaw),o=(e.kind==="mg"?10:e.kind==="flak"?5:3.2)*t;n.headYaw+=Ie(r,-o,o),n.cool<=0&&Math.abs(r)<(e.aim||.6)&&(tb(n,s,i,e),n.cool=Math.max(n.cool,-.05)+1/i.rate)}else n.headYaw+=t*.25,n.cool<0&&(n.cool=0)}function il(n){return n.def.units+2*(n.level-1)+v.mod.barracksCap}function yu(n){return n.def.units+(n.level-1)}function nb(n){for(let t=v.buildings.length-1;t>=0;t--){let e=v.buildings[t];if(e){if(e.flash>0&&(e.flash=Math.max(0,e.flash-n*5)),e.hp<e.maxHp&&e.connected&&v.time-e.lastHit>6&&(e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.015*v.mod.repair*n)),e.hp<e.maxHp*.55&&(e.burnT-=n,e.burnT<=0&&(e.burnT=.22+Math.random()*.2,Jh(e.x,e.y+.5,e.z,.8,.13),e.hp<e.maxHp*.3&&Ba(e.x,e.y+.3,e.z,.8))),e.type==="radar")e.headYaw+=n*(e.connected?1.6:.2);else if(e.type==="barracks")e.connected&&e.units.length<il(e)&&(e.trainT+=n*Math.max(.3,v.eff),e.trainT>=9&&(e.trainT=0,JM(e)));else if(e.type==="airfield"&&e.connected){e.respawn&&e.respawn.length&&e.respawn[0]<=v.time&&e.respawn.shift();let i=e.respawn?e.respawn.length:0;if(e.units.length+i<yu(e)){let s=new Set(e.units.map(o=>o.slot)),r=0;for(;s.has(r);)r++;KM(e,r)}}e.ws&&eb(e,n)}}}function du(n,t,e){let i=null,s=1/0;for(let r of v.buildings){if(!r.alive||e&&!e(r))continue;let o=(r.x-n)**2+(r.z-t)**2;o<s&&(s=o,i=r)}return i}var Qa=n=>In(S.type[n])?1:0,ib=n=>{let t=S.type[n];return Bn(t)?S.road[n]?.8:t===mt.FOREST?1.5:t===mt.HILLS?2:1:0};function ro(n,t){let e=tn(n.x,n.z);if(e>=0&&(t?In(S.type[e]):Bn(S.type[e])))return e;let i=-1,s=1/0;if(e<0)return-1;for(let r=0;r<6;r++){let o=S.nbr[e*6+r];if(!(o<0)&&(t?In(S.type[o]):Bn(S.type[o]))){let a=(S.x[o]-n.x)**2+(S.z[o]-n.z)**2;a<s&&(s=a,i=o)}}return i}function sb(n){let t=new Set;for(let a=0;a<4;a++){let l=du(n.x,n.z,x=>!t.has(x));if(!l)return!1;t.add(l);let c=n.def.range*.85,h=l.x,u=l.z,d=!1;for(let x of S.shore)if((S.x[x]-h)**2+(S.z[x]-u)**2<=c*c){d=!0;break}if(!d)continue;let f=ro(n,!0),g=Bi(f,Qa,x=>Math.hypot(S.x[x]-h,S.z[x]-u)<=c,x=>Math.max(0,Math.hypot(S.x[x]-h,S.z[x]-u)-c)/1.732);if(g)return n.target=l,n.path=g,n.pi=1,n.idleT=0,!0}let e=du(n.x,n.z);if(!e)return!1;let i=-1,s=1/0;for(let a of S.shore){let l=(S.x[a]-e.x)**2+(S.z[a]-e.z)**2;l<s&&(s=l,i=a)}if(i<0)return!1;let r=ro(n,!0),o=Bi(r,Qa,a=>a===i,a=>Math.hypot(S.x[a]-S.x[i],S.z[a]-S.z[i])/1.732);return o?(n.target=e,n.path=o,n.pi=1,n.idleT=0,!0):!1}function rb(n){let t=v.hq||{x:0,z:0},e=-1,i=1/0,s=-1;for(let a of S.landing){let l=-1,c=1/0;for(let u=0;u<6;u++){let d=S.nbr[a*6+u];if(d>=0&&Bn(S.type[d])){let f=Math.hypot(S.x[d]-t.x,S.z[d]-t.z);f<c&&(c=f,l=d)}}if(l<0)continue;let h=Math.hypot(S.x[a]-n.x,S.z[a]-n.z)+.7*c+Math.random()*6;h<i&&(i=h,e=a,s=l)}if(e<0)return!1;let r=ro(n,!0),o=Bi(r,Qa,a=>a===e,a=>Math.hypot(S.x[a]-S.x[e],S.z[a]-S.z[e])/1.732);return o?(n.path=o,n.pi=1,n.landTile=s,!0):!1}function Ap(n){let t=ro(n,!0),e=S.R,i=Bi(t,Qa,s=>kn(S.q[s],S.r[s],0,0)>=e,s=>e-kn(S.q[s],S.r[s],0,0));n.path=i,n.pi=1}function ja(n,t){let e=n.def;if(!n.path||n.pi>=n.path.length)return n.vx*=.95,n.vz*=.95,n.x+=n.vx*t,n.z+=n.vz*t,!0;let i=n.path[n.pi],s=S.x[i]-n.x,r=S.z[i]-n.z,o=Math.hypot(s,r),a=n.pi===n.path.length-1;if(o<(a?.4:1))return n.pi++,n.pi>=n.path.length;let l=hi(Math.atan2(s,r),n.yaw);n.yaw+=Ie(l,-e.turn*t,e.turn*t);let c=Ie(1-Math.abs(l)/1.5,.2,1)*(a?Ie(o/1.5,.3,1):1),h=e.speed*c,u=n.x+Math.sin(n.yaw)*h*t,d=n.z+Math.cos(n.yaw)*h*t,f=tn(u,d);if(f<0||In(S.type[f]))n.vx=(u-n.x)/t,n.vz=(d-n.z)/t,n.x=u,n.z=d;else{let g=Math.min(o,e.speed*.6*t);n.vx=s/o*e.speed*.6,n.vz=r/o*e.speed*.6,n.x+=s/o*g,n.z+=r/o*g,n.yaw+=Ie(l,-e.turn*2*t,e.turn*2*t)}return!1}function ob(n,t){let e=n.def;if(n.dying){n.dying-=t,n.y-=t*.22*(1+e.radius),n.pitch+=t*.12,n.bank+=t*.08,Math.random()<t*8&&Jh(n.x+$t(-.3,.3),Math.max(0,n.y+.4),n.z+$t(-.3,.3),e.radius,.1),Math.random()<t*6&&Ba(n.x,Math.max(0,n.y+.2),n.z,e.radius),n.dying<=0&&(n.gone=!0);return}if(n.think-=t,n.cool-=t,n.state==="leave"&&!e.troops)!n.path&&n.think<=0&&fs()&&(n.think=2,Ap(n),n.path||(n.gone=!0)),n.path&&ja(n,t)&&(n.gone=!0);else if(e.troops)if(n.state==="approach"){if(!n.path&&n.think<=0&&fs()&&(n.think=1,rb(n)||(n.state="leave")),n.path&&ja(n,t)){let s=n.landTile;for(let r=0;r<n.troops;r++)vu(S.x[s],S.z[s],n.wave);n.troops=0,n.state="leave",n.path=null,n.think=1.5,Ot("landing",n.x,n.z)}}else!n.path&&n.think<=0&&fs()&&(n.think=2,Ap(n)),n.path&&ja(n,t)&&(n.gone=!0),!n.path&&n.think>1.9&&(n.gone=!0);else{(!n.target||!n.target.alive)&&n.think<=0&&fs()&&(n.think=.8,sb(n)||(n.target=null,n.path=null,n.state="leave"));let s=n.target&&n.target.alive?n.target:null,r=s?Math.hypot(s.x-n.x,s.z-n.z):1/0,o;if(r<=e.range*.92)o=!0,n.vx*=1-Math.min(1,t*2),n.vz*=1-Math.min(1,t*2),n.x+=n.vx*t,n.z+=n.vz*t;else{o=ja(n,t);let a=n.path&&n.path.length?n.path[n.path.length-1]:-1,l=o||a>=0&&Math.hypot(S.x[a]-n.x,S.z[a]-n.z)<1.8;s&&l&&(n.idleT=(n.idleT||0)+t,n.idleT>20&&(n.state="leave",n.path=null,n.think=0))}if(s){let a=r;if(o){let l=hi(Math.atan2(s.x-n.x,s.z-n.z)+Math.PI/2*(n.phase>3.14?1:-1)*(e.radius>.8?1:0),n.yaw);n.yaw+=Ie(l,-e.turn*.5*t,e.turn*.5*t)}if(a<=e.range&&n.cool<=0){n.cool=1/e.rate*$t(.85,1.15);let l=.4+a*.06,c=n.x+Math.sin(n.yaw)*e.radius*.5,h=n.z+Math.cos(n.yaw)*e.radius*.5;Lp(c,.45,h,s.x+$t(-l,l),s.z+$t(-l,l),e.dmg*n.dm,e.splash,"E",null,n,13),er(c,.45,h,.8+e.radius),Ot(e.radius>.8?"cannon":"gun",n.x,n.z)}}}for(let s of v.enemies){if(s===n||s.domain!=="sea"||s.dying)continue;let r=n.x-s.x,o=n.z-s.z,a=r*r+o*o,l=e.radius+s.def.radius;if(a<l*l&&a>1e-4){let c=Math.sqrt(a),h=(l-c)*.5*Math.min(1,t*4),u=n.x+r/c*h,d=n.z+o/c*h,f=tn(u,d);f>=0&&In(S.type[f])&&(n.x=u,n.z=d)}}n.y=Math.sin(v.time*1.6+n.phase)*.03,n.pitch=Math.sin(v.time*1.3+n.phase)*.025,n.bank=Math.sin(v.time*1.1+n.phase*2)*.035,n.vx*n.vx+n.vz*n.vz>.3&&(n.wakeT=(n.wakeT||0)-t,n.wakeT<=0&&(n.wakeT=.07,ap(n.x-Math.sin(n.yaw)*e.radius*.8,n.z-Math.cos(n.yaw)*e.radius*.8,e.radius)))}function ms(n,t,e,i,s,r){let o=hi(Math.atan2(t-n.x,e-n.z),n.yaw),a=Ie(o,-s*i,s*i);return n.yaw+=a,n.bank+=(Ie(-o*1.4,-1,1)*.85-n.bank)*Math.min(1,i*3),n.vx=Math.sin(n.yaw)*r,n.vz=Math.cos(n.yaw)*r,n.x+=n.vx*i,n.z+=n.vz*i,o}function Vi(n,t,e,i=1.5){let s=Ie(t-n.y,-i*e,i*e);n.y+=s,n.vy=s/Math.max(e,1e-4),n.pitch+=(Ie(-n.vy*.12,-.5,.5)-n.pitch)*Math.min(1,e*3)}function Dp(n){let t=0,e=[];for(let s of v.buildings){if(!s.alive)continue;let o=(s.def.weapon||s.type==="airfield"||s.type==="barracks"||s.type==="radar"?3:s.type==="hq"?2:1)/(1+Math.hypot(s.x-n.x,s.z-n.z)/25);e.push(s,o),t+=o}let i=Math.random()*t;for(let s=0;s<e.length;s+=2)if(i-=e[s+1],i<=0)return e[s];return e[0]||null}function Up(n,t){n.dying-=t,n.vy-=el*.7*t,n.y+=n.vy*t,n.x+=n.vx*.85*t,n.z+=n.vz*.85*t,n.bank+=t*4,n.pitch=Ie(-n.vy*.08,-.9,.9),n.trailT=(n.trailT||0)-t,n.trailT<=0&&(n.trailT=.03,ka(n.x,n.y,n.z,1.2,!0),Ba(n.x,n.y,n.z,.5));let e=js(n.x,n.z);(n.y<=e||n.dying<=0)&&(en(n.x,e,n.z,n.def.radius||.7,e===0),Ot(e===0?"splash":"boom",n.x,n.z),n.gone=!0)}function Np(n){sr({kind:"bomb",x:n.x,y:n.y-.15,z:n.z,vx:n.vx,vy:0,vz:n.vz,dmg:n.def.bombDmg*n.dm,splash:n.def.splash}),Ot("bombDrop",n.x,n.z)}function Fp(n,t){let e=Math.hypot(n.x,n.z)||1;ms(n,n.x+n.x/e*50,n.z+n.z/e*50,t,n.def.turn,n.def.speed),Vi(n,n.alt+2,t),e>80&&(n.gone=!0)}function ab(n,t,e){let i=n.def;if(n.state==="approach"||n.state==="attack"){if((!n.target||!n.target.alive)&&(n.target=Dp(n),!n.target)){n.state="leave";return}let s=n.target,r=Math.hypot(s.x-n.x,s.z-n.z),o=ms(n,s.x,s.z,t,i.turn,i.speed);if(e)if(Vi(n,Math.max(3.5,n.alt-(r<14?2.5:0)),t,2),r<8.5&&Math.abs(o)<.12&&n.rockets>0){for(let a=0;a<2&&n.rockets>0;a++,n.rockets--){let l=Math.cos(n.yaw)*(a?.3:-.3),c=-Math.sin(n.yaw)*(a?.3:-.3),h=n.x+l,u=n.z+c,d=Math.hypot(s.x-h,s.y-n.y,s.z-u);sr({kind:"rocket",sx:h,sy:n.y-.1,sz:u,ex:s.x+$t(-.4,.4),ey:s.y+.2,ez:s.z+$t(-.4,.4),x:h,y:n.y,z:u,t:0,T:d/18,dmg:i.rocketDmg*n.dm,splash:i.splash})}Ot("missile",n.x,n.z),n.state="egress",n.egT=2.6,n.passes++}else r<4&&Math.abs(o)>.4&&(n.state="egress",n.egT=2,n.passes++);else{Vi(n,n.alt,t);let a=i.speed*Math.sqrt(2*Math.max(.5,n.y-s.y)/el);r<=a&&((Math.abs(o)<.12||n.passes>=4)&&(Np(n),n.bombs--),n.state="egress",n.egT=2.4,n.passes++)}}else if(n.state==="egress"){if(ms(n,n.x+Math.sin(n.yaw)*10,n.z+Math.cos(n.yaw)*10,t,i.turn,i.speed),Vi(n,n.alt,t),n.egT-=t,n.egT<=0){let s=e?n.rockets:n.bombs;n.state=s>0&&n.passes<8?"attack":"leave",n.target=null}}else Fp(n,t)}function lb(n,t){let e=n.def;if(n.state==="approach"?(ms(n,n.wpx,n.wpz,t,e.turn,e.speed),Math.hypot(n.wpx-n.x,n.wpz-n.z)<3&&(n.state="run")):(ms(n,n.exx,n.exz,t,e.turn,e.speed),Math.hypot(n.x,n.z)>82&&(n.gone=!0)),Vi(n,n.alt,t),n.cool-=t,n.bombs>0&&n.cool<=0){let i=Math.sqrt(2*n.y/el),s=tn(n.x+n.vx*i,n.z+n.vz*i);s>=0&&S.bld[s]&&(Np(n),n.bombs--,n.cool=.32)}if(n.gcool-=t,n.gcool<=0){n.gcool=.4;for(let i of v.allies){if(!i.alive||i.domain!=="air"||i.state==="parked")continue;if(Math.hypot(i.x-n.x,i.y-n.y,i.z-n.z)<4.5){ao(n.x,n.y,n.z,i.x+$t(-.3,.3),i.y,i.z+$t(-.3,.3),!0),Math.random()<.5&&Gi(i,5*n.dm);break}}}}function cb(n,t){if(n.dying){Up(n,t);return}n.type==="bomber"?lb(n,t):ab(n,t,n.type==="jet")}function fu(n,t,e,i,s,r=!1){let o=t-n.x,a=e-n.z,l=Math.hypot(o,a);if(l<.02)return n.vx=n.vz=0,!0;let c=Math.min(l,i*s),h=n.x+o/l*c,u=n.z+a/l*c,d=tn(h,u);if(!r&&(d<0||!Bn(S.type[d])))if(d=tn(h,n.z),d>=0&&Bn(S.type[d]))u=n.z;else if(d=tn(n.x,u),d>=0&&Bn(S.type[d]))h=n.x;else return n.vx=n.vz=0,!1;return n.vx=(h-n.x)/s,n.vz=(u-n.z)/s,n.x=h,n.z=u,n.yaw+=Ie(hi(Math.atan2(o,a),n.yaw),-8*s,8*s),l<i*s+.05}function pu(n,t,e){if(!n.path||n.pi>=n.path.length)return!0;let i=n.path[n.pi],s=n.pi===n.path.length-1,r=S.x[i]+(n.force?0:n.ox),o=S.z[i]+(n.force?0:n.oz),a=n.x,l=n.z,c=fu(n,r,o,e,t,!!n.force);return n.force||(n.x===a&&n.z===l&&!c?(n.blockT=(n.blockT||0)+t,n.blockT>.3&&(n.force=!0)):n.blockT=0),(c||Math.hypot(r-n.x,o-n.z)<(s?.15:.5))&&(n.pi++,n.blockT=0,n.force=!1),n.pi>=n.path.length}function tl(n,t,e=1){let i=ro(n,!1),s=S.q[t],r=S.r[t];return Bi(i,ib,o=>kn(S.q[o],S.r[o],s,r)<=e,o=>Math.max(0,kn(S.q[o],S.r[o],s,r)-e),3e3)}function mu(n,t){let e=js(n.x,n.z);n.y+=(e-n.y)*Math.min(1,t*10)}function hb(n,t){let e=n.def;if(n.dying){n.gone=!0;return}if(n.think-=t,n.cool-=t,n.think<=0){n.think=$t(.35,.6),n.foe=null;let a=e.range*e.range;for(let l of v.allies){if(!l.alive||l.domain!=="ground")continue;let c=(l.x-n.x)**2+(l.z-n.z)**2;c<a&&(a=c,n.foe=l)}(!n.target||!n.target.alive)&&(n.target=du(n.x,n.z),n.path=null),n.target&&!n.path&&!n.foe&&fs()&&(n.path=tl(n,n.target.tile,1),n.pi=1,!n.path&&v.hq&&n.target!==v.hq&&(n.target=v.hq,n.path=tl(n,v.hq.tile,1)),n.path||(n.target=null))}let i=n.foe&&n.foe.alive?n.foe:null,s=i||n.target;if(!s){n.stuckT=(n.stuckT||0)+t,n.stuckT>20&&(n.gone=!0,Gn(n.x,n.y,n.z,.4)),mu(n,t);return}n.stuckT=0;let r=Math.hypot(s.x-n.x,s.z-n.z),o=e.range+(i?0:.6);r<=o?(n.vx=n.vz=0,n.yaw+=Ie(hi(Math.atan2(s.x-n.x,s.z-n.z),n.yaw),-8*t,8*t),n.cool<=0&&(n.cool=1/e.rate*$t(.8,1.2),ao(n.x,n.y+.2,n.z,s.x+$t(-.2,.2),s.y+.25,s.z+$t(-.2,.2),!0),i?Math.random()<.7&&Gi(i,e.dmg*n.dm):eu(s,e.dmg*n.dm),Ot("rifle",n.x,n.z))):n.path&&pu(n,t,e.speed)&&(n.path=null),mu(n,t)}function ub(n,t){let e=Yr.soldier;if(n.dying){n.gone=!0;return}n.think-=t,n.cool-=t;let i=n.home&&n.home.alive?n.home:null,s=i?i.x:n.x,r=i?i.z:n.z,o=i?i.def.guard:6;if(n.think<=0){n.think=$t(.3,.5);let c=null,h=1/0;for(let u of v.enemies){if(!u.alive||u.domain!=="ground"||(u.x-s)**2+(u.z-r)**2>o*o)continue;let d=(u.x-n.x)**2+(u.z-n.z)**2;d<h&&(h=d,c=u)}c!==n.foe&&(n.foe=c,n.path=null,n.repath=0)}let a=n.foe&&n.foe.alive?n.foe:null,l=e.dmg*v.mod.soldier;if(a)if(Math.hypot(a.x-n.x,a.z-n.z)<=e.range)n.vx=n.vz=0,n.yaw+=Ie(hi(Math.atan2(a.x-n.x,a.z-n.z),n.yaw),-8*t,8*t),n.cool<=0&&(n.cool=1/e.rate*$t(.8,1.2),ao(n.x,n.y+.2,n.z,a.x+$t(-.15,.15),a.y+.2,a.z+$t(-.15,.15)),Math.random()<.75&&Gi(a,l,n.home),Ot("rifle",n.x,n.z));else{if(n.repath=(n.repath||0)-t,(!n.path||n.repath<=0)&&fs()){n.repath=1;let h=tn(a.x,a.z);n.path=h>=0?tl(n,h,0):null,n.pi=1}n.path&&n.pi<n.path.length?pu(n,t,e.speed):fu(n,a.x,a.z,e.speed,t,!0)}else if(i){let c=Math.hypot(n.postX-n.x,n.postZ-n.z);c>3.5?(n.repath=(n.repath||0)-t,(!n.path||n.repath<=0)&&fs()&&(n.repath=2,n.path=tl(n,i.tile,0),n.pi=1),n.path&&pu(n,t,e.speed)&&(n.path=null)):c>.15?(n.path=null,fu(n,n.postX,n.postZ,e.speed*.6,t)):n.vx=n.vz=0}mu(n,t)}function db(n,t){let e=Yr.fighter;if(n.dying){Up(n,t);return}let i=n.home&&n.home.alive?n.home:null,s=e.speed*v.mod.fighterSpeed;if(n.state==="parked"){if(!i){n.gone=!0;return}if(uu(n),!i.connected)return;let o=!1;for(let a of v.enemies)if(a.alive&&(a.domain==="air"||a.domain==="sea")&&Math.hypot(a.x,a.z)<55){o=!0;break}o&&v.time>=(i.nextLaunch||0)&&(i.nextLaunch=v.time+1.2,n.state="takeoff",n.t=0,n.speed=1.5,Ot("plane",n.x,n.z));return}if(n.state==="takeoff"){n.t+=t,n.speed=Math.min(s,n.speed+s*.6*t),n.vx=Math.sin(n.yaw)*n.speed,n.vz=Math.cos(n.yaw)*n.speed,n.x+=n.vx*t,n.z+=n.vz*t,n.t>.8&&Vi(n,4.5,t,2.2),n.t>2.5&&(n.state="engage",n.think=0);return}if(n.think-=t,n.cool-=t,n.think<=0){n.think=.5;let o=null,a=1/0;for(let l of v.enemies){if(!l.alive||l.domain!=="air"&&l.domain!=="sea"||Math.hypot(l.x,l.z)>50)continue;let c=Math.hypot(l.x-n.x,l.z-n.z)*(l.domain==="air"?.5:1);c<a&&(a=c,o=l)}n.target=o,n.state=o?"engage":"return"}let r=n.target&&n.target.alive?n.target:null;if(n.state==="engage"&&r){let o=ms(n,r.x-r.vx*.2,r.z-r.vz*.2,t,e.turn,s);if(Vi(n,r.domain==="air"?r.y:2,t,3),Math.hypot(r.x-n.x,r.y-n.y,r.z-n.z)<e.range&&Math.abs(o)<.35&&n.cool<=0){n.cool=1/e.rate;let l=Math.random()<e.acc;ao(n.x+Math.sin(n.yaw)*.3,n.y,n.z+Math.cos(n.yaw)*.3,r.x+$t(-.3,.3),r.y+.1,r.z+$t(-.3,.3)),l&&Gi(r,e.dmg*v.mod.fighterDmg*(r.domain==="sea"?.7:1),i),Ot("mg",n.x,n.z)}}else{if(!i)return Fp(n,t),n.gone,void 0;let o=Math.hypot(i.x-n.x,i.z-n.z);ms(n,i.x,i.z,t,e.turn,o<6?s*.6:s),Vi(n,o<6?i.y+.6:4.5,t,2),o<1.2&&(n.state="parked",uu(n))}}function zp(n){hu=3,WM(n),nb(n);let t=v.enemies;for(let i=0;i<t.length;i++){let s=t[i];s.hitT>0&&(s.hitT-=n),s.domain==="sea"?ob(s,n):s.domain==="air"?cb(s,n):hb(s,n)}let e=v.allies;for(let i=0;i<e.length;i++){let s=e[i];s.hitT>0&&(s.hitT-=n),s.type==="soldier"?ub(s,n):db(s,n)}jM(n),Rp(t),Rp(e)}function Rp(n){let t=0;for(let e=0;e<n.length;e++){let i=n[e];if(i.gone){if(i.team==="A"&&i.home&&i.home.units){let s=i.home.units.indexOf(i);s>=0&&i.home.units.splice(s,1)}continue}n[t++]=i}n.length=t}function Op(){let n=0;for(let t of v.enemies)t.alive&&n++;return n}var Et={tx:0,tz:4,yaw:0,dist:44,tilt:0,g:{tx:0,tz:4,yaw:0,dist:44,tilt:0},orbit:!1},rl=9,bu=82,$e=new Set,ut={x:-1,y:-1,tile:-1,wx:0,wz:0,over:!1,left:!1,right:!1,middle:!1,sx:0,sy:0,moved:0,roadStart:-1,roadPath:[],roadValid:[],bulldozed:new Set},Te={onSelect:null,onError:null,onPlaced:null,isUIBlocking:()=>!1},_u=new ba,kp=new ct,lo=0,Mu=0;function rr(n,t,e){Et.g.tx=n,Et.g.tz=t,e&&(Et.g.dist=e)}function Vp(n){let t=Et.g;if(Et.orbit)t.yaw+=n*.05;else if(!Te.isUIBlocking()){let g=0,x=0;if(($e.has("KeyW")||$e.has("ArrowUp"))&&(x-=1),($e.has("KeyS")||$e.has("ArrowDown"))&&(x+=1),($e.has("KeyA")||$e.has("ArrowLeft"))&&(g-=1),($e.has("KeyD")||$e.has("ArrowRight"))&&(g+=1),he.edgeScroll&&ut.over&&document.hasFocus()&&(ut.x<=4?g-=1:ut.x>=window.innerWidth-1-4&&(g+=1),ut.y<=4?x-=1:ut.y>=window.innerHeight-1-4&&(x+=1)),g||x){let m=t.dist*($e.has("ShiftLeft")||$e.has("ShiftRight")?1.8:.95)*n,p=Math.cos(t.yaw),w=Math.sin(t.yaw);t.tx+=(p*g+w*x)*m,t.tz+=(-w*g+p*x)*m}$e.has("KeyQ")&&(t.yaw+=n*1.6),$e.has("KeyE")&&(t.yaw-=n*1.6)}let e=42,i=Math.hypot(t.tx,t.tz);i>e&&(t.tx*=e/i,t.tz*=e/i),t.dist=Ie(t.dist,rl,bu),t.tilt=Ie(t.tilt,-.35,.3);let s=1-Math.exp(-n*11);Et.tx=Ue(Et.tx,t.tx,s),Et.tz=Ue(Et.tz,t.tz,s),Et.yaw=Ue(Et.yaw,t.yaw,s),Et.dist=Ue(Et.dist,t.dist,1-Math.exp(-n*9)),Et.tilt=Ue(Et.tilt,t.tilt,s);let r=(Et.dist-rl)/(bu-rl),o=Ie(Ue(.6,1.13,Math.sqrt(r))+Et.tilt,.3,1.45),a=Math.cos(o),l=Math.sin(o),c=Et.tx+Math.sin(Et.yaw)*a*Et.dist,h=.4+l*Et.dist,u=Et.tz+Math.cos(Et.yaw)*a*Et.dist;if(v.shakeReq){let g=v.shakeAt?Math.hypot(v.shakeAt.x-Et.tx,v.shakeAt.z-Et.tz):0,x=v.shakeReq/(1+(g/14)**2)*(30/Math.max(15,Et.dist));x>Mu*(lo/.35)&&(Mu=x,lo=.35),v.shakeReq=0}let d=0,f=0;if(lo>0){lo-=n;let g=Mu*(lo/.35);d=(Math.random()-.5)*g,f=(Math.random()-.5)*g}q.camera.position.set(c+d,h+f,u),q.camera.lookAt(Et.tx+d*.5,.4,Et.tz),Ep(Et.tx,Et.tz,Et.yaw,Et.dist)}function Su(n,t){kp.set(n/window.innerWidth*2-1,-(t/window.innerHeight)*2+1),_u.setFromCamera(kp,q.camera);let e=_u.ray.origin,i=_u.ray.direction;if(i.y>-.001)return-1;let s=(2.6-e.y)/i.y,r=(0-e.y)/i.y,o=(r-s)*Math.hypot(i.x,i.z),a=Math.max(4,Math.ceil(o/.15));for(let h=0;h<=a;h++){let u=Ue(s,r,h/a),d=e.x+i.x*u,f=e.y+i.y*u,g=e.z+i.z*u,x=tn(d,g);if(x<0)continue;let m=Re(S.type[x])?S.h[x]:0;if(f<=m+.001)return ut.wx=d,ut.wz=g,x}let l=e.x+i.x*r,c=e.z+i.z*r;return ut.wx=l,ut.wz=c,tn(l,c)}function pi(n){v.tool=n,ut.roadStart=-1,ut.roadPath=[];for(let t in q.ghosts)q.ghosts[t].visible=!1;co()}function co(){let n=v.tool;if(n&&n.kind==="build"){let t=n.type;$r(e=>Xn(t,e)?.5:1.04)}else n&&n.kind==="road"?$r(t=>Ln(t)&&!S.road[t]?.55:1.02):$r(null)}function Bp(n){return S.bld[n]?0:S.road[n]?.4:Ln(n)?0:1}function Gp(n,t){if(n<0||t<0)return[];if(n===t)return[n];if(Bp(n)===0&&!S.road[n])return[n];let e=S.x[t],i=S.z[t];return Bi(n,r=>Bp(r),r=>r===t,r=>Math.hypot(S.x[r]-e,S.z[r]-i)/1.732*.4,4e3)||[n]}function Wp(){let n=0;for(let t of ut.roadPath)!S.road[t]&&!Ln(t)&&n++;return{tiles:n,gold:n*ui.gold}}function fb(){let n=0,t=null;for(let e of ut.roadPath){if(S.road[e])continue;let i=Ya(e);if(i){if(t=i,i.startsWith("Not enough"))break}else n++}n&&(Ot("build"),Gn(S.x[ut.roadPath[0]],S.h[ut.roadPath[0]],S.z[ut.roadPath[0]],.4)),t&&t.startsWith("Not enough")&&Te.onError&&Te.onError(t),ut.roadPath=[],ut.roadStart=-1,n&&co()}function wu(n){let t=v.tool;if(t){if(t.kind==="build"){let e=qa(t.type,n);if(e){Ot("error"),Te.onError&&Te.onError(e);return}Ot("build"),Gn(S.x[n],S.h[n],S.z[n],1),Te.onPlaced&&Te.onPlaced(t.type,n),le[t.type].unique?pi(null):co()}else if(t.kind==="bulldoze"){if(ut.bulldozed.has(n))return;ut.bulldozed.add(n);let e=eo(n);if(e){ut.bulldozed.size===1&&e!=="Nothing to clear"&&(Ot("error"),Te.onError&&Te.onError(e));return}Ot("demolish"),Gn(S.x[n],S.h[n],S.z[n],1.2)}}}function pb(n){if(n<0){v.selected=null,Te.onSelect&&Te.onSelect(null);return}if(S.bld[n]){let t=v.byId.get(S.bld[n]);v.selected=t||null}else S.ruin[n]?v.selected={ruin:n}:v.selected=null;v.selected&&Ot("click"),Te.onSelect&&Te.onSelect(v.selected)}function Xp(n){n.addEventListener("contextmenu",t=>t.preventDefault()),n.addEventListener("mouseenter",()=>{ut.over=!0}),n.addEventListener("mouseleave",()=>{ut.over=!1,ut.tile=-1}),n.addEventListener("mousedown",t=>{if(v.mode==="play")if(ut.sx=t.clientX,ut.sy=t.clientY,ut.moved=0,t.button===0){ut.left=!0;let e=Su(t.clientX,t.clientY);ut.tile=e;let i=v.tool;i&&i.kind==="road"?(ut.roadStart=e,ut.roadPath=e>=0?Gp(e,e):[]):i&&i.kind==="bulldoze"?(ut.bulldozed.clear(),e>=0&&wu(e)):i&&i.kind==="build"?e>=0&&wu(e):pb(e)}else t.button===2?ut.right=!0:t.button===1&&(ut.middle=!0,t.preventDefault())}),window.addEventListener("mouseup",t=>{t.button===0&&ut.left?(ut.left=!1,v.tool&&v.tool.kind==="road"&&ut.roadStart>=0&&fb(),ut.bulldozed.clear()):t.button===2&&ut.right?(ut.right=!1,ut.moved<6&&v.mode==="play"&&(v.tool?pi(null):v.selected&&(v.selected=null,Te.onSelect&&Te.onSelect(null)))):t.button===1&&(ut.middle=!1)}),window.addEventListener("mousemove",t=>{let e=t.clientX-ut.x,i=t.clientY-ut.y;if(ut.x=t.clientX,ut.y=t.clientY,(ut.right||ut.middle||ut.left)&&(ut.moved+=Math.abs(e)+Math.abs(i)),v.mode==="play"){if(ut.right){let s=2*Et.dist*Math.tan(q.camera.fov*Math.PI/360)/window.innerHeight,r=Math.cos(Et.g.yaw),o=Math.sin(Et.g.yaw);Et.g.tx-=(r*e+o*i*1.4)*s,Et.g.tz-=(-o*e+r*i*1.4)*s}ut.middle&&(Et.g.yaw-=e*.006,Et.g.tilt+=i*.003)}}),n.addEventListener("wheel",t=>{if(t.preventDefault(),v.mode!=="play")return;let e=Et.g.dist,i=Math.exp(Math.sign(t.deltaY)*Math.min(Math.abs(t.deltaY),120)*.0016);if(Et.g.dist=Ie(e*i,rl,bu),Et.g.dist<e){Su(t.clientX,t.clientY);let s=1-Et.g.dist/e;Et.g.tx+=(ut.wx-Et.g.tx)*s,Et.g.tz+=(ut.wz-Et.g.tz)*s}},{passive:!1}),window.addEventListener("keydown",t=>{$e.add(t.code)}),window.addEventListener("keyup",t=>{$e.delete(t.code)}),window.addEventListener("blur",()=>{$e.clear(),ut.left=ut.right=ut.middle=!1})}var sl=new Wt;function qp(){let n=q.pools;v.mode!=="play"||!ut.over||ut.right||ut.middle?ut.over||(ut.tile=-1):ut.tile=Su(ut.x,ut.y);let t=ut.tile,e=v.tool;ut.left&&e&&(e.kind==="road"&&ut.roadStart>=0&&t>=0&&(ut.roadPath=Gp(ut.roadStart,t)),e.kind==="bulldoze"&&t>=0&&wu(t));let i=t>=0&&v.mode==="play"&&Re(S.type[t]);if(q.hover.visible=i,i){q.hover.position.set(S.x[t],S.h[t]+.03,S.z[t]);let r=e&&(e.kind==="build"&&Xn(e.type,t)||e.kind==="road"&&Ln(t)&&!S.road[t]);q.hover.material.color.setHex(e&&e.kind==="bulldoze"?16742986:r?16734794:16777215)}for(let r in q.ghosts)q.ghosts[r].visible=!1;if(q.rangeRing.visible=q.rangeFill.visible=!1,e&&e.kind==="build"&&t>=0&&Re(S.type[t])){let r=q.ghosts[e.type];if(r.visible=!0,r.scale.setScalar(1.12),r.position.set(S.x[t],S.h[t],S.z[t]),r.rotation.y=Math.PI/6,e.type==="dock")for(let c=0;c<6;c++){let h=S.nbr[t*6+c];if(h>=0&&S.type[h]<=1){r.rotation.y=Math.atan2(S.x[h]-S.x[t],S.z[h]-S.z[t]);break}}let o=!Xn(e.type,t)&&un(le[e.type].cost);q.ghostMat.color.setHex(o?13172688:16751242),q.ghostMat.emissive.setHex(o?1923622:6953490);let a=le[e.type],l=a.weapon?a.weapon.range*v.mod.range:a.radius||a.guard||0;l&&Hp(S.x[t],S.h[t],S.z[t],l,a.weapon?16777215:10475775)}if(n.ghostRoad.begin(),e&&e.kind==="road"){let r=ut.roadPath.length?ut.roadPath:t>=0?[t]:[],o=v.res.gold;for(let a of r){if(S.road[a])continue;let l=Ln(a),c=!l&&o>=ui.gold;c&&(o-=ui.gold),sl.setHex(l?16730682:c?10354608:16756810),n.ghostRoad.put(S.x[a],(Re(S.type[a])?S.h[a]:0)+.04,S.z[a],0,.95,1,.95,sl.r,sl.g,sl.b)}}n.ghostRoad.end();let s=v.selected;if(q.select.visible=!1,s){let r=s.ruin!=null?s.ruin:s.tile;if(s.ruin==null&&!s.alive)v.selected=null,Te.onSelect&&Te.onSelect(null);else if(q.select.visible=!0,q.select.position.set(S.x[r],S.h[r]+.04,S.z[r]),!(e&&e.kind==="build")&&s.def){let o=s.ws?s.ws.range:s.def.radius||s.def.guard||0;o&&Hp(s.x,s.y,s.z,o,s.ws?16769658:10475775)}}}function Hp(n,t,e,i,s){q.rangeRing.visible=q.rangeFill.visible=!0,q.rangeRing.position.set(n,t+.06,e),q.rangeFill.position.set(n,t+.05,e),q.rangeRing.scale.setScalar(i),q.rangeFill.scale.setScalar(i),q.rangeRing.material.color.setHex(s),q.rangeFill.material.color.setHex(s)}var Wi={food:'<svg viewBox="0 0 24 24"><path d="M12 23V7" stroke="#c9a23c" stroke-width="2"/><ellipse cx="12" cy="4.6" rx="2.2" ry="3.2" fill="#f3cd5c"/><ellipse cx="8.4" cy="10" rx="2" ry="3.1" transform="rotate(-35 8.4 10)" fill="#f3cd5c"/><ellipse cx="15.6" cy="10" rx="2" ry="3.1" transform="rotate(35 15.6 10)" fill="#f3cd5c"/><ellipse cx="8.4" cy="15.4" rx="2" ry="3.1" transform="rotate(-35 8.4 15.4)" fill="#e2b444"/><ellipse cx="15.6" cy="15.4" rx="2" ry="3.1" transform="rotate(35 15.6 15.4)" fill="#e2b444"/></svg>',wood:'<svg viewBox="0 0 24 24"><rect x="1.5" y="7.5" width="17" height="10" rx="2" fill="#a2713f"/><path d="M4 10.5h11M4 14.5h9" stroke="#7d5530" stroke-width="1.2"/><ellipse cx="18.5" cy="12.5" rx="3.4" ry="5" fill="#e3b47c"/><ellipse cx="18.5" cy="12.5" rx="1.7" ry="2.6" fill="#b98550"/></svg>',stone:'<svg viewBox="0 0 24 24"><path d="M2.5 17.5l3-8.5 6.5-4.5 7 3 2.5 8.5-5 4.5H7.5z" fill="#b0aca3"/><path d="M12 4.5l-2.2 7.8 10.6 3.3M9.8 12.3l-4.3 5" stroke="#807b73" stroke-width="1.3" fill="none"/></svg>',iron:'<svg viewBox="0 0 24 24"><path d="M3 17.5l3.2-8h11.6l3.2 8z" fill="#7f97ad"/><path d="M6.2 9.5h11.6l1.6 3.8H4.6z" fill="#bccbd9"/><path d="M8 7l2-3h4l2 3z" fill="#9fb3c6"/></svg>',gold:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#f2c94c"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#c4952a" stroke-width="1.6"/><path d="M12 7.6v8.8" stroke="#c4952a" stroke-width="2"/></svg>',pop:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4.2" fill="#a9cdff"/><path d="M3.5 22c0-5.4 3.8-8.6 8.5-8.6s8.5 3.2 8.5 8.6z" fill="#a9cdff"/></svg>',road:'<svg viewBox="0 0 24 24"><path d="M8 2L3 22h18L16 2z" fill="#c9b48b"/><path d="M12 4v3M12 10v3M12 16v4" stroke="#fff" stroke-width="1.6"/></svg>',bulldoze:'<svg viewBox="0 0 24 24"><rect x="3" y="11" width="12" height="6" rx="1" fill="#e2a73a"/><rect x="6" y="6" width="6" height="5" fill="#e2a73a"/><rect x="7" y="7" width="4" height="3" fill="#9fd2ec"/><path d="M15 9l5 2v8h-5" fill="#888"/><circle cx="6" cy="19" r="2" fill="#333"/><circle cx="12" cy="19" r="2" fill="#333"/></svg>',research:'<svg viewBox="0 0 24 24"><path d="M9 2h6v2h-1v5l6 10c.8 1.4-.2 3-1.8 3H5.8c-1.6 0-2.6-1.6-1.8-3l6-10V4H9z" fill="#c9e3f2"/><path d="M6.5 16h11l1.6 2.8c.3.6-.1 1.2-.7 1.2H5.6c-.6 0-1-.6-.7-1.2z" fill="#6fd0a0"/></svg>'},zt=(n,t=document)=>t.querySelector(n),mb=n=>n>=1e4?(n/1e3).toFixed(1)+"k":Math.floor(n).toString(),gb=n=>(n=Math.max(0,Math.ceil(n)),`${Math.floor(n/60)}:${String(n%60).padStart(2,"0")}`);var wt={thumbs:{},cat:"city",modal:null,perf:!1,handlers:{},infoFor:null,tipKind:null};function Yn(n,t=""){return Object.keys(n).map(e=>`<span class="cost ${t}" data-res="${e}" data-amt="${n[e]}">${Wi[e]}${n[e]}</span>`).join("")}function gs(n){for(let t of n.querySelectorAll(".cost[data-res]"))t.classList.toggle("short",(v.res[t.dataset.res]||0)<+t.dataset.amt)}function $p(n){wt.handlers=n;let t=document.getElementById("ui");t.innerHTML=`
  <div id="hud" class="hidden">
    <div id="topbar">
      ${qr.map(s=>`<div class="res" id="r-${s}" data-tip="res-${s}">${Wi[s]}<div><b>0</b><small>+0/min</small></div></div>`).join("")}
      <div class="res" id="r-pop" data-tip="res-pop">${Wi.pop}<div><b>0/0</b><small>workers</small></div></div>
    </div>
    <div id="wavebox">
      <div class="wb-title"><span id="wb-name">Wave 1</span><span id="wb-goal"></span></div>
      <div id="wb-timer">2:30</div>
      <div id="wb-bar"><div></div></div>
      <div id="wb-intel"></div>
      <button id="wb-early" class="btn small">Send it now <span></span> (N)</button>
    </div>
    <div id="speedbox">
      <button data-speed="0" title="Pause (Space)">\u275A\u275A</button>
      <button data-speed="1" title="Normal speed">\u25B6</button>
      <button data-speed="2" title="Fast">\u25B6\u25B6</button>
      <button data-speed="3" title="Fastest">\u25B6\u25B6\u25B6</button>
      <button id="menu-btn" title="Menu (Esc)">\u2630</button>
    </div>
    <div id="buildbox">
      <div class="tabs"><button data-cat="city" class="on">City</button><button data-cat="military">Military</button></div>
      <div class="list" id="build-list"></div>
      <div class="tools">
        <button class="tool" id="tool-road" data-tip="tool-road">${Wi.road}<span>Road</span><kbd>R</kbd></button>
        <button class="tool" id="tool-bulldoze" data-tip="tool-bulldoze">${Wi.bulldoze}<span>Bulldoze</span><kbd>X</kbd></button>
        <button class="tool" id="tool-research" data-tip="tool-research">${Wi.research}<span>Research</span><kbd>T</kbd></button>
      </div>
    </div>
    <div id="infobox" class="hidden"></div>
    <div id="minimap"><canvas width="300" height="300"></canvas></div>
    <div id="toasts"></div>
    <div id="hint"></div>
    <div id="paused-banner" class="hidden">PAUSED</div>
  </div>
  <div id="perf" class="hidden"></div>
  <div id="tip" class="hidden"></div>
  <div id="screen" class="hidden"></div>
  <div id="modal" class="hidden"></div>`;for(let s of t.querySelectorAll("#speedbox [data-speed]"))s.addEventListener("click",()=>{ol(+s.dataset.speed),Ot("click")});zt("#menu-btn").addEventListener("click",()=>Lu()),zt("#wb-early").addEventListener("click",()=>rm());for(let s of t.querySelectorAll("#buildbox .tabs button"))s.addEventListener("click",()=>{Ru(s.dataset.cat),Ot("click")});zt("#tool-road").addEventListener("click",()=>or({kind:"road"})),zt("#tool-bulldoze").addEventListener("click",()=>or({kind:"bulldoze"})),zt("#tool-research").addEventListener("click",()=>Pu()),t.addEventListener("mouseover",s=>{let r=s.target.closest("[data-tip]");r&&vb(xb(r.dataset.tip),r)}),t.addEventListener("mouseout",s=>{let r=s.target.closest("[data-tip]");r&&!r.contains(s.relatedTarget)&&fo()});let e=zt("#minimap canvas"),i=s=>{let r=e.getBoundingClientRect(),o=(s.clientX-r.left)/r.width*300,a=(s.clientY-r.top)/r.height*300;rr((o-150)/ar,(a-150)/ar)};e.addEventListener("mousedown",s=>{s.button===0&&(i(s),wt.mmDrag=!0)}),window.addEventListener("mousemove",s=>{wt.mmDrag&&i(s)}),window.addEventListener("mouseup",()=>{wt.mmDrag=!1}),Te.onSelect=()=>Xi(),Te.onError=s=>vn(s,"bad"),Te.onPlaced=()=>{uo()},Te.isUIBlocking=()=>!!wt.modal||v.mode!=="play",window.addEventListener("keydown",Eb),Ru("city")}function Zp(n){wt.thumbs=n,Jp()}function Jp(){let n=zt("#build-list"),t=Gh[wt.cat];n.innerHTML=t.map((e,i)=>{let s=le[e];return`<button class="bbtn" data-type="${e}" data-tip="b-${e}">
      <img src="${wt.thumbs[e]||""}" alt="">
      <div class="bb-txt"><div class="bb-name">${s.name}</div><div class="bb-cost">${Yn(s.cost)}</div></div>
      <kbd>${(i+1)%10}</kbd><i class="lock">\u{1F512}</i></button>`}).join("");for(let e of n.querySelectorAll(".bbtn"))e.addEventListener("click",()=>Kp(e.dataset.type));uo()}function Ru(n){wt.cat=n;for(let t of document.querySelectorAll("#buildbox .tabs button"))t.classList.toggle("on",t.dataset.cat===n);Jp()}function Kp(n){if(!to(n)){vn(`Research ${di[le[n].requires].name} first (T)`,"bad"),Ot("error");return}if(le[n].unique&&v.buildings.some(t=>t.type===n)){vn("Only one can be built","bad"),Ot("error");return}or({kind:"build",type:n})}function or(n){let t=v.tool,e=t&&t.kind===n.kind&&t.type===n.type;pi(e?null:n),Ot("click"),ll()}function ll(){let n=v.tool;for(let t of document.querySelectorAll(".bbtn"))t.classList.toggle("on",!!(n&&n.kind==="build"&&n.type===t.dataset.type));zt("#tool-road").classList.toggle("on",!!(n&&n.kind==="road")),zt("#tool-bulldoze").classList.toggle("on",!!(n&&n.kind==="bulldoze"))}function uo(){for(let n of document.querySelectorAll(".bbtn")){let t=n.dataset.type,e=le[t],i=!to(t),s=e.unique&&v.buildings.some(r=>r.type===t);n.classList.toggle("locked",i),n.classList.toggle("done",!!s),n.classList.toggle("poor",!un(e.cost)),gs(n)}}function xb(n){if(n.startsWith("b-")){let t=n.slice(2),e=le[t],i="";if(e.weapon){let r=e.weapon,o=Object.keys(r.targets).map(a=>({sea:"Ships",air:"Aircraft",ground:"Troops"})[a]).join(", ");i=`<div class="tip-stats"><span>Damage ${Math.round(r.dmg*v.mod.dmg)}${r.splash?" (area)":""}</span><span>Range ${(r.range*v.mod.range).toFixed(1)}</span><span>Rate ${(r.rate*v.mod.rate).toFixed(2)}/s</span><span>Hits: ${o}</span></div>`}e.jobs&&(i+=`<div class="tip-sub">Workers: ${e.jobs}</div>`);let s=e.requires&&!to(t)?`<div class="tip-bad">Requires research: ${di[e.requires].name}</div>`:"";return`<div class="tip-title">${e.name}</div><div>${e.desc}</div>${i}<div class="tip-cost">${Yn(e.cost)}</div>${s}`}if(n==="tool-road")return`<div class="tip-title">Road</div><div>Click and drag to lay a road. Buildings only work when a road links them to the Town Hall.</div><div class="tip-cost">${Yn(ui)} per tile</div>`;if(n==="tool-bulldoze")return'<div class="tip-title">Bulldoze</div><div>Click or drag to demolish buildings, roads and rubble. Buildings refund half their cost.</div>';if(n==="tool-research")return'<div class="tip-title">Research</div><div>Improve your weapons, unlock radar, missiles and aircraft. Needs a War College.</div>';if(n.startsWith("res-")){let t=n.slice(4);if(t==="pop")return`<div class="tip-title">Population</div><div>${Math.floor(v.pop)} residents in homes for ${v.housing}. ${v.jobs} jobs need workers. Farms and docks are staffed first (${Math.round(v.effFood*100)}%), then everything else (${Math.round(v.eff*100)}%).</div><div class="tip-sub">Build houses for more people. They need food to grow. Short-staffed weapons fire slower.</div>`;let e=v.rates[t]||0,i={food:"Farms and fishing docks. Every resident eats.",wood:"Lumber camps beside forests.",stone:"Quarries beside hills and mountains.",iron:"Iron mines on hills.",gold:"Taxes from residents (markets boost them), kill bounties and wave rewards."}[t];return`<div class="tip-title">${Da[t]}</div><div>${e>=0?"+":""}${e.toFixed(1)} per minute.</div><div class="tip-sub">${i}</div>`}return""}function vb(n,t){if(!n)return;let e=zt("#tip");e.innerHTML=n,e.classList.remove("hidden"),gs(e),wt.tipKind="ui";let i=t.getBoundingClientRect(),s=e.offsetWidth,r=e.offsetHeight,o=i.right+10,a=i.top;o+s>window.innerWidth-8&&(o=i.left-s-10),a+r>window.innerHeight-8&&(a=window.innerHeight-r-8),i.top<120&&i.bottom<200&&(o=Math.min(window.innerWidth-s-8,Math.max(8,i.left)),a=i.bottom+8),e.style.transform=`translate(${Math.round(o)}px, ${Math.round(a)}px)`}function fo(){zt("#tip").classList.add("hidden"),wt.tipKind=null}function yb(){if(wt.tipKind==="ui")return;let n=zt("#tip"),t=ut.tile;if(v.mode!=="play"||t<0||wt.modal||ut.right||ut.middle){n.classList.add("hidden"),wt.tipKind=null;return}let e="",i=v.tool,s=Ks[S.type[t]].name;if(i&&i.kind==="build"){let a=Xn(i.type,t);if(a)e=`<div class="tip-bad">${a}</div>`;else{let l=fp(i.type,t);e=`<div class="tip-title">${le[i.type].name}</div>`,l&&(e+=Object.keys(l).map(c=>`<div class="tip-good">${Wi[c]} +${Math.round(l[c])} ${Da[c].toLowerCase()} / min</div>`).join("")),un(le[i.type].cost)||(e+='<div class="tip-bad">Not enough resources</div>'),_b(t)||(e+='<div class="tip-warn">Needs a road to the Town Hall to work</div>')}}else if(i&&i.kind==="road")if(ut.roadPath.length>1){let a=Wp();e=`<div class="tip-title">Road: ${a.tiles} tile${a.tiles===1?"":"s"}</div><div class="tip-cost">${Yn({gold:a.gold})}</div>`}else{let a=Ln(t);e=a&&!S.road[t]?`<div class="tip-bad">${a}</div>`:'<div class="tip-sub">Click and drag to lay a road</div>'}else if(i&&i.kind==="bulldoze")if(S.bld[t]){let a=v.byId.get(S.bld[t]);a&&(e=`<div class="tip-title">Demolish ${a.def.name}</div>${a.type!=="hq"?`<div class="tip-sub">Refund ${Yn(Qr(a.def.cost,.5))}</div>`:'<div class="tip-bad">Cannot demolish the Town Hall</div>'}`)}else S.road[t]?e='<div class="tip-title">Remove road</div>':S.ruin[t]&&(e='<div class="tip-title">Clear rubble</div>');else if(S.bld[t]){let a=v.byId.get(S.bld[t]);a&&(e=`<div class="tip-title">${a.def.name}${a.level>1?" "+Mb(a.level):""}</div><div class="tip-sub">${Math.ceil(a.hp)} / ${Math.ceil(a.maxHp)} HP${a.connected?"":' \xB7 <span class="tip-bad">no road</span>'}</div>`)}else S.ruin[t]?e='<div class="tip-title">Ruins</div><div class="tip-sub">Click to rebuild</div>':Re(S.type[t])&&(e=`<div class="tip-sub">${s}${S.road[t]?" \xB7 road":""}</div>`);if(!e){n.classList.add("hidden"),wt.tipKind=null;return}n.innerHTML!==e&&(n.innerHTML=e,gs(n)),n.classList.remove("hidden"),wt.tipKind="tile";let r=Math.min(window.innerWidth-n.offsetWidth-8,ut.x+18),o=Math.min(window.innerHeight-n.offsetHeight-8,ut.y+18);n.style.transform=`translate(${Math.round(r)}px, ${Math.round(o)}px)`}function _b(n){for(let t=0;t<6;t++){let e=S.nbr[n*6+t];if(e>=0&&(S.conn[e]||v.hq&&e===v.hq.tile))return!0}return!1}var Mb=n=>["","I","II","III","IV"][n]||n;function Xi(){let n=zt("#infobox"),t=v.selected;if(wt.infoFor=t,!t){n.classList.add("hidden"),n.innerHTML="";return}if(n.classList.remove("hidden"),t.ruin!=null){let e=us[S.ruin[t.ruin]-1],i=le[e],s=Qr(i.cost,.6);n.innerHTML=`
      <div class="ip-head"><img src="${wt.thumbs[e]||""}" class="ruined"><div><div class="ip-name">Ruins of a ${i.name}</div><div class="ip-sub">Destroyed in battle</div></div><button class="ip-x" data-act="close">\u2715</button></div>
      <div class="ip-actions"><button class="btn" data-act="rebuild">Rebuild <span>${Yn(s)}</span></button><button class="btn danger" data-act="clear">Clear rubble</button></div>`}else{let e=t,i=e.def;n.innerHTML=`
      <div class="ip-head"><img src="${wt.thumbs[e.type]||""}"><div><div class="ip-name">${i.name}</div><div class="ip-sub" data-k="lvl"></div></div><button class="ip-x" data-act="close">\u2715</button></div>
      <div class="hpbar"><div data-k="hpfill"></div><span data-k="hptext"></span></div>
      <div class="ip-status" data-k="status"></div>
      <div class="ip-stats" data-k="stats"></div>
      <div class="ip-desc">${i.desc}</div>
      <div class="ip-actions">
        ${i.upgradeCost?'<button class="btn" data-act="upgrade"><span data-k="utext">Upgrade</span> <span data-k="ucost"></span></button>':""}
        ${e.type==="college"?'<button class="btn" data-act="research">Open research (T)</button>':""}
        ${e.type==="market"?`<div class="ip-trade">${iu.map((s,r)=>`<button class="btn small" data-trade="${r}">Buy ${Wi[s.res]}${s.amt}<span>${Yn({gold:s.gold})}</span></button>`).join("")}</div>`:""}
        ${e.type!=="hq"?`<button class="btn danger" data-act="demolish">Demolish <span>${Yn(Qr(i.cost,.5),"refund")}</span></button>`:""}
      </div>`}for(let e of n.querySelectorAll("[data-act]"))e.addEventListener("click",()=>Cu(e.dataset.act));for(let e of n.querySelectorAll("[data-trade]"))e.addEventListener("click",()=>{let i=xp(+e.dataset.trade);i?(vn(i,"bad"),Ot("error")):Ot("build")});wt.uKey="",Iu()}function Cu(n){let t=v.selected;if(n==="close"){v.selected=null,Xi();return}if(t)if(n==="upgrade"){let e=up(t);e?(vn(e,"bad"),Ot("error")):(Ot("upgrade"),vn(`${t.def.name} upgraded to level ${t.level}`,"good")),wt.uKey="",Iu()}else if(n==="demolish")eo(t.tile),Ot("demolish"),v.selected=null,Xi();else if(n==="research")Pu();else if(n==="rebuild"){let e=hp(t.ruin);typeof e=="string"?(vn(e,"bad"),Ot("error")):(Ot("build"),v.selected=e,Xi())}else n==="clear"&&(eo(t.ruin),Ot("demolish"),v.selected=null,Xi())}function bb(n){let t=[],e=(o,a)=>t.push(`<div><span>${o}</span><b>${a}</b></div>`),i=n.def;if(n.ws){let o=i.weapon;e("Damage",`${Math.round(n.ws.dmg)}${o.splash?` <small>area ${n.ws.splash.toFixed(1)}</small>`:""}`),e("Range",`${n.ws.range.toFixed(1)}${n.radarBoost?' <small class="good">radar +20%</small>':""}`),e("Fire rate",`${n.ws.rate.toFixed(2)}/s`),e("Targets",Object.keys(o.targets).map(a=>({sea:"Ships",air:"Aircraft",ground:"Troops"})[a]).join(", ")),e("Kills",n.kills)}if(n.prod)for(let o in n.prod)e(Da[o],`+${(n.prod[o]*(n.connected?Za(n):0)).toFixed(0)} / min`);let s=Wa(n);s&&e("Residents",`${Math.round(s*Math.min(1,v.housing?v.pop/v.housing:0))} / ${s}${n.marketBoost?' <small class="good">market +50% tax</small>':""}`);let r=Xa(n);if(r&&e("Workers",`${Math.round(r*Za(n))} / ${r}`),n.type==="barracks"&&e("Marines",`${n.units.length} / ${il(n)}${n.units.length<il(n)&&n.connected?` <small>training ${Math.round(n.trainT/9*100)}%</small>`:""}`),n.type==="airfield"){let o=n.units.filter(a=>a.state!=="parked").length;e("Fighters",`${n.units.length} / ${yu(n)}${o?` <small>${o} airborne</small>`:""}`)}return n.type==="market"&&e("Houses boosted",v.buildings.filter(o=>o.marketBoost&&Math.hypot(o.x-n.x,o.z-n.z)<=i.radius).length),n.type==="radar"&&e("Weapons boosted",v.buildings.filter(o=>o.ws&&Math.hypot(o.x-n.x,o.z-n.z)<=i.radius).length),t.join("")}function Iu(){let n=v.selected;if(n!==wt.infoFor){Xi();return}if(!n||n.ruin!=null){n&&gs(zt("#infobox"));return}let t=zt("#infobox"),e=a=>t.querySelector(`[data-k="${a}"]`),i=n,s=i.def.maxLevel||1;e("lvl").innerHTML=s>1?`Level ${i.level} / ${s}`:"";let r=i.hp/i.maxHp;e("hpfill").style.width=`${(r*100).toFixed(1)}%`,e("hpfill").className=r<.3?"low":r<.6?"mid":"",e("hptext").textContent=`${Math.ceil(i.hp)} / ${Math.ceil(i.maxHp)}`,e("status").innerHTML=i.connected?`<span class="good">\u25CF Connected</span>${v.time-i.lastHit<6?' \xB7 <span class="bad">under attack</span>':i.hp<i.maxHp?" \xB7 repairing":""}`:'<span class="bad">\u25CF No road to the Town Hall: not working</span>',e("stats").innerHTML=bb(i);let o=t.querySelector('[data-act="upgrade"]');if(o){let a=tu(i),l=a?JSON.stringify(a):"max";l!==wt.uKey&&(wt.uKey=l,e("utext").textContent=a?`Upgrade to level ${i.level+1} (U)`:"Fully upgraded",e("ucost").innerHTML=a?Yn(a):""),o.disabled=!a,o.classList.toggle("poor",!!a&&!un(a))}gs(t)}function Pu(){fo(),wt.modal="research",zt("#modal").classList.remove("hidden"),jp()}function jp(){let n=zt("#modal"),t=v.buildings.some(e=>e.type==="college"&&e.connected);n.innerHTML=`<div class="panel research">
    <div class="panel-head"><h2>Research</h2><button class="ip-x" data-act="close">\u2715</button></div>
    ${t?"":'<div class="banner bad">Build a War College (City tab) and connect it by road to start researching.</div>'}
    <div class="rgrid">${Wh.map(e=>{let i=v.research[e.id]||0,s=i>=e.max,r=e.req&&!(v.research[e.req]>0),o=s?null:e.cost(i);return`<div class="rcard ${s?"maxed":""} ${r?"locked":""}">
        <div class="rc-name">${e.name}</div>
        <div class="rc-pips">${Array.from({length:e.max},(a,l)=>`<i class="${l<i?"on":""}"></i>`).join("")}</div>
        <div class="rc-desc">${e.desc}</div>
        ${r?`<div class="rc-req">Requires ${di[e.req].name}</div>`:""}
        ${s?'<div class="rc-done">Complete</div>':`<button class="btn ${!t||r||!un(o)?"poor":""}" data-r="${e.id}" ${!t||r?"disabled":""}>Research ${Yn(o)}</button>`}
      </div>`}).join("")}</div></div>`,n.querySelector('[data-act="close"]').addEventListener("click",Dn);for(let e of n.querySelectorAll("[data-r]"))e.addEventListener("click",()=>{let i=vp(e.dataset.r);i?(vn(i,"bad"),Ot("error")):(Ot("upgrade"),uo()),jp()});gs(n)}function Dn(){wt.modal=null,zt("#modal").classList.add("hidden"),zt("#modal").innerHTML="",wt.wasPausedByModal&&(v.paused=!1,wt.wasPausedByModal=!1)}function Qp(n){let t=zt("#screen");t.innerHTML=n,t.classList.remove("hidden");for(let e of t.querySelectorAll("[data-go]"))e.addEventListener("click",()=>{Ot("click"),wt.handlers[e.dataset.go]()});return t}function Sb(){zt("#screen").classList.add("hidden"),zt("#screen").innerHTML=""}function cl(n){zt("#hud").classList.add("hidden");let t=_p();Qp(`<div class="title-wrap">
    <div class="title">BASTION ISLE</div>
    <div class="subtitle">Build a town. Fortify the coast. Hold the island.</div>
    <div class="menu">
      ${t?'<button class="btn big" data-go="continue">Continue</button>':""}
      <button class="btn big" data-go="newGame">New Game</button>
      <button class="btn" data-go="reroll">Another island</button>
      <button class="btn" data-go="help">How to play</button>
      <button class="btn" data-go="settings">Settings</button>
      <button class="btn" data-go="fullscreen">Fullscreen (F)</button>
    </div>
    <div class="seed">Island #${n}</div>
  </div>`)}function tm(){Sb(),zt("#hud").classList.remove("hidden"),Xi(),uo(),ll(),wt.mmBase=null}function Lu(){if(v.mode!=="play")return;fo(),wt.modal="pause",wt.wasPausedByModal=!v.paused,v.paused=!0;let n=v.wave.state==="prep",t=zt("#modal");t.classList.remove("hidden"),t.innerHTML=`<div class="panel pause">
    <div class="panel-head"><h2>Paused</h2></div>
    <div class="menu">
      <button class="btn big" data-a="resume">Resume</button>
      <button class="btn" data-a="save" ${n?"":"disabled"}>Save game${n?"":" <small>(between waves)</small>"}</button>
      <button class="btn" data-a="help">How to play</button>
      <button class="btn" data-a="settings">Settings</button>
      <button class="btn danger" data-a="quit">Quit to main menu</button>
    </div>
    <div class="note">The game also saves itself after every wave.</div></div>`,t.querySelector('[data-a="resume"]').addEventListener("click",Dn),t.querySelector('[data-a="save"]').addEventListener("click",()=>{io()&&(vn("Game saved","good"),Dn())}),t.querySelector('[data-a="help"]').addEventListener("click",()=>Du(!0)),t.querySelector('[data-a="settings"]').addEventListener("click",()=>Uu(!0)),t.querySelector('[data-a="quit"]').addEventListener("click",()=>{Dn(),wt.handlers.quit()})}var wb=`
  <div class="help-cols">
    <div>
      <h3>Goal</h3>
      <p>Enemy fleets and air raids strike your island in waves. Survive ${Qs} waves to win (then keep going as long as you can). If the Town Hall falls, the island is lost.</p>
      <h3>Building a town</h3>
      <p><b>Roads</b> connect everything: a building only works if it sits beside a road that leads back to the Town Hall.</p>
      <p><b>Houses</b> bring residents who pay taxes in gold, eat food and work in your buildings. If there are more jobs than people, everything slows down.</p>
      <p><b>Farms</b> and <b>docks</b> feed people. <b>Lumber camps</b> want forest next to them, <b>quarries</b> want hills or mountains, <b>iron mines</b> go on hills.</p>
      <h3>Defence</h3>
      <p><b>MG nests</b> stop landing troops. <b>Coastal guns</b> outrange ships. <b>Flak</b> shoots down aircraft. <b>Barracks</b> train marines who hunt landing parties.</p>
      <p>Build a <b>War College</b> to research better weapons, <b>Radar</b>, <b>Missile batteries</b> and an <b>Airfield</b> of interceptors. Select any building to upgrade it.</p>
      <p>Damaged buildings repair themselves when they are out of the fight. Destroyed ones leave ruins you can rebuild cheaply.</p>
    </div>
    <div>
      <h3>Controls</h3>
      <table class="keys">
        <tr><td>W A S D / arrows</td><td>Move the camera (Shift: faster)</td></tr>
        <tr><td>Right-drag</td><td>Pan</td></tr>
        <tr><td>Q / E, middle-drag</td><td>Rotate and tilt</td></tr>
        <tr><td>Mouse wheel</td><td>Zoom</td></tr>
        <tr><td>Left-click</td><td>Select / place</td></tr>
        <tr><td>Right-click, Esc</td><td>Cancel tool / deselect</td></tr>
        <tr><td>1 \u2013 9</td><td>Build from the open tab</td></tr>
        <tr><td>Tab</td><td>Switch City / Military</td></tr>
        <tr><td>R</td><td>Road tool (drag)</td></tr>
        <tr><td>X / Delete</td><td>Bulldoze / demolish selected</td></tr>
        <tr><td>U</td><td>Upgrade selected</td></tr>
        <tr><td>T</td><td>Research</td></tr>
        <tr><td>N</td><td>Send the next wave now (bonus gold)</td></tr>
        <tr><td>Space</td><td>Pause</td></tr>
        <tr><td>+ / \u2212</td><td>Game speed</td></tr>
        <tr><td>H</td><td>Jump to the Town Hall</td></tr>
        <tr><td>F</td><td>Fullscreen</td></tr>
        <tr><td>F3</td><td>Performance stats</td></tr>
      </table>
    </div>
  </div>`;function Du(n){wt.modal=wt.modal||"help";let t=zt("#modal");t.classList.remove("hidden"),t.innerHTML=`<div class="panel help"><div class="panel-head"><h2>How to play</h2><button class="ip-x" data-act="close">\u2715</button></div>${wb}</div>`,t.querySelector('[data-act="close"]').addEventListener("click",()=>n?em():Dn())}function em(){let n=wt.wasPausedByModal;wt.modal=null,Lu(),wt.wasPausedByModal=n}function Uu(n){wt.modal=wt.modal||"settings";let t=zt("#modal");t.classList.remove("hidden");let e=wt.handlers.msaaAtStart;t.innerHTML=`<div class="panel settings"><div class="panel-head"><h2>Settings</h2><button class="ip-x" data-act="close">\u2715</button></div>
    <label class="row"><span>Render resolution <small>(lower for more FPS)</small></span><input type="range" min="50" max="100" step="5" id="s-scale" value="${Math.round(he.renderScale*100)}"><b id="s-scale-v">${Math.round(he.renderScale*100)}%</b></label>
    <label class="row"><span>Shadows</span><select id="s-shadows"><option value="0">Off</option><option value="1">Normal</option><option value="2">High</option></select></label>
    <label class="row"><span>Anti-aliasing (MSAA)</span><input type="checkbox" id="s-msaa" ${he.msaa?"checked":""}></label>
    <div class="row note" id="s-msaa-note" ${he.msaa===e?"hidden":""}>Anti-aliasing changes after a reload. <button class="btn small" id="s-reload">Reload now</button></div>
    <label class="row"><span>Fullscreen <small>(F)</small></span><button class="btn small" id="s-fs">Toggle</button></label>
    <label class="row"><span>Show FPS counter <small>(F3)</small></span><input type="checkbox" id="s-fps" ${he.showFps?"checked":""}></label>
    <label class="row"><span>Scroll at screen edges</span><input type="checkbox" id="s-edge" ${he.edgeScroll?"checked":""}></label>
    <label class="row"><span>Volume</span><input type="range" min="0" max="100" step="5" id="s-vol" value="${Math.round(he.volume*100)}"><b id="s-vol-v">${Math.round(he.volume*100)}%</b></label>
    <div class="note">Frame rate follows your monitor's refresh rate (180 Hz on a 180 Hz display). Turn off "Battery saver" style power modes and use a Chromium browser with hardware acceleration on for the smoothest result.</div>
  </div>`,zt("#s-shadows").value=String(he.shadows),zt("#s-scale").addEventListener("input",i=>{he.renderScale=+i.target.value/100,zt("#s-scale-v").textContent=i.target.value+"%",Fa(),Ni()}),zt("#s-shadows").addEventListener("change",i=>{he.shadows=+i.target.value,Yh(),Ni()}),zt("#s-msaa").addEventListener("change",i=>{he.msaa=i.target.checked,Ni(),zt("#s-msaa-note").hidden=he.msaa===e}),zt("#s-reload").addEventListener("click",()=>location.reload()),zt("#s-fs").addEventListener("click",i=>{i.preventDefault(),hl()}),zt("#s-fps").addEventListener("change",i=>{he.showFps=i.target.checked,wt.perf=i.target.checked,Ni()}),zt("#s-edge").addEventListener("change",i=>{he.edgeScroll=i.target.checked,Ni()}),zt("#s-vol").addEventListener("input",i=>{he.volume=+i.target.value/100,zt("#s-vol-v").textContent=i.target.value+"%",wp(he.volume),Ni()}),t.querySelector('[data-act="close"]').addEventListener("click",()=>n?em():Dn())}function nm(){fo(),Qp(`<div class="title-wrap end">
    <div class="title small bad">THE ISLAND HAS FALLEN</div>
    <div class="subtitle">The Town Hall was destroyed during wave ${v.wave.current||v.wave.n}.</div>
    <div class="endstats">
      <div><b>${v.stats.waves}</b><span>waves survived</span></div>
      <div><b>${v.stats.kills}</b><span>enemies destroyed</span></div>
      <div><b>${v.stats.built}</b><span>buildings raised</span></div>
      <div><b>${v.stats.lost}</b><span>buildings lost</span></div>
    </div>
    <div class="menu row"><button class="btn big" data-go="newGame">Try again</button><button class="btn" data-go="quit">Main menu</button></div>
  </div>`)}function im(){fo(),wt.modal="victory",wt.wasPausedByModal=!v.paused,v.paused=!0;let n=zt("#modal");n.classList.remove("hidden"),n.innerHTML=`<div class="panel victory">
    <div class="title small good">VICTORY</div>
    <div class="subtitle">You held the island through ${Qs} waves.</div>
    <div class="endstats">
      <div><b>${v.stats.kills}</b><span>enemies destroyed</span></div>
      <div><b>${v.stats.built}</b><span>buildings raised</span></div>
      <div><b>${v.stats.lost}</b><span>buildings lost</span></div>
    </div>
    <div class="menu row"><button class="btn big" data-a="go">Keep defending</button><button class="btn" data-a="quit">Main menu</button></div></div>`,n.querySelector('[data-a="go"]').addEventListener("click",Dn),n.querySelector('[data-a="quit"]').addEventListener("click",()=>{Dn(),wt.handlers.quit()})}function vn(n,t="info"){let e=zt("#toasts");if(!e)return;let i=document.createElement("div");for(i.className=`toast ${t}`,i.textContent=n,e.prepend(i);e.children.length>5;)e.lastChild.remove();setTimeout(()=>i.classList.add("out"),t==="alert"?5200:3600),setTimeout(()=>i.remove(),t==="alert"?5800:4200)}function hl(){document.fullscreenElement?document.exitFullscreen().catch(()=>{}):document.documentElement.requestFullscreen({navigationUI:"hide"}).catch(()=>{})}function ol(n){n===0?v.paused=!v.paused:(v.speed=n,v.paused=!1),sm()}function sm(){for(let n of document.querySelectorAll("#speedbox [data-speed]")){let t=+n.dataset.speed;n.classList.toggle("on",t===0?v.paused:!v.paused&&v.speed===t)}zt("#paused-banner").classList.toggle("hidden",!(v.paused&&!wt.modal))}function rm(){let n=Pp();n&&(vn(`Wave called early: +${n} gold`,"good"),Ot("click"))}function Eb(n){if(n.target&&(n.target.tagName==="INPUT"||n.target.tagName==="SELECT")||v.mode!=="play")return;let t=n.code;if((t==="Tab"||t==="F3"||t==="Space")&&n.preventDefault(),t==="Escape"){wt.modal==="pause"||wt.modal?Dn():v.tool?(pi(null),ll()):v.selected?(v.selected=null,Xi()):Lu();return}if(t==="F3"){wt.perf=!wt.perf,he.showFps=wt.perf,Ni();return}if(wt.modal){t==="KeyT"&&wt.modal==="research"&&Dn();return}if((n.ctrlKey||n.metaKey)&&t==="KeyS"){n.preventDefault();let e=io();vn(e?"Game saved":"You can save between waves",e?"good":"bad");return}if(!(n.ctrlKey||n.metaKey||n.altKey)){if(t==="Space")ol(0);else if(t==="KeyR")or({kind:"road"});else if(t==="KeyX")or({kind:"bulldoze"});else if(t==="Delete")v.selected&&v.selected.def?Cu("demolish"):or({kind:"bulldoze"});else if(t==="KeyT")Pu();else if(t==="KeyN")rm();else if(t==="KeyU")v.selected&&v.selected.def&&v.selected.def.upgradeCost&&Cu("upgrade");else if(t==="Tab")Ru(wt.cat==="city"?"military":"city");else if(t==="KeyH"||t==="Home")v.hq&&rr(v.hq.x,v.hq.z+3);else if(t==="KeyF")hl();else if(t==="Equal"||t==="NumpadAdd")ol(Math.min(3,v.speed+1));else if(t==="Minus"||t==="NumpadSubtract")ol(Math.max(1,v.speed-1));else if(/^Digit\d$/.test(t)||/^Numpad\d$/.test(t)){let e=+t.slice(-1),i=e===0?9:e-1,s=Gh[wt.cat][i];s&&Kp(s)}}}var Eu=0,Tu=0,Au=0,qn={};function mi(n,t){n._v!==t&&(n._v=t,n.textContent=t)}function al(n,t){n._h!==t&&(n._h=t,n.innerHTML=t)}function om(n,t){if(v.mode!=="play")return;for(;Ua.length;){let l=Ua.shift();vn(l.text,l.kind)}if(Tu-=n,Tu<=0&&(Tu=.08,yb()),Au-=n,Au<=0&&(Au=.15,Ib()),Rb(),Ab(),Eu-=n,Eu>0)return;Eu=.125;for(let l of qr){let c=document.getElementById("r-"+l);qn[l]||(qn[l]={b:c.querySelector("b"),s:c.querySelector("small")}),mi(qn[l].b,mb(v.res[l]));let h=v.rates[l]||0;mi(qn[l].s,`${h>=0?"+":"\u2212"}${Math.abs(h).toFixed(0)}/min`),qn[l].s.className=h>.05?"up":h<-.05?"down":""}let e=document.getElementById("r-pop");qn.pop||(qn.pop={b:e.querySelector("b"),s:e.querySelector("small")}),mi(qn.pop.b,`${Math.floor(v.pop)} / ${v.housing}`),mi(qn.pop.s,v.jobs?`jobs ${v.jobs} \xB7 ${Math.round(v.eff*100)}%`:"no jobs yet"),qn.pop.s.className=v.eff<.999||v.starving?"down":"",e.classList.toggle("alarm",v.starving);let i=v.wave,s=v.buildings.some(l=>l.type==="radar"&&l.connected);mi(zt("#wb-name"),`Wave ${i.state==="prep"?i.n:i.current}`),mi(zt("#wb-goal"),v.victory?"endless":`of ${Qs}`);let r=zt("#wb-bar div"),o=zt("#wb-early");if(i.state==="prep"){mi(zt("#wb-timer"),`arrives in ${gb(i.timer)}`),r.style.width="0%",o.classList.remove("hidden"),mi(o.querySelector("span"),`+${Math.floor(i.timer*.6)}`);let l=i.plan,c="";if(l){if(s)c=Object.keys(l.counts).map(h=>`<span class="ei ${Pn[h].domain}">${l.counts[h]}\xD7 ${Pn[h].name}</span>`).join("");else{let h=0,u=0;for(let d in l.counts)Pn[d].domain==="air"?u+=l.counts[d]:h+=l.counts[d];c=`<span class="ei sea">~${h} ships</span>${u?`<span class="ei air">~${u} aircraft</span>`:""}<span class="ei dim">Radar reveals details</span>`}(s||i.timer<25)&&(c+=`<div class="dirs">${[...new Set(l.dirs.map(gu))].map(h=>`From the ${h}`).join(" \xB7 ")}</div>`)}al(zt("#wb-intel"),c)}else{let c=Op()+i.queue.length;mi(zt("#wb-timer"),`${c} enem${c===1?"y":"ies"} left`),r.style.width=`${(100*(1-c/Math.max(1,i.total||1))).toFixed(1)}%`,o.classList.add("hidden"),al(zt("#wb-intel"),"")}zt("#wavebox").classList.toggle("active",i.state!=="prep"),uo(),sm(),v.selected&&Iu(),wt.modal==="research"&&Tb();let a=zt("#perf");a.classList.toggle("hidden",!wt.perf),wt.perf&&t&&al(a,t)}function Tb(){for(let n of document.querySelectorAll("#modal [data-r]")){let t=di[n.dataset.r];n.classList.toggle("poor",n.disabled||!un(t.cost(v.research[t.id]||0)))}gs(zt("#modal"))}var Yp="";function Ab(){let n=v.tool,t=n?n.kind+(n.type||""):"";t!==Yp&&(Yp=t,ll())}function Rb(){let n=v.tool,t;n&&n.kind==="build"?t=`Placing <b>${le[n.type].name}</b> \xB7 left-click to build \xB7 right-click or Esc to stop`:n&&n.kind==="road"?t="Road \xB7 click and drag from tile to tile \xB7 2 gold per tile \xB7 right-click to stop":n&&n.kind==="bulldoze"?t="Bulldoze \xB7 click or drag \xB7 buildings refund half their cost":t="WASD move \xB7 Q/E rotate \xB7 wheel zoom \xB7 click a building to inspect \xB7 Space pause",al(zt("#hint"),t)}var ar=300/92;function ho(n,t){return[150+n*ar,150+t*ar]}function Cb(){let n=document.createElement("canvas");n.width=n.height=300;let t=n.getContext("2d");t.fillStyle="#1a5f8e",t.beginPath(),t.arc(150,150,150,0,Math.PI*2),t.fill();let e=1.02*ar,i=new Map;for(let s=0;s<S.count;s++){let r=S.type[s];if(r===mt.DEEP)continue;let o=S.road[s]?"#d9c497":r===mt.SHALLOW?"#3fa9bb":"#"+Ks[r].color.toString(16).padStart(6,"0");i.has(o)||i.set(o,[]),i.get(o).push(s)}for(let[s,r]of i){t.fillStyle=s,t.beginPath();for(let o of r){let[a,l]=ho(S.x[o],S.z[o]);for(let c=0;c<6;c++){let h=Math.PI/3*c-Math.PI/6,u=a+Math.cos(h)*e,d=l+Math.sin(h)*e;c?t.lineTo(u,d):t.moveTo(u,d)}t.closePath()}t.fill()}wt.mmBase=n,wt.mmVersion=S.version}function Ib(){let n=zt("#minimap canvas");if(!n)return;(!wt.mmBase||wt.mmVersion!==S.version)&&Cb();let t=n.getContext("2d");t.clearRect(0,0,300,300),t.save(),t.beginPath(),t.arc(150,150,149,0,Math.PI*2),t.clip(),t.drawImage(wt.mmBase,0,0);for(let a of v.buildings){let[l,c]=ho(a.x,a.z);t.fillStyle=a.type==="hq"?"#ffd84a":a.def.cat==="military"?"#7fb2ff":"#f4efe4";let h=a.type==="hq"?7:4.4;t.fillRect(l-h/2,c-h/2,h,h)}for(let a of v.allies){if(!a.alive)continue;let[l,c]=ho(a.x,a.z);t.fillStyle="#62a8ff",t.fillRect(l-1.5,c-1.5,3,3)}for(let a of v.enemies){if(!a.alive)continue;let[l,c]=ho(a.x,a.z);t.fillStyle=a.domain==="air"?"#ffb347":"#ff3b30",t.beginPath(),a.domain==="air"?(t.moveTo(l+Math.sin(a.yaw)*5,c+Math.cos(a.yaw)*5),t.lineTo(l+Math.sin(a.yaw+2.5)*4,c+Math.cos(a.yaw+2.5)*4),t.lineTo(l+Math.sin(a.yaw-2.5)*4,c+Math.cos(a.yaw-2.5)*4)):t.arc(l,c,a.def.radius>.8?4:2.8,0,Math.PI*2),t.fill()}let e=v.wave,i=v.buildings.some(a=>a.type==="radar"&&a.connected);if(e.state==="prep"&&e.plan&&(i||e.timer<25)){t.strokeStyle="#ff3b30",t.lineWidth=3;let a=.5+.5*Math.sin(performance.now()/200);t.globalAlpha=.5+a*.5;for(let l of e.plan.dirs){let c=150+Math.sin(l)*140,h=150+Math.cos(l)*140,u=150+Math.sin(l)*112,d=150+Math.cos(l)*112;t.beginPath(),t.moveTo(c,h),t.lineTo(u,d),t.stroke(),t.beginPath(),t.moveTo(u,d),t.lineTo(u+Math.sin(l+.5)*10,d+Math.cos(l+.5)*10),t.lineTo(u+Math.sin(l-.5)*10,d+Math.cos(l-.5)*10),t.closePath(),t.fillStyle="#ff3b30",t.fill()}t.globalAlpha=1}let[s,r]=ho(Et.tx,Et.tz),o=Et.dist*.75*ar;t.save(),t.translate(s,r),t.rotate(-Et.yaw),t.strokeStyle="rgba(255,255,255,0.9)",t.lineWidth=1.5,t.strokeRect(-o*1.1,-o*.55,o*2.2,o*1.1),t.restore(),t.restore(),t.fillStyle="rgba(255,255,255,0.85)",t.font="bold 15px system-ui, sans-serif",t.textAlign="center",t.fillText("N",150,18)}var um=document.getElementById("view");try{ep(um)}catch(n){throw document.getElementById("ui").innerHTML=`<div class="fatal"><h1>Bastion Isle needs WebGL</h1><p>Your browser could not start 3D graphics. Make sure hardware acceleration is turned on in your browser settings, then reload.</p><pre>${String(n&&n.message||n)}</pre></div>`,n}sp();Xp(um);$p({newGame:()=>Bu(!1),continue:()=>Bu(!0),reroll:()=>{$n=Hu(),Vu($n),cl($n)},help:()=>Du(!1),settings:()=>Uu(!1),quit:()=>Pb(),fullscreen:()=>hl(),msaaAtStart:he.msaa});wt.perf=!!he.showFps;Zp(ip(Object.keys(le)));var dm=()=>{Sp()};window.addEventListener("pointerdown",dm);window.addEventListener("keydown",dm);var $n=Hu();function Hu(){return 1+Math.floor(Math.random()*999999)}function fm(){np(),tp(),$h(),Zh(),rp();for(let n in v.dirty)v.dirty[n]=!1;v.dirty.connect=!0}function Vu(n){v.mode="menu",su(n,oo),Ka(),fm(),Et.orbit=!0,Et.g.tx=0,Et.g.tz=0,Et.g.dist=62,Et.g.tilt=.05}function Bu(n){if(pi(null),n){if(!Mp()){Bu(!1);return}$n=v.seed}else su($n,oo),Ka();fm(),v.mode="play",Et.orbit=!1,Et.g.yaw=Math.round(Et.g.yaw/(Math.PI*2))*Math.PI*2,rr(v.hq.x,v.hq.z+4,30),Et.g.tilt=0,tm(),Ot("click")}function Pb(){pi(null),v.selected=null,$n=Hu(),Vu($n),cl($n)}v.onHQDestroyed=()=>{let n=v.hq;v.mode="over",pi(null),en(n.x,n.y+.6,n.z,3),en(n.x+.5,n.y+.3,n.z-.4,2),Ot("boomBig",n.x,n.z),ps(n.x,n.z,1),$a(n,!0),bp(),rr(n.x,n.z,26),setTimeout(()=>nm(),2600)};v.onVictory=()=>im();v.onBuildingDestroyed=n=>{en(n.x,n.y+.4,n.z,1.5),Gn(n.x,n.y,n.z,1.5),Ot("boomBig",n.x,n.z),ps(n.x,n.z,.35)};function Lb(){q.renderer.debug.checkShaderErrors=!1;let n=q.pools;for(let t in n)n[t].begin(),n[t].put(0,-40,0),n[t].end();q.hb.begin(),q.hb.bar(0,-40,0,.5),q.hb.end();for(let t in q.ghosts)q.ghosts[t].visible=!0,q.ghosts[t].position.set(0,-40,0);for(let t of[q.hover,q.select,q.rangeRing,q.rangeFill])t.visible=!0,t.position.set(0,-40,0);en(0,-40,0,1,!0),Zr(),q.renderer.render(q.scene,q.camera);for(let t in n)n[t].begin(),n[t].end();q.hb.begin(),q.hb.end();for(let t in q.ghosts)q.ghosts[t].visible=!1;for(let t of[q.hover,q.select,q.rangeRing,q.rangeFill])t.visible=!1}Lb();Vu($n);cl($n);function pm(n){if(v.time+=n,v.mode==="play")for(v.econT+=n;v.econT>=1;)v.econT-=1,gp();zp(n)}function mm(){v.dirty.connect&&(no(),v.dirty.connect=!1,v.dirty.roads=!0),v.dirty.roads&&(Zh(),v.dirty.roads=!1),v.dirty.trees&&($h(),v.dirty.trees=!1),v.dirty.terrainColors&&(co(),v.dirty.terrainColors=!1)}var go=new oe,fl=new Qe,pl=new Ve,gm=new N,xm=new N,vm={mg:1,coastal:1,flak:1,missile:1,radar:1},am=[...Object.keys(le).map(n=>"b_"+n),"b_house2",...Object.keys(vm).map(n=>"h_"+n)],lm=["u_gunboat","u_landing","u_destroyer","u_battleship","u_fighter","u_bomber","u_jet","u_infantry","u_soldier","u_ally_fighter"],Nu=[],cm=-1;function po(n,t,e,i,s,r,o,a,l,c,h){pl.set(s,r,o,"YXZ"),fl.setFromEuler(pl),go.compose(gm.set(t,e,i),fl,xm.set(a,a,a)),n.putMatrix(go,l,c,h)}var mo=1.12,Db=n=>1+2.70158*Math.pow(n-1,3)+1.70158*Math.pow(n-1,2);function ym(){let n=q.pools,t=q.hb,e=v.time;for(let s of am)n[s].begin();for(let s of lm)n[s].begin();n.marker.begin(),n.rubble.begin(),n.arrow.begin(),n.shell.begin(),n.bomb.begin(),n.missileP.begin(),n.rocketP.begin(),n.tracer.begin(),t.begin();for(let s of v.buildings){let r=e-s.born,o=r<.45?Math.max(.02,Db(Math.max(0,r/.45))):1,a=1,l=1,c=1;if(s.level===2?(a=1.05,l=1,c=.88):s.level>=3&&(a=1.1,l=.98,c=.74),s.connected||(a*=.72,l*=.72,c*=.78),s.flash>0){let u=s.flash;a+=u*.8,l*=1-.6*u,c*=1-.6*u}let h=s.type==="house"&&s.level>=2?"b_house2":"b_"+s.type;if(n[h].put(s.x,s.y,s.z,s.yaw,mo,o*mo,mo,a,l,c),vm[s.type]){let u=(1+.08*(s.level-1))*mo,d=s.def.weapon&&s.def.weapon.headY||s.def.headY||0;n["h_"+s.type].put(s.x,s.y+d*o*mo,s.z,s.headYaw,u,u*o,u,a,l,c)}!s.connected&&s.type!=="hq"&&n.marker.put(s.x,s.y+1.05+Math.sin(e*3+s.id)*.08,s.z,e*1.4+s.id),s.hp<s.maxHp-.5&&t.bar(s.x,s.y+(s.type==="hq"?2:1.25),s.z,s.hp/s.maxHp,s.type==="hq"?1.6:1)}if(cm!==S.version){cm=S.version,Nu.length=0;for(let s=0;s<S.count;s++)S.ruin[s]&&Nu.push(s)}for(let s of Nu)S.ruin[s]&&n.rubble.put(S.x[s],S.h[s],S.z[s],s*1.7);for(let s of v.enemies){if(s.gone)continue;let r=s.hitT>0?1:0,o=1+r*.8,a=1-r*.5,l=1-r*.5,c=n["u_"+s.type];if(s.domain==="ground"?c.put(s.x,s.y,s.z,s.yaw,1,1,1,o,a,l):po(c,s.x,s.y,s.z,s.pitch,s.yaw,s.bank,1,o,a,l),s.alive&&s.hp<s.maxHp){let h=s.def.radius||.4;t.bar(s.x,s.y+(s.domain==="air"?.6:s.domain==="sea"?.7+h*.5:.55),s.z,-s.hp/s.maxHp,.55+h*.5)}}for(let s of v.allies){if(s.gone)continue;let r=s.hitT>0?1:0,o=1+r*.8,a=1-r*.5,l=1-r*.5;s.type==="soldier"?n.u_soldier.put(s.x,s.y,s.z,s.yaw,1,1,1,o,a,l):po(n.u_ally_fighter,s.x,s.y,s.z,s.pitch,s.yaw,s.bank,s.state==="parked"?.85:1,o,a,l),s.alive&&s.hp<s.maxHp&&s.state!=="parked"&&t.bar(s.x,s.y+.5,s.z,s.hp/s.maxHp,.6)}for(let s of v.projectiles)switch(s.kind){case"shell":{let r=1+Math.min(1.2,s.splash*.3);s.team==="E"?n.shell.put(s.x,s.y,s.z,0,r,r,r,1.6,.55,.25):n.shell.put(s.x,s.y,s.z,0,r,r,r,1.6,1.3,.6);break}case"flak":n.shell.put(s.x,s.y,s.z,0,.8,.8,.8,1.5,1.2,.6);break;case"bomb":po(n.bomb,s.x,s.y,s.z,-Math.atan2(s.vy,Math.hypot(s.vx,s.vz)),Math.atan2(s.vx,s.vz),0,1.2,1,1,1);break;case"missile":po(n.missileP,s.x,s.y,s.z,-Math.atan2(s.vy,Math.hypot(s.vx,s.vz)),Math.atan2(s.vx,s.vz),0,1,1,1,1);break;case"rocket":{let r=s.ex-s.sx,o=s.ey-s.sy,a=s.ez-s.sz;po(n.rocketP,s.x,s.y,s.z,-Math.atan2(o,Math.hypot(r,a)),Math.atan2(r,a),0,.8,1,1,1);break}case"tracer":{let r=s.ex-s.sx,o=s.ey-s.sy,a=s.ez-s.sz,l=Math.hypot(r,o,a)||1,c=Math.min(1,s.t/s.T),h=Math.min(1.1,l*.4),u=Math.max(0,c-h/l);pl.set(-Math.asin(o/l),Math.atan2(r,a),0,"YXZ"),fl.setFromEuler(pl),go.compose(gm.set(s.sx+r*u,s.sy+o*u,s.sz+a*u),fl,xm.set(.035,.035,(c-u)*l+.02)),s.enemy?n.tracer.putMatrix(go,1,.45,.3):n.tracer.putMatrix(go,1,.9,.5);break}}let i=v.wave;if(v.mode==="play"&&i.state==="prep"&&i.plan&&(v.buildings.some(r=>r.type==="radar"&&r.connected)||i.timer<25)){let r=.55+.45*Math.sin(performance.now()/180);for(let o of i.plan.dirs){let a=34+Math.sin(performance.now()/400)*.8;n.arrow.put(Math.sin(o)*a,.08,Math.cos(o)*a,o+Math.PI,1.6,1,1.6,r*1.2,r*.25,r*.2)}}for(let s of am)n[s].end();for(let s of lm)n[s].end();n.marker.end(),n.rubble.end(),n.arrow.end(),n.shell.end(),n.bomb.end(),n.missileP.end(),n.rocketP.end(),n.tracer.end(),t.end()}var hm=performance.now(),ul=new Float32Array(180),Fu=0,zu=0,_m="",Ou=0,ku=0,dl=0,gi={fps:0,avg:0,worst:0,upd:0,gl:0};function Ub(n,t,e){if(ul[Fu]=n*1e3,Fu=(Fu+1)%ul.length,Ou+=t,ku+=e,dl++,zu-=n,zu>0)return;zu=.5;let i=0,s=0,r=0;for(let l=0;l<ul.length;l++){let c=ul[l];c>0&&(i+=c,r++,c>s&&(s=c))}let o=i/Math.max(1,r),a=q.renderer.info.render;gi.fps=1e3/o,gi.avg=o,gi.worst=s,gi.upd=Ou/dl,gi.gl=ku/dl,_m=`<b>${gi.fps.toFixed(0)}</b> fps \xB7 ${o.toFixed(2)} ms \xB7 worst ${s.toFixed(1)} ms<br>game ${gi.upd.toFixed(2)} ms \xB7 draw ${gi.gl.toFixed(2)} ms (CPU)<br>${q.width}\xD7${q.height} \xB7 ${a.calls} draws \xB7 ${(a.triangles/1e3).toFixed(0)}k tris<br>${v.enemies.length} enemies \xB7 ${v.allies.length} allies \xB7 ${v.projectiles.length} shots`,Ou=0,ku=0,dl=0}function Mm(n){requestAnimationFrame(Mm);let t=(n-hm)/1e3;hm=n,t>.25&&(t=.25),t<=0&&(t=1/1e3);let e=performance.now();if(v.mode==="play"||v.mode==="over"){let r=v.paused?0:Math.min(t*v.speed,.3);for(;r>1e-6;){let o=Math.min(r,.03333333333333333);pm(o),r-=o}}mm(),Vp(t),qp(),ym(),q.water.material.uniforms.uTime.value=n/1e3,Zr();let i=performance.now();q.renderer.info.reset(),q.renderer.render(q.scene,q.camera);let s=performance.now();om(t,_m),Ub(t,i-e+(performance.now()-s),s-i)}requestAnimationFrame(Mm);window.__bastion={G:v,W:S,R:q,CAM:Et,PERF:gi,game:{tryPlace:qa,tryRoad:Ya,addBuilding:nr,placeProblem:Xn,roadProblem:Ln,recomputeConnectivity:no},combat:{spawnEnemy:xu,spawnInfantry:vu,genWave:oo},step(n,t=1/30){let e=0,i=performance.now(),s=this.phases||(this.phases={sim:0,world:0,ents:0,fx:0});for(let r=0;r<n&&v.mode==="play";r++){let o=performance.now();pm(t);let a=performance.now();mm();let l=performance.now();ym();let c=performance.now();Zr();let h=performance.now();s.sim=Math.max(s.sim,a-o),s.world=Math.max(s.world,l-a),s.ents=Math.max(s.ents,c-l),s.fx=Math.max(s.fx,h-c);let u=this.hist||(this.hist={n:0,over1:0,over2:0,over4:0,worldOver1:0});u.n++,h-o>1&&u.over1++,h-o>2&&u.over2++,h-o>4&&u.over4++,l-a>1&&u.worldOver1++,e=Math.max(e,h-o)}return{ms:(performance.now()-i)/n,worst:e}}};})();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
