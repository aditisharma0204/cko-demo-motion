// Grainient — vanilla port of the React Bits component.
// Original component © its authors; ported here for use in plain HTML/JS.
// Loaded as an ES module so we can `import` ogl from the importmap.

import { Renderer, Program, Mesh, Triangle } from "ogl";

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [1, 1, 1];
  return [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255,
  ];
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o, vec2 C){
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);
  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;
  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);
  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));
  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);}
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;
  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);
  o=vec4(col,1.0);
}
void main(){
  vec4 o=vec4(0.0);
  mainImage(o,gl_FragCoord.xy);
  fragColor=o;
}`;

const DEFAULTS = {
  timeSpeed: 0.25,
  colorBalance: 0.0,
  warpStrength: 1.0,
  warpFrequency: 5.0,
  warpSpeed: 2.0,
  warpAmplitude: 50.0,
  blendAngle: 0.0,
  blendSoftness: 0.05,
  rotationAmount: 500.0,
  noiseScale: 2.0,
  grainAmount: 0.1,
  grainScale: 2.0,
  grainAnimated: false,
  contrast: 1.5,
  gamma: 1.0,
  saturation: 1.0,
  centerX: 0.0,
  centerY: 0.0,
  zoom: 0.9,
  color1: "#FF9FFC",
  color2: "#5227FF",
  color3: "#B497CF",
};

class Grainient {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = { ...DEFAULTS, ...opts };
    this._raf = 0;
    this._t0 = 0;
    this._running = false;
    this._init();
  }

  _init() {
    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.renderer = renderer;
    const gl = renderer.gl;
    this.gl = gl;
    const canvas = gl.canvas;
    // Canvas is sized as a square in _setSize and centered via absolute
    // positioning so the 1:1 gradient "covers" wider containers — matching
    // the React Bits Studio preview aspect.
    canvas.style.position = "absolute";
    canvas.style.left = "50%";
    canvas.style.top = "50%";
    canvas.style.display = "block";
    this.canvas = canvas;
    this.container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const o = this.opts;
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uTimeSpeed: { value: o.timeSpeed },
        uColorBalance: { value: o.colorBalance },
        uWarpStrength: { value: o.warpStrength },
        uWarpFrequency: { value: o.warpFrequency },
        uWarpSpeed: { value: o.warpSpeed },
        uWarpAmplitude: { value: o.warpAmplitude },
        uBlendAngle: { value: o.blendAngle },
        uBlendSoftness: { value: o.blendSoftness },
        uRotationAmount: { value: o.rotationAmount },
        uNoiseScale: { value: o.noiseScale },
        uGrainAmount: { value: o.grainAmount },
        uGrainScale: { value: o.grainScale },
        uGrainAnimated: { value: o.grainAnimated ? 1.0 : 0.0 },
        uContrast: { value: o.contrast },
        uGamma: { value: o.gamma },
        uSaturation: { value: o.saturation },
        uCenterOffset: { value: new Float32Array([o.centerX, o.centerY]) },
        uZoom: { value: o.zoom },
        uColor1: { value: new Float32Array(hexToRgb(o.color1)) },
        uColor2: { value: new Float32Array(hexToRgb(o.color2)) },
        uColor3: { value: new Float32Array(hexToRgb(o.color3)) },
      },
    });
    this.program = program;
    this.mesh = new Mesh(gl, { geometry, program });

    this._setSize();
    this._ro = new ResizeObserver(() => this._setSize());
    this._ro.observe(this.container);
  }

  _setSize() {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    // Render to a square canvas sized to the larger dimension; CSS centers
    // it so the gradient covers the container.
    const size = Math.max(w, h);
    this.renderer.setSize(size, size);
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.canvas.style.transform = "translate(-50%, -50%)";
    const res = this.program.uniforms.iResolution.value;
    res[0] = this.gl.drawingBufferWidth;
    res[1] = this.gl.drawingBufferHeight;
    if (!this._running) this.renderer.render({ scene: this.mesh });
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._t0 = performance.now();
    const loop = (t) => {
      if (!this._running) return;
      this.program.uniforms.iTime.value = (t - this._t0) * 0.001;
      this.renderer.render({ scene: this.mesh });
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  destroy() {
    this.stop();
    if (this._ro) this._ro.disconnect();
    try {
      this.container.removeChild(this.canvas);
    } catch (e) {
      // ignore
    }
  }
}

// Expose globally so the non-module script.js can construct it.
window.Grainient = Grainient;
