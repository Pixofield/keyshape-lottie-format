(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define(function() {
            return factory(root);
        });
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(root);
    } else {
        root.lottie = factory(root);
        root.bodymovin = root.lottie;
    }
}((window || {}), function(window) {
    var svgNS = "http://www.w3.org/2000/svg";

var locationHref = '';

var subframeEnabled = true;
var expressionsPlugin;
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var cachedColors = {};
var bm_rounder = Math.round;
var bm_rnd;
var bm_pow = Math.pow;
var bm_sqrt = Math.sqrt;
var bm_abs = Math.abs;
var bm_floor = Math.floor;
var bm_max = Math.max;
var bm_min = Math.min;
var blitter = 10;

var BMMath = {};
(function(){
    var propertyNames = Object.getOwnPropertyNames(Math);
    var i, len = propertyNames.length;
    for(i=0;i<len;i+=1){
        BMMath[propertyNames[i]] = Math[propertyNames[i]];
    }
}());

function ProjectInterface(){return {}};

BMMath.random = Math.random;
BMMath.abs = function(val){
    var tOfVal = typeof val;
    if(tOfVal === 'object' && val.length){
        var absArr = Array.apply(null,{length:val.length});
        var i, len = val.length;
        for(i=0;i<len;i+=1){
            absArr[i] = Math.abs(val[i]);
        }
        return absArr;
    }
    return Math.abs(val);

}
var defaultCurveSegments = 150;
var degToRads = Math.PI/180;
var roundCorner = 0.5519;

function roundValues(flag){
    if(flag){
        bm_rnd = Math.round;
    }else{
        bm_rnd = function(val){
            return val;
        };
    }
}
roundValues(false);

function styleDiv(element){
    element.style.position = 'absolute';
    element.style.top = 0;
    element.style.left = 0;
    element.style.display = 'block';
    element.style.transformOrigin = element.style.webkitTransformOrigin = '0 0';
    element.style.backfaceVisibility  = element.style.webkitBackfaceVisibility = 'visible';
    element.style.transformStyle = element.style.webkitTransformStyle = element.style.mozTransformStyle = "preserve-3d";
}

function styleUnselectableDiv(element){
    element.style.userSelect = 'none';
    element.style.MozUserSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.oUserSelect = 'none';

}

function BMEnterFrameEvent(n,c,t,d){
    this.type = n;
    this.currentTime = c;
    this.totalTime = t;
    this.direction = d < 0 ? -1:1;
}

function BMCompleteEvent(n,d){
    this.type = n;
    this.direction = d < 0 ? -1:1;
}

function BMCompleteLoopEvent(n,c,t,d){
    this.type = n;
    this.currentLoop = c;
    this.totalLoops = t;
    this.direction = d < 0 ? -1:1;
}

function BMSegmentStartEvent(n,f,t){
    this.type = n;
    this.firstFrame = f;
    this.totalFrames = t;
}

function BMDestroyEvent(n,t){
    this.type = n;
    this.target = t;
}

function _addEventListener(eventName, callback){

    if (!this._cbs[eventName]){
        this._cbs[eventName] = [];
    }
    this._cbs[eventName].push(callback);

	return function() {
		this.removeEventListener(eventName, callback);
	}.bind(this);
}

function _removeEventListener(eventName,callback){

    if (!callback){
        this._cbs[eventName] = null;
    }else if(this._cbs[eventName]){
        var i = 0, len = this._cbs[eventName].length;
        while(i<len){
            if(this._cbs[eventName][i] === callback){
                this._cbs[eventName].splice(i,1);
                i -=1;
                len -= 1;
            }
            i += 1;
        }
        if(!this._cbs[eventName].length){
            this._cbs[eventName] = null;
        }
    }

}

function _triggerEvent(eventName, args){
    if (this._cbs[eventName]) {
        var len = this._cbs[eventName].length;
        for (var i = 0; i < len; i++){
            this._cbs[eventName][i](args);
        }
    }
}

function randomString(length, chars){
    if(chars === undefined){
        chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    }
    var i;
    var result = '';
    for (i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [ r,
        g,
         b ];
}

function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [
         h,
         s,
         v
    ];
}

function addSaturationToRGB(color,offset){
    var hsv = RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);
    hsv[1] += offset;
    if (hsv[1] > 1) {
        hsv[1] = 1;
    }
    else if (hsv[1] <= 0) {
        hsv[1] = 0;
    }
    return HSVtoRGB(hsv[0],hsv[1],hsv[2]);
}

function addBrightnessToRGB(color,offset){
    var hsv = RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);
    hsv[2] += offset;
    if (hsv[2] > 1) {
        hsv[2] = 1;
    }
    else if (hsv[2] < 0) {
        hsv[2] = 0;
    }
    return HSVtoRGB(hsv[0],hsv[1],hsv[2]);
}

function addHueToRGB(color,offset) {
    var hsv = RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);
    hsv[0] += offset/360;
    if (hsv[0] > 1) {
        hsv[0] -= 1;
    }
    else if (hsv[0] < 0) {
        hsv[0] += 1;
    }
    return HSVtoRGB(hsv[0],hsv[1],hsv[2]);
}

var rgbToHex = (function(){
    var colorMap = [];
    var i;
    var hex;
    for(i=0;i<256;i+=1){
        hex = i.toString(16);
        colorMap[i] = hex.length == 1 ? '0' + hex : hex;
    }

    return function(r, g, b) {
        if(r<0){
            r = 0;
        }
        if(g<0){
            g = 0;
        }
        if(b<0){
            b = 0;
        }
        return '#' + colorMap[r] + colorMap[g] + colorMap[b];
    };
}());
var createTypedArray = (function(){
	function createRegularArray(type, len){
		var i = 0, arr = [], value;
		switch(type) {
			case 'int16':
			case 'uint8c':
				value = 1;
				break;
			default:
				value = 1.1;
				break;
		}
		for(i = 0; i < len; i += 1) {
			arr.push(value);
		}
		return arr;
	}
	function createTypedArray(type, len){
		if(type === 'float32') {
			return new Float32Array(len);
		} else if(type === 'int16') {
			return new Int16Array(len);
		} else if(type === 'uint8c') {
			return new Uint8ClampedArray(len);
		}
	}
	if(typeof Uint8ClampedArray === 'function' && typeof Float32Array === 'function') {
		return createTypedArray
	} else {
		return createRegularArray
	}
}())
function createNS(type) {
	return document.createElementNS(svgNS, type);
}
/*!
 Transformation Matrix v2.0
 (c) Epistemex 2014-2015
 www.epistemex.com
 By Ken Fyrstenberg
 Contributions by leeoniya.
 License: MIT, header required.
 */

/**
 * 2D transformation matrix object initialized with identity matrix.
 *
 * The matrix can synchronize a canvas context by supplying the context
 * as an argument, or later apply current absolute transform to an
 * existing context.
 *
 * All values are handled as floating point values.
 *
 * @param {CanvasRenderingContext2D} [context] - Optional context to sync with Matrix
 * @prop {number} a - scale x
 * @prop {number} b - shear y
 * @prop {number} c - shear x
 * @prop {number} d - scale y
 * @prop {number} e - translate x
 * @prop {number} f - translate y
 * @prop {CanvasRenderingContext2D|null} [context=null] - set or get current canvas context
 * @constructor
 */

var Matrix = (function(){

    var _cos = Math.cos;
    var _sin = Math.sin;
    var _tan = Math.tan;
    var _rnd = Math.round;

    function reset(){
        this.props[0] = 1;
        this.props[1] = 0;
        this.props[2] = 0;
        this.props[3] = 0;
        this.props[4] = 0;
        this.props[5] = 1;
        this.props[6] = 0;
        this.props[7] = 0;
        this.props[8] = 0;
        this.props[9] = 0;
        this.props[10] = 1;
        this.props[11] = 0;
        this.props[12] = 0;
        this.props[13] = 0;
        this.props[14] = 0;
        this.props[15] = 1;
        return this;
    }

    function rotate(angle) {
        if(angle === 0){
            return this;
        }
        var mCos = _cos(angle);
        var mSin = _sin(angle);
        return this._t(mCos, -mSin,  0, 0
            , mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1);
    }

    function rotateX(angle){
        if(angle === 0){
            return this;
        }
        var mCos = _cos(angle);
        var mSin = _sin(angle);
        return this._t(1, 0, 0, 0
            , 0, mCos, -mSin, 0
            , 0, mSin,  mCos, 0
            , 0, 0, 0, 1);
    }

    function rotateY(angle){
        if(angle === 0){
            return this;
        }
        var mCos = _cos(angle);
        var mSin = _sin(angle);
        return this._t(mCos,  0,  mSin, 0
            , 0, 1, 0, 0
            , -mSin,  0,  mCos, 0
            , 0, 0, 0, 1);
    }

    function rotateZ(angle){
        if(angle === 0){
            return this;
        }
        var mCos = _cos(angle);
        var mSin = _sin(angle);
        return this._t(mCos, -mSin,  0, 0
            , mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1);
    }

    function shear(sx,sy){
        return this._t(1, sy, sx, 1, 0, 0);
    }

    function skew(ax, ay){
        return this.shear(_tan(ax), _tan(ay));
    }

    function skewFromAxis(ax, angle){
        var mCos = _cos(angle);
        var mSin = _sin(angle);
        return this._t(mCos, mSin,  0, 0
            , -mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1)
            ._t(1, 0,  0, 0
            , _tan(ax),  1, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1)
            ._t(mCos, -mSin,  0, 0
            , mSin,  mCos, 0, 0
            , 0,  0,  1, 0
            , 0, 0, 0, 1);
        //return this._t(mCos, mSin, -mSin, mCos, 0, 0)._t(1, 0, _tan(ax), 1, 0, 0)._t(mCos, -mSin, mSin, mCos, 0, 0);
    }

    function scale(sx, sy, sz) {
        sz = isNaN(sz) ? 1 : sz;
        if(sx == 1 && sy == 1 && sz == 1){
            return this;
        }
        return this._t(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
    }

    function setTransform(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
        this.props[0] = a;
        this.props[1] = b;
        this.props[2] = c;
        this.props[3] = d;
        this.props[4] = e;
        this.props[5] = f;
        this.props[6] = g;
        this.props[7] = h;
        this.props[8] = i;
        this.props[9] = j;
        this.props[10] = k;
        this.props[11] = l;
        this.props[12] = m;
        this.props[13] = n;
        this.props[14] = o;
        this.props[15] = p;
        return this;
    }

    function translate(tx, ty, tz) {
        tz = tz || 0;
        if(tx !== 0 || ty !== 0 || tz !== 0){
            return this._t(1,0,0,0,0,1,0,0,0,0,1,0,tx,ty,tz,1);
        }
        return this;
    }

    function transform(a2, b2, c2, d2, e2, f2, g2, h2, i2, j2, k2, l2, m2, n2, o2, p2) {

        if(a2 === 1 && b2 === 0 && c2 === 0 && d2 === 0 && e2 === 0 && f2 === 1 && g2 === 0 && h2 === 0 && i2 === 0 && j2 === 0 && k2 === 1 && l2 === 0){
            if(m2 !== 0 || n2 !== 0 || o2 !== 0){

                this.props[12] = this.props[12] * a2 + this.props[13] * e2 + this.props[14] * i2 + this.props[15] * m2 ;
                this.props[13] = this.props[12] * b2 + this.props[13] * f2 + this.props[14] * j2 + this.props[15] * n2 ;
                this.props[14] = this.props[12] * c2 + this.props[13] * g2 + this.props[14] * k2 + this.props[15] * o2 ;
                this.props[15] = this.props[12] * d2 + this.props[13] * h2 + this.props[14] * l2 + this.props[15] * p2 ;
            }
            this._identityCalculated = false;
            return this;
        }

        var a1 = this.props[0];
        var b1 = this.props[1];
        var c1 = this.props[2];
        var d1 = this.props[3];
        var e1 = this.props[4];
        var f1 = this.props[5];
        var g1 = this.props[6];
        var h1 = this.props[7];
        var i1 = this.props[8];
        var j1 = this.props[9];
        var k1 = this.props[10];
        var l1 = this.props[11];
        var m1 = this.props[12];
        var n1 = this.props[13];
        var o1 = this.props[14];
        var p1 = this.props[15];

        /* matrix order (canvas compatible):
         * ace
         * bdf
         * 001
         */
        this.props[0] = a1 * a2 + b1 * e2 + c1 * i2 + d1 * m2;
        this.props[1] = a1 * b2 + b1 * f2 + c1 * j2 + d1 * n2 ;
        this.props[2] = a1 * c2 + b1 * g2 + c1 * k2 + d1 * o2 ;
        this.props[3] = a1 * d2 + b1 * h2 + c1 * l2 + d1 * p2 ;

        this.props[4] = e1 * a2 + f1 * e2 + g1 * i2 + h1 * m2 ;
        this.props[5] = e1 * b2 + f1 * f2 + g1 * j2 + h1 * n2 ;
        this.props[6] = e1 * c2 + f1 * g2 + g1 * k2 + h1 * o2 ;
        this.props[7] = e1 * d2 + f1 * h2 + g1 * l2 + h1 * p2 ;

        this.props[8] = i1 * a2 + j1 * e2 + k1 * i2 + l1 * m2 ;
        this.props[9] = i1 * b2 + j1 * f2 + k1 * j2 + l1 * n2 ;
        this.props[10] = i1 * c2 + j1 * g2 + k1 * k2 + l1 * o2 ;
        this.props[11] = i1 * d2 + j1 * h2 + k1 * l2 + l1 * p2 ;

        this.props[12] = m1 * a2 + n1 * e2 + o1 * i2 + p1 * m2 ;
        this.props[13] = m1 * b2 + n1 * f2 + o1 * j2 + p1 * n2 ;
        this.props[14] = m1 * c2 + n1 * g2 + o1 * k2 + p1 * o2 ;
        this.props[15] = m1 * d2 + n1 * h2 + o1 * l2 + p1 * p2 ;

        this._identityCalculated = false;
        return this;
    }

    function isIdentity() {
        if(!this._identityCalculated){
            this._identity = !(this.props[0] !== 1 || this.props[1] !== 0 || this.props[2] !== 0 || this.props[3] !== 0
                || this.props[4] !== 0 || this.props[5] !== 1 || this.props[6] !== 0 || this.props[7] !== 0
                || this.props[8] !== 0 || this.props[9] !== 0 || this.props[10] !== 1 || this.props[11] !== 0
                || this.props[12] !== 0 || this.props[13] !== 0 || this.props[14] !== 0 || this.props[15] !== 1);
            this._identityCalculated = true;
        }
        return this._identity;
    }

    function clone(matr){
        var i;
        for(i=0;i<16;i+=1){
            matr.props[i] = this.props[i];
        }
    }

    function cloneFromProps(props){
        var i;
        for(i=0;i<16;i+=1){
            this.props[i] = props[i];
        }
    }

    function applyToPoint(x, y, z) {

        return {
            x: x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12],
            y: x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13],
            z: x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14]
        };
        /*return {
         x: x * me.a + y * me.c + me.e,
         y: x * me.b + y * me.d + me.f
         };*/
    }
    function applyToX(x, y, z) {
        return x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12];
    }
    function applyToY(x, y, z) {
        return x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13];
    }
    function applyToZ(x, y, z) {
        return x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14];
    }

    function inversePoint(pt) {
        var determinant = this.props[0] * this.props[5] - this.props[1] * this.props[4];
        var a = this.props[5]/determinant;
        var b = - this.props[1]/determinant;
        var c = - this.props[4]/determinant;
        var d = this.props[0]/determinant;
        var e = (this.props[4] * this.props[13] - this.props[5] * this.props[12])/determinant;
        var f = - (this.props[0] * this.props[13] - this.props[1] * this.props[12])/determinant;
        return [pt[0] * a + pt[1] * c + e, pt[0] * b + pt[1] * d + f, 0];
    }

    function inversePoints(pts){
        var i, len = pts.length, retPts = [];
        for(i=0;i<len;i+=1){
            retPts[i] = inversePoint(pts[i]);
        }
        return retPts;
    }

    function applyToPointArray(x,y,z,dimensions){
        if(dimensions && dimensions === 2) {
            var arr = point_pool.newPoint();
            arr[0] = x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12]; 
            arr[1] = x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13]; 
            return arr;    
        }
        return [x * this.props[0] + y * this.props[4] + z * this.props[8] + this.props[12],x * this.props[1] + y * this.props[5] + z * this.props[9] + this.props[13],x * this.props[2] + y * this.props[6] + z * this.props[10] + this.props[14]];
    }
    function applyToPointStringified(x, y) {
        if(this.isIdentity()) {
            return x + ',' + y;
        }
        return (bm_rnd(x * this.props[0] + y * this.props[4] + this.props[12]))+','+(bm_rnd(x * this.props[1] + y * this.props[5] + this.props[13]));
    }

    function toCSS() {
        //Doesn't make much sense to add this optimization. If it is an identity matrix, it's very likely this will get called only once since it won't be keyframed.
        /*if(this.isIdentity()) {
            return '';
        }*/
        var i = 0;
        var props = this.props;
        var cssValue = 'matrix3d(';
        var v = 10000;
        while(i<16){
            cssValue += _rnd(props[i]*v)/v
            cssValue += i === 15 ? ')':',';
            i += 1;
        }
        return cssValue;
    }

    function to2dCSS() {
        //Doesn't make much sense to add this optimization. If it is an identity matrix, it's very likely this will get called only once since it won't be keyframed.
        /*if(this.isIdentity()) {
            console.log(new Error().stack)
            return '';
        }*/
        var v = 10000;
        var props = this.props;
        return "matrix(" + _rnd(props[0]*v)/v + ',' + _rnd(props[1]*v)/v + ',' + _rnd(props[4]*v)/v + ',' + _rnd(props[5]*v)/v + ',' + _rnd(props[12]*v)/v + ',' + _rnd(props[13]*v)/v + ")";
    }

    return function(){
        this.reset = reset;
        this.rotate = rotate;
        this.rotateX = rotateX;
        this.rotateY = rotateY;
        this.rotateZ = rotateZ;
        this.skew = skew;
        this.skewFromAxis = skewFromAxis;
        this.shear = shear;
        this.scale = scale;
        this.setTransform = setTransform;
        this.translate = translate;
        this.transform = transform;
        this.applyToPoint = applyToPoint;
        this.applyToX = applyToX;
        this.applyToY = applyToY;
        this.applyToZ = applyToZ;
        this.applyToPointArray = applyToPointArray;
        this.applyToPointStringified = applyToPointStringified;
        this.toCSS = toCSS;
        this.to2dCSS = to2dCSS;
        this.clone = clone;
        this.cloneFromProps = cloneFromProps;
        this.inversePoints = inversePoints;
        this.inversePoint = inversePoint;
        this._t = this.transform;
        this.isIdentity = isIdentity;
        this._identity = true;
        this._identityCalculated = false;

        this.props = createTypedArray('float32', 16);
        this.reset();
    }
}());

/*
 Copyright 2014 David Bau.

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

(function (pool, math) {
//
// The following constants are related to IEEE 754 limits.
//
    var global = this,
        width = 256,        // each RC4 output is 0 <= x < 256
        chunks = 6,         // at least six RC4 outputs for each double
        digits = 52,        // there are 52 significant digits in a double
        rngname = 'random', // rngname: name for Math.random and Math.seedrandom
        startdenom = math.pow(width, chunks),
        significance = math.pow(2, digits),
        overflow = significance * 2,
        mask = width - 1,
        nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
    function seedrandom(seed, options, callback) {
        var key = [];
        options = (options == true) ? { entropy: true } : (options || {});

        // Flatten the seed string or build one from local entropy if needed.
        var shortseed = mixkey(flatten(
            options.entropy ? [seed, tostring(pool)] :
                (seed == null) ? autoseed() : seed, 3), key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(key);

        // This function returns a random double in [0, 1) that contains
        // randomness in every bit of the mantissa of the IEEE 754 value.
        var prng = function() {
            var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
                d = startdenom,                 //   and denominator d = 2 ^ 48.
                x = 0;                          //   and no 'extra last byte'.
            while (n < significance) {          // Fill up all significant digits by
                n = (n + x) * width;              //   shifting numerator and
                d *= width;                       //   denominator and generating a
                x = arc4.g(1);                    //   new least-significant-byte.
            }
            while (n >= overflow) {             // To avoid rounding up, before adding
                n /= 2;                           //   last byte, shift everything
                d /= 2;                           //   right using integer math until
                x >>>= 1;                         //   we have exactly the desired bits.
            }
            return (n + x) / d;                 // Form the number within [0, 1).
        };

        prng.int32 = function() { return arc4.g(4) | 0; }
        prng.quick = function() { return arc4.g(4) / 0x100000000; }
        prng.double = prng;

        // Mix the randomness into accumulated entropy.
        mixkey(tostring(arc4.S), pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return (options.pass || callback ||
        function(prng, seed, is_math_call, state) {
            if (state) {
                // Load the arc4 state from the given state if it has an S array.
                if (state.S) { copy(state, arc4); }
                // Only provide the .state method if requested via options.state.
                prng.state = function() { return copy(arc4, {}); }
            }

            // If called as a method of Math (Math.seedrandom()), mutate
            // Math.random because that is how seedrandom.js has worked since v1.0.
            if (is_math_call) { math[rngname] = prng; return seed; }

            // Otherwise, it is a newer calling convention, so return the
            // prng directly.
            else return prng;
        })(
            prng,
            shortseed,
            'global' in options ? options.global : (this == math),
            options.state);
    }
    math['seed' + rngname] = seedrandom;

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
    function ARC4(key) {
        var t, keylen = key.length,
            me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

        // The empty key [] is treated as [0].
        if (!keylen) { key = [keylen++]; }

        // Set up S using the standard key scheduling algorithm.
        while (i < width) {
            s[i] = i++;
        }
        for (i = 0; i < width; i++) {
            s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
            s[j] = t;
        }

        // The "g" method returns the next (count) outputs as one number.
        (me.g = function(count) {
            // Using instance members instead of closure state nearly doubles speed.
            var t, r = 0,
                i = me.i, j = me.j, s = me.S;
            while (count--) {
                t = s[i = mask & (i + 1)];
                r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
            }
            me.i = i; me.j = j;
            return r;
            // For robust unpredictability, the function call below automatically
            // discards an initial batch of values.  This is called RC4-drop[256].
            // See http://google.com/search?q=rsa+fluhrer+response&btnI
        })(width);
    }

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
    function copy(f, t) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
    };

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
    function flatten(obj, depth) {
        var result = [], typ = (typeof obj), prop;
        if (depth && typ == 'object') {
            for (prop in obj) {
                try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
            }
        }
        return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    }

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
    function mixkey(seed, key) {
        var stringseed = seed + '', smear, j = 0;
        while (j < stringseed.length) {
            key[mask & j] =
                mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
        }
        return tostring(key);
    }

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
    function autoseed() {
        try {
            if (nodecrypto) { return tostring(nodecrypto.randomBytes(width)); }
            var out = new Uint8Array(width);
            (global.crypto || global.msCrypto).getRandomValues(out);
            return tostring(out);
        } catch (e) {
            var browser = global.navigator,
                plugins = browser && browser.plugins;
            return [+new Date, global, plugins, global.screen, tostring(pool)];
        }
    }

//
// tostring()
// Converts an array of charcodes to a string
//
    function tostring(a) {
        return String.fromCharCode.apply(0, a);
    }

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
    mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//

// End anonymous scope, and pass initial values.
})(
    [],     // pool: entropy pool starts empty
    BMMath    // math: package containing random, pow, and seedrandom
);
var BezierFactory = (function(){
    /**
     * BezierEasing - use bezier curve for transition easing function
     * by Gaëtan Renaudeau 2014 - 2015 – MIT License
     *
     * Credits: is based on Firefox's nsSMILKeySpline.cpp
     * Usage:
     * var spline = BezierEasing([ 0.25, 0.1, 0.25, 1.0 ])
     * spline.get(x) => returns the easing value | x must be in [0, 1] range
     *
     */

        var ob = {};
    ob.getBezierEasing = getBezierEasing;
    var beziers = {};

    function getBezierEasing(a,b,c,d,nm){
        var str = nm || ('bez_' + a+'_'+b+'_'+c+'_'+d).replace(/\./g, 'p');
        if(beziers[str]){
            return beziers[str];
        }
        var bezEasing = new BezierEasing([a,b,c,d]);
        beziers[str] = bezEasing;
        return bezEasing;
    }

// These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === "function";

    function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
    function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
    function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
    function calcBezier (aT, aA1, aA2) {
        return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
    }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
    function getSlope (aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    }

    function binarySubdivide (aX, aA, aB, mX1, mX2) {
        var currentX, currentT, i = 0;
        do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
                aB = currentT;
            } else {
                aA = currentT;
            }
        } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
        return currentT;
    }

    function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
        for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) return aGuessT;
            var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }

    /**
     * points is an array of [ mX1, mY1, mX2, mY2 ]
     */
    function BezierEasing (points) {
        this._p = points;
        this._mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
        this._precomputed = false;

        this.get = this.get.bind(this);
    }

    BezierEasing.prototype = {

        get: function (x) {
            var mX1 = this._p[0],
                mY1 = this._p[1],
                mX2 = this._p[2],
                mY2 = this._p[3];
            if (!this._precomputed) this._precompute();
            if (mX1 === mY1 && mX2 === mY2) return x; // linear
            // Because JavaScript number are imprecise, we should guarantee the extremes are right.
            if (x === 0) return 0;
            if (x === 1) return 1;
            return calcBezier(this._getTForX(x), mY1, mY2);
        },

        // Private part

        _precompute: function () {
            var mX1 = this._p[0],
                mY1 = this._p[1],
                mX2 = this._p[2],
                mY2 = this._p[3];
            this._precomputed = true;
            if (mX1 !== mY1 || mX2 !== mY2)
                this._calcSampleValues();
        },

        _calcSampleValues: function () {
            var mX1 = this._p[0],
                mX2 = this._p[2];
            for (var i = 0; i < kSplineTableSize; ++i) {
                this._mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            }
        },

        /**
         * getTForX chose the fastest heuristic to determine the percentage value precisely from a given X projection.
         */
        _getTForX: function (aX) {
            var mX1 = this._p[0],
                mX2 = this._p[2],
                mSampleValues = this._mSampleValues;

            var intervalStart = 0.0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;

            for (; currentSample !== lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }
            --currentSample;

            // Interpolate to provide an initial guess for t
            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample+1] - mSampleValues[currentSample]);
            var guessForT = intervalStart + dist * kSampleStepSize;

            var initialSlope = getSlope(guessForT, mX1, mX2);
            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
            } else if (initialSlope === 0.0) {
                return guessForT;
            } else {
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
            }
        }
    };

    return ob;

}());
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if(!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if(!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

function createElement(parent,child,params){
    if(child){
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
        child.prototype._parent = parent.prototype;
    }else{
        var instance = Object.create(parent.prototype,params);
        var getType = {};
        if(instance && getType.toString.call(instance.init) === '[object Function]'){
            instance.init();
        }
        return instance;
    }
}

function extendPrototype(source,destination){
    for (var attr in source.prototype) {
        if (source.prototype.hasOwnProperty(attr)) destination.prototype[attr] = source.prototype[attr];
    }
}

function getDescriptor(object, prop) {
    return Object.getOwnPropertyDescriptor(object, prop);
}
function bezFunction(){

    var easingFunctions = [];
    var math = Math;

    function pointOnLine2D(x1,y1, x2,y2, x3,y3){
        var det1 = (x1*y2) + (y1*x3) + (x2*y3) - (x3*y2) - (y3*x1) - (x2*y1);
        return det1 > -0.0001 && det1 < 0.0001;
    }

    function pointOnLine3D(x1,y1,z1, x2,y2,z2, x3,y3,z3){
        if(z1 === 0 && z2 === 0 && z3 === 0) {
            return pointOnLine2D(x1,y1, x2,y2, x3,y3);
        }
        var dist1 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
        var dist2 = Math.sqrt(Math.pow(x3 - x1, 2) + Math.pow(y3 - y1, 2) + Math.pow(z3 - z1, 2));
        var dist3 = Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2) + Math.pow(z3 - z2, 2));
        var diffDist;
        if(dist1 > dist2){
            if(dist1 > dist3){
                diffDist = dist1 - dist2 - dist3;
            } else {
                diffDist = dist3 - dist2 - dist1;
            }
        } else if(dist3 > dist2){
            diffDist = dist3 - dist2 - dist1;
        } else {
            diffDist = dist2 - dist1 - dist3;
        }
        return diffDist > -0.0001 && diffDist < 0.0001;
    }

    /*function getEasingCurve(aa,bb,cc,dd,encodedFuncName) {
        if(!encodedFuncName){
            encodedFuncName = ('bez_' + aa+'_'+bb+'_'+cc+'_'+dd).replace(/\./g, 'p');
        }
        if(easingFunctions[encodedFuncName]){
            return easingFunctions[encodedFuncName];
        }
        var A0, B0, C0;
        var A1, B1, C1;
        easingFunctions[encodedFuncName] = function(tt) {
            var x = tt;
            var i = 0, z;
            while (++i < 20) {
                C0 = 3 * aa;
                B0 = 3 * (cc - aa) - C0;
                A0 = 1 - C0 - B0;
                z = (x * (C0 + x * (B0 + x * A0))) - tt;
                if (bm_abs(z) < 1e-3) break;
                x -= z / (C0 + x * (2 * B0 + 3 * A0 * x));
            }
            C1 = 3 * bb;
            B1 = 3 * (dd - bb) - C1;
            A1 = 1 - C1 - B1;
            var polyB = x * (C1 + x * (B1 + x * A1));
            //return c * polyB + b;
            return polyB;
        };
        return easingFunctions[encodedFuncName];
    }*/
    var getBezierLength = (function(){

        function Segment(l,p){
            this.l = l;
            this.p = p;
        }

        return function(pt1,pt2,pt3,pt4){
            var curveSegments = defaultCurveSegments;
            var k;
            var i, len;
            var ptCoord,perc,addedLength = 0;
            var ptDistance;
            var point = [],lastPoint = [];
            var lengthData = {
                addedLength: 0,
                segments: Array.apply(null,{length:curveSegments})
            };
            len = pt3.length;
            for(k=0;k<curveSegments;k+=1){
                perc = k/(curveSegments-1);
                ptDistance = 0;
                for(i=0;i<len;i+=1){
                    ptCoord = bm_pow(1-perc,3)*pt1[i]+3*bm_pow(1-perc,2)*perc*pt3[i]+3*(1-perc)*bm_pow(perc,2)*pt4[i]+bm_pow(perc,3)*pt2[i];
                    point[i] = ptCoord;
                    if(lastPoint[i] !== null){
                        ptDistance += bm_pow(point[i] - lastPoint[i],2);
                    }
                    lastPoint[i] = point[i];
                }
                if(ptDistance){
                    ptDistance = bm_sqrt(ptDistance);
                    addedLength += ptDistance;
                }
                lengthData.segments[k] = new Segment(addedLength,perc);
            }
            lengthData.addedLength = addedLength;
            return lengthData;
        };
    }());

    function getSegmentsLength(shapeData) {
        var closed = shapeData.c;
        var pathV = shapeData.v;
        var pathO = shapeData.o;
        var pathI = shapeData.i;
        var i, len = shapeData._length;
        var lengths = [];
        var totalLength = 0;
        for(i=0;i<len-1;i+=1){
            lengths[i] = getBezierLength(pathV[i],pathV[i+1],pathO[i],pathI[i+1]);
            totalLength += lengths[i].addedLength;
        }
        if(closed){
            lengths[i] = getBezierLength(pathV[i],pathV[0],pathO[i],pathI[0]);
            totalLength += lengths[i].addedLength;
        }
        return {lengths:lengths,totalLength:totalLength};
    }

    function BezierData(length){
        this.segmentLength = 0;
        this.points = new Array(length);
    }

    function PointData(partial,point){
        this.partialLength = partial;
        this.point = point;
    }

    var buildBezierData = (function(){

        var storedData = {};

        return function (keyData){
            var pt1 = keyData.s;
            var pt2 = keyData.e;
            var pt3 = keyData.to;
            var pt4 = keyData.ti;
            var bezierName = (pt1[0]+'_'+pt1[1]+'_'+pt2[0]+'_'+pt2[1]+'_'+pt3[0]+'_'+pt3[1]+'_'+pt4[0]+'_'+pt4[1]).replace(/\./g, 'p');
            if(storedData[bezierName]){
                keyData.bezierData = storedData[bezierName];
                return;
            }
        var curveSegments = defaultCurveSegments;
        var k, i, len;
            var ptCoord,perc,addedLength = 0;
            var ptDistance;
            var point,lastPoint = null;
            if(pt1.length === 2 && (pt1[0] != pt2[0] || pt1[1] != pt2[1]) && pointOnLine2D(pt1[0],pt1[1],pt2[0],pt2[1],pt1[0]+pt3[0],pt1[1]+pt3[1]) && pointOnLine2D(pt1[0],pt1[1],pt2[0],pt2[1],pt2[0]+pt4[0],pt2[1]+pt4[1])){
                curveSegments = 2;
            }
            var bezierData = new BezierData(curveSegments);
            len = pt3.length;
            for(k=0;k<curveSegments;k+=1){
            point = new Array(len);
                perc = k/(curveSegments-1);
                ptDistance = 0;
                for(i=0;i<len;i+=1){
                ptCoord = bm_pow(1-perc,3)*pt1[i]+3*bm_pow(1-perc,2)*perc*(pt1[i] + pt3[i])+3*(1-perc)*bm_pow(perc,2)*(pt2[i] + pt4[i])+bm_pow(perc,3)*pt2[i];
                point[i] = ptCoord;
                    if(lastPoint !== null){
                    ptDistance += bm_pow(point[i] - lastPoint[i],2);
                    }
                }
            ptDistance = bm_sqrt(ptDistance);
                addedLength += ptDistance;
                bezierData.points[k] = new PointData(ptDistance,point);
                lastPoint = point;
            }
            bezierData.segmentLength = addedLength;
            keyData.bezierData = bezierData;
            storedData[bezierName] = bezierData;

        }
    }());

    function getDistancePerc(perc,bezierData){
        var segments = bezierData.segments;
        var len = segments.length;
        var initPos = bm_floor((len-1)*perc);
        var lengthPos = perc*bezierData.addedLength;
        var lPerc = 0;
        if(lengthPos == segments[initPos].l){
            return segments[initPos].p;
        }else{
            var dir = segments[initPos].l > lengthPos ? -1 : 1;
            var flag = true;
            while(flag){
                if(segments[initPos].l <= lengthPos && segments[initPos+1].l > lengthPos){
                    lPerc = (lengthPos - segments[initPos].l)/(segments[initPos+1].l-segments[initPos].l);
                    flag = false;
                }else{
                    initPos += dir;
                }
                if(initPos < 0 || initPos >= len - 1){
                    flag = false;
                }
            }
            return segments[initPos].p + (segments[initPos+1].p - segments[initPos].p)*lPerc;
        }
    }

    function SegmentPoints(){
        this.pt1 = new Array(2);
        this.pt2 = new Array(2);
        this.pt3 = new Array(2);
        this.pt4 = new Array(2);
    }

    function getPointInSegment(pt1, pt2, pt3, pt4, percent, bezierData) {
        var t1 = getDistancePerc(percent,bezierData);
        var u0 = 1;
        var u1 = 1 - t1;
        var ptX = Math.round((u1*u1*u1* pt1[0] + (t1*u1*u1 + u1*t1*u1 + u1*u1*t1)* pt3[0] + (t1*t1*u1 + u1*t1*t1 + t1*u1*t1)*pt4[0] + t1*t1*t1* pt2[0])* 1000) / 1000;
        var ptY = Math.round((u1*u1*u1* pt1[1] + (t1*u1*u1 + u1*t1*u1 + u1*u1*t1)* pt3[1] + (t1*t1*u1 + u1*t1*t1 + t1*u1*t1)*pt4[1] + t1*t1*t1* pt2[1])* 1000) / 1000;
        return [ptX, ptY];
    }

    function getNewSegment(pt1,pt2,pt3,pt4,startPerc,endPerc, bezierData){

        var pts = new SegmentPoints();
        startPerc = startPerc < 0 ? 0 : startPerc > 1 ? 1 : startPerc;
        var t0 = getDistancePerc(startPerc,bezierData);
        endPerc = endPerc > 1 ? 1 : endPerc;
        var t1 = getDistancePerc(endPerc,bezierData);
        var i, len = pt1.length;
        var u0 = 1 - t0;
        var u1 = 1 - t1;
        //Math.round(num * 100) / 100
        for(i=0;i<len;i+=1){
            pts.pt1[i] =  Math.round((u0*u0*u0* pt1[i] + (t0*u0*u0 + u0*t0*u0 + u0*u0*t0) * pt3[i] + (t0*t0*u0 + u0*t0*t0 + t0*u0*t0)* pt4[i] + t0*t0*t0* pt2[i])* 1000) / 1000;
            pts.pt3[i] = Math.round((u0*u0*u1*pt1[i] + (t0*u0*u1 + u0*t0*u1 + u0*u0*t1)* pt3[i] + (t0*t0*u1 + u0*t0*t1 + t0*u0*t1)* pt4[i] + t0*t0*t1* pt2[i])* 1000) / 1000;
            pts.pt4[i] = Math.round((u0*u1*u1* pt1[i] + (t0*u1*u1 + u0*t1*u1 + u0*u1*t1)* pt3[i] + (t0*t1*u1 + u0*t1*t1 + t0*u1*t1)* pt4[i] + t0*t1*t1* pt2[i])* 1000) / 1000;
            pts.pt2[i] = Math.round((u1*u1*u1* pt1[i] + (t1*u1*u1 + u1*t1*u1 + u1*u1*t1)* pt3[i] + (t1*t1*u1 + u1*t1*t1 + t1*u1*t1)*pt4[i] + t1*t1*t1* pt2[i])* 1000) / 1000;
        }
        return pts;
    }

    return {
        //getEasingCurve : getEasingCurve,
        getBezierLength : getBezierLength,
        getSegmentsLength : getSegmentsLength,
        getNewSegment : getNewSegment,
        getPointInSegment : getPointInSegment,
        buildBezierData : buildBezierData,
        pointOnLine2D : pointOnLine2D,
        pointOnLine3D : pointOnLine3D
    };
}

var bez = bezFunction();
function dataFunctionManager(){

    //var tCanvasHelper = document.createElement('canvas').getContext('2d');

    function completeLayers(layers, comps, fontManager){
        var layerData;
        var animArray, lastFrame;
        var i, len = layers.length;
        var j, jLen, k, kLen;
        for(i=0;i<len;i+=1){
            layerData = layers[i];
            if(!('ks' in layerData) || layerData.completed){
                continue;
            }
            layerData.completed = true;
            if(layerData.tt){
                layers[i-1].td = layerData.tt;
            }
            animArray = [];
            lastFrame = -1;
            if(layerData.hasMask){
                var maskProps = layerData.masksProperties;
                jLen = maskProps.length;
                for(j=0;j<jLen;j+=1){
                    if(maskProps[j].pt.k.i){
                        convertPathsToAbsoluteValues(maskProps[j].pt.k);
                    }else{
                        kLen = maskProps[j].pt.k.length;
                        for(k=0;k<kLen;k+=1){
                            if(maskProps[j].pt.k[k].s){
                                convertPathsToAbsoluteValues(maskProps[j].pt.k[k].s[0]);
                            }
                            if(maskProps[j].pt.k[k].e){
                                convertPathsToAbsoluteValues(maskProps[j].pt.k[k].e[0]);
                            }
                        }
                    }
                }
            }
            if(layerData.ty===0){
                layerData.layers = findCompLayers(layerData.refId, comps);
                completeLayers(layerData.layers,comps, fontManager);
            }else if(layerData.ty === 4){
                completeShapes(layerData.shapes);
            }else if(layerData.ty == 5){
                completeText(layerData, fontManager);
            }
        }
    }

    function findCompLayers(id,comps){
        var i = 0, len = comps.length;
        while(i<len){
            if(comps[i].id === id){
                if(!comps[i].layers.__used) {
                    comps[i].layers.__used = true;
                    return comps[i].layers;
                }
                return JSON.parse(JSON.stringify(comps[i].layers));
            }
            i += 1;
        }
    }

    function completeShapes(arr){
        var i, len = arr.length;
        var j, jLen;
        var hasPaths = false;
        for(i=len-1;i>=0;i-=1){
            if(arr[i].ty == 'sh'){
                if(arr[i].ks.k.i){
                    convertPathsToAbsoluteValues(arr[i].ks.k);
                }else{
                    jLen = arr[i].ks.k.length;
                    for(j=0;j<jLen;j+=1){
                        if(arr[i].ks.k[j].s){
                            convertPathsToAbsoluteValues(arr[i].ks.k[j].s[0]);
                        }
                        if(arr[i].ks.k[j].e){
                            convertPathsToAbsoluteValues(arr[i].ks.k[j].e[0]);
                        }
                    }
                }
                hasPaths = true;
            }else if(arr[i].ty == 'gr'){
                completeShapes(arr[i].it);
            }
        }
        /*if(hasPaths){
            //mx: distance
            //ss: sensitivity
            //dc: decay
            arr.splice(arr.length-1,0,{
                "ty": "ms",
                "mx":20,
                "ss":10,
                 "dc":0.001,
                "maxDist":200
            });
        }*/
    }

    function convertPathsToAbsoluteValues(path){
        var i, len = path.i.length;
        for(i=0;i<len;i+=1){
            path.i[i][0] += path.v[i][0];
            path.i[i][1] += path.v[i][1];
            path.o[i][0] += path.v[i][0];
            path.o[i][1] += path.v[i][1];
        }
    }

    function checkVersion(minimum,animVersionString){
        var animVersion = animVersionString ? animVersionString.split('.') : [100,100,100];
        if(minimum[0]>animVersion[0]){
            return true;
        } else if(animVersion[0] > minimum[0]){
            return false;
        }
        if(minimum[1]>animVersion[1]){
            return true;
        } else if(animVersion[1] > minimum[1]){
            return false;
        }
        if(minimum[2]>animVersion[2]){
            return true;
        } else if(animVersion[2] > minimum[2]){
            return false;
        }
    }

    var checkText = (function(){
        var minimumVersion = [4,4,14];

        function updateTextLayer(textLayer){
            var documentData = textLayer.t.d;
            textLayer.t.d = {
                k: [
                    {
                        s:documentData,
                        t:0
                    }
                ]
            }
        }

        function iterateLayers(layers){
            var i, len = layers.length;
            for(i=0;i<len;i+=1){
                if(layers[i].ty === 5){
                    updateTextLayer(layers[i]);
                }
            }
        }

        return function (animationData){
            if(checkVersion(minimumVersion,animationData.v)){
                iterateLayers(animationData.layers);
                if(animationData.assets){
                    var i, len = animationData.assets.length;
                    for(i=0;i<len;i+=1){
                        if(animationData.assets[i].layers){
                            iterateLayers(animationData.assets[i].layers);

                        }
                    }
                }
            }
        }
    }())

    var checkChars = (function() {
        var minimumVersion = [4,7,99];
        return function (animationData){
            if(animationData.chars && !checkVersion(minimumVersion,animationData.v)){
                var i, len = animationData.chars.length, j, jLen, k, kLen;
                var pathData, paths;
                for(i = 0; i < len; i += 1) {
                    if(animationData.chars[i].data && animationData.chars[i].data.shapes) {
                        paths = animationData.chars[i].data.shapes[0].it;
                        jLen = paths.length;

                        for(j = 0; j < jLen; j += 1) {
                            pathData = paths[j].ks.k;
                            if(!pathData.__converted) {
                                convertPathsToAbsoluteValues(paths[j].ks.k);
                                pathData.__converted = true;
                            }
                        }
                    }
                }
            }
        }

    }())

    var checkColors = (function(){
        var minimumVersion = [4,1,9];

        function iterateShapes(shapes){
            var i, len = shapes.length;
            var j, jLen;
            for(i=0;i<len;i+=1){
                if(shapes[i].ty === 'gr'){
                    iterateShapes(shapes[i].it);
                }else if(shapes[i].ty === 'fl' || shapes[i].ty === 'st'){
                    if(shapes[i].c.k && shapes[i].c.k[0].i){
                        jLen = shapes[i].c.k.length;
                        for(j=0;j<jLen;j+=1){
                            if(shapes[i].c.k[j].s){
                                shapes[i].c.k[j].s[0] /= 255;
                                shapes[i].c.k[j].s[1] /= 255;
                                shapes[i].c.k[j].s[2] /= 255;
                                shapes[i].c.k[j].s[3] /= 255;
                            }
                            if(shapes[i].c.k[j].e){
                                shapes[i].c.k[j].e[0] /= 255;
                                shapes[i].c.k[j].e[1] /= 255;
                                shapes[i].c.k[j].e[2] /= 255;
                                shapes[i].c.k[j].e[3] /= 255;
                            }
                        }
                    } else {
                        shapes[i].c.k[0] /= 255;
                        shapes[i].c.k[1] /= 255;
                        shapes[i].c.k[2] /= 255;
                        shapes[i].c.k[3] /= 255;
                    }
                }
            }
        }

        function iterateLayers(layers){
            var i, len = layers.length;
            for(i=0;i<len;i+=1){
                if(layers[i].ty === 4){
                    iterateShapes(layers[i].shapes);
                }
            }
        }

        return function (animationData){
            if(checkVersion(minimumVersion,animationData.v)){
                iterateLayers(animationData.layers);
                if(animationData.assets){
                    var i, len = animationData.assets.length;
                    for(i=0;i<len;i+=1){
                        if(animationData.assets[i].layers){
                            iterateLayers(animationData.assets[i].layers);

                        }
                    }
                }
            }
        }
    }());

    var checkShapes = (function(){
        var minimumVersion = [4,4,18];



        function completeShapes(arr){
            var i, len = arr.length;
            var j, jLen;
            var hasPaths = false;
            for(i=len-1;i>=0;i-=1){
                if(arr[i].ty == 'sh'){
                    if(arr[i].ks.k.i){
                        arr[i].ks.k.c = arr[i].closed;
                    }else{
                        jLen = arr[i].ks.k.length;
                        for(j=0;j<jLen;j+=1){
                            if(arr[i].ks.k[j].s){
                                arr[i].ks.k[j].s[0].c = arr[i].closed;
                            }
                            if(arr[i].ks.k[j].e){
                                arr[i].ks.k[j].e[0].c = arr[i].closed;
                            }
                        }
                    }
                    hasPaths = true;
                }else if(arr[i].ty == 'gr'){
                    completeShapes(arr[i].it);
                }
            }
        }

        function iterateLayers(layers){
            var layerData;
            var i, len = layers.length;
            var j, jLen, k, kLen;
            for(i=0;i<len;i+=1){
                layerData = layers[i];
                if(layerData.hasMask){
                    var maskProps = layerData.masksProperties;
                    jLen = maskProps.length;
                    for(j=0;j<jLen;j+=1){
                        if(maskProps[j].pt.k.i){
                            maskProps[j].pt.k.c = maskProps[j].cl;
                        }else{
                            kLen = maskProps[j].pt.k.length;
                            for(k=0;k<kLen;k+=1){
                                if(maskProps[j].pt.k[k].s){
                                    maskProps[j].pt.k[k].s[0].c = maskProps[j].cl;
                                }
                                if(maskProps[j].pt.k[k].e){
                                    maskProps[j].pt.k[k].e[0].c = maskProps[j].cl;
                                }
                            }
                        }
                    }
                }
                if(layerData.ty === 4){
                    completeShapes(layerData.shapes);
                }
            }
        }

        return function (animationData){
            if(checkVersion(minimumVersion,animationData.v)){
                iterateLayers(animationData.layers);
                if(animationData.assets){
                    var i, len = animationData.assets.length;
                    for(i=0;i<len;i+=1){
                        if(animationData.assets[i].layers){
                            iterateLayers(animationData.assets[i].layers);

                        }
                    }
                }
            }
        }
    }());

    /*function blitPaths(path){
        var i, len = path.i.length;
        for(i=0;i<len;i+=1){
            path.i[i][0] /= blitter;
            path.i[i][1] /= blitter;
            path.o[i][0] /= blitter;
            path.o[i][1] /= blitter;
            path.v[i][0] /= blitter;
            path.v[i][1] /= blitter;
        }
    }

    function blitShapes(arr){
        var i, len = arr.length;
        var j, jLen;
        var hasPaths = false;
        for(i=len-1;i>=0;i-=1){
            if(arr[i].ty == 'sh'){
                if(arr[i].ks.k.i){
                    blitPaths(arr[i].ks.k);
                }else{
                    jLen = arr[i].ks.k.length;
                    for(j=0;j<jLen;j+=1){
                        if(arr[i].ks.k[j].s){
                            blitPaths(arr[i].ks.k[j].s[0]);
                        }
                        if(arr[i].ks.k[j].e){
                            blitPaths(arr[i].ks.k[j].e[0]);
                        }
                    }
                }
                hasPaths = true;
            }else if(arr[i].ty == 'gr'){
                blitShapes(arr[i].it);
            }else if(arr[i].ty == 'rc'){
                blitProperty(arr[i].p);
                blitProperty(arr[i].s);
            }else if(arr[i].ty == 'st'){
                blitProperty(arr[i].w);
            }else if(arr[i].ty == 'tr'){
                blitProperty(arr[i].p);
                blitProperty(arr[i].sk);
                blitProperty(arr[i].a);
            }else if(arr[i].ty == 'el'){
                blitProperty(arr[i].p);
                blitProperty(arr[i].s);
            }else if(arr[i].ty == 'rd'){
                blitProperty(arr[i].r);
            }else{

                //console.log(arr[i].ty );
            }
        }
    }

    function blitText(data, fontManager){

    }

    function blitValue(val){
        if(typeof(val) === 'number'){
            val /= blitter;
        } else {
            var i = val.length-1;
            while(i>=0){
                val[i] /= blitter;
                i-=1;
            }
        }
        return val;
    }

    function blitProperty(data){
        if(!data.k.length){
            data.k = blitValue(data.k);
        }else if(typeof(data.k[0]) === 'number'){
            data.k = blitValue(data.k);
        } else {
            var i, len = data.k.length;
            for(i=0;i<len;i+=1){
                if(data.k[i].s){
                    //console.log('pre S: ', data.k[i].s);
                    data.k[i].s = blitValue(data.k[i].s);
                    //console.log('post S: ', data.k[i].s);
                }
                if(data.k[i].e){
                    //console.log('pre E: ', data.k[i].e);
                    data.k[i].e = blitValue(data.k[i].e);
                    //console.log('post E: ', data.k[i].e);
                }
            }
        }
    }

    function blitLayers(layers,comps, fontManager){
        var layerData;
        var animArray, lastFrame;
        var i, len = layers.length;
        var j, jLen, k, kLen;
        for(i=0;i<len;i+=1){
            layerData = layers[i];
            if(!('ks' in layerData)){
                continue;
            }
            blitProperty(layerData.ks.a);
            blitProperty(layerData.ks.p);
            layerData.completed = true;
            if(layerData.tt){
                layers[i-1].td = layerData.tt;
            }
            animArray = [];
            lastFrame = -1;
            if(layerData.hasMask){
                var maskProps = layerData.masksProperties;
                jLen = maskProps.length;
                for(j=0;j<jLen;j+=1){
                    if(maskProps[j].pt.k.i){
                        blitPaths(maskProps[j].pt.k);
                    }else{
                        kLen = maskProps[j].pt.k.length;
                        for(k=0;k<kLen;k+=1){
                            if(maskProps[j].pt.k[k].s){
                                blitPaths(maskProps[j].pt.k[k].s[0]);
                            }
                            if(maskProps[j].pt.k[k].e){
                                blitPaths(maskProps[j].pt.k[k].e[0]);
                            }
                        }
                    }
                }
            }
            if(layerData.ty===0){
                layerData.w = Math.round(layerData.w/blitter);
                layerData.h = Math.round(layerData.h/blitter);
                blitLayers(layerData.layers,comps, fontManager);
            }else if(layerData.ty === 4){
                blitShapes(layerData.shapes);
            }else if(layerData.ty == 5){
                blitText(layerData, fontManager);
            }else if(layerData.ty == 1){
                layerData.sh /= blitter;
                layerData.sw /= blitter;
            } else {
            }
        }
    }

    function blitAnimation(animationData,comps, fontManager){
        blitLayers(animationData.layers,comps, fontManager);
    }*/

    function completeData(animationData, fontManager){
        if(animationData.__complete){
            return;
        }
        checkColors(animationData);
        checkText(animationData);
        checkChars(animationData);
        checkShapes(animationData);
        completeLayers(animationData.layers, animationData.assets, fontManager);
        animationData.__complete = true;
        //blitAnimation(animationData, animationData.assets, fontManager);
    }

    function completeText(data, fontManager){
        if(data.t.a.length === 0 && !('m' in data.t.p)){
            data.singleShape = true;
        }
    }

    var moduleOb = {};
    moduleOb.completeData = completeData;

    return moduleOb;
}

var dataManager = dataFunctionManager();
var FontManager = (function(){

    var maxWaitingTime = 5000;
    var emptyChar = {
        w: 0,
        size:0,
        shapes:[]
    }

    function setUpNode(font, family){
        var parentNode = document.createElement('span');
        parentNode.style.fontFamily    = family;
        var node = document.createElement('span');
        // Characters that vary significantly among different fonts
        node.innerHTML = 'giItT1WQy@!-/#';
        // Visible - so we can measure it - but not on the screen
        parentNode.style.position      = 'absolute';
        parentNode.style.left          = '-10000px';
        parentNode.style.top           = '-10000px';
        // Large font size makes even subtle changes obvious
        parentNode.style.fontSize      = '300px';
        // Reset any font properties
        parentNode.style.fontVariant   = 'normal';
        parentNode.style.fontStyle     = 'normal';
        parentNode.style.fontWeight    = 'normal';
        parentNode.style.letterSpacing = '0';
        parentNode.appendChild(node);
        document.body.appendChild(parentNode);

        // Remember width with no applied web font
        var width = node.offsetWidth;
        node.style.fontFamily = font + ', '+family;
        return {node:node, w:width, parent:parentNode};
    }

    function checkLoadedFonts() {
        var i, len = this.fonts.length;
        var node, w;
        var loadedCount = len;
        for(i=0;i<len; i+= 1){
            if(this.fonts[i].loaded){
                loadedCount -= 1;
                continue;
            }
            if(this.fonts[i].fOrigin === 't' || this.fonts[i].origin === 2){
                if(window.Typekit && window.Typekit.load && this.typekitLoaded === 0){
                    this.typekitLoaded = 1;
                    try{window.Typekit.load({
                        async: true,
                        active: function() {
                            this.typekitLoaded = 2;
                        }.bind(this)
                    });}catch(e){}
                }
                if(this.typekitLoaded === 2) {
                    this.fonts[i].loaded = true;
                }
            } else if(this.fonts[i].fOrigin === 'n' || this.fonts[i].origin === 0){
                this.fonts[i].loaded = true;
            } else{
                node = this.fonts[i].monoCase.node;
                w = this.fonts[i].monoCase.w;
                if(node.offsetWidth !== w){
                    loadedCount -= 1;
                    this.fonts[i].loaded = true;
                }else{
                    node = this.fonts[i].sansCase.node;
                    w = this.fonts[i].sansCase.w;
                    if(node.offsetWidth !== w){
                        loadedCount -= 1;
                        this.fonts[i].loaded = true;
                    }
                }
                if(this.fonts[i].loaded){
                    this.fonts[i].sansCase.parent.parentNode.removeChild(this.fonts[i].sansCase.parent);
                    this.fonts[i].monoCase.parent.parentNode.removeChild(this.fonts[i].monoCase.parent);
                }
            }
        }

        if(loadedCount !== 0 && Date.now() - this.initTime < maxWaitingTime){
            setTimeout(checkLoadedFonts.bind(this),20);
        }else{
            setTimeout(function(){this.loaded = true;}.bind(this),0);

        }
    };

    function createHelper(def, fontData){
        var tHelper = createNS('text');
        tHelper.style.fontSize = '100px';
        tHelper.style.fontFamily = fontData.fFamily;
        tHelper.textContent = '1';
        if(fontData.fClass){
            tHelper.style.fontFamily = 'inherit';
            tHelper.className = fontData.fClass;
        } else {
            tHelper.style.fontFamily = fontData.fFamily;
        }
        def.appendChild(tHelper);
        var tCanvasHelper = document.createElement('canvas').getContext('2d');
        tCanvasHelper.font = '100px '+ fontData.fFamily;
        return tCanvasHelper;
    }

    function addFonts(fontData, defs){
        if(!fontData){
            this.loaded = true;
            return;
        }
        if(this.chars){
            this.loaded = true;
            this.fonts = fontData.list;
            return;
        }

        var fontArr = fontData.list;
        var i, len = fontArr.length;
        for(i=0; i<len; i+= 1){
            fontArr[i].loaded = false;
            fontArr[i].monoCase = setUpNode(fontArr[i].fFamily,'monospace');
            fontArr[i].sansCase = setUpNode(fontArr[i].fFamily,'sans-serif');
            if(!fontArr[i].fPath) {
                fontArr[i].loaded = true;
            }else if(fontArr[i].fOrigin === 'p' || fontArr[i].origin === 3){
                var s = document.createElement('style');
                s.type = "text/css";
                s.innerHTML = "@font-face {" + "font-family: "+fontArr[i].fFamily+"; font-style: normal; src: url('"+fontArr[i].fPath+"');}";
                defs.appendChild(s);
            } else if(fontArr[i].fOrigin === 'g' || fontArr[i].origin === 1){
                //<link href='https://fonts.googleapis.com/css?family=Montserrat' rel='stylesheet' type='text/css'>
                var l = document.createElement('link');
                l.type = "text/css";
                l.rel = "stylesheet";
                l.href = fontArr[i].fPath;
                defs.appendChild(l);
            } else if(fontArr[i].fOrigin === 't' || fontArr[i].origin === 2){
                //<link href='https://fonts.googleapis.com/css?family=Montserrat' rel='stylesheet' type='text/css'>
                var sc = document.createElement('script');
                sc.setAttribute('src',fontArr[i].fPath);
                defs.appendChild(sc);
            }
            fontArr[i].helper = createHelper(defs,fontArr[i]);
            this.fonts.push(fontArr[i]);
        }
        checkLoadedFonts.bind(this)();
    }

    function addChars(chars){
        if(!chars){
            return;
        }
        if(!this.chars){
            this.chars = [];
        }
        var i, len = chars.length;
        var j, jLen = this.chars.length, found;
        for(i=0;i<len;i+=1){
            j = 0;
            found = false;
            while(j<jLen){
                if(this.chars[j].style === chars[i].style && this.chars[j].fFamily === chars[i].fFamily && this.chars[j].ch === chars[i].ch){
                    found = true;
                }
                j += 1;
            }
            if(!found){
                this.chars.push(chars[i]);
                jLen += 1;
            }
        }
    }

    function getCharData(char, style, font){
        var i = 0, len = this.chars.length;
        while( i < len) {
            if(this.chars[i].ch === char && this.chars[i].style === style && this.chars[i].fFamily === font){
                return this.chars[i];
            }
            i+= 1;
        }
        if(console && console.warn) {
            console.warn('Missing character from exported characters list: ', char, style, font);
        }
        return emptyChar;
    }

    function measureText(char, fontName, size){
        var fontData = this.getFontByName(fontName);
        var tHelper = fontData.helper;
        //tHelper.textContent = char;
        return tHelper.measureText(char).width*size/100;
        //return tHelper.getComputedTextLength()*size/100;
    }

    function getFontByName(name){
        var i = 0, len = this.fonts.length;
        while(i<len){
            if(this.fonts[i].fName === name) {
                return this.fonts[i];
            }
            i += 1;
        }
        return 'sans-serif';
    }

    var Font = function(){
        this.fonts = [];
        this.chars = null;
        this.typekitLoaded = 0;
        this.loaded = false;
        this.initTime = Date.now();
    };
    Font.prototype.addChars = addChars;
    Font.prototype.addFonts = addFonts;
    Font.prototype.getCharData = getCharData;
    Font.prototype.getFontByName = getFontByName;
    Font.prototype.measureText = measureText;

    return Font;

}());
var PropertyFactory = (function(){

    var initFrame = -999999;

    function interpolateValue(frameNum, iterationIndex, previousValue, caching){
        var offsetTime = this.offsetTime;
        var newValue;
        if(this.propType === 'multidimensional') {
            newValue = createTypedArray('float32', previousValue.length);
        }
        var i = iterationIndex;
        var len = this.keyframes.length- 1,flag = true;
        var keyData, nextKeyData;

        while(flag){
            keyData = this.keyframes[i];
            nextKeyData = this.keyframes[i+1];
            if(i == len-1 && frameNum >= nextKeyData.t - offsetTime){
                if(keyData.h){
                    keyData = nextKeyData;
                }
                iterationIndex = 0;
                break;
            }
            if((nextKeyData.t - offsetTime) > frameNum){
                iterationIndex = i;
                break;
            }
            if(i < len - 1){
                i += 1;
            }else{
                iterationIndex = 0;
                flag = false;
            }
        }

        var k, kLen,perc,jLen, j, fnc;
        if(keyData.to){

            if(!keyData.bezierData){
                bez.buildBezierData(keyData);
            }
            var bezierData = keyData.bezierData;
            if(frameNum >= nextKeyData.t-offsetTime || frameNum < keyData.t-offsetTime){
                var ind = frameNum >= nextKeyData.t-offsetTime ? bezierData.points.length - 1 : 0;
                kLen = bezierData.points[ind].point.length;
                for(k = 0; k < kLen; k += 1){
                    newValue[k] = bezierData.points[ind].point[k];
                }
                caching._lastBezierData = null;
            }else{
                if(keyData.__fnct){
                    fnc = keyData.__fnct;
                }else{
                    fnc = BezierFactory.getBezierEasing(keyData.o.x,keyData.o.y,keyData.i.x,keyData.i.y,keyData.n).get;
                    keyData.__fnct = fnc;
                }
                perc = fnc((frameNum-(keyData.t-offsetTime))/((nextKeyData.t-offsetTime)-(keyData.t-offsetTime)));
                var distanceInLine = bezierData.segmentLength*perc;

                var segmentPerc;
                var addedLength =  (caching.lastFrame < frameNum && caching._lastBezierData === bezierData) ? caching._lastAddedLength : 0;
                j =  (caching.lastFrame < frameNum && caching._lastBezierData === bezierData) ? caching._lastPoint : 0;
                flag = true;
                jLen = bezierData.points.length;
                while(flag){
                    addedLength +=bezierData.points[j].partialLength;
                    if(distanceInLine === 0 || perc === 0 || j == bezierData.points.length - 1){
                        kLen = bezierData.points[j].point.length;
                        for(k=0;k<kLen;k+=1){
                            newValue[k] = bezierData.points[j].point[k];
                        }
                        break;
                    }else if(distanceInLine >= addedLength && distanceInLine < addedLength + bezierData.points[j+1].partialLength){
                        segmentPerc = (distanceInLine-addedLength)/(bezierData.points[j+1].partialLength);
                        kLen = bezierData.points[j].point.length;
                        for(k=0;k<kLen;k+=1){
                            newValue[k] = bezierData.points[j].point[k] + (bezierData.points[j+1].point[k] - bezierData.points[j].point[k])*segmentPerc;
                        }
                        break;
                    }
                    if(j < jLen - 1){
                        j += 1;
                    }else{
                        flag = false;
                    }
                }
                caching._lastPoint = j;
                caching._lastAddedLength = addedLength - bezierData.points[j].partialLength;
                caching._lastBezierData = bezierData;
            }
        }else{
            var outX,outY,inX,inY, keyValue;
            len = keyData.s.length;
            for(i=0;i<len;i+=1){
                if(keyData.h !== 1){
                    if(frameNum >= nextKeyData.t-offsetTime){
                        perc = 1;
                    }else if(frameNum < keyData.t-offsetTime){
                        perc = 0;
                    }else{
                        if(keyData.o.x.constructor === Array){
                            if(!keyData.__fnct){
                                keyData.__fnct = [];
                            }
                            if (!keyData.__fnct[i]) {
                                outX = keyData.o.x[i] || keyData.o.x[0];
                                outY = keyData.o.y[i] || keyData.o.y[0];
                                inX = keyData.i.x[i] || keyData.i.x[0];
                                inY = keyData.i.y[i] || keyData.i.y[0];
                                fnc = BezierFactory.getBezierEasing(outX,outY,inX,inY).get;
                                keyData.__fnct[i] = fnc;
                            } else {
                                fnc = keyData.__fnct[i];
                            }
                        } else {
                            if (!keyData.__fnct) {
                                outX = keyData.o.x;
                                outY = keyData.o.y;
                                inX = keyData.i.x;
                                inY = keyData.i.y;
                                fnc = BezierFactory.getBezierEasing(outX,outY,inX,inY).get;
                                keyData.__fnct = fnc;
                            } else{
                                fnc = keyData.__fnct;
                            }
                        }
                        perc = fnc((frameNum-(keyData.t-offsetTime))/((nextKeyData.t-offsetTime)-(keyData.t-offsetTime)));
                    }
                }
                if(this.sh && keyData.h !== 1){
                    var initP = keyData.s[i];
                    var endP = keyData.e[i];
                    if(initP-endP < -180){
                        initP += 360;
                    } else if(initP-endP > 180){
                        initP -= 360;
                    }
                    keyValue = initP+(endP-initP)*perc;
                } else {
                    keyValue = keyData.h === 1 ? keyData.s[i] : keyData.s[i]+(keyData.e[i]-keyData.s[i])*perc;
                }
                if(len === 1){
                    newValue = keyValue;
                }else{
                    newValue[i] = keyValue;
                }
            }
        }
        return {
            value: newValue,
            iterationIndex: iterationIndex
        }
    }

    function getValueAtCurrentTime(){
        if(this.elem.globalData.frameId === this.frameId){
            return;
        }
        this.mdf = false;
        var frameNum = this.comp.renderedFrame - this.offsetTime;
        var initTime = this.keyframes[0].t-this.offsetTime;
        var endTime = this.keyframes[this.keyframes.length- 1].t-this.offsetTime;
        if(!(frameNum === this._caching.lastFrame || (this._caching.lastFrame !== initFrame && ((this._caching.lastFrame >= endTime && frameNum >= endTime) || (this._caching.lastFrame < initTime && frameNum < initTime))))){
            var i = this._caching.lastFrame < frameNum ? this._caching.lastIndex : 0;
            var renderResult = this.interpolateValue(frameNum, i, this.pv, this._caching);
            this._caching.lastIndex = renderResult.iterationIndex;
            if(this.propType === 'multidimensional'){
                i = 0;
                while(i<this.v.length){
                    this.pv[i] = renderResult.value[i];
                    this.v[i] = this.mult ? this.pv[i] * this.mult : this.pv[i];
                    if(this.lastPValue[i] !== this.pv[i]) {
                        this.mdf = true;
                        this.lastPValue[i] = this.pv[i];
                    }
                    i += 1;
                }
                if(this.firstFrame) {
                    this.firstFrame = false;
                    this.mdf = true;
                }
            } else {
                this.pv = renderResult.value;
                this.v = this.mult ? this.pv*this.mult : this.pv;
                if(this.lastPValue != this.pv){
                    this.mdf = true;
                    this.lastPValue = this.pv;
                }
            }
            
        }
        this._caching.lastFrame = frameNum;
        this.frameId = this.elem.globalData.frameId;
    }

    function getNoValue(){}

    function ValueProperty(elem,data, mult){
        this.propType = 'unidimensional';
        this.mult = mult;
        this.v = mult ? data.k * mult : data.k;
        this.pv = data.k;
        this.mdf = false;
        this.comp = elem.comp;
        this.k = false;
        this.kf = false;
        this.vel = 0;
        this.getValue = getNoValue;
    }

    function MultiDimensionalProperty(elem,data, mult){
        this.propType = 'multidimensional';
        this.mult = mult;
        this.data = data;
        this.mdf = false;
        this.comp = elem.comp;
        this.k = false;
        this.kf = false;
        this.frameId = -1;
        this.v = createTypedArray('float32', data.k.length);
        this.pv = createTypedArray('float32', data.k.length);
        this.lastValue = createTypedArray('float32', data.k.length);
        var arr = createTypedArray('float32', data.k.length);
        this.vel = createTypedArray('float32', data.k.length);
        var i, len = data.k.length;
        for(i = 0;i<len;i+=1){
            this.v[i] = mult ? data.k[i] * mult : data.k[i];
            this.pv[i] = data.k[i];
        }
        this.getValue = getNoValue;
    }

    function KeyframedValueProperty(elem, data, mult){
        this.propType = 'unidimensional';
        this.keyframes = data.k;
        this.offsetTime = elem.data.st;
        this.lastValue = -99999;
        this.lastPValue = -99999;
        this.frameId = -1;
        this._caching={lastFrame:initFrame,lastIndex:0};
        this.k = true;
        this.kf = true;
        this.data = data;
        this.mult = mult;
        this.elem = elem;
        this.firstFrame = false;
        this.comp = elem.comp;
        this.v = mult ? data.k[0].s[0]*mult : data.k[0].s[0];
        this.pv = data.k[0].s[0];
        this.getValue = getValueAtCurrentTime;
        this.interpolateValue = interpolateValue;
    }

    function KeyframedMultidimensionalProperty(elem, data, mult){
        var i, len = data.k.length;
        var s, e,to,ti;
        for(i=0;i<len-1;i+=1){
            if(data.k[i].to && data.k[i].s && data.k[i].e){
                s = data.k[i].s;
                e = data.k[i].e;
                to = data.k[i].to;
                ti = data.k[i].ti;
                if((s.length === 2 && !(s[0] === e[0] && s[1] === e[1]) && bez.pointOnLine2D(s[0],s[1],e[0],e[1],s[0] + to[0],s[1] + to[1]) && bez.pointOnLine2D(s[0],s[1],e[0],e[1],e[0] + ti[0],e[1] + ti[1])) || (s.length === 3 && !(s[0] === e[0] && s[1] === e[1] && s[2] === e[2]) && bez.pointOnLine3D(s[0],s[1],s[2],e[0],e[1],e[2],s[0] + to[0],s[1] + to[1],s[2] + to[2]) && bez.pointOnLine3D(s[0],s[1],s[2],e[0],e[1],e[2],e[0] + ti[0],e[1] + ti[1],e[2] + ti[2]))){
                    data.k[i].to = null;
                    data.k[i].ti = null;
                }
            }
        }
        this.propType = 'multidimensional';
        this.keyframes = data.k;
        this.offsetTime = elem.data.st;
        this.k = true;
        this.kf = true;
        this.firstFrame = true;
        this.mult = mult;
        this.elem = elem;
        this.comp = elem.comp;
        this._caching={lastFrame:initFrame,lastIndex:0};
        this.getValue = getValueAtCurrentTime;
        this.interpolateValue = interpolateValue;
        this.frameId = -1;
        var arrLen = data.k[0].s.length;
        this.v = createTypedArray('float32', arrLen);
        this.pv = createTypedArray('float32', arrLen);
        this.lastValue = createTypedArray('float32', arrLen);
        this.lastPValue = createTypedArray('float32', arrLen);
    }

    function getProp(elem,data,type, mult, arr) {
        var p;
        if(data.a === 0){
            if(type === 0) {
                p = new ValueProperty(elem,data,mult);
            } else {
                p = new MultiDimensionalProperty(elem,data, mult);
            }
        } else if(data.a === 1){
            if(type === 0) {
                p = new KeyframedValueProperty(elem,data,mult);
            } else {
                p = new KeyframedMultidimensionalProperty(elem,data, mult);
            }
        } else if(!data.k.length){
            p = new ValueProperty(elem,data, mult);
        }else if(typeof(data.k[0]) === 'number'){
            p = new MultiDimensionalProperty(elem,data, mult);
        }else{
            switch(type){
                case 0:
                    p = new KeyframedValueProperty(elem,data,mult);
                    break;
                case 1:
                    p = new KeyframedMultidimensionalProperty(elem,data,mult);
                    break;
            }
        }
        if(p.k){
            arr.push(p);
        }
        return p;
    }

    var ob = {
        getProp: getProp
    };
    return ob;
}());
var TransformPropertyFactory = (function() {
    
    function applyToMatrix(mat) {
        var i, len = this.dynamicProperties.length;
        for(i = 0; i < len; i += 1) {
            this.dynamicProperties[i].getValue();
            if (this.dynamicProperties[i].mdf) {
                this.mdf = true;
            }
        }
        if (this.a) {
            mat.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
        }
        if (this.s) {
            mat.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
        }
        if (this.r) {
            mat.rotate(-this.r.v);
        } else {
            mat.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
        }
        if (this.data.p.s) {
            if (this.data.p.z) {
                mat.translate(this.px.v, this.py.v, -this.pz.v);
            } else {
                mat.translate(this.px.v, this.py.v, 0);
            }
        } else {
            mat.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
        }
    }
    function processKeys(){
        if (this.elem.globalData.frameId === this.frameId) {
            return;
        }

        this.mdf = false;
        var i, len = this.dynamicProperties.length;

        for(i = 0; i < len; i += 1) {
            this.dynamicProperties[i].getValue();
            if (this.dynamicProperties[i].mdf) {
                this.mdf = true;
            }
        }

        if (this.mdf) {
            this.v.reset();
            if (this.a) {
                this.v.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
            }
            if(this.s) {
                this.v.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
            }
            if (this.sk) {
                this.v.skewFromAxis(-this.sk.v, this.sa.v);
            }
            if (this.r) {
                this.v.rotate(-this.r.v);
            } else {
                this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
            }
            if (this.autoOriented && this.p.keyframes && this.p.getValueAtTime) {
                var v1,v2;
                if (this.p._caching.lastFrame+this.p.offsetTime <= this.p.keyframes[0].t) {
                    v1 = this.p.getValueAtTime((this.p.keyframes[0].t + 0.01) / this.elem.globalData.frameRate,0);
                    v2 = this.p.getValueAtTime(this.p.keyframes[0].t / this.elem.globalData.frameRate, 0);
                } else if(this.p._caching.lastFrame+this.p.offsetTime >= this.p.keyframes[this.p.keyframes.length - 1].t) {
                    v1 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t / this.elem.globalData.frameRate), 0);
                    v2 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t - 0.01) / this.elem.globalData.frameRate, 0);
                } else {
                    v1 = this.p.pv;
                    v2 = this.p.getValueAtTime((this.p._caching.lastFrame+this.p.offsetTime - 0.01) / this.elem.globalData.frameRate, this.p.offsetTime);
                }
                this.v.rotate(-Math.atan2(v1[1] - v2[1], v1[0] - v2[0]));
            }
            if(this.data.p.s){
                if(this.data.p.z) {
                    this.v.translate(this.px.v, this.py.v, -this.pz.v);
                } else {
                    this.v.translate(this.px.v, this.py.v, 0);
                }
            }else{
                this.v.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);
            }
        }
        this.frameId = this.elem.globalData.frameId;
    }

    function setInverted(){
        this.inverted = true;
        this.iv = new Matrix();
        if(!this.k){
            if(this.data.p.s){
                this.iv.translate(this.px.v,this.py.v,-this.pz.v);
            }else{
                this.iv.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);
            }
            if(this.r){
                this.iv.rotate(-this.r.v);
            }else{
                this.iv.rotateX(-this.rx.v).rotateY(-this.ry.v).rotateZ(this.rz.v);
            }
            if(this.s){
                this.iv.scale(this.s.v[0],this.s.v[1],1);
            }
            if(this.a){
                this.iv.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);
            }
        }
    }

    function autoOrient(){
        //
        //var prevP = this.getValueAtTime();
    }

    function TransformProperty(elem,data,arr){
        this.elem = elem;
        this.frameId = -1;
        this.type = 'transform';
        this.dynamicProperties = [];
        this.mdf = false;
        this.data = data;
        this.v = new Matrix();
        if(data.p.s){
            this.px = PropertyFactory.getProp(elem,data.p.x,0,0,this.dynamicProperties);
            this.py = PropertyFactory.getProp(elem,data.p.y,0,0,this.dynamicProperties);
            if(data.p.z){
                this.pz = PropertyFactory.getProp(elem,data.p.z,0,0,this.dynamicProperties);
            }
        }else{
            this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
        }
        if(data.r) {
            this.r = PropertyFactory.getProp(elem, data.r, 0, degToRads, this.dynamicProperties);
        } else if(data.rx) {
            this.rx = PropertyFactory.getProp(elem, data.rx, 0, degToRads, this.dynamicProperties);
            this.ry = PropertyFactory.getProp(elem, data.ry, 0, degToRads, this.dynamicProperties);
            this.rz = PropertyFactory.getProp(elem, data.rz, 0, degToRads, this.dynamicProperties);
            if(data.or.k[0].ti) {
                var i, len = data.or.k.length;
                for(i=0;i<len;i+=1) {
                    data.or.k[i].to = data.or.k[i].ti = null;
                }
            }
            this.or = PropertyFactory.getProp(elem, data.or, 1, degToRads, this.dynamicProperties);
            //sh Indicates it needs to be capped between -180 and 180
            this.or.sh = true;
        }
        if(data.sk){
            this.sk = PropertyFactory.getProp(elem, data.sk, 0, degToRads, this.dynamicProperties);
            this.sa = PropertyFactory.getProp(elem, data.sa, 0, degToRads, this.dynamicProperties);
        }
        if(data.a) {
            this.a = PropertyFactory.getProp(elem,data.a,1,0,this.dynamicProperties);
        }
        if(data.s) {
            this.s = PropertyFactory.getProp(elem,data.s,1,0.01,this.dynamicProperties);
        }
        if(data.o){
            this.o = PropertyFactory.getProp(elem,data.o,0,0.01,arr);
        } else {
            this.o = {mdf:false,v:1};
        }
        if(this.dynamicProperties.length){
            arr.push(this);
        }else{
            if(this.a){
                this.v.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);
            }
            if(this.s){
                this.v.scale(this.s.v[0],this.s.v[1],this.s.v[2]);
            }
            if(this.sk){
                this.v.skewFromAxis(-this.sk.v,this.sa.v);
            }
            if(this.r){
                this.v.rotate(-this.r.v);
            }else{
                this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);
            }
            if(this.data.p.s){
                if(data.p.z) {
                    this.v.translate(this.px.v, this.py.v, -this.pz.v);
                } else {
                    this.v.translate(this.px.v, this.py.v, 0);
                }
            }else{
                this.v.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);
            }
        }
    }

    TransformProperty.prototype.applyToMatrix = applyToMatrix;
    TransformProperty.prototype.getValue = processKeys;
    TransformProperty.prototype.setInverted = setInverted;
    TransformProperty.prototype.autoOrient = autoOrient;

    function getTransformProperty(elem,data,arr){
        return new TransformProperty(elem,data,arr)
    }

    return {
        getTransformProperty: getTransformProperty
    };

}());
function ShapePath(){
	this.c = false;
	this._length = 0;
	this._maxLength = 8;
	this.v = Array.apply(null,{length:this._maxLength});
	this.o = Array.apply(null,{length:this._maxLength});
	this.i = Array.apply(null,{length:this._maxLength});
};

ShapePath.prototype.setPathData = function(closed, len) {
	this.c = closed;
	this.setLength(len);
	var i = 0;
	while(i < len){
		this.v[i] = point_pool.newPoint();
		this.o[i] = point_pool.newPoint();
		this.i[i] = point_pool.newPoint();
		i += 1;
	}
};

ShapePath.prototype.setLength = function(len) {
	while(this._maxLength < len) {
		this.doubleArrayLength();
	}
	this._length = len;
}

ShapePath.prototype.doubleArrayLength = function() {
	this.v = this.v.concat(Array.apply(null,{length:this._maxLength}))
	this.i = this.i.concat(Array.apply(null,{length:this._maxLength}))
	this.o = this.o.concat(Array.apply(null,{length:this._maxLength}))
	this._maxLength *= 2;
};

ShapePath.prototype.setXYAt = function(x, y, type, pos, replace) {
	var arr;
	this._length = Math.max(this._length, pos + 1);
	if(this._length >= this._maxLength) {
		this.doubleArrayLength();
	}
	switch(type){
		case 'v':
			arr = this.v;
			break;
		case 'i':
			arr = this.i;
			break;
		case 'o':
			arr = this.o;
			break;
	}
	if(!arr[pos] || (arr[pos] && !replace)){
		arr[pos] = point_pool.newPoint();
	}
	arr[pos][0] = x;
	arr[pos][1] = y;
};

ShapePath.prototype.setTripleAt = function(vX,vY,oX,oY,iX,iY,pos, replace) {
	this.setXYAt(vX,vY,'v',pos, replace);
	this.setXYAt(oX,oY,'o',pos, replace);
	this.setXYAt(iX,iY,'i',pos, replace);
};

ShapePath.prototype.reverse = function() {
	var newPath = new ShapePath();
	newPath.setPathData(this.c, this._length);
	var vertices = this.v, outPoints = this.o, inPoints = this.i;
	var init = 0;
	if (this.c) {
		newPath.setTripleAt(vertices[0][0], vertices[0][1], inPoints[0][0], inPoints[0][1], outPoints[0][0], outPoints[0][1], 0, false);
        init = 1;
    }
    var cnt = this._length - 1;
    var len = this._length;

    for (i = init; i < len; i += 1) {
    	newPath.setTripleAt(vertices[cnt][0], vertices[cnt][1], inPoints[cnt][0], inPoints[cnt][1], outPoints[cnt][0], outPoints[cnt][1], i, false);
        cnt -= 1;
    }
    return newPath;
};
var ShapePropertyFactory = (function(){

    var initFrame = -999999;

    function interpolateShape(frameNum, iterationIndex, previousValue, isCurrentRender) {
        var keyPropS,keyPropE,isHold;
        if(frameNum < this.keyframes[0].t-this.offsetTime){
            keyPropS = this.keyframes[0].s[0];
            isHold = true;
            iterationIndex = 0;
        }else if(frameNum >= this.keyframes[this.keyframes.length - 1].t-this.offsetTime){
            if(this.keyframes[this.keyframes.length - 2].h === 1){
                keyPropS = this.keyframes[this.keyframes.length - 1].s[0];
            }else{
                keyPropS = this.keyframes[this.keyframes.length - 2].e[0];
            }
            isHold = true;
        }else{
            var i = iterationIndex;
            var len = this.keyframes.length- 1,flag = true,keyData,nextKeyData, j, jLen, k, kLen;
            while(flag){
                keyData = this.keyframes[i];
                nextKeyData = this.keyframes[i+1];
                if((nextKeyData.t - this.offsetTime) > frameNum){
                    break;
                }
                if(i < len - 1){
                    i += 1;
                }else{
                    flag = false;
                }
            }
            isHold = keyData.h === 1;
            iterationIndex = i;

            var perc;
            if(!isHold){
                if(frameNum >= nextKeyData.t-this.offsetTime){
                    perc = 1;
                }else if(frameNum < keyData.t-this.offsetTime){
                    perc = 0;
                }else{
                    var fnc;
                    if(keyData.__fnct){
                        fnc = keyData.__fnct;
                    }else{
                        fnc = BezierFactory.getBezierEasing(keyData.o.x,keyData.o.y,keyData.i.x,keyData.i.y).get;
                        keyData.__fnct = fnc;
                    }
                    perc = fnc((frameNum-(keyData.t-this.offsetTime))/((nextKeyData.t-this.offsetTime)-(keyData.t-this.offsetTime)));
                }
                keyPropE = keyData.e[0];
            }
            keyPropS = keyData.s[0];
        }
        jLen = previousValue._length;
        kLen = keyPropS.i[0].length;
        var hasModified = false;
        var vertexValue;
        for(j=0;j<jLen;j+=1){
            for(k=0;k<kLen;k+=1){
                if(isHold){
                    vertexValue = keyPropS.i[j][k];
                    if(previousValue.i[j][k] !== vertexValue){
                        previousValue.i[j][k] = vertexValue;
                        if(isCurrentRender) {
                            this.pv.i[j][k] = vertexValue;
                        }
                        hasModified = true;
                    }
                    vertexValue = keyPropS.o[j][k];
                    if(previousValue.o[j][k] !== vertexValue){
                        previousValue.o[j][k] = vertexValue;
                        if(isCurrentRender) {
                            this.pv.o[j][k] = vertexValue;
                        }
                        hasModified = true;
                    }
                    vertexValue = keyPropS.v[j][k];
                    if(previousValue.v[j][k] !== vertexValue){
                        previousValue.v[j][k] = vertexValue;
                        if(isCurrentRender) {
                            this.pv.v[j][k] = vertexValue;
                        }
                        hasModified = true;
                    }
                }else{
                    vertexValue = keyPropS.i[j][k]+(keyPropE.i[j][k]-keyPropS.i[j][k])*perc;
                    if(previousValue.i[j][k] !== vertexValue){
                        previousValue.i[j][k] = vertexValue;
                        if(isCurrentRender) {
                            this.pv.i[j][k] = vertexValue;
                        }
                        hasModified = true;
                    }
                    vertexValue = keyPropS.o[j][k]+(keyPropE.o[j][k]-keyPropS.o[j][k])*perc;
                    if(previousValue.o[j][k] !== vertexValue){
                        previousValue.o[j][k] = vertexValue;
                        if(isCurrentRender) {
                            this.pv.o[j][k] = vertexValue;
                        }
                        hasModified = true;
                    }
                    vertexValue = keyPropS.v[j][k]+(keyPropE.v[j][k]-keyPropS.v[j][k])*perc;
                    if(previousValue.v[j][k] !== vertexValue){
                        previousValue.v[j][k] = vertexValue;
                        if(isCurrentRender) {
                            this.pv.v[j][k] = vertexValue;
                        }
                        hasModified = true;
                    }
                }
            }
        }
        if(hasModified) {
            previousValue.c = keyPropS.c;
        }
        return {
            iterationIndex: iterationIndex,
            hasModified: hasModified
        }
    }

    function interpolateShapeCurrentTime(){
        if(this.elem.globalData.frameId === this.frameId){
            return;
        }
        this.mdf = false;
        var frameNum = this.comp.renderedFrame - this.offsetTime;
        var initTime = this.keyframes[0].t - this.offsetTime;
        var endTime = this.keyframes[this.keyframes.length - 1].t - this.offsetTime;
        if(!(this.lastFrame !== initFrame && ((this.lastFrame < initTime && frameNum < initTime) || (this.lastFrame > endTime && frameNum > endTime)))){
            ////
            var i = this.lastFrame < frameNum ? this._lastIndex : 0;
            var renderResult = this.interpolateShape(frameNum, i, this.v, true);
            ////
            this._lastIndex = renderResult.iterationIndex;
            this.mdf = renderResult.hasModified;
            if(renderResult.hasModified) {
                this.paths = this.localShapeCollection;
            }
        }
        this.lastFrame = frameNum;
        this.frameId = this.elem.globalData.frameId;
    }

    function getShapeValue(){
        return this.v;
    }

    function resetShape(){
        this.paths = this.localShapeCollection;
        if(!this.k){
            this.mdf = false;
        }
    }

    function ShapeProperty(elem, data, type){
        this.__shapeObject = 1;
        this.comp = elem.comp;
        this.k = false;
        this.mdf = false;
        var pathData = type === 3 ? data.pt.k : data.ks.k;
        this.v = shape_pool.clone(pathData);
        this.pv = shape_pool.clone(this.v);
        this.localShapeCollection = shapeCollection_pool.newShapeCollection();
        this.paths = this.localShapeCollection;
        this.paths.addShape(this.v);
        this.reset = resetShape;
    }
    ShapeProperty.prototype.interpolateShape = interpolateShape;
    ShapeProperty.prototype.getValue = getShapeValue;

    function KeyframedShapeProperty(elem,data,type){
        this.__shapeObject = 1;
        this.comp = elem.comp;
        this.elem = elem;
        this.offsetTime = elem.data.st;
        this._lastIndex = 0;
        this.keyframes = type === 3 ? data.pt.k : data.ks.k;
        this.k = true;
        this.kf = true;
        var i, len = this.keyframes[0].s[0].i.length;
        var jLen = this.keyframes[0].s[0].i[0].length;
        this.v = shape_pool.newShape();
        this.v.setPathData(this.keyframes[0].s[0].c, len);
        this.pv = shape_pool.clone(this.v);
        this.localShapeCollection = shapeCollection_pool.newShapeCollection();
        this.paths = this.localShapeCollection;
        this.paths.addShape(this.v);
        this.lastFrame = initFrame;
        this.reset = resetShape;
    }
    KeyframedShapeProperty.prototype.getValue = interpolateShapeCurrentTime;
    KeyframedShapeProperty.prototype.interpolateShape = interpolateShape;

    var EllShapeProperty = (function(){

        var cPoint = roundCorner;

        function convertEllToPath(){
            var p0 = this.p.v[0], p1 = this.p.v[1], s0 = this.s.v[0]/2, s1 = this.s.v[1]/2;
            if(this.d !== 3){
                this.v.v[0][0] = p0;
                this.v.v[0][1] = p1-s1;
                this.v.v[1][0] = p0 + s0;
                this.v.v[1][1] = p1;
                this.v.v[2][0] = p0;
                this.v.v[2][1] = p1+s1;
                this.v.v[3][0] = p0 - s0;
                this.v.v[3][1] = p1;
                this.v.i[0][0] = p0 - s0*cPoint;
                this.v.i[0][1] = p1 - s1;
                this.v.i[1][0] = p0 + s0;
                this.v.i[1][1] = p1 - s1*cPoint;
                this.v.i[2][0] = p0 + s0*cPoint;
                this.v.i[2][1] = p1 + s1;
                this.v.i[3][0] = p0 - s0;
                this.v.i[3][1] = p1 + s1*cPoint;
                this.v.o[0][0] = p0 + s0*cPoint;
                this.v.o[0][1] = p1 - s1;
                this.v.o[1][0] = p0 + s0;
                this.v.o[1][1] = p1 + s1*cPoint;
                this.v.o[2][0] = p0 - s0*cPoint;
                this.v.o[2][1] = p1 + s1;
                this.v.o[3][0] = p0 - s0;
                this.v.o[3][1] = p1 - s1*cPoint;
            }else{
                this.v.v[0][0] = p0;
                this.v.v[0][1] = p1-s1;
                this.v.v[1][0] = p0 - s0;
                this.v.v[1][1] = p1;
                this.v.v[2][0] = p0;
                this.v.v[2][1] = p1+s1;
                this.v.v[3][0] = p0 + s0;
                this.v.v[3][1] = p1;
                this.v.i[0][0] = p0 + s0*cPoint;
                this.v.i[0][1] = p1 - s1;
                this.v.i[1][0] = p0 - s0;
                this.v.i[1][1] = p1 - s1*cPoint;
                this.v.i[2][0] = p0 - s0*cPoint;
                this.v.i[2][1] = p1 + s1;
                this.v.i[3][0] = p0 + s0;
                this.v.i[3][1] = p1 + s1*cPoint;
                this.v.o[0][0] = p0 - s0*cPoint;
                this.v.o[0][1] = p1 - s1;
                this.v.o[1][0] = p0 - s0;
                this.v.o[1][1] = p1 + s1*cPoint;
                this.v.o[2][0] = p0 + s0*cPoint;
                this.v.o[2][1] = p1 + s1;
                this.v.o[3][0] = p0 + s0;
                this.v.o[3][1] = p1 - s1*cPoint;
            }
        }

        function processKeys(frameNum){
            var i, len = this.dynamicProperties.length;
            if(this.elem.globalData.frameId === this.frameId){
                return;
            }
            this.mdf = false;
            this.frameId = this.elem.globalData.frameId;

            for(i=0;i<len;i+=1){
                this.dynamicProperties[i].getValue(frameNum);
                if(this.dynamicProperties[i].mdf){
                    this.mdf = true;
                }
            }
            if(this.mdf){
                this.convertEllToPath();
            }
        }

        return function EllShapeProperty(elem,data) {
            /*this.v = {
                v: Array.apply(null,{length:4}),
                i: Array.apply(null,{length:4}),
                o: Array.apply(null,{length:4}),
                c: true
            };*/
            this.v = shape_pool.newShape();
            this.v.setPathData(true, 4);
            this.localShapeCollection = shapeCollection_pool.newShapeCollection();
            this.paths = this.localShapeCollection;
            this.localShapeCollection.addShape(this.v);
            this.d = data.d;
            this.dynamicProperties = [];
            this.elem = elem;
            this.comp = elem.comp;
            this.frameId = -1;
            this.mdf = false;
            this.getValue = processKeys;
            this.convertEllToPath = convertEllToPath;
            this.reset = resetShape;
            this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
            this.s = PropertyFactory.getProp(elem,data.s,1,0,this.dynamicProperties);
            if(this.dynamicProperties.length){
                this.k = true;
            }else{
                this.convertEllToPath();
            }
        }
    }());

    var StarShapeProperty = (function() {

        function convertPolygonToPath(){
            var numPts = Math.floor(this.pt.v);
            var angle = Math.PI*2/numPts;
            /*this.v.v.length = numPts;
            this.v.i.length = numPts;
            this.v.o.length = numPts;*/
            var rad = this.or.v;
            var roundness = this.os.v;
            var perimSegment = 2*Math.PI*rad/(numPts*4);
            var i, currentAng = -Math.PI/ 2;
            var dir = this.data.d === 3 ? -1 : 1;
            currentAng += this.r.v;
            this.v._length = 0;
            for(i=0;i<numPts;i+=1){
                var x = rad * Math.cos(currentAng);
                var y = rad * Math.sin(currentAng);
                var ox = x === 0 && y === 0 ? 0 : y/Math.sqrt(x*x + y*y);
                var oy = x === 0 && y === 0 ? 0 : -x/Math.sqrt(x*x + y*y);
                x +=  + this.p.v[0];
                y +=  + this.p.v[1];
                this.v.setTripleAt(x,y,x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir,x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir, i, true);
                /*this.v.v[i] = [x,y];
                this.v.i[i] = [x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir];
                this.v.o[i] = [x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir];*/
                currentAng += angle*dir;
            }
            this.paths.length = 0;
            this.paths[0] = this.v;
        }

        function convertStarToPath() {
            var numPts = Math.floor(this.pt.v)*2;
            var angle = Math.PI*2/numPts;
            /*this.v.v.length = numPts;
            this.v.i.length = numPts;
            this.v.o.length = numPts;*/
            var longFlag = true;
            var longRad = this.or.v;
            var shortRad = this.ir.v;
            var longRound = this.os.v;
            var shortRound = this.is.v;
            var longPerimSegment = 2*Math.PI*longRad/(numPts*2);
            var shortPerimSegment = 2*Math.PI*shortRad/(numPts*2);
            var i, rad,roundness,perimSegment, currentAng = -Math.PI/ 2;
            currentAng += this.r.v;
            var dir = this.data.d === 3 ? -1 : 1;
            this.v._length = 0;
            for(i=0;i<numPts;i+=1){
                rad = longFlag ? longRad : shortRad;
                roundness = longFlag ? longRound : shortRound;
                perimSegment = longFlag ? longPerimSegment : shortPerimSegment;
                var x = rad * Math.cos(currentAng);
                var y = rad * Math.sin(currentAng);
                var ox = x === 0 && y === 0 ? 0 : y/Math.sqrt(x*x + y*y);
                var oy = x === 0 && y === 0 ? 0 : -x/Math.sqrt(x*x + y*y);
                x +=  + this.p.v[0];
                y +=  + this.p.v[1];
                this.v.setTripleAt(x,y,x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir,x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir, i, true);

                /*this.v.v[i] = [x,y];
                this.v.i[i] = [x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir];
                this.v.o[i] = [x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir];
                this.v._length = numPts;*/
                longFlag = !longFlag;
                currentAng += angle*dir;
            }
        }

        function processKeys() {
            if(this.elem.globalData.frameId === this.frameId){
                return;
            }
            this.mdf = false;
            this.frameId = this.elem.globalData.frameId;
            var i, len = this.dynamicProperties.length;

            for(i=0;i<len;i+=1){
                this.dynamicProperties[i].getValue();
                if(this.dynamicProperties[i].mdf){
                    this.mdf = true;
                }
            }
            if(this.mdf){
                this.convertToPath();
            }
        }

        return function StarShapeProperty(elem,data) {
            /*this.v = {
                v: [],
                i: [],
                o: [],
                c: true
            };*/
            this.v = shape_pool.newShape();
            this.v.setPathData(true, 0);
            this.elem = elem;
            this.comp = elem.comp;
            this.data = data;
            this.frameId = -1;
            this.d = data.d;
            this.dynamicProperties = [];
            this.mdf = false;
            this.getValue = processKeys;
            this.reset = resetShape;
            if(data.sy === 1){
                this.ir = PropertyFactory.getProp(elem,data.ir,0,0,this.dynamicProperties);
                this.is = PropertyFactory.getProp(elem,data.is,0,0.01,this.dynamicProperties);
                this.convertToPath = convertStarToPath;
            } else {
                this.convertToPath = convertPolygonToPath;
            }
            this.pt = PropertyFactory.getProp(elem,data.pt,0,0,this.dynamicProperties);
            this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
            this.r = PropertyFactory.getProp(elem,data.r,0,degToRads,this.dynamicProperties);
            this.or = PropertyFactory.getProp(elem,data.or,0,0,this.dynamicProperties);
            this.os = PropertyFactory.getProp(elem,data.os,0,0.01,this.dynamicProperties);
            this.localShapeCollection = shapeCollection_pool.newShapeCollection();
            this.localShapeCollection.addShape(this.v);
            this.paths = this.localShapeCollection;
            if(this.dynamicProperties.length){
                this.k = true;
            }else{
                this.convertToPath();
            }
        }
    }());

    var RectShapeProperty = (function() {
        function processKeys(frameNum){
            if(this.elem.globalData.frameId === this.frameId){
                return;
            }
            this.mdf = false;
            this.frameId = this.elem.globalData.frameId;
            var i, len = this.dynamicProperties.length;

            for(i=0;i<len;i+=1){
                this.dynamicProperties[i].getValue(frameNum);
                if(this.dynamicProperties[i].mdf){
                    this.mdf = true;
                }
            }
            if(this.mdf){
                this.convertRectToPath();
            }

        }

        function convertRectToPath(){
            var p0 = this.p.v[0], p1 = this.p.v[1], v0 = this.s.v[0]/2, v1 = this.s.v[1]/2;
            var round = bm_min(v0,v1,this.r.v);
            var cPoint = round*(1-roundCorner);
            this.v._length = 0;

            if(this.d === 2 || this.d === 1) {
                this.v.setTripleAt(p0+v0, p1-v1+round,p0+v0, p1-v1+round,p0+v0,p1-v1+cPoint,0, true);
                this.v.setTripleAt(p0+v0, p1+v1-round,p0+v0, p1+v1-cPoint,p0+v0, p1+v1-round,1, true);
                if(round!== 0){
                    this.v.setTripleAt(p0+v0-round, p1+v1,p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,2, true);
                    this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,p0-v0+round,p1+v1,3, true);
                    this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,4, true);
                    this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,p0-v0,p1-v1+round,5, true);
                    this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,6, true);
                    this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,p0+v0-round,p1-v1,7, true);
                } else {
                    this.v.setTripleAt(p0-v0,p1+v1,p0-v0+cPoint,p1+v1,p0-v0,p1+v1,2);
                    this.v.setTripleAt(p0-v0,p1-v1,p0-v0,p1-v1+cPoint,p0-v0,p1-v1,3);
                }
            }else{
                this.v.setTripleAt(p0+v0,p1-v1+round,p0+v0,p1-v1+cPoint,p0+v0,p1-v1+round,0, true);
                if(round!== 0){
                    this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,1, true);
                    this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,p0-v0+round,p1-v1,2, true);
                    this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,3, true);
                    this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,p0-v0,p1+v1-round,4, true);
                    this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,5, true);
                    this.v.setTripleAt(p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,p0+v0-round,p1+v1,6, true);
                    this.v.setTripleAt(p0+v0,p1+v1-round,p0+v0,p1+v1-round,p0+v0,p1+v1-cPoint,7, true);
                } else {
                    this.v.setTripleAt(p0-v0,p1-v1,p0-v0+cPoint,p1-v1,p0-v0,p1-v1,1, true);
                    this.v.setTripleAt(p0-v0,p1+v1,p0-v0,p1+v1-cPoint,p0-v0,p1+v1,2, true);
                    this.v.setTripleAt(p0+v0,p1+v1,p0+v0-cPoint,p1+v1,p0+v0,p1+v1,3, true);

                }
            }
        }

        return function RectShapeProperty(elem,data) {
            this.v = shape_pool.newShape();
            this.v.c = true;
            this.localShapeCollection = shapeCollection_pool.newShapeCollection();
            this.localShapeCollection.addShape(this.v);
            this.paths = this.localShapeCollection;
            this.elem = elem;
            this.comp = elem.comp;
            this.frameId = -1;
            this.d = data.d;
            this.dynamicProperties = [];
            this.mdf = false;
            this.getValue = processKeys;
            this.convertRectToPath = convertRectToPath;
            this.reset = resetShape;
            this.p = PropertyFactory.getProp(elem,data.p,1,0,this.dynamicProperties);
            this.s = PropertyFactory.getProp(elem,data.s,1,0,this.dynamicProperties);
            this.r = PropertyFactory.getProp(elem,data.r,0,0,this.dynamicProperties);
            if(this.dynamicProperties.length){
                this.k = true;
            }else{
                this.convertRectToPath();
            }
        }
    }());

    function getShapeProp(elem,data,type, arr){
        var prop;
        if(type === 3 || type === 4){
            var dataProp = type === 3 ? data.pt : data.ks;
            var keys = dataProp.k;
            if(dataProp.a === 1 || keys.length){
                prop = new KeyframedShapeProperty(elem, data, type);
            }else{
                prop = new ShapeProperty(elem, data, type);
            }
        }else if(type === 5){
            prop = new RectShapeProperty(elem, data);
        }else if(type === 6){
            prop = new EllShapeProperty(elem, data);
        }else if(type === 7){
            prop = new StarShapeProperty(elem, data);
        }
        if(prop.k){
            arr.push(prop);
        }
        return prop;
    }

    function getConstructorFunction() {
        return ShapeProperty;
    }

    function getKeyframedConstructorFunction() {
        return KeyframedShapeProperty;
    }

    var ob = {};
    ob.getShapeProp = getShapeProp;
    ob.getConstructorFunction = getConstructorFunction;
    ob.getKeyframedConstructorFunction = getKeyframedConstructorFunction;
    return ob;
}());
var ShapeModifiers = (function(){
    var ob = {};
    var modifiers = {};
    ob.registerModifier = registerModifier;
    ob.getModifier = getModifier;

    function registerModifier(nm,factory){
        if(!modifiers[nm]){
            modifiers[nm] = factory;
        }
    }

    function getModifier(nm,elem, data, dynamicProperties){
        return new modifiers[nm](elem, data, dynamicProperties);
    }

    return ob;
}());

function ShapeModifier(){}
ShapeModifier.prototype.initModifierProperties = function(){};
ShapeModifier.prototype.addShapeToModifier = function(){};
ShapeModifier.prototype.addShape = function(data){
    if(!this.closed){
        this.shapes.push({shape:data.sh, data: data, localShapeCollection:shapeCollection_pool.newShapeCollection()});
        this.addShapeToModifier(data.sh);
    }
}
ShapeModifier.prototype.init = function(elem,data,dynamicProperties){
    this.elem = elem;
    this.frameId = -1;
    this.shapes = [];
    this.dynamicProperties = [];
    this.mdf = false;
    this.closed = false;
    this.k = false;
    this.comp = elem.comp;
    this.initModifierProperties(elem,data);
    if(this.dynamicProperties.length){
        this.k = true;
        dynamicProperties.push(this);
    }else{
        this.getValue(true);
    }
}
function TrimModifier(){};
extendPrototype(ShapeModifier,TrimModifier);
TrimModifier.prototype.processKeys = function(forceRender){
    if(this.elem.globalData.frameId === this.frameId && !forceRender){
        return;
    }
    this.mdf = forceRender ? true : false;
    this.frameId = this.elem.globalData.frameId;
    var i, len = this.dynamicProperties.length;

    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
        if(this.dynamicProperties[i].mdf){
            this.mdf = true;
        }
    }
    if(this.mdf || forceRender){
        var o = (this.o.v%360)/360;
        if(o < 0){
            o += 1;
        }
        var s = this.s.v + o;
        var e = this.e.v + o;
        if(s == e){

        }
        if(s>e){
            var _s = s;
            s = e;
            e = _s;
        }
        this.sValue = s;
        this.eValue = e;
        this.oValue = o;
    }
}
TrimModifier.prototype.initModifierProperties = function(elem,data){
    this.sValue = 0;
    this.eValue = 0;
    this.oValue = 0;
    this.getValue = this.processKeys;
    this.s = PropertyFactory.getProp(elem,data.s,0,0.01,this.dynamicProperties);
    this.e = PropertyFactory.getProp(elem,data.e,0,0.01,this.dynamicProperties);
    this.o = PropertyFactory.getProp(elem,data.o,0,0,this.dynamicProperties);
    this.m = data.m;
    if(!this.dynamicProperties.length){
        this.getValue(true);
    }
};

TrimModifier.prototype.calculateShapeEdges = function(s, e, shapeLength, addedLength, totalModifierLength) {
    var segments = []
    if(e <= 1){
        segments.push({
            s: s,
            e: e
        })
    }else if(s >= 1){
        segments.push({
            s: s - 1,
            e: e - 1
        })
    }else{
        segments.push({
            s: s,
            e: 1
        })
        segments.push({
            s: 0,
            e: e - 1
        })
    }
    var shapeSegments = [];
    var i, len = segments.length, segmentOb;
    for(i = 0; i < len; i += 1) {
        segmentOb = segments[i];
        if (segmentOb.e * totalModifierLength < addedLength || segmentOb.s * totalModifierLength > addedLength + shapeLength) {
            
        } else {
            var shapeS, shapeE;
            if(segmentOb.s * totalModifierLength <= addedLength) {
                shapeS = 0;
            } else {
                shapeS = (segmentOb.s * totalModifierLength - addedLength) / shapeLength;
            }
            if(segmentOb.e * totalModifierLength >= addedLength + shapeLength) {
                shapeE = 1;
            } else {
                shapeE = ((segmentOb.e * totalModifierLength - addedLength) / shapeLength);
            }
            shapeSegments.push([shapeS, shapeE]);
        }
    }
    if(!shapeSegments.length){
        shapeSegments.push([0,0]);
    }
    return shapeSegments;
}

TrimModifier.prototype.processShapes = function(firstFrame){
    var shapePaths;
    var i, len = this.shapes.length;
    var j, jLen;
    var s = this.sValue;
    var e = this.eValue;
    var pathsData,pathData, totalShapeLength, totalModifierLength = 0;

    if(e === s){
        for(i=0;i<len;i+=1){
            this.shapes[i].localShapeCollection.releaseShapes();
            this.shapes[i].shape.mdf = true;
            this.shapes[i].shape.paths = this.shapes[i].localShapeCollection;
        }
    } else if(!((e === 1 && s === 0) || (e===0 && s === 1))){
        var segments = [], shapeData, localShapeCollection;
        for(i=0;i<len;i+=1){
            shapeData = this.shapes[i];
            if(!shapeData.shape.mdf && !this.mdf && !firstFrame && this.m !== 2){
                shapeData.shape.paths = shapeData.localShapeCollection;
            } else {
                shapePaths = shapeData.shape.paths;
                jLen = shapePaths._length;
                totalShapeLength = 0;
                if(!shapeData.shape.mdf && shapeData.pathsData){
                    totalShapeLength = shapeData.totalShapeLength;
                } else {
                    pathsData = [];
                    for(j=0;j<jLen;j+=1){
                        pathData = bez.getSegmentsLength(shapePaths.shapes[j]);
                        pathsData.push(pathData);
                        totalShapeLength += pathData.totalLength;
                    }
                    shapeData.totalShapeLength = totalShapeLength;
                    shapeData.pathsData = pathsData;
                }

                totalModifierLength += totalShapeLength;
                shapeData.shape.mdf = true;
            }
        }
        var shapeS = s, shapeE = e, addedLength = 0;
        var j, jLen;
        for(i = len - 1; i >= 0; i -= 1){
            shapeData = this.shapes[i];
            if (shapeData.shape.mdf) {
                localShapeCollection = shapeData.localShapeCollection;
                localShapeCollection.releaseShapes();
                if(this.m === 2 && len > 1) {
                    var edges = this.calculateShapeEdges(s, e, shapeData.totalShapeLength, addedLength, totalModifierLength);
                    addedLength += shapeData.totalShapeLength;
                } else {
                    edges = [[shapeS, shapeE]]
                }
                jLen = edges.length;
                for (j = 0; j < jLen; j += 1) {
                    shapeS = edges[j][0];
                    shapeE = edges[j][1];
                    segments.length = 0;
                    if(shapeE <= 1){
                        segments.push({
                            s:shapeData.totalShapeLength * shapeS,
                            e:shapeData.totalShapeLength * shapeE
                        })
                    }else if(shapeS >= 1){
                        segments.push({
                            s:shapeData.totalShapeLength * (shapeS - 1),
                            e:shapeData.totalShapeLength * (shapeE - 1)
                        })
                    }else{
                        segments.push({
                            s:shapeData.totalShapeLength * shapeS,
                            e:shapeData.totalShapeLength
                        })
                        segments.push({
                            s:0,
                            e:shapeData.totalShapeLength*(shapeE - 1)
                        })
                    }
                    var newShapesData = this.addShapes(shapeData,segments[0]);
                    if (segments[0].s !== segments[0].e) {
                        var lastPos;
                        if(segments.length > 1){
                            if(shapeData.shape.v.c){
                                var lastShape = newShapesData.pop();
                                this.addPaths(newShapesData, localShapeCollection);
                                newShapesData = this.addShapes(shapeData,segments[1], lastShape);
                            } else {
                                this.addPaths(newShapesData, localShapeCollection);
                                newShapesData = this.addShapes(shapeData,segments[1]);
                            }
                        } 
                        this.addPaths(newShapesData, localShapeCollection);
                    }
                    
                }
                shapeData.shape.paths = localShapeCollection;
            }
        }
    } else if(this.mdf){
        for(i=0;i<len;i+=1){
            this.shapes[i].shape.mdf = true;
        }
    }
    if(!this.dynamicProperties.length){
        this.mdf = false;
    }
}

TrimModifier.prototype.addPaths = function(newPaths, localShapeCollection) {
    var i, len = newPaths.length;
    for(i = 0; i < len; i += 1) {
        localShapeCollection.addShape(newPaths[i])
    }
}

TrimModifier.prototype.addSegment = function(pt1,pt2,pt3,pt4,shapePath,pos, newShape) {
    /*console.log(pt1, 'vertex: v, at: ', pos);
    console.log(pt2, 'vertex: o, at: ', pos);
    console.log(pt3, 'vertex: i, at: ', pos + 1);
    console.log(pt4, 'vertex: v, at: ', pos + 1);
    console.log('newShape: ', newShape);*/
    shapePath.setXYAt(pt2[0],pt2[1],'o',pos);
    shapePath.setXYAt(pt3[0],pt3[1],'i',pos + 1);
    if(newShape){
        shapePath.setXYAt(pt1[0],pt1[1],'v',pos);
    }
    shapePath.setXYAt(pt4[0],pt4[1],'v',pos + 1);
}

TrimModifier.prototype.addShapes = function(shapeData, shapeSegment, shapePath){
    var pathsData = shapeData.pathsData;
    var shapePaths = shapeData.shape.paths.shapes;
    var i, len = shapeData.shape.paths._length, j, jLen;
    var addedLength = 0;
    var currentLengthData,segmentCount;
    var lengths;
    var segment;
    var shapes = [];
    var initPos;
    var newShape = true;
    if(!shapePath){
        shapePath = shape_pool.newShape();
        segmentCount = 0;
        initPos = 0;
    } else {
        segmentCount = shapePath._length;
        initPos = shapePath._length;
    }
    shapes.push(shapePath);
    for(i=0;i<len;i+=1){
        lengths = pathsData[i].lengths;
        shapePath.c = shapePaths[i].c;
        jLen = shapePaths[i].c ? lengths.length : lengths.length + 1;
        for(j=1;j<jLen;j+=1){
            currentLengthData = lengths[j-1];
            if(addedLength + currentLengthData.addedLength < shapeSegment.s){
                addedLength += currentLengthData.addedLength;
                shapePath.c = false;
            } else if(addedLength > shapeSegment.e){
                shapePath.c = false;
                break;
            } else {
                if(shapeSegment.s <= addedLength && shapeSegment.e >= addedLength + currentLengthData.addedLength){
                    this.addSegment(shapePaths[i].v[j-1],shapePaths[i].o[j-1],shapePaths[i].i[j],shapePaths[i].v[j],shapePath,segmentCount,newShape);
                    newShape = false;
                } else {
                    segment = bez.getNewSegment(shapePaths[i].v[j-1],shapePaths[i].v[j],shapePaths[i].o[j-1],shapePaths[i].i[j], (shapeSegment.s - addedLength)/currentLengthData.addedLength,(shapeSegment.e - addedLength)/currentLengthData.addedLength, lengths[j-1]);
                    this.addSegment(segment.pt1,segment.pt3,segment.pt4,segment.pt2,shapePath,segmentCount,newShape);
                    newShape = false;
                    shapePath.c = false;
                }
                addedLength += currentLengthData.addedLength;
                segmentCount += 1;
            }
        }
        if(shapePaths[i].c){
            currentLengthData = lengths[j-1];
            if(addedLength <= shapeSegment.e){
                var segmentLength = lengths[j-1].addedLength;
                if(shapeSegment.s <= addedLength && shapeSegment.e >= addedLength + segmentLength){
                    this.addSegment(shapePaths[i].v[j-1],shapePaths[i].o[j-1],shapePaths[i].i[0],shapePaths[i].v[0],shapePath,segmentCount,newShape);
                    newShape = false;
                }else{
                    segment = bez.getNewSegment(shapePaths[i].v[j-1],shapePaths[i].v[0],shapePaths[i].o[j-1],shapePaths[i].i[0], (shapeSegment.s - addedLength)/segmentLength,(shapeSegment.e - addedLength)/segmentLength, lengths[j-1]);
                    this.addSegment(segment.pt1,segment.pt3,segment.pt4,segment.pt2,shapePath,segmentCount,newShape);
                    newShape = false;
                    shapePath.c = false;
                }
            } else {
                shapePath.c = false;
            }
            addedLength += currentLengthData.addedLength;
            segmentCount += 1;
        }
        if(shapePath._length){
            shapePath.setXYAt(shapePath.v[initPos][0],shapePath.v[initPos][1],'i',initPos);
            shapePath.setXYAt(shapePath.v[shapePath._length - 1][0],shapePath.v[shapePath._length - 1][1],'o',shapePath._length - 1);
        }
        if(addedLength > shapeSegment.e){
            break;
        }
        if(i<len-1){
            shapePath = shape_pool.newShape();
            newShape = true;
            shapes.push(shapePath);
            segmentCount = 0;
        }
    }
    return shapes;

}


ShapeModifiers.registerModifier('tm',TrimModifier);
function RoundCornersModifier(){};
extendPrototype(ShapeModifier,RoundCornersModifier);
RoundCornersModifier.prototype.processKeys = function(forceRender){
    if(this.elem.globalData.frameId === this.frameId && !forceRender){
        return;
    }
    this.mdf = forceRender ? true : false;
    this.frameId = this.elem.globalData.frameId;
    var i, len = this.dynamicProperties.length;

    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
        if(this.dynamicProperties[i].mdf){
            this.mdf = true;
        }
    }
}
RoundCornersModifier.prototype.initModifierProperties = function(elem,data){
    this.getValue = this.processKeys;
    this.rd = PropertyFactory.getProp(elem,data.r,0,null,this.dynamicProperties);
    if(!this.dynamicProperties.length){
        this.getValue(true);
    }
};

RoundCornersModifier.prototype.processPath = function(path, round){
    var cloned_path = shape_pool.newShape();
    cloned_path.c = path.c;
    var i, len = path._length;
    var currentV,currentI,currentO,closerV, newV,newO,newI,distance,newPosPerc,index = 0;
    var vX,vY,oX,oY,iX,iY;
    for(i=0;i<len;i+=1){
        currentV = path.v[i];
        currentO = path.o[i];
        currentI = path.i[i];
        if(currentV[0]===currentO[0] && currentV[1]===currentO[1] && currentV[0]===currentI[0] && currentV[1]===currentI[1]){
            if((i===0 || i === len - 1) && !path.c){
                cloned_path.setTripleAt(currentV[0],currentV[1],currentO[0],currentO[1],currentI[0],currentI[1],index);
                /*cloned_path.v[index] = currentV;
                cloned_path.o[index] = currentO;
                cloned_path.i[index] = currentI;*/
                index += 1;
            } else {
                if(i===0){
                    closerV = path.v[len-1];
                } else {
                    closerV = path.v[i-1];
                }
                distance = Math.sqrt(Math.pow(currentV[0]-closerV[0],2)+Math.pow(currentV[1]-closerV[1],2));
                newPosPerc = distance ? Math.min(distance/2,round)/distance : 0;
                vX = iX = currentV[0]+(closerV[0]-currentV[0])*newPosPerc;
                vY = iY = currentV[1]-(currentV[1]-closerV[1])*newPosPerc;
                oX = vX-(vX-currentV[0])*roundCorner;
                oY = vY-(vY-currentV[1])*roundCorner;
                cloned_path.setTripleAt(vX,vY,oX,oY,iX,iY,index);
                index += 1;

                if(i === len - 1){
                    closerV = path.v[0];
                } else {
                    closerV = path.v[i+1];
                }
                distance = Math.sqrt(Math.pow(currentV[0]-closerV[0],2)+Math.pow(currentV[1]-closerV[1],2));
                newPosPerc = distance ? Math.min(distance/2,round)/distance : 0;
                vX = oX = currentV[0]+(closerV[0]-currentV[0])*newPosPerc;
                vY = oY = currentV[1]+(closerV[1]-currentV[1])*newPosPerc;
                iX = vX-(vX-currentV[0])*roundCorner;
                iY = vY-(vY-currentV[1])*roundCorner;
                cloned_path.setTripleAt(vX,vY,oX,oY,iX,iY,index);
                index += 1;
            }
        } else {
            cloned_path.setTripleAt(path.v[i][0],path.v[i][1],path.o[i][0],path.o[i][1],path.i[i][0],path.i[i][1],index);
            index += 1;
        }
    }
    return cloned_path;
}

RoundCornersModifier.prototype.processShapes = function(firstFrame){
    var shapePaths;
    var i, len = this.shapes.length;
    var j, jLen;
    var rd = this.rd.v;

    if(rd !== 0){
        var shapeData, newPaths, localShapeCollection;
        for(i=0;i<len;i+=1){
            shapeData = this.shapes[i];
            newPaths = shapeData.shape.paths;
            localShapeCollection = shapeData.localShapeCollection;
            if(!(!shapeData.shape.mdf && !this.mdf && !firstFrame)){
                localShapeCollection.releaseShapes();
                shapeData.shape.mdf = true;
                shapePaths = shapeData.shape.paths.shapes;
                jLen = shapeData.shape.paths._length;
                for(j=0;j<jLen;j+=1){
                    localShapeCollection.addShape(this.processPath(shapePaths[j],rd));
                }
            }
            shapeData.shape.paths = shapeData.localShapeCollection;
        }

    }
    if(!this.dynamicProperties.length){
        this.mdf = false;
    }
}


ShapeModifiers.registerModifier('rd',RoundCornersModifier);
function RepeaterModifier(){};
RepeaterModifier.prototype.processKeys = function(forceRender){
    if(this.elem.globalData.frameId === this.frameId && !forceRender){
        return;
    }
    this.mdf = forceRender ? true : false;
    var i, len = this.dynamicProperties.length;

    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
        if(this.dynamicProperties[i].mdf){
            this.mdf = true;
        }
    }
};

RepeaterModifier.prototype.initModifierProperties = function(elem,data){
    this.getValue = this.processKeys;
    this.c = PropertyFactory.getProp(elem,data.c,0,null,this.dynamicProperties);
    this.o = PropertyFactory.getProp(elem,data.o,0,null,this.dynamicProperties);
    this.tr = TransformPropertyFactory.getTransformProperty(elem,data.tr,this.dynamicProperties);
    this.data = data;
    if(!this.dynamicProperties.length){
        this.getValue(true);
    }
    this.pMatrix = new Matrix();
    this.rMatrix = new Matrix();
    this.sMatrix = new Matrix();
    this.tMatrix = new Matrix();
    this.matrix = new Matrix();
};

RepeaterModifier.prototype.applyTransforms = function(pMatrix, rMatrix, sMatrix, transform, perc, inv){
    var dir = inv ? -1 : 1;
    var scaleX = transform.s.v[0] + (1 - transform.s.v[0]) * (1 - perc);
    var scaleY = transform.s.v[1] + (1 - transform.s.v[1]) * (1 - perc);
    pMatrix.translate(transform.p.v[0] * dir * perc, transform.p.v[1] * dir * perc, transform.p.v[2]);
    rMatrix.translate(-transform.a.v[0], -transform.a.v[1], transform.a.v[2]);
    rMatrix.rotate(-transform.r.v * dir * perc);
    rMatrix.translate(transform.a.v[0], transform.a.v[1], transform.a.v[2]);
    sMatrix.translate(-transform.a.v[0], -transform.a.v[1], transform.a.v[2]);
    sMatrix.scale(inv ? 1/scaleX : scaleX, inv ? 1/scaleY : scaleY);
    sMatrix.translate(transform.a.v[0], transform.a.v[1], transform.a.v[2]);
}

RepeaterModifier.prototype.init = function(elem, arr, pos, elemsData, dynamicProperties) {
    this.elem = elem;
    this.arr = arr;
    this.pos = pos;
    this.elemsData = elemsData;
    this._currentCopies = 0;
    this._elements = [];
    this._groups = [];
    this.dynamicProperties = [];
    this.frameId = -1;
    this.initModifierProperties(elem,arr[pos]);
    var cont = 0;
    while(pos>0){
        pos -= 1;
        //this._elements.unshift(arr.splice(pos,1)[0]);
        this._elements.unshift(arr[pos]);
        cont += 1;
    }
    if(this.dynamicProperties.length){
        this.k = true;
        dynamicProperties.push(this);
    }else{
        this.getValue(true);
    }
}

RepeaterModifier.prototype.resetElements = function(elements){
    var i, len = elements.length;
    for(i = 0; i < len; i += 1) {
        elements[i]._processed = false;
        if(elements[i].ty === 'gr'){
            this.resetElements(elements[i].it);
        }
    }
}

RepeaterModifier.prototype.cloneElements = function(elements){
    var i, len = elements.length;
    var newElements = JSON.parse(JSON.stringify(elements));
    this.resetElements(newElements);
    return newElements;
}

RepeaterModifier.prototype.changeGroupRender = function(elements, renderFlag) {
    var i, len = elements.length;
    for(i = 0; i < len ; i += 1) {
        elements[i]._render = renderFlag;
        if(elements[i].ty === 'gr') {
            this.changeGroupRender(elements[i].it, renderFlag);
        }
    }
}

RepeaterModifier.prototype.processShapes = function(firstFrame){

    if(this.elem.globalData.frameId === this.frameId){
        return;
    }
    this.frameId = this.elem.globalData.frameId;
    if(!this.dynamicProperties.length && !firstFrame){
        this.mdf = false;
    }
    if(this.mdf){
        var copies = Math.ceil(this.c.v);
        if(this._groups.length < copies){
            while(this._groups.length < copies){
                var group = {
                    it:this.cloneElements(this._elements),
                    ty:'gr'
                }
                group.it.push({"a":{"a":0,"ix":1,"k":[0,0]},"nm":"Transform","o":{"a":0,"ix":7,"k":100},"p":{"a":0,"ix":2,"k":[0,0]},"r":{"a":0,"ix":6,"k":0},"s":{"a":0,"ix":3,"k":[100,100]},"sa":{"a":0,"ix":5,"k":0},"sk":{"a":0,"ix":4,"k":0},"ty":"tr"});
                
                this.arr.splice(0,0,group);
                this._groups.splice(0,0,group);
                this._currentCopies += 1;
            }
            this.elem.reloadShapes();
        }
        var i, cont = 0, renderFlag;
        for(i = 0; i  <= this._groups.length - 1; i += 1){
            renderFlag = cont < copies;
            this._groups[i]._render = renderFlag;
            this.changeGroupRender(this._groups[i].it, renderFlag);
            cont += 1;
        }
        
        this._currentCopies = copies;
        this.elem.firstFrame = true;
        ////

        var offset = this.o.v;
        var offsetModulo = offset%1;
        var roundOffset = offset > 0 ? Math.floor(offset) : Math.ceil(offset);
        var k;
        var tMat = this.tr.v.props;
        var pProps = this.pMatrix.props;
        var rProps = this.rMatrix.props;
        var sProps = this.sMatrix.props;
        this.pMatrix.reset();
        this.rMatrix.reset();
        this.sMatrix.reset();
        this.tMatrix.reset();
        this.matrix.reset();
        var iteration = 0;

        if(offset > 0) {
            while(iteration<roundOffset){
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, false);
                iteration += 1;
            }
            if(offsetModulo){
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, offsetModulo, false);
                iteration += offsetModulo;
            }
        } else if(offset < 0) {
            while(iteration>roundOffset){
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, true);
                iteration -= 1;
            }
            if(offsetModulo){
                this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, - offsetModulo, true);
                iteration -= offsetModulo;
            }
        }
        i = this.data.m === 1 ? 0 : this._currentCopies - 1;
        var dir = this.data.m === 1 ? 1 : -1;
        cont = this._currentCopies;
        while(cont){
            if(iteration !== 0){
                if((i !== 0 && dir === 1) || (i !== this._currentCopies - 1 && dir === -1)){
                    this.applyTransforms(this.pMatrix, this.rMatrix, this.sMatrix, this.tr, 1, false);
                }
                this.matrix.transform(rProps[0],rProps[1],rProps[2],rProps[3],rProps[4],rProps[5],rProps[6],rProps[7],rProps[8],rProps[9],rProps[10],rProps[11],rProps[12],rProps[13],rProps[14],rProps[15]);
                this.matrix.transform(sProps[0],sProps[1],sProps[2],sProps[3],sProps[4],sProps[5],sProps[6],sProps[7],sProps[8],sProps[9],sProps[10],sProps[11],sProps[12],sProps[13],sProps[14],sProps[15]);
                this.matrix.transform(pProps[0],pProps[1],pProps[2],pProps[3],pProps[4],pProps[5],pProps[6],pProps[7],pProps[8],pProps[9],pProps[10],pProps[11],pProps[12],pProps[13],pProps[14],pProps[15]);
                var items = this.elemsData[i].it;
                var itemsTransform = items[items.length - 1].transform.mProps.v.props;
                var j, jLen = itemsTransform.length;
                for(j=0;j<jLen;j+=1) {
                    itemsTransform[j] = this.matrix.props[j];
                }
                this.matrix.reset();
            } else {
                this.matrix.reset();
                var items = this.elemsData[i].it;
                var itemsTransform = items[items.length - 1].transform.mProps.v.props;
                var j, jLen = itemsTransform.length;
                for(j=0;j<jLen;j+=1) {
                    itemsTransform[j] = this.matrix.props[j];
                }
            }
            iteration += 1;
            cont -= 1;
            i += dir;
        }
    }
}

RepeaterModifier.prototype.addShape = function(){}

ShapeModifiers.registerModifier('rp',RepeaterModifier);
function ShapeCollection(){
	this._length = 0;
	this._maxLength = 4;
	this.shapes = Array.apply(null,{length:this._maxLength});
};

ShapeCollection.prototype.addShape = function(shapeData){
	if(this._length === this._maxLength){
		this.shapes = this.shapes.concat(Array.apply(null,{length:this._maxLength}));
		this._maxLength *= 2;
	}
	this.shapes[this._length] = shapeData;
	this._length += 1;
};

ShapeCollection.prototype.releaseShapes = function(){
	var i;
	for(i = 0; i < this._length; i += 1) {
		shape_pool.release(this.shapes[i]);
	}
	this._length = 0;
};
function DashProperty(elem, data, renderer, dynamicProperties) {
    this.elem = elem;
    this.frameId = -1;
    this.dataProps = Array.apply(null,{length:data.length});
    this.renderer = renderer;
    this.mdf = false;
    this.k = false;
    this.dashStr = '';
    this.dashArray = createTypedArray('float32',  data.length - 1);
    this.dashoffset = createTypedArray('float32',  1);
    var i, len = data.length, prop;
    for(i=0;i<len;i+=1){
        prop = PropertyFactory.getProp(elem,data[i].v,0, 0, dynamicProperties);
        this.k = prop.k ? true : this.k;
        this.dataProps[i] = {n:data[i].n,p:prop};
    }
    if(this.k){
        dynamicProperties.push(this);
    }else{
        this.getValue(true);
    }
}

DashProperty.prototype.getValue = function(forceRender) {
    if(this.elem.globalData.frameId === this.frameId && !forceRender){
        return;
    }
    var i = 0, len = this.dataProps.length;
    this.mdf = false;
    this.frameId = this.elem.globalData.frameId;
    while(i<len){
        if(this.dataProps[i].p.mdf){
            this.mdf = !forceRender;
            break;
        }
        i+=1;
    }
    if(this.mdf || forceRender){
        if(this.renderer === 'svg') {
            this.dashStr = '';
        }
        for(i=0;i<len;i+=1){
            if(this.dataProps[i].n != 'o'){
                if(this.renderer === 'svg') {
                    this.dashStr += ' ' + this.dataProps[i].p.v;
                }else{
                    this.dashArray[i] = this.dataProps[i].p.v;
                }
            }else{
                this.dashoffset[0] = this.dataProps[i].p.v;
            }
        }
    }
}
function GradientProperty(elem,data,arr){
    this.prop = PropertyFactory.getProp(elem,data.k,1,null,[]);
    this.data = data;
    this.k = this.prop.k;
    this.c = createTypedArray('uint8c', data.p*4)
    var cLength = data.k.k[0].s ? (data.k.k[0].s.length - data.p*4) : data.k.k.length - data.p*4;
    this.o = createTypedArray('float32', cLength);
    this.cmdf = false;
    this.omdf = false;
    if(this.prop.k){
        arr.push(this);
    }
    this.getValue(true);
}

GradientProperty.prototype.getValue = function(forceRender){
    this.prop.getValue();
    this.cmdf = false;
    this.omdf = false;
    if(this.prop.mdf || forceRender){
        var i, len = this.data.p*4;
        var mult, val;
        for(i=0;i<len;i+=1){
            mult = i%4 === 0 ? 100 : 255;
            val = Math.round(this.prop.v[i]*mult);
            if(this.c[i] !== val){
                this.c[i] = val;
                this.cmdf = !forceRender;
            }
        }
        if(this.o.length){
            len = this.prop.v.length;
            for(i=this.data.p*4;i<len;i+=1){
                mult = i%2 === 0 ? 100 : 1;
                val = i%2 === 0 ?  Math.round(this.prop.v[i]*100):this.prop.v[i];
                if(this.o[i-this.data.p*4] !== val){
                    this.o[i-this.data.p*4] = val;
                    this.omdf = !forceRender;
                }
            }
        }
    }
}
var ImagePreloader = (function(){

    function imageLoaded(){
        this.loadedAssets += 1;
        if(this.loadedAssets === this.totalImages){
            if(this.imagesLoadedCb) {
                this.imagesLoadedCb(null);
            }
        }
    }

    function getAssetsPath(assetData){
        var path = '';
        if(this.assetsPath){
            var imagePath = assetData.p;
            if(imagePath.indexOf('images/') !== -1){
                imagePath = imagePath.split('/')[1];
            }
            path = this.assetsPath + imagePath;
        } else {
            path = this.path;
            path += assetData.u ? assetData.u : '';
            path += assetData.p;
        }
        return path;
    }

    function loadImage(path){
        var img = document.createElement('img');
        img.addEventListener('load', imageLoaded.bind(this), false);
        img.addEventListener('error', imageLoaded.bind(this), false);
        img.src = path;
    }
    function loadAssets(assets, cb){
        this.imagesLoadedCb = cb;
        this.totalAssets = assets.length;
        var i;
        for(i=0;i<this.totalAssets;i+=1){
            if(!assets[i].layers){
                loadImage.bind(this)(getAssetsPath.bind(this)(assets[i]));
                this.totalImages += 1;
            }
        }
    }

    function setPath(path){
        this.path = path || '';
    }

    function setAssetsPath(path){
        this.assetsPath = path || '';
    }

    function destroy() {
        this.imagesLoadedCb = null;
    }

    return function ImagePreloader(){
        this.loadAssets = loadAssets;
        this.setAssetsPath = setAssetsPath;
        this.setPath = setPath;
        this.destroy = destroy;
        this.assetsPath = '';
        this.path = '';
        this.totalAssets = 0;
        this.totalImages = 0;
        this.loadedAssets = 0;
        this.imagesLoadedCb = null;
    }
}());
var featureSupport = (function(){
	var ob = {
		maskType: true
	}
	if (/MSIE 10/i.test(navigator.userAgent) || /MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent) || /Edge\/\d./i.test(navigator.userAgent)) {
	   ob.maskType = false;
	}
	return ob;
}());
var filtersFactory = (function(){
	var ob = {};
	ob.createFilter = createFilter;
	ob.createAlphaToLuminanceFilter = createAlphaToLuminanceFilter;

	function createFilter(filId){
        	var fil = createNS('filter');
        	fil.setAttribute('id',filId);
                fil.setAttribute('filterUnits','objectBoundingBox');
                fil.setAttribute('x','0%');
                fil.setAttribute('y','0%');
                fil.setAttribute('width','100%');
                fil.setAttribute('height','100%');
                return fil;
	}

	function createAlphaToLuminanceFilter(){
                var feColorMatrix = createNS('feColorMatrix');
                feColorMatrix.setAttribute('type','matrix');
                feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
                feColorMatrix.setAttribute('values','0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 1');
                return feColorMatrix;
	}

	return ob;
}())
function TextAnimatorProperty(textData, renderType, elem){
    this.mdf = false;
    this._firstFrame = true;
	this._hasMaskedPath = false;
	this._frameId = -1;
	this._dynamicProperties = [];
	this._textData = textData;
	this._renderType = renderType;
	this._elem = elem;
	this._animatorsData = Array.apply(null,{length:this._textData.a.length});
	this._pathData = {}
	this._moreOptions = {
		alignment: {}
	};
	this.renderedLetters = [];
    this.lettersChangedFlag = false;

}

TextAnimatorProperty.prototype.searchProperties = function(dynamicProperties){
    var i, len = this._textData.a.length, animatorData, animatorProps;
    var getProp = PropertyFactory.getProp;
    for(i=0;i<len;i+=1){
        animatorProps = this._textData.a[i];
        animatorData = {
            a: {},
            s: {}
        };
        if('r' in animatorProps.a) {
            animatorData.a.r = getProp(this._elem,animatorProps.a.r,0,degToRads,this._dynamicProperties);
        }
        if('rx' in animatorProps.a) {
            animatorData.a.rx = getProp(this._elem,animatorProps.a.rx,0,degToRads,this._dynamicProperties);
        }
        if('ry' in animatorProps.a) {
            animatorData.a.ry = getProp(this._elem,animatorProps.a.ry,0,degToRads,this._dynamicProperties);
        }
        if('sk' in animatorProps.a) {
            animatorData.a.sk = getProp(this._elem,animatorProps.a.sk,0,degToRads,this._dynamicProperties);
        }
        if('sa' in animatorProps.a) {
            animatorData.a.sa = getProp(this._elem,animatorProps.a.sa,0,degToRads,this._dynamicProperties);
        }
        if('s' in animatorProps.a) {
            animatorData.a.s = getProp(this._elem,animatorProps.a.s,1,0.01,this._dynamicProperties);
        }
        if('a' in animatorProps.a) {
            animatorData.a.a = getProp(this._elem,animatorProps.a.a,1,0,this._dynamicProperties);
        }
        if('o' in animatorProps.a) {
            animatorData.a.o = getProp(this._elem,animatorProps.a.o,0,0.01,this._dynamicProperties);
        }
        if('p' in animatorProps.a) {
            animatorData.a.p = getProp(this._elem,animatorProps.a.p,1,0,this._dynamicProperties);
        }
        if('sw' in animatorProps.a) {
            animatorData.a.sw = getProp(this._elem,animatorProps.a.sw,0,0,this._dynamicProperties);
        }
        if('sc' in animatorProps.a) {
            animatorData.a.sc = getProp(this._elem,animatorProps.a.sc,1,0,this._dynamicProperties);
        }
        if('fc' in animatorProps.a) {
            animatorData.a.fc = getProp(this._elem,animatorProps.a.fc,1,0,this._dynamicProperties);
        }
        if('fh' in animatorProps.a) {
            animatorData.a.fh = getProp(this._elem,animatorProps.a.fh,0,0,this._dynamicProperties);
        }
        if('fs' in animatorProps.a) {
            animatorData.a.fs = getProp(this._elem,animatorProps.a.fs,0,0.01,this._dynamicProperties);
        }
        if('fb' in animatorProps.a) {
            animatorData.a.fb = getProp(this._elem,animatorProps.a.fb,0,0.01,this._dynamicProperties);
        }
        if('t' in animatorProps.a) {
            animatorData.a.t = getProp(this._elem,animatorProps.a.t,0,0,this._dynamicProperties);
        }
        animatorData.s = TextSelectorProp.getTextSelectorProp(this._elem,animatorProps.s,this._dynamicProperties);
        animatorData.s.t = animatorProps.s.t;
        this._animatorsData[i] = animatorData;
    }
    if(this._textData.p && 'm' in this._textData.p){
        this._pathData = {
            f: getProp(this._elem,this._textData.p.f,0,0,this._dynamicProperties),
            l: getProp(this._elem,this._textData.p.l,0,0,this._dynamicProperties),
            r: this._textData.p.r,
            m: this._elem.maskManager.getMaskProperty(this._textData.p.m)
        };
        this._hasMaskedPath = true;
    } else {
        this._hasMaskedPath = false;
    }
    this._moreOptions.alignment = getProp(this._elem,this._textData.m.a,1,0,this._dynamicProperties);
    if(this._dynamicProperties.length) {
    	dynamicProperties.push(this);
    }
}

TextAnimatorProperty.prototype.getMeasures = function(documentData, lettersChangedFlag){
    this.lettersChangedFlag = lettersChangedFlag;
    if(!this.mdf && !this._firstFrame && !lettersChangedFlag && (!this._hasMaskedPath || !this._pathData.m.mdf)) {
        return;
    }
    this._firstFrame = false;
    var alignment = this._moreOptions.alignment.v;
    var animators = this._animatorsData;
    var textData = this._textData;
    var matrixHelper = this.mHelper;
    var renderType = this._renderType;
    var renderedLettersCount = this.renderedLetters.length;
    var data = this.data;
    var xPos,yPos;
    var i, len;
    var letters = documentData.l;
    if(this._hasMaskedPath) {
        var mask = this._pathData.m;
        if(!this._pathData.n || this._pathData.mdf){
            var paths = mask.v;
            if(this._pathData.r){
                paths = paths.reverse();
            }
            var pathInfo = {
                tLength: 0,
                segments: []
            };
            len = paths._length - 1;
            var pathData;
            var totalLength = 0;
            for (i = 0; i < len; i += 1) {
                pathData = {
                    s: paths.v[i],
                    e: paths.v[i + 1],
                    to: [paths.o[i][0] - paths.v[i][0], paths.o[i][1] - paths.v[i][1]],
                    ti: [paths.i[i + 1][0] - paths.v[i + 1][0], paths.i[i + 1][1] - paths.v[i + 1][1]]
                };
                bez.buildBezierData(pathData);
                pathInfo.tLength += pathData.bezierData.segmentLength;
                pathInfo.segments.push(pathData);
                totalLength += pathData.bezierData.segmentLength;
            }
            i = len;
            if (mask.v.c) {
                pathData = {
                    s: paths.v[i],
                    e: paths.v[0],
                    to: [paths.o[i][0] - paths.v[i][0], paths.o[i][1] - paths.v[i][1]],
                    ti: [paths.i[0][0] - paths.v[0][0], paths.i[0][1] - paths.v[0][1]]
                };
                bez.buildBezierData(pathData);
                pathInfo.tLength += pathData.bezierData.segmentLength;
                pathInfo.segments.push(pathData);
                totalLength += pathData.bezierData.segmentLength;
            }
            this._pathData.pi = pathInfo;
        }
        var pathInfo = this._pathData.pi;

        var currentLength = this._pathData.f.v, segmentInd = 0, pointInd = 1, currentPoint, prevPoint, points;
        var segmentLength = 0, flag = true;
        var segments = pathInfo.segments;
        if (currentLength < 0 && mask.v.c) {
            if (pathInfo.tLength < Math.abs(currentLength)) {
                currentLength = -Math.abs(currentLength) % pathInfo.tLength;
            }
            segmentInd = segments.length - 1;
            points = segments[segmentInd].bezierData.points;
            pointInd = points.length - 1;
            while (currentLength < 0) {
                currentLength += points[pointInd].partialLength;
                pointInd -= 1;
                if (pointInd < 0) {
                    segmentInd -= 1;
                    points = segments[segmentInd].bezierData.points;
                    pointInd = points.length - 1;
                }
            }

        }
        points = segments[segmentInd].bezierData.points;
        prevPoint = points[pointInd - 1];
        currentPoint = points[pointInd];
        var partialLength = currentPoint.partialLength;
        var perc, tanAngle;
    }


    len = letters.length;
    xPos = 0;
    yPos = 0;
    var yOff = documentData.s*1.2*.714;
    var firstLine = true;
    var animatorProps, animatorSelector;
    var j, jLen;
    var letterValue;

    jLen = animators.length;
    //Todo Confirm this is not necessary here. Text Animator Selectors should not be called without a text index. And it is later correctly called.
    /*if (lettersChangedFlag) {
        for (j = 0; j < jLen; j += 1) {
            animatorSelector = animators[j].s;
            //animatorSelector.getValue(true);
        }
    }*/
    var lastLetter;

    var mult, ind = -1, offf, xPathPos, yPathPos;
    var initPathPos = currentLength,initSegmentInd = segmentInd, initPointInd = pointInd, currentLine = -1;
    var elemOpacity;
    var sc,sw,fc,k;
    var lineLength = 0;
    var letterSw,letterSc,letterFc,letterM = '',letterP = this.defaultPropsArray,letterO;
    for( i = 0; i < len; i += 1) {
        matrixHelper.reset();
        elemOpacity = 1;
        if(letters[i].n) {
            xPos = 0;
            yPos += documentData.yOffset;
            yPos += firstLine ? 1 : 0;
            currentLength = initPathPos ;
            firstLine = false;
            lineLength = 0;
            if(this._hasMaskedPath) {
                segmentInd = initSegmentInd;
                pointInd = initPointInd;
                points = segments[segmentInd].bezierData.points;
                prevPoint = points[pointInd - 1];
                currentPoint = points[pointInd];
                partialLength = currentPoint.partialLength;
                segmentLength = 0;
            }
            letterO = letterSw = letterFc = letterM = '';
            letterP = this.defaultPropsArray;
        }else{
            if(this._hasMaskedPath) {
                if(currentLine !== letters[i].line){
                    switch(documentData.j){
                        case 1:
                            currentLength += totalLength - documentData.lineWidths[letters[i].line];
                            break;
                        case 2:
                            currentLength += (totalLength - documentData.lineWidths[letters[i].line])/2;
                            break;
                    }
                    currentLine = letters[i].line;
                }
                if (ind !== letters[i].ind) {
                    if (letters[ind]) {
                        currentLength += letters[ind].extra;
                    }
                    currentLength += letters[i].an / 2;
                    ind = letters[i].ind;
                }
                currentLength += alignment[0] * letters[i].an / 200;
                var animatorOffset = 0;
                for (j = 0; j < jLen; j += 1) {
                    animatorProps = animators[j].a;
                    if ('p' in animatorProps) {
                        animatorSelector = animators[j].s;
                        mult = animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);
                        if(mult.length){
                            animatorOffset += animatorProps.p.v[0] * mult[0];
                        } else{
                            animatorOffset += animatorProps.p.v[0] * mult;
                        }

                    }
                    if ('a' in animatorProps) {
                        animatorSelector = animators[j].s;
                        mult = animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);
                        if(mult.length){
                            animatorOffset += animatorProps.a.v[0] * mult[0];
                        } else{
                            animatorOffset += animatorProps.a.v[0] * mult;
                        }

                    }
                }
                flag = true;
                while (flag) {
                    if (segmentLength + partialLength >= currentLength + animatorOffset || !points) {
                        perc = (currentLength + animatorOffset - segmentLength) / currentPoint.partialLength;
                        xPathPos = prevPoint.point[0] + (currentPoint.point[0] - prevPoint.point[0]) * perc;
                        yPathPos = prevPoint.point[1] + (currentPoint.point[1] - prevPoint.point[1]) * perc;
                        matrixHelper.translate(-alignment[0]*letters[i].an/200, -(alignment[1] * yOff / 100));
                        flag = false;
                    } else if (points) {
                        segmentLength += currentPoint.partialLength;
                        pointInd += 1;
                        if (pointInd >= points.length) {
                            pointInd = 0;
                            segmentInd += 1;
                            if (!segments[segmentInd]) {
                                if (mask.v.c) {
                                    pointInd = 0;
                                    segmentInd = 0;
                                    points = segments[segmentInd].bezierData.points;
                                } else {
                                    segmentLength -= currentPoint.partialLength;
                                    points = null;
                                }
                            } else {
                                points = segments[segmentInd].bezierData.points;
                            }
                        }
                        if (points) {
                            prevPoint = currentPoint;
                            currentPoint = points[pointInd];
                            partialLength = currentPoint.partialLength;
                        }
                    }
                }
                offf = letters[i].an / 2 - letters[i].add;
                matrixHelper.translate(-offf, 0, 0);
            } else {
                offf = letters[i].an/2 - letters[i].add;
                matrixHelper.translate(-offf,0,0);

                // Grouping alignment
                matrixHelper.translate(-alignment[0]*letters[i].an/200, -alignment[1]*yOff/100, 0);
            }

            lineLength += letters[i].l/2;
            for(j=0;j<jLen;j+=1){
                animatorProps = animators[j].a;
                if ('t' in animatorProps) {
                    animatorSelector = animators[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);
                    if(this._hasMaskedPath) {
                        if(mult.length) {
                            currentLength += animatorProps.t*mult[0];
                        } else {
                            currentLength += animatorProps.t*mult;
                        }
                    }else{
                        if(mult.length) {
                            xPos += animatorProps.t.v*mult[0];
                        } else {
                            xPos += animatorProps.t.v*mult;
                        }
                    }
                }
            }
            lineLength += letters[i].l/2;
            if(documentData.strokeWidthAnim) {
                sw = documentData.sw || 0;
            }
            if(documentData.strokeColorAnim) {
                if(documentData.sc){
                    sc = [documentData.sc[0], documentData.sc[1], documentData.sc[2]];
                }else{
                    sc = [0,0,0];
                }
            }
            if(documentData.fillColorAnim && documentData.fc) {
                fc = [documentData.fc[0], documentData.fc[1], documentData.fc[2]];
            }
            for(j=0;j<jLen;j+=1){
                animatorProps = animators[j].a;
                if ('a' in animatorProps) {
                    animatorSelector = animators[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);

                    if(mult.length){
                        matrixHelper.translate(-animatorProps.a.v[0]*mult[0], -animatorProps.a.v[1]*mult[1], animatorProps.a.v[2]*mult[2]);
                    } else {
                        matrixHelper.translate(-animatorProps.a.v[0]*mult, -animatorProps.a.v[1]*mult, animatorProps.a.v[2]*mult);
                    }
                }
            }
            for(j=0;j<jLen;j+=1){
                animatorProps = animators[j].a;
                if ('s' in animatorProps) {
                    animatorSelector = animators[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);
                    if(mult.length){
                        matrixHelper.scale(1+((animatorProps.s.v[0]-1)*mult[0]),1+((animatorProps.s.v[1]-1)*mult[1]),1);
                    } else {
                        matrixHelper.scale(1+((animatorProps.s.v[0]-1)*mult),1+((animatorProps.s.v[1]-1)*mult),1);
                    }
                }
            }
            for(j=0;j<jLen;j+=1) {
                animatorProps = animators[j].a;
                animatorSelector = animators[j].s;
                mult = animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);
                if ('sk' in animatorProps) {
                    if(mult.length) {
                        matrixHelper.skewFromAxis(-animatorProps.sk.v * mult[0], animatorProps.sa.v * mult[1]);
                    } else {
                        matrixHelper.skewFromAxis(-animatorProps.sk.v * mult, animatorProps.sa.v * mult);
                    }
                }
                if ('r' in animatorProps) {
                    if(mult.length) {
                        matrixHelper.rotateZ(-animatorProps.r.v * mult[2]);
                    } else {
                        matrixHelper.rotateZ(-animatorProps.r.v * mult);
                    }
                }
                if ('ry' in animatorProps) {

                    if(mult.length) {
                        matrixHelper.rotateY(animatorProps.ry.v*mult[1]);
                    }else{
                        matrixHelper.rotateY(animatorProps.ry.v*mult);
                    }
                }
                if ('rx' in animatorProps) {
                    if(mult.length) {
                        matrixHelper.rotateX(animatorProps.rx.v*mult[0]);
                    } else {
                        matrixHelper.rotateX(animatorProps.rx.v*mult);
                    }
                }
                if ('o' in animatorProps) {
                    if(mult.length) {
                        elemOpacity += ((animatorProps.o.v)*mult[0] - elemOpacity)*mult[0];
                    } else {
                        elemOpacity += ((animatorProps.o.v)*mult - elemOpacity)*mult;
                    }
                }
                if (documentData.strokeWidthAnim && 'sw' in animatorProps) {
                    if(mult.length) {
                        sw += animatorProps.sw.v*mult[0];
                    } else {
                        sw += animatorProps.sw.v*mult;
                    }
                }
                if (documentData.strokeColorAnim && 'sc' in animatorProps) {
                    for(k=0;k<3;k+=1){
                        if(mult.length) {
                            sc[k] = sc[k] + (animatorProps.sc.v[k] - sc[k])*mult[0]
                        } else {
                            sc[k] = sc[k] + (animatorProps.sc.v[k] - sc[k])*mult;
                        }
                    }
                }
                if (documentData.fillColorAnim && documentData.fc) {
                    if('fc' in animatorProps){
                        for(k=0;k<3;k+=1){
                            if(mult.length) {
                                fc[k] = fc[k] + (animatorProps.fc.v[k] - fc[k])*mult[0];
                            } else {
                                fc[k] = fc[k] + (animatorProps.fc.v[k] - fc[k])*mult;
                            }
                        }
                    }
                    if('fh' in animatorProps){
                        if(mult.length) {
                            fc = addHueToRGB(fc,animatorProps.fh.v*mult[0]);
                        } else {
                            fc = addHueToRGB(fc,animatorProps.fh.v*mult);
                        }
                    }
                    if('fs' in animatorProps){
                        if(mult.length) {
                            fc = addSaturationToRGB(fc,animatorProps.fs.v*mult[0]);
                        } else {
                            fc = addSaturationToRGB(fc,animatorProps.fs.v*mult);
                        }
                    }
                    if('fb' in animatorProps){
                        if(mult.length) {
                            fc = addBrightnessToRGB(fc,animatorProps.fb.v*mult[0]);
                        } else {
                            fc = addBrightnessToRGB(fc,animatorProps.fb.v*mult);
                        }
                    }
                }
            }

            for(j=0;j<jLen;j+=1){
                animatorProps = animators[j].a;

                if ('p' in animatorProps) {
                    animatorSelector = animators[j].s;
                    mult = animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);
                    if(this._hasMaskedPath) {
                        if(mult.length) {
                            matrixHelper.translate(0, animatorProps.p.v[1] * mult[0], -animatorProps.p.v[2] * mult[1]);
                        } else {
                            matrixHelper.translate(0, animatorProps.p.v[1] * mult, -animatorProps.p.v[2] * mult);
                        }
                    }else{
                        if(mult.length) {
                            matrixHelper.translate(animatorProps.p.v[0] * mult[0], animatorProps.p.v[1] * mult[1], -animatorProps.p.v[2] * mult[2]);
                        } else {
                            matrixHelper.translate(animatorProps.p.v[0] * mult, animatorProps.p.v[1] * mult, -animatorProps.p.v[2] * mult);
                        }
                    }
                }
            }
            if(documentData.strokeWidthAnim){
                letterSw = sw < 0 ? 0 : sw;
            }
            if(documentData.strokeColorAnim){
                letterSc = 'rgb('+Math.round(sc[0]*255)+','+Math.round(sc[1]*255)+','+Math.round(sc[2]*255)+')';
            }
            if(documentData.fillColorAnim && documentData.fc){
                letterFc = 'rgb('+Math.round(fc[0]*255)+','+Math.round(fc[1]*255)+','+Math.round(fc[2]*255)+')';
            }

            if(this._hasMaskedPath) {
                matrixHelper.translate(0,-documentData.ls);

                matrixHelper.translate(0, alignment[1]*yOff/100 + yPos,0);
                if (textData.p.p) {
                    tanAngle = (currentPoint.point[1] - prevPoint.point[1]) / (currentPoint.point[0] - prevPoint.point[0]);
                    var rot = Math.atan(tanAngle) * 180 / Math.PI;
                    if (currentPoint.point[0] < prevPoint.point[0]) {
                        rot += 180;
                    }
                    matrixHelper.rotate(-rot * Math.PI / 180);
                }
                matrixHelper.translate(xPathPos, yPathPos, 0);
                currentLength -= alignment[0]*letters[i].an/200;
                if(letters[i+1] && ind !== letters[i+1].ind){
                    currentLength += letters[i].an / 2;
                    currentLength += documentData.tr/1000*documentData.s;
                }
            }else{

                matrixHelper.translate(xPos,yPos,0);

                if(documentData.ps){
                    //matrixHelper.translate(documentData.ps[0],documentData.ps[1],0);
                    matrixHelper.translate(documentData.ps[0],documentData.ps[1] + documentData.ascent,0);
                }
                switch(documentData.j){
                    case 1:
                        matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[letters[i].line]),0,0);
                        break;
                    case 2:
                        matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[letters[i].line])/2,0,0);
                        break;
                }
                matrixHelper.translate(0,-documentData.ls);
                matrixHelper.translate(offf,0,0);
                matrixHelper.translate(alignment[0]*letters[i].an/200,alignment[1]*yOff/100,0);
                xPos += letters[i].l + documentData.tr/1000*documentData.s;
            }
            if(renderType === 'html'){
                letterM = matrixHelper.toCSS();
            }else if(renderType === 'svg'){
                letterM = matrixHelper.to2dCSS();
            }else{
                letterP = [matrixHelper.props[0],matrixHelper.props[1],matrixHelper.props[2],matrixHelper.props[3],matrixHelper.props[4],matrixHelper.props[5],matrixHelper.props[6],matrixHelper.props[7],matrixHelper.props[8],matrixHelper.props[9],matrixHelper.props[10],matrixHelper.props[11],matrixHelper.props[12],matrixHelper.props[13],matrixHelper.props[14],matrixHelper.props[15]];
            }
            letterO = elemOpacity;
        }

        if(renderedLettersCount <= i) {
            letterValue = new LetterProps(letterO,letterSw,letterSc,letterFc,letterM,letterP);
            this.renderedLetters.push(letterValue);
            renderedLettersCount += 1;
            this.lettersChangedFlag = true;
        } else {
            letterValue = this.renderedLetters[i];
            this.lettersChangedFlag = letterValue.update(letterO, letterSw, letterSc, letterFc, letterM, letterP) || this.lettersChangedFlag;
        }
    }
}

TextAnimatorProperty.prototype.getValue = function(){
	if(this._elem.globalData.frameId === this._frameId){
        return;
    }
    this._frameId = this._elem.globalData.frameId;
	var i, len = this._dynamicProperties.length;
    this.mdf = false;
	for(i = 0; i < len; i += 1) {
		this._dynamicProperties[i].getValue();
        this.mdf = this._dynamicProperties[i].mdf || this.mdf;
	}
}

TextAnimatorProperty.prototype.mHelper = new Matrix();
TextAnimatorProperty.prototype.defaultPropsArray = [];
function LetterProps(o, sw, sc, fc, m, p){
    this.o = o;
    this.sw = sw;
    this.sc = sc;
    this.fc = fc;
    this.m = m;
    this.p = p;
    this.mdf = {
    	o: true,
    	sw: !!sw,
    	sc: !!sc,
    	fc: !!fc,
    	m: true,
    	p: true
    };
}

LetterProps.prototype.update = function(o, sw, sc, fc, m, p) {
	this.mdf.o = false;
	this.mdf.sw = false;
	this.mdf.sc = false;
	this.mdf.fc = false;
	this.mdf.m = false;
	this.mdf.p = false;
	var updated = false;

	if(this.o !== o) {
		this.o = o;
		this.mdf.o = true;
		updated = true;
	}
	if(this.sw !== sw) {
		this.sw = sw;
		this.mdf.sw = true;
		updated = true;
	}
	if(this.sc !== sc) {
		this.sc = sc;
		this.mdf.sc = true;
		updated = true;
	}
	if(this.fc !== fc) {
		this.fc = fc;
		this.mdf.fc = true;
		updated = true;
	}
	if(this.m !== m) {
		this.m = m;
		this.mdf.m = true;
		updated = true;
	}
	if(p.length && (this.p[0] !== p[0] || this.p[1] !== p[1] || this.p[4] !== p[4] || this.p[5] !== p[5] || this.p[12] !== p[12] || this.p[13] !== p[13])) {
		this.p = p;
		this.mdf.p = true;
		updated = true;
	}
	return updated;
}
function TextProperty(elem, data, dynamicProperties){
	this._frameId = -99999;
	this.pv = '';
	this.v = '';
	this.kf = false;
	this.firstFrame = true;
	this.mdf = true;
	this.data = data;
	this.elem = elem;
	this.keysIndex = -1;
	this.currentData = {
		ascent: 0,
        boxWidth: [0,0],
        f: '',
        fStyle: '',
        fWeight: '',
        fc: '',
        j: '',
        justifyOffset: '',
        l: [],
        lh: 0,
        lineWidths: [],
        ls: '',
        of: '',
        s: '',
        sc: '',
        sw: 0,
        t: 0,
        tr: 0,
        sz:0,
        ps:[0,0],
        fillColorAnim: false,
        strokeColorAnim: false,
        strokeWidthAnim: false,
        yOffset: 0,
        __complete: false

	}
	if(this.searchProperty()) {
		dynamicProperties.push(this);
	} else {
		this.getValue(true);
	}
}

TextProperty.prototype.setCurrentData = function(data){
		var currentData = this.currentData;
        currentData.ascent = data.ascent;
        currentData.boxWidth = data.boxWidth ? data.boxWidth : currentData.boxWidth;
        currentData.f = data.f;
        currentData.fStyle = data.fStyle;
        currentData.fWeight = data.fWeight;
        currentData.fc = data.fc;
        currentData.j = data.j;
        currentData.justifyOffset = data.justifyOffset;
        currentData.l = data.l;
        currentData.lh = data.lh;
        currentData.lineWidths = data.lineWidths;
        currentData.ls = data.ls;
        currentData.of = data.of;
        currentData.s = data.s;
        currentData.sc = data.sc;
        currentData.sw = data.sw;
        currentData.sz = data.sz;
        currentData.ps = data.ps;
        currentData.t = data.t;
        currentData.tr = data.tr;
        currentData.fillColorAnim = data.fillColorAnim || currentData.fillColorAnim;
        currentData.strokeColorAnim = data.strokeColorAnim || currentData.strokeColorAnim;
        currentData.strokeWidthAnim = data.strokeWidthAnim || currentData.strokeWidthAnim;
        currentData.yOffset = data.yOffset;
        currentData.__complete = false;
}

TextProperty.prototype.searchProperty = function() {
	this.kf = this.data.d.k.length > 1;
	return this.kf;
}

TextProperty.prototype.getValue = function() {
	this.mdf = false;
	var frameId = this.elem.globalData.frameId;
	if((frameId === this._frameId || !this.kf) && !this.firstFrame) {
		return;
	}
	var textKeys = this.data.d.k, textDocumentData;
    var i = 0, len = textKeys.length;
    while(i <= len - 1) {
        textDocumentData = textKeys[i].s;
        if(i === len - 1 || textKeys[i+1].t > frameId){
            break;
        }
        i += 1;
    }
    if(this.keysIndex !== i) {
    	if(!textDocumentData.__complete) {
            this.completeTextData(textDocumentData);
        }
        this.setCurrentData(textDocumentData);
        this.mdf = this.firstFrame ? false : true;
        this.pv = this.v = this.currentData.t;
        this.keysIndex = i;
    }
	this._frameId = frameId;
}

TextProperty.prototype.completeTextData = function(documentData) {
    documentData.__complete = true;
    var fontManager = this.elem.globalData.fontManager;
    var data = this.data;
    var letters = [];
    var i, len;
    var newLineFlag, index = 0, val;
    var anchorGrouping = data.m.g;
    var currentSize = 0, currentPos = 0, currentLine = 0, lineWidths = [];
    var lineWidth = 0;
    var maxLineWidth = 0;
    var j, jLen;
    var fontData = fontManager.getFontByName(documentData.f);
    var charData, cLength = 0;
    var styles = fontData.fStyle.split(' ');

    var fWeight = 'normal', fStyle = 'normal';
    len = styles.length;
    var styleName;
    for(i=0;i<len;i+=1){
        styleName = styles[i].toLowerCase();
        switch(styleName) {
            case 'italic':
            fStyle = 'italic';
            break;
            case 'bold':
            fWeight = '700';
            break;
            case 'black':
            fWeight = '900';
            break;
            case 'medium':
            fWeight = '500';
            break;
            case 'regular':
            case 'normal':
            fWeight = '400';
            case 'light':
            case 'thin':
            fWeight = '200';
            break;
        }
    }
    documentData.fWeight = fWeight;
    documentData.fStyle = fStyle;
    len = documentData.t.length;
    var trackingOffset = documentData.tr/1000*documentData.s;
    if(documentData.sz){
        var boxWidth = documentData.sz[0];
        var lastSpaceIndex = -1;
        for(i=0;i<len;i+=1){
            newLineFlag = false;
            if(documentData.t.charAt(i) === ' '){
                lastSpaceIndex = i;
            }else if(documentData.t.charCodeAt(i) === 13){
                lineWidth = 0;
                newLineFlag = true;
            }
            if(fontManager.chars){
                charData = fontManager.getCharData(documentData.t.charAt(i), fontData.fStyle, fontData.fFamily);
                cLength = newLineFlag ? 0 : charData.w*documentData.s/100;
            }else{
                //tCanvasHelper.font = documentData.s + 'px '+ fontData.fFamily;
                cLength = fontManager.measureText(documentData.t.charAt(i), documentData.f, documentData.s);
            }
            if(lineWidth + cLength > boxWidth && documentData.t.charAt(i) !== ' '){
                if(lastSpaceIndex === -1){
                    len += 1;
                } else {
                    i = lastSpaceIndex;
                }
                documentData.t = documentData.t.substr(0,i) + "\r" + documentData.t.substr(i === lastSpaceIndex ? i + 1 : i);
                lastSpaceIndex = -1;
                lineWidth = 0;
            }else {
                lineWidth += cLength;
                lineWidth += trackingOffset;
            }
        }
        len = documentData.t.length;
    }
    lineWidth = - trackingOffset;
    cLength = 0;
    var uncollapsedSpaces = 0;
    var currentChar;
    for (i = 0;i < len ;i += 1) {
        newLineFlag = false;
        currentChar = documentData.t.charAt(i);
        if(currentChar === ' '){
            val = '\u00A0';
        }else if(currentChar.charCodeAt(0) === 13){
            uncollapsedSpaces = 0;
            lineWidths.push(lineWidth);
            maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
            lineWidth = - 2 * trackingOffset;
            val = '';
            newLineFlag = true;
            currentLine += 1;
        }else{
            val = documentData.t.charAt(i);
        }
        if(fontManager.chars){
            charData = fontManager.getCharData(currentChar, fontData.fStyle, fontManager.getFontByName(documentData.f).fFamily);
            cLength = newLineFlag ? 0 : charData.w*documentData.s/100;
        }else{
            //var charWidth = fontManager.measureText(val, documentData.f, documentData.s);
            //tCanvasHelper.font = documentData.s + 'px '+ fontManager.getFontByName(documentData.f).fFamily;
            cLength = fontManager.measureText(val, documentData.f, documentData.s);
        }

        //
        if(currentChar === ' '){
            uncollapsedSpaces += cLength + trackingOffset;
        } else {
            lineWidth += cLength + trackingOffset + uncollapsedSpaces;
            uncollapsedSpaces = 0;
        }
        letters.push({l:cLength,an:cLength,add:currentSize,n:newLineFlag, anIndexes:[], val: val, line: currentLine});
        if(anchorGrouping == 2){
            currentSize += cLength;
            if(val == '' || val == '\u00A0' || i == len - 1){
                if(val == '' || val == '\u00A0'){
                    currentSize -= cLength;
                }
                while(currentPos<=i){
                    letters[currentPos].an = currentSize;
                    letters[currentPos].ind = index;
                    letters[currentPos].extra = cLength;
                    currentPos += 1;
                }
                index += 1;
                currentSize = 0;
            }
        }else if(anchorGrouping == 3){
            currentSize += cLength;
            if(val == '' || i == len - 1){
                if(val == ''){
                    currentSize -= cLength;
                }
                while(currentPos<=i){
                    letters[currentPos].an = currentSize;
                    letters[currentPos].ind = index;
                    letters[currentPos].extra = cLength;
                    currentPos += 1;
                }
                currentSize = 0;
                index += 1;
            }
        }else{
            letters[index].ind = index;
            letters[index].extra = 0;
            index += 1;
        }
    }
    documentData.l = letters;
    maxLineWidth = lineWidth > maxLineWidth ? lineWidth : maxLineWidth;
    lineWidths.push(lineWidth);
    if(documentData.sz){
        documentData.boxWidth = documentData.sz[0];
        documentData.justifyOffset = 0;
    }else{
        documentData.boxWidth = maxLineWidth;
        switch(documentData.j){
            case 1:
                documentData.justifyOffset = - documentData.boxWidth;
                break;
            case 2:
                documentData.justifyOffset = - documentData.boxWidth/2;
                break;
            default:
                documentData.justifyOffset = 0;
        }
    }
    documentData.lineWidths = lineWidths;

    var animators = data.a, animatorData, letterData;
    jLen = animators.length;
    var based, ind, indexes = [];
    for(j=0;j<jLen;j+=1){
        animatorData = animators[j];
        if(animatorData.a.sc){
            documentData.strokeColorAnim = true;
        }
        if(animatorData.a.sw){
            documentData.strokeWidthAnim = true;
        }
        if(animatorData.a.fc || animatorData.a.fh || animatorData.a.fs || animatorData.a.fb){
            documentData.fillColorAnim = true;
        }
        ind = 0;
        based = animatorData.s.b;
        for(i=0;i<len;i+=1){
            letterData = letters[i];
            letterData.anIndexes[j] = ind;
            if((based == 1 && letterData.val != '') || (based == 2 && letterData.val != '' && letterData.val != '\u00A0') || (based == 3 && (letterData.n || letterData.val == '\u00A0' || i == len - 1)) || (based == 4 && (letterData.n || i == len - 1))){
                if(animatorData.s.rn === 1){
                    indexes.push(ind);
                }
                ind += 1;
            }
        }
        data.a[j].s.totalChars = ind;
        var currentInd = -1, newInd;
        if(animatorData.s.rn === 1){
            for(i = 0; i < len; i += 1){
                letterData = letters[i];
                if(currentInd != letterData.anIndexes[j]){
                    currentInd = letterData.anIndexes[j];
                    newInd = indexes.splice(Math.floor(Math.random()*indexes.length),1)[0];
                }
                letterData.anIndexes[j] = newInd;
            }
        }
    }
    documentData.yOffset = documentData.lh || documentData.s*1.2;
    documentData.ls = documentData.ls || 0;
    documentData.ascent = fontData.ascent*documentData.s/100;
}

TextProperty.prototype.updateDocumentData = function(newData, index) {
	index = index === undefined ? this.keysIndex : index;
    var dData = this.data.d.k[index].s;
    dData.__complete = false;
    dData.t = newData.t;
    this.keysIndex = -1;
    this.firstFrame = true;
    this.getValue();
}

var TextSelectorProp = (function(){
    var max = Math.max;
    var min = Math.min;
    var floor = Math.floor;
    function updateRange(newCharsFlag){
        this.mdf = newCharsFlag || false;
        if(this.dynamicProperties.length){
            var i, len = this.dynamicProperties.length;
            for(i=0;i<len;i+=1){
                this.dynamicProperties[i].getValue();
                if(this.dynamicProperties[i].mdf){
                    this.mdf = true;
                }
            }
        }
        var totalChars = this.elem.textProperty.currentData ? this.elem.textProperty.currentData.l.length : 0;
        if(newCharsFlag && this.data.r === 2) {
            this.e.v = totalChars;
        }
        var divisor = this.data.r === 2 ? 1 : 100 / totalChars;
        var o = this.o.v/divisor;
        var s = this.s.v/divisor + o;
        var e = (this.e.v/divisor) + o;
        if(s>e){
            var _s = s;
            s = e;
            e = _s;
        }
        this.finalS = s;
        this.finalE = e;
    }

    function getMult(ind){
        //var easer = bez.getEasingCurve(this.ne.v/100,0,1-this.xe.v/100,1);
        var easer = BezierFactory.getBezierEasing(this.ne.v/100,0,1-this.xe.v/100,1).get;
        var mult = 0;
        var s = this.finalS;
        var e = this.finalE;
        var type = this.data.sh;
        if(type == 2){
            if(e === s){
                mult = ind >= e ? 1 : 0;
            }else{
                mult = max(0,min(0.5/(e-s) + (ind-s)/(e-s),1));
            }
            mult = easer(mult);
        }else if(type == 3){
            if(e === s){
                mult = ind >= e ? 0 : 1;
            }else{
                mult = 1 - max(0,min(0.5/(e-s) + (ind-s)/(e-s),1));
            }

            mult = easer(mult);
        }else if(type == 4){
            if(e === s){
                mult = 0;
            }else{
                mult = max(0,min(0.5/(e-s) + (ind-s)/(e-s),1));
                if(mult<.5){
                    mult *= 2;
                }else{
                    mult = 1 - 2*(mult-0.5);
                }
            }
            mult = easer(mult);
        }else if(type == 5){
            if(e === s){
                mult = 0;
            }else{
                var tot = e - s;
                /*ind += 0.5;
                mult = -4/(tot*tot)*(ind*ind)+(4/tot)*ind;*/
                ind = min(max(0,ind+0.5-s),e-s);
                var x = -tot/2+ind;
                var a = tot/2;
                mult = Math.sqrt(1 - (x*x)/(a*a));
            }
            mult = easer(mult);
        }else if(type == 6){
            if(e === s){
                mult = 0;
            }else{
                ind = min(max(0,ind+0.5-s),e-s);
                mult = (1+(Math.cos((Math.PI+Math.PI*2*(ind)/(e-s)))))/2;
                /*
                 ind = Math.min(Math.max(s,ind),e-1);
                 mult = (1+(Math.cos((Math.PI+Math.PI*2*(ind-s)/(e-1-s)))))/2;
                 mult = Math.max(mult,(1/(e-1-s))/(e-1-s));*/
            }
            mult = easer(mult);
        }else {
            if(ind >= floor(s)){
                if(ind-s < 0){
                    mult = 1 - (s - ind);
                }else{
                    mult = max(0,min(e-ind,1));
                }
            }
            mult = easer(mult);
        }
        return mult*this.a.v;
    }

    function TextSelectorProp(elem,data, arr){
        this.mdf = false;
        this.k = false;
        this.data = data;
        this.dynamicProperties = [];
        this.getValue = updateRange;
        this.getMult = getMult;
        this.elem = elem;
        this.comp = elem.comp;
        this.finalS = 0;
        this.finalE = 0;
        this.s = PropertyFactory.getProp(elem,data.s || {k:0},0,0,this.dynamicProperties);
        if('e' in data){
            this.e = PropertyFactory.getProp(elem,data.e,0,0,this.dynamicProperties);
        }else{
            this.e = {v:100};
        }
        this.o = PropertyFactory.getProp(elem,data.o || {k:0},0,0,this.dynamicProperties);
        this.xe = PropertyFactory.getProp(elem,data.xe || {k:0},0,0,this.dynamicProperties);
        this.ne = PropertyFactory.getProp(elem,data.ne || {k:0},0,0,this.dynamicProperties);
        this.a = PropertyFactory.getProp(elem,data.a,0,0.01,this.dynamicProperties);
        if(this.dynamicProperties.length){
            arr.push(this);
        }else{
            this.getValue();
        }
    }

    function getTextSelectorProp(elem, data,arr) {
        return new TextSelectorProp(elem, data, arr);
    };

    return {
        getTextSelectorProp: getTextSelectorProp
    }
}());

    
var pooling = (function(){

	function double(arr){
		return arr.concat(Array.apply(null,{length:arr.length}))
	}

	return {
		double: double
	}
}());
var point_pool = (function(){
	var ob = {
		newPoint: newPoint,
		release: release
	}

	var _length = 0;
	var _maxLength = 8;
	var pool = Array.apply(null,{length:_maxLength});

	function newPoint(){
		var point;
		if(_length){
			_length -= 1;
			point = pool[_length];
		} else {
			point = createTypedArray('float32', 2);
		}
		return point;
	}

	function release(point) {
		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		pool[_length] = point;
		_length += 1;
	}


	return ob;
}());
var shape_pool = (function(){
	var ob = {
		clone: clone,
		newShape: newShape,
		release: release,
		releaseArray: releaseArray
	}

	var _length = 0;
	var _maxLength = 4;
	var pool = Array.apply(null,{length:_maxLength});

	function newShape(){
		var shapePath;
		if(_length){
			_length -= 1;
			shapePath = pool[_length];
		} else {
			shapePath = new ShapePath();
		}
		return shapePath;
	}

	function release(shapePath) {
		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		var len = shapePath._length, i;
		for(i = 0; i < len; i += 1) {
			point_pool.release(shapePath.v[i]);
			point_pool.release(shapePath.i[i]);
			point_pool.release(shapePath.o[i]);
			shapePath.v[i] = null;
			shapePath.i[i] = null;
			shapePath.o[i] = null;
		}
		shapePath._length = 0;
		shapePath.c = false;
		pool[_length] = shapePath;
		_length += 1;
	}

	function releaseArray(shapePathsCollection, length) {
		while(length--) {
			release(shapePathsCollection[length]);
		}
	}

	function clone(shape, transform) {
		var i, len = shape._length === undefined ? shape.v.length : shape._length;
		var cloned = newShape();
		cloned.setLength(len);
		cloned.c = shape.c;

		var pt;
		
		for(i = 0; i < len; i += 1) {
			if(transform){
				pt = transform.applyToPointArray(shape.v[i][0],shape.v[i][1],0,2);
				cloned.setXYAt(pt[0],pt[1],'v',i);
				point_pool.release(pt);
				pt = transform.applyToPointArray(shape.o[i][0],shape.o[i][1],0,2);
				cloned.setXYAt(pt[0],pt[1],'o',i);
				point_pool.release(pt);
				pt = transform.applyToPointArray(shape.i[i][0],shape.i[i][1],0,2);
				cloned.setXYAt(pt[0],pt[1],'i',i);
				point_pool.release(pt);
			}else{
				cloned.setTripleAt(shape.v[i][0],shape.v[i][1],shape.o[i][0],shape.o[i][1],shape.i[i][0],shape.i[i][1], i);
			}
		}
		return cloned
	}


	return ob;
}());
var shapeCollection_pool = (function(){
	var ob = {
		newShapeCollection: newShapeCollection,
		release: release,
		clone: clone
	}

	var _length = 0;
	var _maxLength = 4;
	var pool = Array.apply(null,{length:_maxLength});

	var cont = 0;

	function newShapeCollection(){
		var shapeCollection;
		if(_length){
			_length -= 1;
			shapeCollection = pool[_length];
		} else {
			shapeCollection = new ShapeCollection();
		}
		return shapeCollection;
	}

	function release(shapeCollection) {
		var i, len = shapeCollection._length;
		for(i = 0; i < len; i += 1) {
			shape_pool.release(shapeCollection.shapes[i]);
		}
		shapeCollection._length = 0;

		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		pool[_length] = shapeCollection;
		_length += 1;
	}

	function clone(shapeCollection, originCollection) {
		release(shapeCollection);
		if(_length === _maxLength) {
			pool = pooling.double(pool);
			_maxLength = _maxLength*2;
		}
		pool[_length] = shapeCollection;
		_length += 1;
	}


	return ob;
}());
function BaseRenderer(){}
BaseRenderer.prototype.checkLayers = function(num){
    var i, len = this.layers.length, data;
    this.completeLayers = true;
    for (i = len - 1; i >= 0; i--) {
        if (!this.elements[i]) {
            data = this.layers[i];
            if(data.ip - data.st <= (num - this.layers[i].st) && data.op - data.st > (num - this.layers[i].st))
            {
                this.buildItem(i);
            }
        }
        this.completeLayers = this.elements[i] ? this.completeLayers:false;
    }
    this.checkPendingElements();
};

BaseRenderer.prototype.createItem = function(layer){
    switch(layer.ty){
        case 2:
            return this.createImage(layer);
        case 0:
            return this.createComp(layer);
        case 1:
            return this.createSolid(layer);
        case 4:
            return this.createShape(layer);
        case 5:
            return this.createText(layer);
        case 13:
            return this.createCamera(layer);
        case 99:
            return null;
    }
    return this.createBase(layer);
};

BaseRenderer.prototype.createCamera = function(){
    throw new Error('You\'re using a 3d camera. Try the html renderer.');
}

BaseRenderer.prototype.buildAllItems = function(){
    var i, len = this.layers.length;
    for(i=0;i<len;i+=1){
        this.buildItem(i);
    }
    this.checkPendingElements();
};

BaseRenderer.prototype.includeLayers = function(newLayers){
    this.completeLayers = false;
    var i, len = newLayers.length;
    var j, jLen = this.layers.length;
    for(i=0;i<len;i+=1){
        j = 0;
        while(j<jLen){
            if(this.layers[j].id == newLayers[i].id){
                this.layers[j] = newLayers[i];
                break;
            }
            j += 1;
        }
    }
};

BaseRenderer.prototype.setProjectInterface = function(pInterface){
    this.globalData.projectInterface = pInterface;
};

BaseRenderer.prototype.initItems = function(){
    if(!this.globalData.progressiveLoad){
        this.buildAllItems();
    }
};
BaseRenderer.prototype.buildElementParenting = function(element, parentName, hierarchy){
    hierarchy = hierarchy || [];
    var elements = this.elements;
    var layers = this.layers;
    var i=0, len = layers.length;
    while(i<len){
        if(layers[i].ind == parentName){
            if(!elements[i] || elements[i] === true){
                this.buildItem(i);
                this.addPendingElement(element);
            } else if(layers[i].parent !== undefined){
                hierarchy.push(elements[i]);
                elements[i]._isParent = true;
                this.buildElementParenting(element,layers[i].parent, hierarchy);
            } else {
                hierarchy.push(elements[i]);
                elements[i]._isParent = true;
                element.setHierarchy(hierarchy);
            }


        }
        i += 1;
    }
};

BaseRenderer.prototype.addPendingElement = function(element){
    this.pendingElements.push(element);
};
function SVGRenderer(animationItem, config){
    this.animationItem = animationItem;
    this.layers = null;
    this.renderedFrame = -1;
    this.globalData = {
        frameNum: -1
    };
    this.renderConfig = {
        preserveAspectRatio: (config && config.preserveAspectRatio) || 'xMidYMid meet',
        progressiveLoad: (config && config.progressiveLoad) || false,
        hideOnTransparent: (config && config.hideOnTransparent === false) ? false : true,
        viewBoxOnly: (config && config.viewBoxOnly) || false,
        viewBoxSize: (config && config.viewBoxSize) || false,
        className: (config && config.className) || ''
    };
    this.globalData.renderConfig = this.renderConfig;
    this.elements = [];
    this.pendingElements = [];
    this.destroyed = false;

}

extendPrototype(BaseRenderer,SVGRenderer);

SVGRenderer.prototype.createBase = function (data) {
    return new SVGBaseElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.createShape = function (data) {
    return new IShapeElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.createText = function (data) {
    return new SVGTextElement(data, this.layerElement,this.globalData,this);

};

SVGRenderer.prototype.createImage = function (data) {
    return new IImageElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.createComp = function (data) {
    return new ICompElement(data, this.layerElement,this.globalData,this);

};

SVGRenderer.prototype.createSolid = function (data) {
    return new ISolidElement(data, this.layerElement,this.globalData,this);
};

SVGRenderer.prototype.configAnimation = function(animData){
    this.layerElement = createNS('svg');
    this.layerElement.setAttribute('xmlns','http://www.w3.org/2000/svg');
    if(this.renderConfig.viewBoxSize) {
        this.layerElement.setAttribute('viewBox',this.renderConfig.viewBoxSize);
    } else {
        this.layerElement.setAttribute('viewBox','0 0 '+animData.w+' '+animData.h);
    }

    if(!this.renderConfig.viewBoxOnly) {
        this.layerElement.setAttribute('width',animData.w);
        this.layerElement.setAttribute('height',animData.h);
        this.layerElement.style.width = '100%';
        this.layerElement.style.height = '100%';
    }
    if(this.renderConfig.className) {
        this.layerElement.setAttribute('class', this.renderConfig.className);
    }
    this.layerElement.setAttribute('preserveAspectRatio',this.renderConfig.preserveAspectRatio);
    //this.layerElement.style.transform = 'translate3d(0,0,0)';
    //this.layerElement.style.transformOrigin = this.layerElement.style.mozTransformOrigin = this.layerElement.style.webkitTransformOrigin = this.layerElement.style['-webkit-transform'] = "0px 0px 0px";
    this.animationItem.wrapper.appendChild(this.layerElement);
    //Mask animation
    var defs = createNS( 'defs');
    this.globalData.defs = defs;
    this.layerElement.appendChild(defs);
    this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
    this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
    this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
    this.globalData.frameId = 0;
    this.globalData.nm = animData.nm;
    this.globalData.compSize = {
        w: animData.w,
        h: animData.h
    };
    this.data = animData;
    this.globalData.frameRate = animData.fr;
    var maskElement = createNS( 'clipPath');
    var rect = createNS('rect');
    rect.setAttribute('width',animData.w);
    rect.setAttribute('height',animData.h);
    rect.setAttribute('x',0);
    rect.setAttribute('y',0);
    var maskId = 'animationMask_'+randomString(10);
    maskElement.setAttribute('id', maskId);
    maskElement.appendChild(rect);
    var maskedElement = createNS('g');
    maskedElement.setAttribute("clip-path", "url(" + locationHref + "#"+maskId+")");
    this.layerElement.appendChild(maskedElement);
    defs.appendChild(maskElement);
    this.layerElement = maskedElement;
    this.layers = animData.layers;
    this.globalData.fontManager = new FontManager();
    this.globalData.fontManager.addChars(animData.chars);
    this.globalData.fontManager.addFonts(animData.fonts,defs);
    this.elements = Array.apply(null,{length:animData.layers.length});
};


SVGRenderer.prototype.destroy = function () {
    this.animationItem.wrapper.innerHTML = '';
    this.layerElement = null;
    this.globalData.defs = null;
    var i, len = this.layers ? this.layers.length : 0;
    for (i = 0; i < len; i++) {
        if(this.elements[i]){
            this.elements[i].destroy();
        }
    }
    this.elements.length = 0;
    this.destroyed = true;
    this.animationItem = null;
};

SVGRenderer.prototype.updateContainerSize = function () {
};

SVGRenderer.prototype.buildItem  = function(pos){
    var elements = this.elements;
    if(elements[pos] || this.layers[pos].ty == 99){
        return;
    }
    elements[pos] = true;
    var element = this.createItem(this.layers[pos]);

    elements[pos] = element;
    if(expressionsPlugin){
        if(this.layers[pos].ty === 0){
            this.globalData.projectInterface.registerComposition(element);
        }
        element.initExpressions();
    }
    this.appendElementInPos(element,pos);
    if(this.layers[pos].tt){
        if(!this.elements[pos - 1] || this.elements[pos - 1] === true){
            this.buildItem(pos - 1);
            this.addPendingElement(element);
        } else {
            element.setMatte(elements[pos - 1].layerId);
        }
    }
};

SVGRenderer.prototype.checkPendingElements  = function(){
    while(this.pendingElements.length){
        var element = this.pendingElements.pop();
        element.checkParenting();
        if(element.data.tt){
            var i = 0, len = this.elements.length;
            while(i<len){
                if(this.elements[i] === element){
                    element.setMatte(this.elements[i - 1].layerId);
                    break;
                }
                i += 1;
            }
        }
    }
};

SVGRenderer.prototype.renderFrame = function(num){
    if(this.renderedFrame == num || this.destroyed){
        return;
    }
    if(num === null){
        num = this.renderedFrame;
    }else{
        this.renderedFrame = num;
    }
    //clearPoints();
    /*console.log('-------');
    console.log('FRAME ',num);*/
    this.globalData.frameNum = num;
    this.globalData.frameId += 1;
    this.globalData.projectInterface.currentFrame = num;
    var i, len = this.layers.length;
    if(!this.completeLayers){
        this.checkLayers(num);
    }
    for (i = len - 1; i >= 0; i--) {
        if(this.completeLayers || this.elements[i]){
            this.elements[i].prepareFrame(num - this.layers[i].st);
        }
    }
    for (i = len - 1; i >= 0; i--) {
        if(this.completeLayers || this.elements[i]){
            this.elements[i].renderFrame();
        }
    }
};

SVGRenderer.prototype.appendElementInPos = function(element, pos){
    var newElement = element.getBaseElement();
    if(!newElement){
        return;
    }
    var i = 0;
    var nextElement;
    while(i<pos){
        if(this.elements[i] && this.elements[i]!== true && this.elements[i].getBaseElement()){
            nextElement = this.elements[i].getBaseElement();
        }
        i += 1;
    }
    if(nextElement){
        this.layerElement.insertBefore(newElement, nextElement);
    } else {
        this.layerElement.appendChild(newElement);
    }
};

SVGRenderer.prototype.hide = function(){
    this.layerElement.style.display = 'none';
};

SVGRenderer.prototype.show = function(){
    this.layerElement.style.display = 'block';
};

SVGRenderer.prototype.searchExtraCompositions = function(assets){
    var i, len = assets.length;
    var floatingContainer = createNS('g');
    for(i=0;i<len;i+=1){
        if(assets[i].xt){
            var comp = this.createComp(assets[i],floatingContainer,this.globalData.comp,null);
            comp.initExpressions();
            //comp.compInterface = CompExpressionInterface(comp);
            //Expressions.addLayersInterface(comp.elements, this.globalData.projectInterface);
            this.globalData.projectInterface.registerComposition(comp);
        }
    }
};

function MaskElement(data,element,globalData) {
    this.dynamicProperties = [];
    this.data = data;
    this.element = element;
    this.globalData = globalData;
    this.storedData = [];
    this.masksProperties = this.data.masksProperties;
    this.viewData = Array.apply(null,{length:this.masksProperties.length});
    this.maskElement = null;
    this.firstFrame = true;
    var defs = this.globalData.defs;
    var i, len = this.masksProperties.length;


    var path, properties = this.masksProperties;
    var count = 0;
    var currentMasks = [];
    var j, jLen;
    var layerId = randomString(10);
    var rect, expansor, feMorph,x;
    var maskType = 'clipPath', maskRef = 'clip-path';
    for (i = 0; i < len; i++) {

        if((properties[i].mode !== 'a' && properties[i].mode !== 'n')|| properties[i].inv || properties[i].o.k !== 100){
            maskType = 'mask';
            maskRef = 'mask';
        }

        if((properties[i].mode == 's' || properties[i].mode == 'i') && count == 0){
            rect = createNS( 'rect');
            rect.setAttribute('fill', '#ffffff');
            rect.setAttribute('width', this.element.comp.data.w);
            rect.setAttribute('height', this.element.comp.data.h);
            currentMasks.push(rect);
        } else {
            rect = null;
        }

        path = createNS( 'path');
        if(properties[i].mode == 'n') {
            this.viewData[i] = {
                op: PropertyFactory.getProp(this.element,properties[i].o,0,0.01,this.dynamicProperties),
                prop: ShapePropertyFactory.getShapeProp(this.element,properties[i],3,this.dynamicProperties,null),
                elem: path
            };
            defs.appendChild(path);
            continue;
        }
        count += 1;

        if(properties[i].mode == 's'){
            path.setAttribute('fill', '#000000');
        }else{
            path.setAttribute('fill', '#ffffff');
        }
        path.setAttribute('clip-rule','nonzero');

        if(properties[i].x.k !== 0){
            maskType = 'mask';
            maskRef = 'mask';
            x = PropertyFactory.getProp(this.element,properties[i].x,0,null,this.dynamicProperties);
            var filterID = 'fi_'+randomString(10);
            expansor = createNS('filter');
            expansor.setAttribute('id',filterID);
            feMorph = createNS('feMorphology');
            feMorph.setAttribute('operator','dilate');
            feMorph.setAttribute('in','SourceGraphic');
            feMorph.setAttribute('radius','0');
            expansor.appendChild(feMorph);
            defs.appendChild(expansor);
            if(properties[i].mode == 's'){
                path.setAttribute('stroke', '#000000');
            }else{
                path.setAttribute('stroke', '#ffffff');
            }
        }else{
            feMorph = null;
            x = null;
        }


        this.storedData[i] = {
             elem: path,
             x: x,
             expan: feMorph,
            lastPath: '',
            lastOperator:'',
            filterId:filterID,
            lastRadius:0
        };
        if(properties[i].mode == 'i'){
            jLen = currentMasks.length;
            var g = createNS('g');
            for(j=0;j<jLen;j+=1){
                g.appendChild(currentMasks[j]);
            }
            var mask = createNS('mask');
            mask.setAttribute('mask-type','alpha');
            mask.setAttribute('id',layerId+'_'+count);
            mask.appendChild(path);
            defs.appendChild(mask);
            g.setAttribute('mask','url(' + locationHref + '#'+layerId+'_'+count+')');

            currentMasks.length = 0;
            currentMasks.push(g);
        }else{
            currentMasks.push(path);
        }
        if(properties[i].inv && !this.solidPath){
            this.solidPath = this.createLayerSolidPath();
        }
        this.viewData[i] = {
            elem: path,
            lastPath: '',
            op: PropertyFactory.getProp(this.element,properties[i].o,0,0.01,this.dynamicProperties),
            prop:ShapePropertyFactory.getShapeProp(this.element,properties[i],3,this.dynamicProperties,null)
        };
        if(rect){
            this.viewData[i].invRect = rect;
        }
        if(!this.viewData[i].prop.k){
            this.drawPath(properties[i],this.viewData[i].prop.v,this.viewData[i]);
        }
    }

    this.maskElement = createNS( maskType);

    len = currentMasks.length;
    for(i=0;i<len;i+=1){
        this.maskElement.appendChild(currentMasks[i]);
    }

    this.maskElement.setAttribute('id', layerId);
    if(count > 0){
        this.element.maskedElement.setAttribute(maskRef, "url(" + locationHref + "#" + layerId + ")");
    }

    defs.appendChild(this.maskElement);
};

MaskElement.prototype.getMaskProperty = function(pos){
    return this.viewData[pos].prop;
};

MaskElement.prototype.prepareFrame = function(){
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();

    }
};

MaskElement.prototype.renderFrame = function (finalMat) {
    var i, len = this.masksProperties.length;
    for (i = 0; i < len; i++) {
        if(this.viewData[i].prop.mdf || this.firstFrame){
            this.drawPath(this.masksProperties[i],this.viewData[i].prop.v,this.viewData[i]);
        }
        if(this.viewData[i].op.mdf || this.firstFrame){
            this.viewData[i].elem.setAttribute('fill-opacity',this.viewData[i].op.v);
        }
        if(this.masksProperties[i].mode !== 'n'){
            if(this.viewData[i].invRect && (this.element.finalTransform.mProp.mdf || this.firstFrame)){
                this.viewData[i].invRect.setAttribute('x', -finalMat.props[12]);
                this.viewData[i].invRect.setAttribute('y', -finalMat.props[13]);
            }
            if(this.storedData[i].x && (this.storedData[i].x.mdf || this.firstFrame)){
                var feMorph = this.storedData[i].expan;
                if(this.storedData[i].x.v < 0){
                    if(this.storedData[i].lastOperator !== 'erode'){
                        this.storedData[i].lastOperator = 'erode';
                        this.storedData[i].elem.setAttribute('filter','url(' + locationHref + '#'+this.storedData[i].filterId+')');
                    }
                    feMorph.setAttribute('radius',-this.storedData[i].x.v);
                }else{
                    if(this.storedData[i].lastOperator !== 'dilate'){
                        this.storedData[i].lastOperator = 'dilate';
                        this.storedData[i].elem.setAttribute('filter',null);
                    }
                    this.storedData[i].elem.setAttribute('stroke-width', this.storedData[i].x.v*2);

                }
            }
        }
    }
    this.firstFrame = false;
};

MaskElement.prototype.getMaskelement = function () {
    return this.maskElement;
};

MaskElement.prototype.createLayerSolidPath = function(){
    var path = 'M0,0 ';
    path += ' h' + this.globalData.compSize.w ;
    path += ' v' + this.globalData.compSize.h ;
    path += ' h-' + this.globalData.compSize.w ;
    path += ' v-' + this.globalData.compSize.h + ' ';
    return path;
};

MaskElement.prototype.drawPath = function(pathData,pathNodes,viewData){
    var pathString = " M"+pathNodes.v[0][0]+','+pathNodes.v[0][1];
    var i, len;
    len = pathNodes._length;
    for(i=1;i<len;i+=1){
        //pathString += " C"+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1] + " "+pathNodes.i[i][0]+','+pathNodes.i[i][1] + " "+pathNodes.v[i][0]+','+pathNodes.v[i][1];
        pathString += " C"+bm_rnd(pathNodes.o[i-1][0])+','+bm_rnd(pathNodes.o[i-1][1]) + " "+bm_rnd(pathNodes.i[i][0])+','+bm_rnd(pathNodes.i[i][1]) + " "+bm_rnd(pathNodes.v[i][0])+','+bm_rnd(pathNodes.v[i][1]);
    }
        //pathString += " C"+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1] + " "+pathNodes.i[0][0]+','+pathNodes.i[0][1] + " "+pathNodes.v[0][0]+','+pathNodes.v[0][1];
    if(pathNodes.c && len > 1){
        pathString += " C"+bm_rnd(pathNodes.o[i-1][0])+','+bm_rnd(pathNodes.o[i-1][1]) + " "+bm_rnd(pathNodes.i[0][0])+','+bm_rnd(pathNodes.i[0][1]) + " "+bm_rnd(pathNodes.v[0][0])+','+bm_rnd(pathNodes.v[0][1]);
    }
    //pathNodes.__renderedString = pathString;


    if(viewData.lastPath !== pathString){
        if(viewData.elem){
            if(!pathNodes.c){
                viewData.elem.setAttribute('d','');
            }else if(pathData.inv){
                viewData.elem.setAttribute('d',this.solidPath + pathString);
            }else{
                viewData.elem.setAttribute('d',pathString);
            }
        }
        viewData.lastPath = pathString;
    }
};

MaskElement.prototype.destroy = function(){
    this.element = null;
    this.globalData = null;
    this.maskElement = null;
    this.data = null;
    this.masksProperties = null;
};
function BaseElement(){
};
BaseElement.prototype.checkMasks = function(){
    if(!this.data.hasMask){
        return false;
    }
    var i = 0, len = this.data.masksProperties.length;
    while(i<len) {
        if((this.data.masksProperties[i].mode !== 'n' && this.data.masksProperties[i].cl !== false)) {
            return true;
        }
        i += 1;
    }
    return false;
}

BaseElement.prototype.checkParenting = function(){
    if(this.data.parent !== undefined){
        this.comp.buildElementParenting(this, this.data.parent);
    }
}

BaseElement.prototype.prepareFrame = function(num){
    if(this.data.ip - this.data.st <= num && this.data.op - this.data.st > num)
    {
        if(this.isVisible !== true){
            this.elemMdf = true;
            this.globalData.mdf = true;
            this.isVisible = true;
            this.firstFrame = true;
            if(this.data.hasMask){
                this.maskManager.firstFrame = true;
            }
        }
    }else{
        if(this.isVisible !== false){
            this.elemMdf = true;
            this.globalData.mdf = true;
            this.isVisible = false;
        }
    }
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        if(this.isVisible || (this._isParent && this.dynamicProperties[i].type === 'transform')){
            this.dynamicProperties[i].getValue();
            if(this.dynamicProperties[i].mdf){
                this.elemMdf = true;
                this.globalData.mdf = true;
            }
        }
    }
    if(this.data.hasMask && this.isVisible){
        this.maskManager.prepareFrame(num*this.data.sr);
    }
    
    /* TODO check this
    if(this.data.sy){
        if(this.data.sy[0].renderedData[num]){
            if(this.data.sy[0].renderedData[num].c){
                this.feFlood.setAttribute('flood-color','rgb('+Math.round(this.data.sy[0].renderedData[num].c[0])+','+Math.round(this.data.sy[0].renderedData[num].c[1])+','+Math.round(this.data.sy[0].renderedData[num].c[2])+')');
            }
            if(this.data.sy[0].renderedData[num].s){
                this.feMorph.setAttribute('radius',this.data.sy[0].renderedData[num].s);
            }
        }
    }
    */


    this.currentFrameNum = num*this.data.sr;
    return this.isVisible;
};

BaseElement.prototype.globalToLocal = function(pt){
    var transforms = [];
    transforms.push(this.finalTransform);
    var flag = true;
    var comp = this.comp;
    while(flag){
        if(comp.finalTransform){
            if(comp.data.hasMask){
                transforms.splice(0,0,comp.finalTransform);
            }
            comp = comp.comp;
        } else {
            flag = false;
        }
    }
    var i, len = transforms.length,ptNew;
    for(i=0;i<len;i+=1){
        ptNew = transforms[i].mat.applyToPointArray(0,0,0);
        //ptNew = transforms[i].mat.applyToPointArray(pt[0],pt[1],pt[2]);
        pt = [pt[0] - ptNew[0],pt[1] - ptNew[1],0];
    }
    return pt;
};

BaseElement.prototype.initExpressions = function(){
    this.layerInterface = LayerExpressionInterface(this);
    if(this.data.hasMask){
        this.layerInterface.registerMaskInterface(this.maskManager);
    }
    var effectsInterface = EffectsExpressionInterface.createEffectsInterface(this,this.layerInterface);
    this.layerInterface.registerEffectsInterface(effectsInterface);

    if(this.data.ty === 0 || this.data.xt){
        this.compInterface = CompExpressionInterface(this);
    } else if(this.data.ty === 4){
        this.layerInterface.shapeInterface = ShapeExpressionInterface.createShapeInterface(this.shapesData,this.itemsData,this.layerInterface);
        this.layerInterface.content = this.layerInterface.shapeInterface;
    } else if(this.data.ty === 5){
        this.layerInterface.textInterface = TextExpressionInterface(this);
        this.layerInterface.text = this.layerInterface.textInterface;
    }
}

BaseElement.prototype.setBlendMode = function(){
    var blendModeValue = '';
    switch(this.data.bm){
        case 1:
            blendModeValue = 'multiply';
            break;
        case 2:
            blendModeValue = 'screen';
            break;
        case 3:
            blendModeValue = 'overlay';
            break;
        case 4:
            blendModeValue = 'darken';
            break;
        case 5:
            blendModeValue = 'lighten';
            break;
        case 6:
            blendModeValue = 'color-dodge';
            break;
        case 7:
            blendModeValue = 'color-burn';
            break;
        case 8:
            blendModeValue = 'hard-light';
            break;
        case 9:
            blendModeValue = 'soft-light';
            break;
        case 10:
            blendModeValue = 'difference';
            break;
        case 11:
            blendModeValue = 'exclusion';
            break;
        case 12:
            blendModeValue = 'hue';
            break;
        case 13:
            blendModeValue = 'saturation';
            break;
        case 14:
            blendModeValue = 'color';
            break;
        case 15:
            blendModeValue = 'luminosity';
            break;
    }
    var elem = this.baseElement || this.layerElement;

    elem.style['mix-blend-mode'] = blendModeValue;
}

BaseElement.prototype.init = function(){
    if(!this.data.sr){
        this.data.sr = 1;
    }
    this.dynamicProperties = this.dynamicProperties || [];
    if(this.data.ef){
        this.effects = new EffectsManager(this.data,this,this.dynamicProperties);
        //this.effect = this.effectsManager.bind(this.effectsManager);
    }
    //this.elemInterface = buildLayerExpressionInterface(this);
    this.hidden = false;
    this.firstFrame = true;
    this.isVisible = false;
    this._isParent = false;
    this.currentFrameNum = -99999;
    this.lastNum = -99999;
    if(this.data.ks){
        this.finalTransform = {
            mProp: TransformPropertyFactory.getTransformProperty(this,this.data.ks,this.dynamicProperties),
            //mProp: PropertyFactory.getProp(this,this.data.ks,2,null,this.dynamicProperties),
            matMdf: false,
            opMdf: false,
            mat: new Matrix(),
            opacity: 1
        };
        if(this.data.ao){
            this.finalTransform.mProp.autoOriented = true;
        }
        this.finalTransform.op = this.finalTransform.mProp.o;
        this.transform = this.finalTransform.mProp;
        if(this.data.ty !== 11){
            this.createElements();
        }
        if(this.data.hasMask){
            this.addMasks(this.data);
        }
    }
    this.elemMdf = false;
};
BaseElement.prototype.getType = function(){
    return this.type;
};

BaseElement.prototype.resetHierarchy = function(){
    if(!this.hierarchy){
        this.hierarchy = [];
    }else{
        this.hierarchy.length = 0;
    }
};

BaseElement.prototype.getHierarchy = function(){
    if(!this.hierarchy){
        this.hierarchy = [];
    }
    return this.hierarchy;
};

BaseElement.prototype.setHierarchy = function(hierarchy){
    this.hierarchy = hierarchy;
};

BaseElement.prototype.getLayerSize = function(){
    if(this.data.ty === 5){
        return {w:this.data.textData.width,h:this.data.textData.height};
    }else{
        return {w:this.data.width,h:this.data.height};
    }
};

BaseElement.prototype.hide = function(){

};

BaseElement.prototype.sourceRectAtTime = function(){
    return {
        top:0,
        left:0,
        width:100,
        height:100
    }
};

BaseElement.prototype.mHelper = new Matrix();
function SVGBaseElement(data,parentContainer,globalData,comp, placeholder){
    this.globalData = globalData;
    this.comp = comp;
    this.data = data;
    this.matteElement = null;
    this.transformedElement = null;
    this.isTransparent = false;
    this.parentContainer = parentContainer;
    this.layerId = placeholder ? placeholder.layerId : 'ly_'+randomString(10);
    this.placeholder = placeholder;
    this._sizeChanged = false;
    this.init();
};

createElement(BaseElement, SVGBaseElement);

SVGBaseElement.prototype.createElements = function(){
    this.layerElement = createNS('g');
    this.transformedElement = this.layerElement;
    if(this.data.hasMask){
        this.maskedElement = this.layerElement;
    }
    var layerElementParent = null;
    if(this.data.td){
        if(this.data.td == 3 || this.data.td == 1){
            var masker = createNS('mask');
            masker.setAttribute('id',this.layerId);
            masker.setAttribute('mask-type',this.data.td == 3 ? 'luminance':'alpha');
            masker.appendChild(this.layerElement);
            layerElementParent = masker;
            this.globalData.defs.appendChild(masker);
            ////// This is only for IE and Edge when mask if of type alpha
            if(!featureSupport.maskType && this.data.td == 1){
                masker.setAttribute('mask-type','luminance');
                var filId = randomString(10);
                var fil = filtersFactory.createFilter(filId);
                this.globalData.defs.appendChild(fil);
                fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
                var gg = createNS('g');
                gg.appendChild(this.layerElement);
                layerElementParent = gg;
                masker.appendChild(gg);
                gg.setAttribute('filter','url(' + locationHref + '#'+filId+')');
            }
        }else if(this.data.td == 2){
            var maskGroup = createNS('mask');
            maskGroup.setAttribute('id',this.layerId);
            maskGroup.setAttribute('mask-type','alpha');
            var maskGrouper = createNS('g');
            maskGroup.appendChild(maskGrouper);
            var filId = randomString(10);
            var fil = filtersFactory.createFilter(filId);
            ////

            var feColorMatrix = createNS('feColorMatrix');
            feColorMatrix.setAttribute('type','matrix');
            feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
            feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 -1 1');
            fil.appendChild(feColorMatrix);

            ////
            /*var feCTr = createNS('feComponentTransfer');
            feCTr.setAttribute('in','SourceGraphic');
            fil.appendChild(feCTr);
            var feFunc = createNS('feFuncA');
            feFunc.setAttribute('type','table');
            feFunc.setAttribute('tableValues','1.0 0.0');
            feCTr.appendChild(feFunc);*/
            this.globalData.defs.appendChild(fil);
            var alphaRect = createNS('rect');
            alphaRect.setAttribute('width',this.comp.data.w);
            alphaRect.setAttribute('height',this.comp.data.h);
            alphaRect.setAttribute('x','0');
            alphaRect.setAttribute('y','0');
            alphaRect.setAttribute('fill','#ffffff');
            alphaRect.setAttribute('opacity','0');
            maskGrouper.setAttribute('filter','url(' + locationHref + '#'+filId+')');
            maskGrouper.appendChild(alphaRect);
            maskGrouper.appendChild(this.layerElement);
            layerElementParent = maskGrouper;
            if(!featureSupport.maskType){
                maskGroup.setAttribute('mask-type','luminance');
                fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
                var gg = createNS('g');
                maskGrouper.appendChild(alphaRect);
                gg.appendChild(this.layerElement);
                layerElementParent = gg;
                maskGrouper.appendChild(gg);
            }
            this.globalData.defs.appendChild(maskGroup);
        }
    }else if(this.data.hasMask || this.data.tt){
        if(this.data.tt){
            this.matteElement = createNS('g');
            this.matteElement.appendChild(this.layerElement);
            layerElementParent = this.matteElement;
            this.baseElement = this.matteElement;
        }else{
            this.baseElement = this.layerElement;
        }
    }else{
        this.baseElement = this.layerElement;
    }
    if((this.data.ln || this.data.cl) && (this.data.ty === 4 || this.data.ty === 0)){
        if(this.data.ln){
            this.layerElement.setAttribute('id',this.data.ln);
        }
        if(this.data.cl){
            this.layerElement.setAttribute('class',this.data.cl);
        }
    }
    if(this.data.ty === 0){
            var cp = createNS( 'clipPath');
            var pt = createNS('path');
            pt.setAttribute('d','M0,0 L'+this.data.w+',0'+' L'+this.data.w+','+this.data.h+' L0,'+this.data.h+'z');
            var clipId = 'cp_'+randomString(8);
            cp.setAttribute('id',clipId);
            cp.appendChild(pt);
            this.globalData.defs.appendChild(cp);
        if(this.checkMasks()){
            var cpGroup = createNS('g');
            cpGroup.setAttribute('clip-path','url(' + locationHref + '#'+clipId+')');
            cpGroup.appendChild(this.layerElement);
            this.transformedElement = cpGroup;
            if(layerElementParent){
                layerElementParent.appendChild(this.transformedElement);
            } else {
                this.baseElement = this.transformedElement;
            }
        } else {
            this.layerElement.setAttribute('clip-path','url(' + locationHref + '#'+clipId+')');
        }
        
    }
    if(this.data.bm !== 0){
        this.setBlendMode();
    }
    if(this.layerElement !== this.parentContainer){
        this.placeholder = null;
    }
    /* Todo performance killer
    if(this.data.sy){
        var filterID = 'st_'+randomString(10);
        var c = this.data.sy[0].c.k;
        var r = this.data.sy[0].s.k;
        var expansor = createNS('filter');
        expansor.setAttribute('id',filterID);
        var feFlood = createNS('feFlood');
        this.feFlood = feFlood;
        if(!c[0].e){
            feFlood.setAttribute('flood-color','rgb('+c[0]+','+c[1]+','+c[2]+')');
        }
        feFlood.setAttribute('result','base');
        expansor.appendChild(feFlood);
        var feMorph = createNS('feMorphology');
        feMorph.setAttribute('operator','dilate');
        feMorph.setAttribute('in','SourceGraphic');
        feMorph.setAttribute('result','bigger');
        this.feMorph = feMorph;
        if(!r.length){
            feMorph.setAttribute('radius',this.data.sy[0].s.k);
        }
        expansor.appendChild(feMorph);
        var feColorMatrix = createNS('feColorMatrix');
        feColorMatrix.setAttribute('result','mask');
        feColorMatrix.setAttribute('in','bigger');
        feColorMatrix.setAttribute('type','matrix');
        feColorMatrix.setAttribute('values','0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0');
        expansor.appendChild(feColorMatrix);
        var feComposite = createNS('feComposite');
        feComposite.setAttribute('result','drop');
        feComposite.setAttribute('in','base');
        feComposite.setAttribute('in2','mask');
        feComposite.setAttribute('operator','in');
        expansor.appendChild(feComposite);
        var feBlend = createNS('feBlend');
        feBlend.setAttribute('in','SourceGraphic');
        feBlend.setAttribute('in2','drop');
        feBlend.setAttribute('mode','normal');
        expansor.appendChild(feBlend);
        this.globalData.defs.appendChild(expansor);
        var cont = createNS('g');
        if(this.layerElement === this.parentContainer){
            this.layerElement = cont;
        }else{
            cont.appendChild(this.layerElement);
        }
        cont.setAttribute('filter','url(#'+filterID+')');
        if(this.data.td){
            cont.setAttribute('data-td',this.data.td);
        }
        if(this.data.td == 3){
            this.globalData.defs.appendChild(cont);
        }else if(this.data.td == 2){
            maskGrouper.appendChild(cont);
        }else if(this.data.td == 1){
            masker.appendChild(cont);
        }else{
            if(this.data.hasMask && this.data.tt){
                this.matteElement.appendChild(cont);
            }else{
                this.appendNodeToParent(cont);
            }
        }
    }*/
    if(this.data.ef){
        this.effectsManager = new SVGEffects(this);
    }
    this.checkParenting();
};


SVGBaseElement.prototype.setBlendMode = BaseElement.prototype.setBlendMode;

SVGBaseElement.prototype.renderFrame = function(parentTransform){
    if(this.data.ty === 3 || this.data.hd || !this.isVisible){
        return false;
    }

    this.lastNum = this.currentFrameNum;
    this.finalTransform.opMdf = this.firstFrame || this.finalTransform.op.mdf;
    this.finalTransform.matMdf = this.firstFrame || this.finalTransform.mProp.mdf;
    this.finalTransform.opacity = this.finalTransform.op.v;

    var mat;
    var finalMat = this.finalTransform.mat;

    if(this.hierarchy){
        var i = 0, len = this.hierarchy.length;
        if(!this.finalTransform.matMdf) {
            while(i < len) {
                if(this.hierarchy[i].finalTransform.mProp.mdf) {
                    this.finalTransform.matMdf = true;
                    break;
                }
                i += 1;
            }
        }
        
        if(this.finalTransform.matMdf) {
            mat = this.finalTransform.mProp.v.props;
            finalMat.cloneFromProps(mat);
            for(i=0;i<len;i+=1){
                mat = this.hierarchy[i].finalTransform.mProp.v.props;
                finalMat.transform(mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],mat[12],mat[13],mat[14],mat[15]);
            }
        }
        
    }else if(this.isVisible){
        finalMat = this.finalTransform.mProp.v;
    }
    if(this.finalTransform.matMdf && this.layerElement){
        this.transformedElement.setAttribute('transform',finalMat.to2dCSS());
    }
    if(this.finalTransform.opMdf && this.layerElement){
        if(this.finalTransform.op.v <= 0) {
            if(!this.isTransparent && this.globalData.renderConfig.hideOnTransparent){
                this.isTransparent = true;
                this.hide();
            }
        } else if(this.hidden && this.isTransparent){
            this.isTransparent = false;
            this.show();
        }
        this.transformedElement.setAttribute('opacity',this.finalTransform.op.v);
    }

    if(this.data.hasMask){
        this.maskManager.renderFrame(finalMat);
    }
    if(this.effectsManager){
        this.effectsManager.renderFrame(this.firstFrame);
    }
    return this.isVisible;
};

SVGBaseElement.prototype.destroy = function(){
    this.layerElement = null;
    this.parentContainer = null;
    if(this.matteElement) {
        this.matteElement = null;
    }
    if(this.maskManager) {
        this.maskManager.destroy();
    }
};

SVGBaseElement.prototype.getBaseElement = function(){
    return this.baseElement;
};
SVGBaseElement.prototype.addMasks = function(data){
    this.maskManager = new MaskElement(data,this,this.globalData);
};

SVGBaseElement.prototype.setMatte = function(id){
    if(!this.matteElement){
        return;
    }
    this.matteElement.setAttribute("mask", "url(" + locationHref + "#" + id + ")");
};

SVGBaseElement.prototype.hide = function(){
    if(!this.hidden){
        this.layerElement.style.display = 'none';
        this.hidden = true;
    }
};

SVGBaseElement.prototype.show = function(){
    if(this.isVisible && !this.isTransparent){
        this.hidden = false;
        this.layerElement.style.display = 'block';
    }
};

function IShapeElement(data,parentContainer,globalData,comp, placeholder){
    this.shapes = [];
    this.shapesData = data.shapes;
    this.stylesList = [];
    this.itemsData = [];
    this.prevViewData = [];
    this.shapeModifiers = [];
    this.processedElements = [];
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(SVGBaseElement, IShapeElement);

IShapeElement.prototype.identityMatrix = new Matrix();

IShapeElement.prototype.lcEnum = {
    '1': 'butt',
    '2': 'round',
    '3': 'square'
}

IShapeElement.prototype.ljEnum = {
    '1': 'miter',
    '2': 'round',
    '3': 'butt'
}

IShapeElement.prototype.searchProcessedElement = function(elem){
    var i = this.processedElements.length;
    while(i){
        i -= 1;
        if(this.processedElements[i].elem === elem){
            return this.processedElements[i].pos;
        }
    }
    return 0;
};

IShapeElement.prototype.addProcessedElement = function(elem, pos){
    var i = this.processedElements.length;
    while(i){
        i -= 1;
        if(this.processedElements[i].elem === elem){
            this.processedElements[i].pos = pos;
            break;
        }
    }
    if(i === 0){
        this.processedElements.push({
            elem: elem,
            pos: pos
        })
    }
};

IShapeElement.prototype.buildExpressionInterface = function(){};

IShapeElement.prototype.createElements = function(){
    //TODO check if I can use symbol so i can set its viewBox
    this._parent.createElements.call(this);
    this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.layerElement,this.dynamicProperties, 0, [], true);
    if(!this.data.hd || this.data.td){
        styleUnselectableDiv(this.layerElement);
    }
};

IShapeElement.prototype.setGradientData = function(pathElement,arr,data){

    var gradientId = 'gr_'+randomString(10);
    var gfill;
    if(arr.t === 1){
        gfill = createNS('linearGradient');
    } else {
        gfill = createNS('radialGradient');
    }
    gfill.setAttribute('id',gradientId);
    gfill.setAttribute('spreadMethod','pad');
    gfill.setAttribute('gradientUnits','userSpaceOnUse');
    var stops = [];
    var stop, j, jLen;
    jLen = arr.g.p*4;
    for(j=0;j<jLen;j+=4){
        stop = createNS('stop');
        gfill.appendChild(stop);
        stops.push(stop);
    }
    pathElement.setAttribute( arr.ty === 'gf' ? 'fill':'stroke','url(#'+gradientId+')');
    this.globalData.defs.appendChild(gfill);
    data.gf = gfill;
    data.cst = stops;
}

IShapeElement.prototype.setGradientOpacity = function(arr, data, styleOb){
    if((arr.g.k.k[0].s && arr.g.k.k[0].s.length > arr.g.p*4) || arr.g.k.k.length > arr.g.p*4){
        var opFill;
        var stop, j, jLen;
        var mask = createNS("mask");
        var maskElement = createNS( 'path');
        mask.appendChild(maskElement);
        var opacityId = 'op_'+randomString(10);
        var maskId = 'mk_'+randomString(10);
        mask.setAttribute('id',maskId);
        if(arr.t === 1){
            opFill = createNS('linearGradient');
        } else {
            opFill = createNS('radialGradient');
        }
        opFill.setAttribute('id',opacityId);
        opFill.setAttribute('spreadMethod','pad');
        opFill.setAttribute('gradientUnits','userSpaceOnUse');
        jLen = arr.g.k.k[0].s ? arr.g.k.k[0].s.length : arr.g.k.k.length;
        var stops = [];
        for(j=arr.g.p*4;j<jLen;j+=2){
            stop = createNS('stop');
            stop.setAttribute('stop-color','rgb(255,255,255)');
            //stop.setAttribute('offset',Math.round(arr.y[j][0]*100)+'%');
            //stop.setAttribute('style','stop-color:rgb(255,255,255);stop-opacity:'+arr.y[j][1]);
            opFill.appendChild(stop);
            stops.push(stop);
        }
        maskElement.setAttribute( arr.ty === 'gf' ? 'fill':'stroke','url(#'+opacityId+')');
        this.globalData.defs.appendChild(opFill);
        this.globalData.defs.appendChild(mask);
        data.of = opFill;
        data.ost = stops;
        styleOb.msElem = maskElement;
        return maskId;
    }
};

IShapeElement.prototype.createStyleElement = function(data, level, dynamicProperties){
    var elementData = {
    };
    var styleOb = {
        data: data,
        type: data.ty,
        d: '',
        ld: '',
        lvl: level,
        mdf: false,
        closed: false
    };
    var pathElement = createNS( "path");
    elementData.o = PropertyFactory.getProp(this,data.o,0,0.01,dynamicProperties);
    if(data.ty == 'st' || data.ty == 'gs') {
        pathElement.setAttribute('stroke-linecap', this.lcEnum[data.lc] || 'round');
        ////pathElement.style.strokeLinecap = this.lcEnum[data.lc] || 'round';
        pathElement.setAttribute('stroke-linejoin',this.ljEnum[data.lj] || 'round');
        ////pathElement.style.strokeLinejoin = this.ljEnum[data.lj] || 'round';
        pathElement.setAttribute('fill-opacity','0');
        ////pathElement.style.fillOpacity = 0;
        if(data.lj == 1) {
            pathElement.setAttribute('stroke-miterlimit',data.ml);
            ////pathElement.style.strokeMiterlimit = data.ml;
        }

        elementData.w = PropertyFactory.getProp(this,data.w,0,null,dynamicProperties);
        if(data.d){
            var d = new DashProperty(this,data.d,'svg',dynamicProperties);
            if(!d.k){
                pathElement.setAttribute('stroke-dasharray', d.dasharray);
                ////pathElement.style.strokeDasharray = d.dasharray;
                pathElement.setAttribute('stroke-dashoffset', d.dashoffset[0]);
                ////pathElement.style.strokeDashoffset = d.dashoffset;
            }
            elementData.d = d;
        }

    }
    if(data.ty == 'fl' || data.ty == 'st'){
        elementData.c = PropertyFactory.getProp(this,data.c,1,255,dynamicProperties);
    } else {
        elementData.g = new GradientProperty(this,data.g,dynamicProperties);
        if(data.t == 2){
            elementData.h = PropertyFactory.getProp(this,data.h,0,0.01,dynamicProperties);
            elementData.a = PropertyFactory.getProp(this,data.a,0,degToRads,dynamicProperties);
        }
        elementData.s = PropertyFactory.getProp(this,data.s,1,null,dynamicProperties);
        elementData.e = PropertyFactory.getProp(this,data.e,1,null,dynamicProperties);
        this.setGradientData(pathElement,data,elementData, styleOb);
        var maskId = this.setGradientOpacity(data,elementData, styleOb);
        if(maskId){
            pathElement.setAttribute('mask','url(#'+maskId+')');
        }
    }
    elementData.elem = pathElement;
    //container.appendChild(pathElement);
    if(data.r === 2) {
        pathElement.setAttribute('fill-rule', 'evenodd');
    }

    if(data.ln){
        pathElement.setAttribute('id',data.ln);
    }
    if(data.cl){
        pathElement.setAttribute('class',data.cl);
    }
    styleOb.pElem = pathElement;
    this.stylesList.push(styleOb);
    elementData.style = styleOb;
    return elementData;
}

IShapeElement.prototype.createGroupElement = function(data) {
    var elementData = {
        it: [],
        prevViewData: []
    };
    var g = createNS('g');
    elementData.gr = g;
    if(data.ln){
        elementData.gr.setAttribute('id',data.ln);
    }
    return elementData;
}

IShapeElement.prototype.createTransformElement = function(data, dynamicProperties) {
    var elementData = {
        transform : {
            op: PropertyFactory.getProp(this,data.o,0,0.01,dynamicProperties),
            mProps: TransformPropertyFactory.getTransformProperty(this,data,dynamicProperties)
            //mProps: PropertyFactory.getProp(this,data,2,null,dynamicProperties)
        },
        elements: []
    };
    return elementData;
}

IShapeElement.prototype.createShapeElement = function(data, ownTransformers, level, dynamicProperties) {
    var elementData = {
        elements : [],
        caches:[],
        styles : [],
        transformers: ownTransformers,
        lStr: ''
    };
    var ty = 4;
    if(data.ty == 'rc'){
        ty = 5;
    }else if(data.ty == 'el'){
        ty = 6;
    }else if(data.ty == 'sr'){
        ty = 7;
    }
    elementData.sh = ShapePropertyFactory.getShapeProp(this,data,ty,dynamicProperties);
    elementData.lvl = level;
    this.shapes.push(elementData.sh);
    this.addShapeToModifiers(elementData);
    return elementData;
}

var cont = 0;

IShapeElement.prototype.setElementStyles = function(){
    var j, jLen = this.stylesList.length;
    var arr = [];
    for(j=0;j<jLen;j+=1){
        if(!this.stylesList[j].closed){
            arr.push(this.stylesList[j]);
        }
    }
    return arr;
}

IShapeElement.prototype.reloadShapes = function(){
    this.firstFrame = true;
    var i, len = this.itemsData.length;
    for(i=0;i<len;i+=1){
        this.prevViewData[i] = this.itemsData[i];
    }
    this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.layerElement,this.dynamicProperties, 0, [], true);
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
    }
    this.renderModifiers();
}

IShapeElement.prototype.searchShapes = function(arr,itemsData,prevViewData,container,dynamicProperties, level, transformers, render){
    var ownTransformers = [].concat(transformers);
    var i, len = arr.length - 1;
    var j, jLen;
    var ownStyles = [], ownModifiers = [], styleOb, currentTransform, modifier, processedPos;
    for(i=len;i>=0;i-=1){
        processedPos = this.searchProcessedElement(arr[i]);
        if(!processedPos){
            arr[i]._render = render;
        } else {
            itemsData[i] = prevViewData[processedPos - 1];
        }
        if(arr[i].ty == 'fl' || arr[i].ty == 'st' || arr[i].ty == 'gf' || arr[i].ty == 'gs'){
            if(!processedPos){
                itemsData[i] = this.createStyleElement(arr[i], level, dynamicProperties);
            } else {
                itemsData[i].style.closed = false;
            }
            if(arr[i]._render){
                container.appendChild(itemsData[i].elem);
            }
            ownStyles.push(itemsData[i].style);
        }else if(arr[i].ty == 'gr'){
            if(!processedPos){
                itemsData[i] = this.createGroupElement(arr[i]);
            } else {
                jLen = itemsData[i].it.length;
                for(j=0;j<jLen;j+=1){
                    itemsData[i].prevViewData[j] = itemsData[i].it[j];
                }
            }
            this.searchShapes(arr[i].it,itemsData[i].it,itemsData[i].prevViewData,itemsData[i].gr,dynamicProperties, level + 1, ownTransformers, render);
            if(arr[i]._render){
                container.appendChild(itemsData[i].gr);
            }
        }else if(arr[i].ty == 'tr'){
            if(!processedPos){
                itemsData[i] = this.createTransformElement(arr[i], dynamicProperties);
            }
            currentTransform = itemsData[i].transform;
            ownTransformers.push(currentTransform);
        }else if(arr[i].ty == 'sh' || arr[i].ty == 'rc' || arr[i].ty == 'el' || arr[i].ty == 'sr'){
            if(!processedPos){
                itemsData[i] = this.createShapeElement(arr[i], ownTransformers, level, dynamicProperties);
            }
            itemsData[i].elements = this.setElementStyles();

        }else if(arr[i].ty == 'tm' || arr[i].ty == 'rd' || arr[i].ty == 'ms'){
            if(!processedPos){
                modifier = ShapeModifiers.getModifier(arr[i].ty);
                modifier.init(this,arr[i],dynamicProperties);
                itemsData[i] = modifier;
                this.shapeModifiers.push(modifier);
            } else {
                modifier = itemsData[i];
                modifier.closed = false;
            }
            ownModifiers.push(modifier);
        }else if(arr[i].ty == 'rp'){
            if(!processedPos){
                modifier = ShapeModifiers.getModifier(arr[i].ty);
                itemsData[i] = modifier;
                modifier.init(this,arr,i,itemsData,dynamicProperties);
                this.shapeModifiers.push(modifier);
                render = false;
            }else{
                modifier = itemsData[i];
                modifier.closed = true;
            }
            ownModifiers.push(modifier);
        }
        this.addProcessedElement(arr[i], i + 1);
    }
    len = ownStyles.length;
    for(i=0;i<len;i+=1){
        ownStyles[i].closed = true;
    }
    len = ownModifiers.length;
    for(i=0;i<len;i+=1){
        ownModifiers[i].closed = true;
    }
};

IShapeElement.prototype.addShapeToModifiers = function(data) {
    var i, len = this.shapeModifiers.length;
    for(i=0;i<len;i+=1){
        this.shapeModifiers[i].addShape(data);
    }
};

IShapeElement.prototype.renderModifiers = function() {
    if(!this.shapeModifiers.length){
        return;
    }
    var i, len = this.shapes.length;
    for(i=0;i<len;i+=1){
        this.shapes[i].reset();
    }


    len = this.shapeModifiers.length;

    for(i=len-1;i>=0;i-=1){
        this.shapeModifiers[i].processShapes(this.firstFrame);
    }
};

IShapeElement.prototype.renderFrame = function(parentMatrix){
    //this.reloadShapes();
    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    if(renderParent===false){
        this.hide();
        return;
    }
    if(this.hidden){
        this.layerElement.style.display = 'block';
        this.hidden = false;
    }
    this.renderModifiers();
    var i, len = this.stylesList.length;
    for(i=0;i<len;i+=1){
        this.stylesList[i].d = '';
        this.stylesList[i].mdf = false;
    }
    this.renderShape(this.shapesData,this.itemsData, null);

    for (i = 0; i < len; i += 1) {
        if (this.stylesList[i].ld === '0') {
            this.stylesList[i].ld = '1';
            this.stylesList[i].pElem.style.display = 'block';
            //this.stylesList[i].parent.appendChild(this.stylesList[i].pElem);
        }
        if (this.stylesList[i].mdf || this.firstFrame) {
            this.stylesList[i].pElem.setAttribute('d', this.stylesList[i].d || 'M0 0');
            if(this.stylesList[i].msElem){
                this.stylesList[i].msElem.setAttribute('d', this.stylesList[i].d);
            }
        }
    }
    if (this.firstFrame) {
        this.firstFrame = false;
    }
};

IShapeElement.prototype.hide = function(){
    if(!this.hidden){
        this.layerElement.style.display = 'none';
        var i, len = this.stylesList.length;
        for(i=len-1;i>=0;i-=1){
            if(this.stylesList[i].ld !== '0'){
                this.stylesList[i].ld = '0';
                this.stylesList[i].pElem.style.display = 'none';
                if(this.stylesList[i].pElem.parentNode){
                    this.stylesList[i].parent = this.stylesList[i].pElem.parentNode;
                    //this.stylesList[i].pElem.parentNode.removeChild(this.stylesList[i].pElem);
                }
            }
        }
        this.hidden = true;
    }
};

IShapeElement.prototype.renderShape = function(items,data, container){
    var i, len = items.length - 1;
    var ty;
    for(i=0;i<=len;i+=1){
        ty = items[i].ty;
        if(ty == 'tr'){
            if(this.firstFrame || data[i].transform.op.mdf && container){
                container.setAttribute('opacity',data[i].transform.op.v);
            }
            if(this.firstFrame || data[i].transform.mProps.mdf && container){
                container.setAttribute('transform',data[i].transform.mProps.v.to2dCSS());
            }
        }else if(ty == 'sh' || ty == 'el' || ty == 'rc' || ty == 'sr'){
            this.renderPath(items[i],data[i]);
        }else if(ty == 'fl'){
            this.renderFill(items[i],data[i]);
        }else if(ty == 'gf'){
            this.renderGradient(items[i],data[i]);
        }else if(ty == 'gs'){
            this.renderGradient(items[i],data[i]);
            this.renderStroke(items[i],data[i]);
        }else if(ty == 'st'){
            this.renderStroke(items[i],data[i]);
        }else if(ty == 'gr'){
            this.renderShape(items[i].it,data[i].it, data[i].gr);
        }else if(ty == 'tm'){
            //
        }
    }

};

IShapeElement.prototype.buildShapeString = function(pathNodes, length, closed, mat) {
    var i, shapeString = '';
    for(i = 1; i < length; i += 1) {
        if (i === 1) {
            shapeString += " M" + mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
        }
        shapeString += " C" + mat.applyToPointStringified(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1]) + " " + mat.applyToPointStringified(pathNodes.i[i][0], pathNodes.i[i][1]) + " " + mat.applyToPointStringified(pathNodes.v[i][0], pathNodes.v[i][1]);
    }
    if (length === 1) {
        shapeString += " M" + mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
    }
    if (closed && length) {
        shapeString += " C" + mat.applyToPointStringified(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1]) + " " + mat.applyToPointStringified(pathNodes.i[0][0], pathNodes.i[0][1]) + " " + mat.applyToPointStringified(pathNodes.v[0][0], pathNodes.v[0][1]);
        shapeString += 'z';
    }
    return shapeString;
};

IShapeElement.prototype.renderPath = function(pathData,itemData){
    var len, i, j, jLen,pathStringTransformed,redraw,pathNodes,l, mat, lLen = itemData.elements.length;
    var lvl = itemData.lvl;
    if(!pathData._render){
        return;
    }
    for(l=0;l<lLen;l+=1){
        if(itemData.elements[l].data._render){
            redraw = itemData.sh.mdf || this.firstFrame;
            //M0 0 is needed for IE and Edge bug. If it's missing, and shape has a mask with a gradient fill, it won't show up. :/
            //Removing it because it's causing issues with Chrome, and also it's probably better not to have it so the shape won't be larger than needed.
            //Keeping previous comment to try to find a solution.
            pathStringTransformed = '';
            var paths = itemData.sh.paths;
            jLen = paths._length;

            if(itemData.elements[l].lvl < lvl){
                mat = this.mHelper.reset();
                iterations = lvl - itemData.elements[l].lvl;
                k = itemData.transformers.length-1;
                while(iterations > 0) {
                    redraw = itemData.transformers[k].mProps.mdf || redraw;
                    props = itemData.transformers[k].mProps.v.props;
                    mat.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);
                    iterations --;
                    k --;
                }
            } else {
                mat = this.identityMatrix;
            }
            if(redraw){
                for(j=0;j<jLen;j+=1){
                    pathNodes = paths.shapes[j];
                    if(pathNodes && pathNodes._length){
                        pathStringTransformed += this.buildShapeString(pathNodes, pathNodes._length, pathNodes.c, mat);
                    }
                }
                itemData.caches[l] = pathStringTransformed;
            } else {
                pathStringTransformed = itemData.caches[l];
            }
            itemData.elements[l].d += pathStringTransformed;
            itemData.elements[l].mdf = redraw || itemData.elements[l].mdf;
        } else {
            itemData.elements[l].mdf = true;
        }
    }
};

IShapeElement.prototype.renderFill = function(styleData,itemData){
    var styleElem = itemData.style;

    if(itemData.c.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('fill','rgb('+bm_floor(itemData.c.v[0])+','+bm_floor(itemData.c.v[1])+','+bm_floor(itemData.c.v[2])+')');
        ////styleElem.pElem.style.fill = 'rgb('+bm_floor(itemData.c.v[0])+','+bm_floor(itemData.c.v[1])+','+bm_floor(itemData.c.v[2])+')';
    }
    if(itemData.o.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('fill-opacity',itemData.o.v);
    }
};

IShapeElement.prototype.renderGradient = function(styleData,itemData){
    var gfill = itemData.gf;
    var opFill = itemData.of;
    var pt1 = itemData.s.v,pt2 = itemData.e.v;

    if(itemData.o.mdf || this.firstFrame){
        var attr = styleData.ty === 'gf' ? 'fill-opacity':'stroke-opacity';
        itemData.elem.setAttribute(attr,itemData.o.v);
    }
    //clippedElement.setAttribute('transform','matrix(1,0,0,1,-100,0)');
    if(itemData.s.mdf || this.firstFrame){
        var attr1 = styleData.t === 1 ? 'x1':'cx';
        var attr2 = attr1 === 'x1' ? 'y1':'cy';
        gfill.setAttribute(attr1,pt1[0]);
        gfill.setAttribute(attr2,pt1[1]);
        if(opFill){
            opFill.setAttribute(attr1,pt1[0]);
            opFill.setAttribute(attr2,pt1[1]);
        }
    }
    var stops, i, len, stop;
    if(itemData.g.cmdf || this.firstFrame){
        stops = itemData.cst;
        var cValues = itemData.g.c;
        len = stops.length;
        for(i=0;i<len;i+=1){
            stop = stops[i];
            stop.setAttribute('offset',cValues[i*4]+'%');
            stop.setAttribute('stop-color','rgb('+cValues[i*4+1]+','+cValues[i*4+2]+','+cValues[i*4+3]+')');
        }
    }
    if(opFill && (itemData.g.omdf || this.firstFrame)){
        stops = itemData.ost;
        var oValues = itemData.g.o;
        len = stops.length;
        for(i=0;i<len;i+=1){
            stop = stops[i];
            stop.setAttribute('offset',oValues[i*2]+'%');
            stop.setAttribute('stop-opacity',oValues[i*2+1]);
        }
    }
    if(styleData.t === 1){
        if(itemData.e.mdf  || this.firstFrame){
            gfill.setAttribute('x2',pt2[0]);
            gfill.setAttribute('y2',pt2[1]);
            if(opFill){
                opFill.setAttribute('x2',pt2[0]);
                opFill.setAttribute('y2',pt2[1]);
            }
        }
    } else {
        var rad;
        if(itemData.s.mdf || itemData.e.mdf || this.firstFrame){
            rad = Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));
            gfill.setAttribute('r',rad);
            if(opFill){
                opFill.setAttribute('r',rad);
            }
        }
        if(itemData.e.mdf || itemData.h.mdf || itemData.a.mdf || this.firstFrame){
            if(!rad){
                rad = Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));
            }
            var ang = Math.atan2(pt2[1]-pt1[1], pt2[0]-pt1[0]);

            var percent = itemData.h.v >= 1 ? 0.99 : itemData.h.v <= -1 ? -0.99:itemData.h.v;
            var dist = rad*percent;
            var x = Math.cos(ang + itemData.a.v)*dist + pt1[0];
            var y = Math.sin(ang + itemData.a.v)*dist + pt1[1];
            gfill.setAttribute('fx',x);
            gfill.setAttribute('fy',y);
            if(opFill){
                opFill.setAttribute('fx',x);
                opFill.setAttribute('fy',y);
            }
        }
        //gfill.setAttribute('fy','200');
    }
};

IShapeElement.prototype.renderStroke = function(styleData,itemData){
    var styleElem = itemData.style;
    var d = itemData.d;
    if(d && (d.mdf || this.firstFrame)){
        styleElem.pElem.setAttribute('stroke-dasharray', d.dashStr);
        styleElem.pElem.setAttribute('stroke-dashoffset', d.dashoffset[0]);
    }
    if(itemData.c && (itemData.c.mdf || this.firstFrame)){
        styleElem.pElem.setAttribute('stroke','rgb('+bm_floor(itemData.c.v[0])+','+bm_floor(itemData.c.v[1])+','+bm_floor(itemData.c.v[2])+')');
    }
    if(itemData.o.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('stroke-opacity',itemData.o.v);
    }
    if(itemData.w.mdf || this.firstFrame){
        styleElem.pElem.setAttribute('stroke-width',itemData.w.v);
        if(styleElem.msElem){
            styleElem.msElem.setAttribute('stroke-width',itemData.w.v);
        }
    }
};

IShapeElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
    this.shapeData = null;
    this.itemsData = null;
    this.parentContainer = null;
    this.placeholder = null;
};

function ITextElement(data, animationItem,parentContainer,globalData){
}
ITextElement.prototype.init = function(){
    this.lettersChangedFlag = true;
    this.dynamicProperties = this.dynamicProperties || [];
    this.textAnimator = new TextAnimatorProperty(this.data.t, this.renderType, this);
    this.textProperty = new TextProperty(this, this.data.t, this.dynamicProperties);
    this._parent.init.call(this);
    this.textAnimator.searchProperties(this.dynamicProperties);
};

ITextElement.prototype.prepareFrame = function(num) {
    this._parent.prepareFrame.call(this, num);
    if(this.textProperty.mdf || this.textProperty.firstFrame) {
        this.buildNewText();
        this.textProperty.firstFrame = false;
    }
}

ITextElement.prototype.createPathShape = function(matrixHelper, shapes) {
    var j,jLen = shapes.length;
    var k, kLen, pathNodes;
    var shapeStr = '';
    for(j=0;j<jLen;j+=1){
        pathNodes = shapes[j].ks.k;
        shapeStr += this.buildShapeString(pathNodes, pathNodes.i.length, true, matrixHelper);
    }
    return shapeStr;
};

ITextElement.prototype.updateDocumentData = function(newData, index) {
    this.textProperty.updateDocumentData(newData, index);
}

ITextElement.prototype.applyTextPropertiesToMatrix = function(documentData, matrixHelper, lineNumber, xPos, yPos) {
    if(documentData.ps){
        matrixHelper.translate(documentData.ps[0],documentData.ps[1] + documentData.ascent,0);
    }
    matrixHelper.translate(0,-documentData.ls,0);
    switch(documentData.j){
        case 1:
            matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[lineNumber]),0,0);
            break;
        case 2:
            matrixHelper.translate(documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[lineNumber] )/2,0,0);
            break;
    }
    matrixHelper.translate(xPos, yPos, 0);
}

ITextElement.prototype.buildColor = function(colorData) {
    return 'rgb(' + Math.round(colorData[0]*255) + ',' + Math.round(colorData[1]*255) + ',' + Math.round(colorData[2]*255) + ')';
}

ITextElement.prototype.buildShapeString = IShapeElement.prototype.buildShapeString;

ITextElement.prototype.emptyProp = new LetterProps();

ITextElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
};
function SVGTextElement(data,parentContainer,globalData,comp, placeholder){
    this.textSpans = [];
    this.renderType = 'svg';
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(SVGBaseElement, SVGTextElement);

extendPrototype(ITextElement, SVGTextElement);

SVGTextElement.prototype.createElements = function(){

    this._parent.createElements.call(this);


    if(this.data.ln){
        this.layerElement.setAttribute('id',this.data.ln);
    }
    if(this.data.cl){
        this.layerElement.setAttribute('class',this.data.cl);
    }
    if (this.data.singleShape && !this.globalData.fontManager.chars) {
        this.textContainer = createNS('text');
    }
};

SVGTextElement.prototype.buildNewText = function(){
    var i, len;

    var documentData = this.textProperty.currentData;
    this.renderedLetters = Array.apply(null,{length:documentData ? documentData.l.length : 0});
    if(documentData.fc) {
        this.layerElement.setAttribute('fill', this.buildColor(documentData.fc));
    }else{
        this.layerElement.setAttribute('fill', 'rgba(0,0,0,0)');
    }
    if(documentData.sc){
        this.layerElement.setAttribute('stroke', this.buildColor(documentData.sc));
        this.layerElement.setAttribute('stroke-width', documentData.sw);
    }
    this.layerElement.setAttribute('font-size', documentData.s);
    var fontData = this.globalData.fontManager.getFontByName(documentData.f);
    if(fontData.fClass){
        this.layerElement.setAttribute('class',fontData.fClass);
    } else {
        this.layerElement.setAttribute('font-family', fontData.fFamily);
        var fWeight = documentData.fWeight, fStyle = documentData.fStyle;
        this.layerElement.setAttribute('font-style', fStyle);
        this.layerElement.setAttribute('font-weight', fWeight);
    }

    var letters = documentData.l || [];
    var usesGlyphs = this.globalData.fontManager.chars;
    len = letters.length;
    if(!len){
        return;
    }
    var tSpan;
    var matrixHelper = this.mHelper;
    var shapes, shapeStr = '', singleShape = this.data.singleShape;
    var xPos = 0, yPos = 0, firstLine = true;
    var trackingOffset = documentData.tr/1000*documentData.s;
    if(singleShape && !usesGlyphs) {
        var tElement = this.textContainer;
        var justify = '';
        switch(documentData.j) {
            case 1:
                justify = 'end';
                break;
            case 2:
                justify = 'middle';
                break;
            case 2:
                justify = 'start';
                break;
        }
        tElement.setAttribute('text-anchor',justify);
        tElement.setAttribute('letter-spacing',trackingOffset);
        var textContent = documentData.t.split(String.fromCharCode(13));
        len = textContent.length;
        var yPos = documentData.ps ? documentData.ps[1] + documentData.ascent : 0;
        for ( i = 0; i < len; i += 1) {
            tSpan = this.textSpans[i] || createNS('tspan');
            tSpan.textContent = textContent[i];
            tSpan.setAttribute('x', 0);
            tSpan.setAttribute('y', yPos);
            tSpan.style.display = 'inherit';
            tElement.appendChild(tSpan);
            this.textSpans[i] = tSpan;
            yPos += documentData.lh;
        }
        
        this.layerElement.appendChild(tElement);
    } else {
        var cachedSpansLength = this.textSpans.length;
        var shapeData, charData;
        for (i = 0; i < len; i += 1) {
            if(!usesGlyphs || !singleShape || i === 0){
                tSpan = cachedSpansLength > i ? this.textSpans[i] : createNS(usesGlyphs?'path':'text');
                if (cachedSpansLength <= i) {
                    tSpan.setAttribute('stroke-linecap', 'butt');
                    tSpan.setAttribute('stroke-linejoin','round');
                    tSpan.setAttribute('stroke-miterlimit','4');
                    this.textSpans[i] = tSpan;
                    this.layerElement.appendChild(tSpan);
                }
                tSpan.style.display = 'inherit';
            }
            
            matrixHelper.reset();
            if(usesGlyphs) {
                matrixHelper.scale(documentData.s / 100, documentData.s / 100);
                if (singleShape) {
                    if(letters[i].n) {
                        xPos = -trackingOffset;
                        yPos += documentData.yOffset;
                        yPos += firstLine ? 1 : 0;
                        firstLine = false;
                    }
                    this.applyTextPropertiesToMatrix(documentData, matrixHelper, letters[i].line, xPos, yPos);
                    xPos += letters[i].l || 0;
                    //xPos += letters[i].val === ' ' ? 0 : trackingOffset;
                    xPos += trackingOffset;
                }
                charData = this.globalData.fontManager.getCharData(documentData.t.charAt(i), fontData.fStyle, this.globalData.fontManager.getFontByName(documentData.f).fFamily);
                shapeData = charData && charData.data || {};
                shapes = shapeData.shapes ? shapeData.shapes[0].it : [];
                if(!singleShape){
                    tSpan.setAttribute('d',this.createPathShape(matrixHelper,shapes));
                } else {
                    shapeStr += this.createPathShape(matrixHelper,shapes);
                }
            } else {
                tSpan.textContent = letters[i].val;
                tSpan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve");
            }
            //
        }
        if (singleShape) {
            tSpan.setAttribute('d',shapeStr);
        }
    }
    while (i < this.textSpans.length){
        this.textSpans[i].style.display = 'none';
        i += 1;
    }
    
    this._sizeChanged = true;
}

SVGTextElement.prototype.sourceRectAtTime = function(time){
    this.prepareFrame(this.comp.renderedFrame - this.data.st);
    this.renderLetters();
    if(this._sizeChanged){
        this._sizeChanged = false;
        var textBox = this.layerElement.getBBox();
        this.bbox = {
            top: textBox.y,
            left: textBox.x,
            width: textBox.width,
            height: textBox.height
        }
    }
    return this.bbox;
}

SVGTextElement.prototype.renderLetters = function(){

    if(!this.data.singleShape){
        this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
        if(this.lettersChangedFlag || this.textAnimator.lettersChangedFlag){
            this._sizeChanged = true;
            var  i,len;
            var renderedLetters = this.textAnimator.renderedLetters;

            var letters = this.textProperty.currentData.l;

            len = letters.length;
            var renderedLetter, textSpan;
            for(i=0;i<len;i+=1){
                if(letters[i].n){
                    continue;
                }
                renderedLetter = renderedLetters[i];
                textSpan = this.textSpans[i];
                if(renderedLetter.mdf.m) {
                    textSpan.setAttribute('transform',renderedLetter.m);
                }
                if(renderedLetter.mdf.o) {
                    textSpan.setAttribute('opacity',renderedLetter.o);
                }
                if(renderedLetter.mdf.sw){
                    textSpan.setAttribute('stroke-width',renderedLetter.sw);
                }
                if(renderedLetter.mdf.sc){
                    textSpan.setAttribute('stroke',renderedLetter.sc);
                }
                if(renderedLetter.mdf.fc){
                    textSpan.setAttribute('fill',renderedLetter.fc);
                }
            }
        }
    }
}

SVGTextElement.prototype.renderFrame = function(parentMatrix){

    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    if(renderParent===false){
        this.hide();
        return;
    }
    if(this.hidden){
        this.show();
    }
    if(this.firstFrame) {
        this.firstFrame = false;
    }
    this.renderLetters();
}
function SVGTintFilter(filter, filterManager){
    this.filterManager = filterManager;
    var feColorMatrix = createNS('feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','linearRGB');
    feColorMatrix.setAttribute('values','0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0');
    feColorMatrix.setAttribute('result','f1');
    filter.appendChild(feColorMatrix);
    feColorMatrix = createNS('feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
    feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    feColorMatrix.setAttribute('result','f2');
    filter.appendChild(feColorMatrix);
    this.matrixFilter = feColorMatrix;
    if(filterManager.effectElements[2].p.v !== 100 || filterManager.effectElements[2].p.k){
        var feMerge = createNS('feMerge');
        filter.appendChild(feMerge);
        var feMergeNode;
        feMergeNode = createNS('feMergeNode');
        feMergeNode.setAttribute('in','SourceGraphic');
        feMerge.appendChild(feMergeNode);
        feMergeNode = createNS('feMergeNode');
        feMergeNode.setAttribute('in','f2');
        feMerge.appendChild(feMergeNode);
    }
}

SVGTintFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var colorBlack = this.filterManager.effectElements[0].p.v;
        var colorWhite = this.filterManager.effectElements[1].p.v;
        var opacity = this.filterManager.effectElements[2].p.v/100;
        this.matrixFilter.setAttribute('values',(colorWhite[0]- colorBlack[0])+' 0 0 0 '+ colorBlack[0] +' '+ (colorWhite[1]- colorBlack[1]) +' 0 0 0 '+ colorBlack[1] +' '+ (colorWhite[2]- colorBlack[2]) +' 0 0 0 '+ colorBlack[2] +' 0 0 0 ' + opacity + ' 0');
    }
};
function SVGFillFilter(filter, filterManager){
    this.filterManager = filterManager;
    var feColorMatrix = createNS('feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','sRGB');
    feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    filter.appendChild(feColorMatrix);
    this.matrixFilter = feColorMatrix;
}
SVGFillFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var color = this.filterManager.effectElements[2].p.v;
        var opacity = this.filterManager.effectElements[6].p.v;
        this.matrixFilter.setAttribute('values','0 0 0 0 '+color[0]+' 0 0 0 0 '+color[1]+' 0 0 0 0 '+color[2]+' 0 0 0 '+opacity+' 0');
    }
};
function SVGStrokeEffect(elem, filterManager){
    this.initialized = false;
    this.filterManager = filterManager;
    this.elem = elem;
    this.paths = [];
}

SVGStrokeEffect.prototype.initialize = function(){

    var elemChildren = this.elem.layerElement.children || this.elem.layerElement.childNodes;
    var path,groupPath, i, len;
    if(this.filterManager.effectElements[1].p.v === 1){
        len = this.elem.maskManager.masksProperties.length;
        i = 0;
    } else {
        i = this.filterManager.effectElements[0].p.v - 1;
        len = i + 1;
    }
    groupPath = createNS('g'); 
    groupPath.setAttribute('fill','none');
    groupPath.setAttribute('stroke-linecap','round');
    groupPath.setAttribute('stroke-dashoffset',1);
    for(i;i<len;i+=1){
        path = createNS('path');
        groupPath.appendChild(path);
        this.paths.push({p:path,m:i});
    }
    if(this.filterManager.effectElements[10].p.v === 3){
        var mask = createNS('mask');
        var id = 'stms_' + randomString(10);
        mask.setAttribute('id',id);
        mask.setAttribute('mask-type','alpha');
        mask.appendChild(groupPath);
        this.elem.globalData.defs.appendChild(mask);
        var g = createNS('g');
        g.setAttribute('mask','url(' + locationHref + '#'+id+')');
        if(elemChildren[0]){
            g.appendChild(elemChildren[0]);
        }
        this.elem.layerElement.appendChild(g);
        this.masker = mask;
        groupPath.setAttribute('stroke','#fff');
    } else if(this.filterManager.effectElements[10].p.v === 1 || this.filterManager.effectElements[10].p.v === 2){
        if(this.filterManager.effectElements[10].p.v === 2){
            var elemChildren = this.elem.layerElement.children || this.elem.layerElement.childNodes;
            while(elemChildren.length){
                this.elem.layerElement.removeChild(elemChildren[0]);
            }
        }
        this.elem.layerElement.appendChild(groupPath);
        this.elem.layerElement.removeAttribute('mask');
        groupPath.setAttribute('stroke','#fff');
    }
    this.initialized = true;
    this.pathMasker = groupPath;
}

SVGStrokeEffect.prototype.renderFrame = function(forceRender){
    if(!this.initialized){
        this.initialize();
    }
    var i, len = this.paths.length;
    var mask, path;
    for(i=0;i<len;i+=1){
        mask = this.elem.maskManager.viewData[this.paths[i].m];
        path = this.paths[i].p;
        if(forceRender || this.filterManager.mdf || mask.prop.mdf){
            path.setAttribute('d',mask.lastPath);
        }
        if(forceRender || this.filterManager.effectElements[9].p.mdf || this.filterManager.effectElements[4].p.mdf || this.filterManager.effectElements[7].p.mdf || this.filterManager.effectElements[8].p.mdf || mask.prop.mdf){
            var dasharrayValue;
            if(this.filterManager.effectElements[7].p.v !== 0 || this.filterManager.effectElements[8].p.v !== 100){
                var s = Math.min(this.filterManager.effectElements[7].p.v,this.filterManager.effectElements[8].p.v)/100;
                var e = Math.max(this.filterManager.effectElements[7].p.v,this.filterManager.effectElements[8].p.v)/100;
                var l = path.getTotalLength();
                dasharrayValue = '0 0 0 ' + l*s + ' ';
                var lineLength = l*(e-s);
                var segment = 1+this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v/100;
                var units = Math.floor(lineLength/segment);
                var j;
                for(j=0;j<units;j+=1){
                    dasharrayValue += '1 ' + this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v/100 + ' ';
                }
                dasharrayValue += '0 ' + l*10 + ' 0 0';
            } else {
                dasharrayValue = '1 ' + this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v/100;
            }
            path.setAttribute('stroke-dasharray',dasharrayValue);
        }
    }
    if(forceRender || this.filterManager.effectElements[4].p.mdf){
        this.pathMasker.setAttribute('stroke-width',this.filterManager.effectElements[4].p.v*2);
    }
    
    if(forceRender || this.filterManager.effectElements[6].p.mdf){
        this.pathMasker.setAttribute('opacity',this.filterManager.effectElements[6].p.v);
    }
    if(this.filterManager.effectElements[10].p.v === 1 || this.filterManager.effectElements[10].p.v === 2){
        if(forceRender || this.filterManager.effectElements[3].p.mdf){
            var color = this.filterManager.effectElements[3].p.v;
            this.pathMasker.setAttribute('stroke','rgb('+bm_floor(color[0]*255)+','+bm_floor(color[1]*255)+','+bm_floor(color[2]*255)+')');
        }
    }
};
function SVGTritoneFilter(filter, filterManager){
    this.filterManager = filterManager;
    var feColorMatrix = createNS('feColorMatrix');
    feColorMatrix.setAttribute('type','matrix');
    feColorMatrix.setAttribute('color-interpolation-filters','linearRGB');
    feColorMatrix.setAttribute('values','0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0');
    feColorMatrix.setAttribute('result','f1');
    filter.appendChild(feColorMatrix);
    var feComponentTransfer = createNS('feComponentTransfer');
    feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');
    filter.appendChild(feComponentTransfer);
    this.matrixFilter = feComponentTransfer;
    var feFuncR = createNS('feFuncR');
    feFuncR.setAttribute('type','table');
    feComponentTransfer.appendChild(feFuncR);
    this.feFuncR = feFuncR;
    var feFuncG = createNS('feFuncG');
    feFuncG.setAttribute('type','table');
    feComponentTransfer.appendChild(feFuncG);
    this.feFuncG = feFuncG;
    var feFuncB = createNS('feFuncB');
    feFuncB.setAttribute('type','table');
    feComponentTransfer.appendChild(feFuncB);
    this.feFuncB = feFuncB;
}

SVGTritoneFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var color1 = this.filterManager.effectElements[0].p.v;
        var color2 = this.filterManager.effectElements[1].p.v;
        var color3 = this.filterManager.effectElements[2].p.v;
        var tableR = color3[0] + ' ' + color2[0] + ' ' + color1[0]
        var tableG = color3[1] + ' ' + color2[1] + ' ' + color1[1]
        var tableB = color3[2] + ' ' + color2[2] + ' ' + color1[2]
        this.feFuncR.setAttribute('tableValues', tableR);
        this.feFuncG.setAttribute('tableValues', tableG);
        this.feFuncB.setAttribute('tableValues', tableB);
        //var opacity = this.filterManager.effectElements[2].p.v/100;
        //this.matrixFilter.setAttribute('values',(colorWhite[0]- colorBlack[0])+' 0 0 0 '+ colorBlack[0] +' '+ (colorWhite[1]- colorBlack[1]) +' 0 0 0 '+ colorBlack[1] +' '+ (colorWhite[2]- colorBlack[2]) +' 0 0 0 '+ colorBlack[2] +' 0 0 0 ' + opacity + ' 0');
    }
};
function SVGProLevelsFilter(filter, filterManager){
    this.filterManager = filterManager;
    var effectElements = this.filterManager.effectElements;
    var feComponentTransfer = createNS('feComponentTransfer');
    var feFuncR, feFuncG, feFuncB;
    
    if(effectElements[10].p.k || effectElements[10].p.v !== 0 || effectElements[11].p.k || effectElements[11].p.v !== 1 || effectElements[12].p.k || effectElements[12].p.v !== 1 || effectElements[13].p.k || effectElements[13].p.v !== 0 || effectElements[14].p.k || effectElements[14].p.v !== 1){
        this.feFuncR = this.createFeFunc('feFuncR', feComponentTransfer);
    }
    if(effectElements[17].p.k || effectElements[17].p.v !== 0 || effectElements[18].p.k || effectElements[18].p.v !== 1 || effectElements[19].p.k || effectElements[19].p.v !== 1 || effectElements[20].p.k || effectElements[20].p.v !== 0 || effectElements[21].p.k || effectElements[21].p.v !== 1){
        this.feFuncG = this.createFeFunc('feFuncG', feComponentTransfer);
    }
    if(effectElements[24].p.k || effectElements[24].p.v !== 0 || effectElements[25].p.k || effectElements[25].p.v !== 1 || effectElements[26].p.k || effectElements[26].p.v !== 1 || effectElements[27].p.k || effectElements[27].p.v !== 0 || effectElements[28].p.k || effectElements[28].p.v !== 1){
        this.feFuncB = this.createFeFunc('feFuncB', feComponentTransfer);
    }
    if(effectElements[31].p.k || effectElements[31].p.v !== 0 || effectElements[32].p.k || effectElements[32].p.v !== 1 || effectElements[33].p.k || effectElements[33].p.v !== 1 || effectElements[34].p.k || effectElements[34].p.v !== 0 || effectElements[35].p.k || effectElements[35].p.v !== 1){
        this.feFuncA = this.createFeFunc('feFuncA', feComponentTransfer);
    }
    
    if(this.feFuncR || this.feFuncG || this.feFuncB || this.feFuncA){
        feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');
        filter.appendChild(feComponentTransfer);
        feComponentTransfer = createNS('feComponentTransfer');
    }

    if(effectElements[3].p.k || effectElements[3].p.v !== 0 || effectElements[4].p.k || effectElements[4].p.v !== 1 || effectElements[5].p.k || effectElements[5].p.v !== 1 || effectElements[6].p.k || effectElements[6].p.v !== 0 || effectElements[7].p.k || effectElements[7].p.v !== 1){

        feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');
        filter.appendChild(feComponentTransfer);
        this.feFuncRComposed = this.createFeFunc('feFuncR', feComponentTransfer);
        this.feFuncGComposed = this.createFeFunc('feFuncG', feComponentTransfer);
        this.feFuncBComposed = this.createFeFunc('feFuncB', feComponentTransfer);
    }
}

SVGProLevelsFilter.prototype.createFeFunc = function(type, feComponentTransfer) {
    var feFunc = createNS(type);
    feFunc.setAttribute('type','table');
    feComponentTransfer.appendChild(feFunc);
    return feFunc;
};

SVGProLevelsFilter.prototype.getTableValue = function(inputBlack, inputWhite, gamma, outputBlack, outputWhite) {
    var cnt = 0;
    var segments = 256;
    var perc;
    var min = Math.min(inputBlack, inputWhite);
    var max = Math.max(inputBlack, inputWhite);
    var table = Array.call(null,{length:segments});
    var colorValue;
    var pos = 0;
    var outputDelta = outputWhite - outputBlack; 
    var inputDelta = inputWhite - inputBlack; 
    while(cnt <= 256) {
        perc = cnt/256;
        if(perc <= min){
            colorValue = inputDelta < 0 ? outputWhite : outputBlack;
        } else if(perc >= max){
            colorValue = inputDelta < 0 ? outputBlack : outputWhite;
        } else {
            colorValue = (outputBlack + outputDelta * Math.pow((perc - inputBlack) / inputDelta, 1 / gamma));
        }
        table[pos++] = colorValue;
        cnt += 256/(segments-1);
    }
    return table.join(' ');
};

SVGProLevelsFilter.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        var val, cnt, perc, bezier;
        var effectElements = this.filterManager.effectElements;
        if(this.feFuncRComposed && (forceRender || effectElements[3].p.mdf || effectElements[4].p.mdf || effectElements[5].p.mdf || effectElements[6].p.mdf || effectElements[7].p.mdf)){
            val = this.getTableValue(effectElements[3].p.v,effectElements[4].p.v,effectElements[5].p.v,effectElements[6].p.v,effectElements[7].p.v);
            this.feFuncRComposed.setAttribute('tableValues',val);
            this.feFuncGComposed.setAttribute('tableValues',val);
            this.feFuncBComposed.setAttribute('tableValues',val);
        }

        if(this.feFuncR && (forceRender || effectElements[10].p.mdf || effectElements[11].p.mdf || effectElements[12].p.mdf || effectElements[13].p.mdf || effectElements[14].p.mdf)){
            val = this.getTableValue(effectElements[10].p.v,effectElements[11].p.v,effectElements[12].p.v,effectElements[13].p.v,effectElements[14].p.v);
            this.feFuncR.setAttribute('tableValues',val);
        }

        if(this.feFuncG && (forceRender || effectElements[17].p.mdf || effectElements[18].p.mdf || effectElements[19].p.mdf || effectElements[20].p.mdf || effectElements[21].p.mdf)){
            val = this.getTableValue(effectElements[17].p.v,effectElements[18].p.v,effectElements[19].p.v,effectElements[20].p.v,effectElements[21].p.v);
            this.feFuncG.setAttribute('tableValues',val);
        }

        if(this.feFuncB && (forceRender || effectElements[24].p.mdf || effectElements[25].p.mdf || effectElements[26].p.mdf || effectElements[27].p.mdf || effectElements[28].p.mdf)){
            val = this.getTableValue(effectElements[24].p.v,effectElements[25].p.v,effectElements[26].p.v,effectElements[27].p.v,effectElements[28].p.v);
            this.feFuncB.setAttribute('tableValues',val);
        }

        if(this.feFuncA && (forceRender || effectElements[31].p.mdf || effectElements[32].p.mdf || effectElements[33].p.mdf || effectElements[34].p.mdf || effectElements[35].p.mdf)){
            val = this.getTableValue(effectElements[31].p.v,effectElements[32].p.v,effectElements[33].p.v,effectElements[34].p.v,effectElements[35].p.v);
            this.feFuncA.setAttribute('tableValues',val);
        }
        
    }
};
function SVGDropShadowEffect(filter, filterManager){
    /*<feGaussianBlur in="SourceAlpha" stdDeviation="3"/> <!-- stdDeviation is how much to blur -->
  <feOffset dx="2" dy="2" result="offsetblur"/> <!-- how much to offset -->
  <feMerge> 
    <feMergeNode/> <!-- this contains the offset blurred image -->
    <feMergeNode in="SourceGraphic"/> <!-- this contains the element that the filter is applied to -->
  </feMerge>*/
  /*<feFlood flood-color="#3D4574" flood-opacity="0.5" result="offsetColor"/>*/
    filter.setAttribute('x','-100%');
    filter.setAttribute('y','-100%');
    filter.setAttribute('width','400%');
    filter.setAttribute('height','400%');
    this.filterManager = filterManager;

    var feGaussianBlur = createNS('feGaussianBlur');
    feGaussianBlur.setAttribute('in','SourceAlpha');
    feGaussianBlur.setAttribute('result','drop_shadow_1');
    feGaussianBlur.setAttribute('stdDeviation','0');
    this.feGaussianBlur = feGaussianBlur;
    filter.appendChild(feGaussianBlur);

    var feOffset = createNS('feOffset');
    feOffset.setAttribute('dx','25');
    feOffset.setAttribute('dy','0');
    feOffset.setAttribute('in','drop_shadow_1');
    feOffset.setAttribute('result','drop_shadow_2');
    this.feOffset = feOffset;
    filter.appendChild(feOffset);
    var feFlood = createNS('feFlood');
    feFlood.setAttribute('flood-color','#00ff00');
    feFlood.setAttribute('flood-opacity','1');
    feFlood.setAttribute('result','drop_shadow_3');
    this.feFlood = feFlood;
    filter.appendChild(feFlood);

    var feComposite = createNS('feComposite');
    feComposite.setAttribute('in','drop_shadow_3');
    feComposite.setAttribute('in2','drop_shadow_2');
    feComposite.setAttribute('operator','in');
    feComposite.setAttribute('result','drop_shadow_4');
    filter.appendChild(feComposite);


    var feMerge = createNS('feMerge');
    filter.appendChild(feMerge);
    var feMergeNode;
    feMergeNode = createNS('feMergeNode');
    feMerge.appendChild(feMergeNode);
    feMergeNode = createNS('feMergeNode');
    feMergeNode.setAttribute('in','SourceGraphic');
    this.feMergeNode = feMergeNode;
    this.feMerge = feMerge;
    this.originalNodeAdded = false;
    feMerge.appendChild(feMergeNode);
}

SVGDropShadowEffect.prototype.renderFrame = function(forceRender){
    if(forceRender || this.filterManager.mdf){
        if(forceRender || this.filterManager.effectElements[4].p.mdf){
            this.feGaussianBlur.setAttribute('stdDeviation', this.filterManager.effectElements[4].p.v / 4);
        }
        if(forceRender || this.filterManager.effectElements[0].p.mdf){
            var col = this.filterManager.effectElements[0].p.v;
            this.feFlood.setAttribute('flood-color',rgbToHex(Math.round(col[0]*255),Math.round(col[1]*255),Math.round(col[2]*255)));
        }
        if(forceRender || this.filterManager.effectElements[1].p.mdf){
            this.feFlood.setAttribute('flood-opacity',this.filterManager.effectElements[1].p.v/255);
        }
        if(forceRender || this.filterManager.effectElements[2].p.mdf || this.filterManager.effectElements[3].p.mdf){
            var distance = this.filterManager.effectElements[3].p.v
            var angle = (this.filterManager.effectElements[2].p.v - 90) * degToRads
            var x = distance * Math.cos(angle)
            var y = distance * Math.sin(angle)
            this.feOffset.setAttribute('dx', x);
            this.feOffset.setAttribute('dy', y);
        }
        /*if(forceRender || this.filterManager.effectElements[5].p.mdf){
            if(this.filterManager.effectElements[5].p.v === 1 && this.originalNodeAdded) {
                this.feMerge.removeChild(this.feMergeNode);
                this.originalNodeAdded = false;
            } else if(this.filterManager.effectElements[5].p.v === 0 && !this.originalNodeAdded) {
                this.feMerge.appendChild(this.feMergeNode);
                this.originalNodeAdded = true;
            }
        }*/
    }
};
function SVGMatte3Effect(filterElem, filterManager, elem){
    this.initialized = false;
    this.filterManager = filterManager;
    this.filterElem = filterElem;
    this.elem = elem;
    elem.matteElement = createNS('g');
    elem.matteElement.appendChild(elem.layerElement);
    elem.matteElement.appendChild(elem.transformedElement);
    elem.baseElement = elem.matteElement;
}

SVGMatte3Effect.prototype.setElementAsMask = function(elem, mask) {
    var masker = createNS('mask');
    masker.setAttribute('id',mask.layerId);
    masker.setAttribute('mask-type','alpha');
    masker.appendChild(mask.layerElement);
    elem.setMatte(mask.layerId);
    mask.data.hd = false;
    var defs = elem.globalData.defs;
    defs.appendChild(masker);
}

SVGMatte3Effect.prototype.initialize = function() {
    var ind = this.filterManager.effectElements[0].p.v;
    var i = 0, len = this.elem.comp.elements.length;
    while(i < len) {
    	if(this.elem.comp.elements[i].data.ind === ind) {
    		this.setElementAsMask(this.elem, this.elem.comp.elements[i]);
    	}
    	i += 1;
    }
    this.initialized = true;
}

SVGMatte3Effect.prototype.renderFrame = function() {
	if(!this.initialized) {
		this.initialize();
	}
}
function SVGEffects(elem){
    var i, len = elem.data.ef.length;
    var filId = randomString(10);
    var fil = filtersFactory.createFilter(filId);
    var count = 0;
    this.filters = [];
    var filterManager;
    for(i=0;i<len;i+=1){
        if(elem.data.ef[i].ty === 20){
            count += 1;
            filterManager = new SVGTintFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 21){
            count += 1;
            filterManager = new SVGFillFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 22){
            filterManager = new SVGStrokeEffect(elem, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 23){
            count += 1;
            filterManager = new SVGTritoneFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 24){
            count += 1;
            filterManager = new SVGProLevelsFilter(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 25){
            count += 1;
            filterManager = new SVGDropShadowEffect(fil, elem.effects.effectElements[i]);
            this.filters.push(filterManager);
        }else if(elem.data.ef[i].ty === 28){
            //count += 1;
            filterManager = new SVGMatte3Effect(fil, elem.effects.effectElements[i], elem);
            this.filters.push(filterManager);
        }
    }
    if(count){
        elem.globalData.defs.appendChild(fil);
        elem.layerElement.setAttribute('filter','url(' + locationHref + '#'+filId+')');
    }
}

SVGEffects.prototype.renderFrame = function(firstFrame){
    var i, len = this.filters.length;
    for(i=0;i<len;i+=1){
        this.filters[i].renderFrame(firstFrame);
    }
};
function ICompElement(data,parentContainer,globalData,comp, placeholder){
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
    this.layers = data.layers;
    this.supports3d = true;
    this.completeLayers = false;
    this.pendingElements = [];
    this.elements = this.layers ? Array.apply(null,{length:this.layers.length}) : [];
    if(this.data.tm){
        this.tm = PropertyFactory.getProp(this,this.data.tm,0,globalData.frameRate,this.dynamicProperties);
    }
    if(this.data.xt){
        this.layerElement = createNS('g');
        this.buildAllItems();
    } else if(!globalData.progressiveLoad){
        this.buildAllItems();
    }
}
createElement(SVGBaseElement, ICompElement);

ICompElement.prototype.hide = function(){
    if(!this.hidden){
        this._parent.hide.call(this);
        var i,len = this.elements.length;
        for( i = 0; i < len; i+=1 ){
            if(this.elements[i]){
                this.elements[i].hide();
            }
        }
    }
};

ICompElement.prototype.prepareFrame = function(num){
    this._parent.prepareFrame.call(this,num);
    if(this.isVisible===false && !this.data.xt){
        return;
    }

    if(this.tm){
        var timeRemapped = this.tm.v;
        if(timeRemapped === this.data.op){
            timeRemapped = this.data.op - 1;
        }
        this.renderedFrame = timeRemapped;
    } else {
        this.renderedFrame = num/this.data.sr;
    }
    var i,len = this.elements.length;
    if(!this.completeLayers){
        this.checkLayers(this.renderedFrame);
    }
    for( i = 0; i < len; i+=1 ){
        if(this.completeLayers || this.elements[i]){
            this.elements[i].prepareFrame(this.renderedFrame - this.layers[i].st);
        }
    }
};

ICompElement.prototype.renderFrame = function(parentMatrix){
    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    var i,len = this.layers.length;
    if(renderParent===false){
        this.hide();
        return;
    }

    if(this.hidden) {
        this.show();
    }
    for( i = 0; i < len; i+=1 ){
        if(this.completeLayers || this.elements[i]){
            this.elements[i].renderFrame();
        }
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
};

ICompElement.prototype.setElements = function(elems){
    this.elements = elems;
};

ICompElement.prototype.getElements = function(){
    return this.elements;
};

ICompElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
    var i,len = this.layers.length;
    for( i = 0; i < len; i+=1 ){
        if(this.elements[i]){
            this.elements[i].destroy();
        }
    }
};

ICompElement.prototype.checkLayers = SVGRenderer.prototype.checkLayers;
ICompElement.prototype.buildItem = SVGRenderer.prototype.buildItem;
ICompElement.prototype.buildAllItems = SVGRenderer.prototype.buildAllItems;
ICompElement.prototype.buildElementParenting = SVGRenderer.prototype.buildElementParenting;
ICompElement.prototype.createItem = SVGRenderer.prototype.createItem;
ICompElement.prototype.createImage = SVGRenderer.prototype.createImage;
ICompElement.prototype.createComp = SVGRenderer.prototype.createComp;
ICompElement.prototype.createSolid = SVGRenderer.prototype.createSolid;
ICompElement.prototype.createShape = SVGRenderer.prototype.createShape;
ICompElement.prototype.createText = SVGRenderer.prototype.createText;
ICompElement.prototype.createBase = SVGRenderer.prototype.createBase;
ICompElement.prototype.appendElementInPos = SVGRenderer.prototype.appendElementInPos;
ICompElement.prototype.checkPendingElements = SVGRenderer.prototype.checkPendingElements;
ICompElement.prototype.addPendingElement = SVGRenderer.prototype.addPendingElement;
function IImageElement(data,parentContainer,globalData,comp,placeholder){
    this.assetData = globalData.getAssetData(data.refId);
    this._parent.constructor.call(this,data,parentContainer,globalData,comp,placeholder);
}
createElement(SVGBaseElement, IImageElement);

IImageElement.prototype.createElements = function(){

    var assetPath = this.globalData.getAssetsPath(this.assetData);

    this._parent.createElements.call(this);

    this.innerElem = createNS('image');
    this.innerElem.setAttribute('width',this.assetData.w+"px");
    this.innerElem.setAttribute('height',this.assetData.h+"px");
    this.innerElem.setAttribute('preserveAspectRatio','xMidYMid slice');
    this.innerElem.setAttributeNS('http://www.w3.org/1999/xlink','href',assetPath);
    this.maskedElement = this.innerElem;
    this.layerElement.appendChild(this.innerElem);
    if(this.data.ln){
        this.layerElement.setAttribute('id',this.data.ln);
    }
    if(this.data.cl){
        this.layerElement.setAttribute('class',this.data.cl);
    }

};

IImageElement.prototype.renderFrame = function(parentMatrix){
    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    if(renderParent===false){
        this.hide();
        return;
    }
    if(this.hidden){
        this.show();
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
};

IImageElement.prototype.destroy = function(){
    this._parent.destroy.call(this._parent);
    this.innerElem =  null;
};
function ISolidElement(data,parentContainer,globalData,comp, placeholder){
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(SVGBaseElement, ISolidElement);

ISolidElement.prototype.createElements = function(){
    this._parent.createElements.call(this);

    var rect = createNS('rect');
    ////rect.style.width = this.data.sw;
    ////rect.style.height = this.data.sh;
    ////rect.style.fill = this.data.sc;
    rect.setAttribute('width',this.data.sw);
    rect.setAttribute('height',this.data.sh);
    rect.setAttribute('fill',this.data.sc);
    this.layerElement.appendChild(rect);
    this.innerElem = rect;
    if(this.data.ln){
        this.layerElement.setAttribute('id',this.data.ln);
    }
    if(this.data.cl){
        this.layerElement.setAttribute('class',this.data.cl);
    }
};

ISolidElement.prototype.renderFrame = IImageElement.prototype.renderFrame;
ISolidElement.prototype.destroy = IImageElement.prototype.destroy;

var animationManager = (function(){
    var moduleOb = {};
    var registeredAnimations = [];
    var initTime = 0;
    var len = 0;
    var idled = true;
    var playingAnimationsNum = 0;
    var _stopped = true;

    function removeElement(ev){
        var i = 0;
        var animItem = ev.target;
        while(i<len) {
            if (registeredAnimations[i].animation === animItem) {
                registeredAnimations.splice(i, 1);
                i -= 1;
                len -= 1;
                if(!animItem.isPaused){
                    subtractPlayingCount();
                }
            }
            i += 1;
        }
    }

    function registerAnimation(element, animationData){
        if(!element){
            return null;
        }
        var i=0;
        while(i<len){
            if(registeredAnimations[i].elem == element && registeredAnimations[i].elem !== null ){
                return registeredAnimations[i].animation;
            }
            i+=1;
        }
        var animItem = new AnimationItem();
        setupAnimation(animItem, element);
        animItem.setData(element, animationData);
        return animItem;
    }

    function addPlayingCount(){
        playingAnimationsNum += 1;
        activate();
    }

    function subtractPlayingCount(){
        playingAnimationsNum -= 1;
        if(playingAnimationsNum === 0){
            idled = true;
        }
    }

    function setupAnimation(animItem, element){
        animItem.addEventListener('destroy',removeElement);
        animItem.addEventListener('_active',addPlayingCount);
        animItem.addEventListener('_idle',subtractPlayingCount);
        registeredAnimations.push({elem: element,animation:animItem});
        len += 1;
    }

    function loadAnimation(params){
        var animItem = new AnimationItem();
        setupAnimation(animItem, null);
        animItem.setParams(params);
        return animItem;
    }


    function setSpeed(val,animation){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.setSpeed(val, animation);
        }
    }

    function setDirection(val, animation){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.setDirection(val, animation);
        }
    }

    function play(animation){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.play(animation);
        }
    }

    function moveFrame (value, animation) {
        initTime = Date.now();
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.moveFrame(value,animation);
        }
    }
    function resume(nowTime) {
        var elapsedTime = nowTime - initTime;
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.advanceTime(elapsedTime);
        }
        initTime = nowTime;
        if(!idled) {
            window.requestAnimationFrame(resume);
        } else {
            _stopped = true;
        }
    }

    function first(nowTime){
        initTime = nowTime;
        window.requestAnimationFrame(resume);
    }

    function pause(animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.pause(animation);
        }
    }

    function goToAndStop(value,isFrame,animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.goToAndStop(value,isFrame,animation);
        }
    }

    function stop(animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.stop(animation);
        }
    }

    function togglePause(animation) {
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.togglePause(animation);
        }
    }

    function destroy(animation) {
        var i;
        for(i=(len-1);i>=0;i-=1){
            registeredAnimations[i].animation.destroy(animation);
        }
    }

    function searchAnimations(animationData, standalone, renderer){
        var animElements = [].concat([].slice.call(document.getElementsByClassName('lottie')),
                  [].slice.call(document.getElementsByClassName('bodymovin')));
        var i, len = animElements.length;
        for(i=0;i<len;i+=1){
            if(renderer){
                animElements[i].setAttribute('data-bm-type',renderer);
            }
            registerAnimation(animElements[i], animationData);
        }
        if(standalone && len === 0){
            if(!renderer){
                renderer = 'svg';
            }
            var body = document.getElementsByTagName('body')[0];
            body.innerHTML = '';
            var div = document.createElement('div');
            div.style.width = '100%';
            div.style.height = '100%';
            div.setAttribute('data-bm-type',renderer);
            body.appendChild(div);
            registerAnimation(div, animationData);
        }
    }

    function resize(){
        var i;
        for(i=0;i<len;i+=1){
            registeredAnimations[i].animation.resize();
        }
    }

    /*function start(){
        window.requestAnimationFrame(first);
    }*/

    function activate(){
        if(idled){
            idled = false;
            if(_stopped) {
                window.requestAnimationFrame(first);
                _stopped = false;
            }
        }
    }

    //start();

    //setTimeout(start,0);

    moduleOb.registerAnimation = registerAnimation;
    moduleOb.loadAnimation = loadAnimation;
    moduleOb.setSpeed = setSpeed;
    moduleOb.setDirection = setDirection;
    moduleOb.play = play;
    moduleOb.moveFrame = moveFrame;
    moduleOb.pause = pause;
    moduleOb.stop = stop;
    moduleOb.togglePause = togglePause;
    moduleOb.searchAnimations = searchAnimations;
    moduleOb.resize = resize;
    //moduleOb.start = start;
    moduleOb.goToAndStop = goToAndStop;
    moduleOb.destroy = destroy;
    return moduleOb;
}());

var AnimationItem = function () {
    this._cbs = [];
    this.name = '';
    this.path = '';
    this.isLoaded = false;
    this.currentFrame = 0;
    this.currentRawFrame = 0;
    this.totalFrames = 0;
    this.frameRate = 0;
    this.frameMult = 0;
    this.playSpeed = 1;
    this.playDirection = 1;
    this.pendingElements = 0;
    this.playCount = 0;
    this.animationData = {};
    this.layers = [];
    this.assets = [];
    this.isPaused = true;
    this.autoplay = false;
    this.loop = true;
    this.renderer = null;
    this.animationID = randomString(10);
    this.assetsPath = '';
    this.timeCompleted = 0;
    this.segmentPos = 0;
    this.subframeEnabled = subframeEnabled;
    this.segments = [];
    this.pendingSegment = false;
    this._idle = true;
    this.projectInterface = ProjectInterface();
};

AnimationItem.prototype.setParams = function(params) {
    var self = this;
    if(params.context){
        this.context = params.context;
    }
    if(params.wrapper || params.container){
        this.wrapper = params.wrapper || params.container;
    }
    var animType = params.animType ? params.animType : params.renderer ? params.renderer : 'svg';
    switch(animType){
        case 'canvas':
            this.renderer = new CanvasRenderer(this, params.rendererSettings);
            break;
        case 'svg':
            this.renderer = new SVGRenderer(this, params.rendererSettings);
            break;
        case 'hybrid':
        case 'html':
        default:
            this.renderer = new HybridRenderer(this, params.rendererSettings);
            break;
    }
    this.renderer.setProjectInterface(this.projectInterface);
    this.animType = animType;

    if(params.loop === '' || params.loop === null){
    }else if(params.loop === false){
        this.loop = false;
    }else if(params.loop === true){
        this.loop = true;
    }else{
        this.loop = parseInt(params.loop);
    }
    this.autoplay = 'autoplay' in params ? params.autoplay : true;
    this.name = params.name ? params.name :  '';
    this.autoloadSegments = params.hasOwnProperty('autoloadSegments') ? params.autoloadSegments :  true;
    if(params.animationData){
        self.configAnimation(params.animationData);
    }else if(params.path){
        if(params.path.substr(-4) != 'json'){
            if (params.path.substr(-1, 1) != '/') {
                params.path += '/';
            }
            params.path += 'data.json';
        }

        var xhr = new XMLHttpRequest();
        if(params.path.lastIndexOf('\\') != -1){
            this.path = params.path.substr(0,params.path.lastIndexOf('\\')+1);
        }else{
            this.path = params.path.substr(0,params.path.lastIndexOf('/')+1);
        }
        this.assetsPath = params.assetsPath;
        this.fileName = params.path.substr(params.path.lastIndexOf('/')+1);
        this.fileName = this.fileName.substr(0,this.fileName.lastIndexOf('.json'));
        xhr.open('GET', params.path, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if(xhr.status == 200){
                    self.configAnimation(JSON.parse(xhr.responseText));
                }else{
                    try{
                        var response = JSON.parse(xhr.responseText);
                        self.configAnimation(response);
                    }catch(err){
                    }
                }
            }
        };
    }
};

AnimationItem.prototype.setData = function (wrapper, animationData) {
    var params = {
        wrapper: wrapper,
        animationData: animationData ? (typeof animationData  === "object") ? animationData : JSON.parse(animationData) : null
    };
    var wrapperAttributes = wrapper.attributes;

    params.path = wrapperAttributes.getNamedItem('data-animation-path') ? wrapperAttributes.getNamedItem('data-animation-path').value : wrapperAttributes.getNamedItem('data-bm-path') ? wrapperAttributes.getNamedItem('data-bm-path').value :  wrapperAttributes.getNamedItem('bm-path') ? wrapperAttributes.getNamedItem('bm-path').value : '';
    params.animType = wrapperAttributes.getNamedItem('data-anim-type') ? wrapperAttributes.getNamedItem('data-anim-type').value : wrapperAttributes.getNamedItem('data-bm-type') ? wrapperAttributes.getNamedItem('data-bm-type').value : wrapperAttributes.getNamedItem('bm-type') ? wrapperAttributes.getNamedItem('bm-type').value :  wrapperAttributes.getNamedItem('data-bm-renderer') ? wrapperAttributes.getNamedItem('data-bm-renderer').value : wrapperAttributes.getNamedItem('bm-renderer') ? wrapperAttributes.getNamedItem('bm-renderer').value : 'canvas';

    var loop = wrapperAttributes.getNamedItem('data-anim-loop') ? wrapperAttributes.getNamedItem('data-anim-loop').value :  wrapperAttributes.getNamedItem('data-bm-loop') ? wrapperAttributes.getNamedItem('data-bm-loop').value :  wrapperAttributes.getNamedItem('bm-loop') ? wrapperAttributes.getNamedItem('bm-loop').value : '';
    if(loop === ''){
    }else if(loop === 'false'){
        params.loop = false;
    }else if(loop === 'true'){
        params.loop = true;
    }else{
        params.loop = parseInt(loop);
    }
    var autoplay = wrapperAttributes.getNamedItem('data-anim-autoplay') ? wrapperAttributes.getNamedItem('data-anim-autoplay').value :  wrapperAttributes.getNamedItem('data-bm-autoplay') ? wrapperAttributes.getNamedItem('data-bm-autoplay').value :  wrapperAttributes.getNamedItem('bm-autoplay') ? wrapperAttributes.getNamedItem('bm-autoplay').value : true;
    params.autoplay = autoplay !== "false";

    params.name = wrapperAttributes.getNamedItem('data-name') ? wrapperAttributes.getNamedItem('data-name').value :  wrapperAttributes.getNamedItem('data-bm-name') ? wrapperAttributes.getNamedItem('data-bm-name').value : wrapperAttributes.getNamedItem('bm-name') ? wrapperAttributes.getNamedItem('bm-name').value :  '';
    var prerender = wrapperAttributes.getNamedItem('data-anim-prerender') ? wrapperAttributes.getNamedItem('data-anim-prerender').value :  wrapperAttributes.getNamedItem('data-bm-prerender') ? wrapperAttributes.getNamedItem('data-bm-prerender').value :  wrapperAttributes.getNamedItem('bm-prerender') ? wrapperAttributes.getNamedItem('bm-prerender').value : '';

    if(prerender === 'false'){
        params.prerender = false;
    }
    this.setParams(params);
};

AnimationItem.prototype.includeLayers = function(data) {
    if(data.op > this.animationData.op){
        this.animationData.op = data.op;
        this.totalFrames = Math.floor(data.op - this.animationData.ip);
        this.animationData.tf = this.totalFrames;
    }
    var layers = this.animationData.layers;
    var i, len = layers.length;
    var newLayers = data.layers;
    var j, jLen = newLayers.length;
    for(j=0;j<jLen;j+=1){
        i = 0;
        while(i<len){
            if(layers[i].id == newLayers[j].id){
                layers[i] = newLayers[j];
                break;
            }
            i += 1;
        }
    }
    if(data.chars || data.fonts){
        this.renderer.globalData.fontManager.addChars(data.chars);
        this.renderer.globalData.fontManager.addFonts(data.fonts, this.renderer.globalData.defs);
    }
    if(data.assets){
        len = data.assets.length;
        for(i = 0; i < len; i += 1){
            this.animationData.assets.push(data.assets[i]);
        }
    }
    //this.totalFrames = 50;
    //this.animationData.tf = 50;
    this.animationData.__complete = false;
    dataManager.completeData(this.animationData,this.renderer.globalData.fontManager);
    this.renderer.includeLayers(data.layers);
    if(expressionsPlugin){
        expressionsPlugin.initExpressions(this);
    }
    this.renderer.renderFrame(null);
    this.loadNextSegment();
};

AnimationItem.prototype.loadNextSegment = function() {
    var segments = this.animationData.segments;
    if(!segments || segments.length === 0 || !this.autoloadSegments){
        this.trigger('data_ready');
        this.timeCompleted = this.animationData.tf;
        return;
    }
    var segment = segments.shift();
    this.timeCompleted = segment.time * this.frameRate;
    var xhr = new XMLHttpRequest();
    var self = this;
    var segmentPath = this.path+this.fileName+'_' + this.segmentPos + '.json';
    this.segmentPos += 1;
    xhr.open('GET', segmentPath, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if(xhr.status == 200){
                self.includeLayers(JSON.parse(xhr.responseText));
            }else{
                try{
                    var response = JSON.parse(xhr.responseText);
                    self.includeLayers(response);
                }catch(err){
                }
            }
        }
    };
};

AnimationItem.prototype.loadSegments = function() {
    var segments = this.animationData.segments;
    if(!segments) {
        this.timeCompleted = this.animationData.tf;
    }
    this.loadNextSegment();
};

AnimationItem.prototype.configAnimation = function (animData) {
    var _this = this;
    if(this.renderer && this.renderer.destroyed){
        return;
    }
    //console.log(JSON.parse(JSON.stringify(animData)));
    //animData.w = Math.round(animData.w/blitter);
    //animData.h = Math.round(animData.h/blitter);
    this.animationData = animData;
    this.totalFrames = Math.floor(this.animationData.op - this.animationData.ip);
    this.animationData.tf = this.totalFrames;
    this.renderer.configAnimation(animData);
    if(!animData.assets){
        animData.assets = [];
    }
    if(animData.comps) {
        animData.assets = animData.assets.concat(animData.comps);
        animData.comps = null;
    }
    this.renderer.searchExtraCompositions(animData.assets);

    this.layers = this.animationData.layers;
    this.assets = this.animationData.assets;
    this.frameRate = this.animationData.fr;
    this.firstFrame = Math.round(this.animationData.ip);
    this.frameMult = this.animationData.fr / 1000;
    this.trigger('config_ready');
    this.imagePreloader = new ImagePreloader();
    this.imagePreloader.setAssetsPath(this.assetsPath);
    this.imagePreloader.setPath(this.path);
    this.imagePreloader.loadAssets(animData.assets, function(err) {
        if(!err) {
            _this.trigger('loaded_images');
        }
    });
    this.loadSegments();
    this.updaFrameModifier();
    if(this.renderer.globalData.fontManager){
        this.waitForFontsLoaded();
    }else{
        dataManager.completeData(this.animationData,this.renderer.globalData.fontManager);
        this.checkLoaded();
    }
};

AnimationItem.prototype.waitForFontsLoaded = (function(){
    function checkFontsLoaded(){
        if(this.renderer.globalData.fontManager.loaded){
            dataManager.completeData(this.animationData,this.renderer.globalData.fontManager);
            //this.renderer.buildItems(this.animationData.layers);
            this.checkLoaded();
        }else{
            setTimeout(checkFontsLoaded.bind(this),20);
        }
    }

    return function(){
        checkFontsLoaded.bind(this)();
    }
}());

AnimationItem.prototype.addPendingElement = function () {
    this.pendingElements += 1;
}

AnimationItem.prototype.elementLoaded = function () {
    this.pendingElements--;
    this.checkLoaded();
};

AnimationItem.prototype.checkLoaded = function () {
    if (this.pendingElements === 0) {
        if(expressionsPlugin){
            expressionsPlugin.initExpressions(this);
        }
        this.renderer.initItems();
        setTimeout(function(){
            this.trigger('DOMLoaded');
        }.bind(this),0);
        this.isLoaded = true;
        this.gotoFrame();
        if(this.autoplay){
            this.play();
        }
    }
};

AnimationItem.prototype.resize = function () {
    this.renderer.updateContainerSize();
};

AnimationItem.prototype.setSubframe = function(flag){
    this.subframeEnabled = flag ? true : false;
}

AnimationItem.prototype.gotoFrame = function () {
    this.currentFrame = this.subframeEnabled ? this.currentRawFrame : ~~this.currentRawFrame;

    if(this.timeCompleted !== this.totalFrames && this.currentFrame > this.timeCompleted){
        this.currentFrame = this.timeCompleted;
    }
    this.trigger('enterFrame');
    this.renderFrame();
};

AnimationItem.prototype.renderFrame = function () {
    if(this.isLoaded === false){
        return;
    }
    //console.log('this.currentFrame:',this.currentFrame + this.firstFrame);
    this.renderer.renderFrame(this.currentFrame + this.firstFrame);
};

AnimationItem.prototype.play = function (name) {
    if(name && this.name != name){
        return;
    }
    if(this.isPaused === true){
        this.isPaused = false;
        if(this._idle){
            this._idle = false;
            this.trigger('_active');
        }
    }
};

AnimationItem.prototype.pause = function (name) {
    if(name && this.name != name){
        return;
    }
    if(this.isPaused === false){
        this.isPaused = true;
        if(!this.pendingSegment){
            this._idle = true;
            this.trigger('_idle');
        }
    }
};

AnimationItem.prototype.togglePause = function (name) {
    if(name && this.name != name){
        return;
    }
    if(this.isPaused === true){
        this.play();
    }else{
        this.pause();
    }
};

AnimationItem.prototype.stop = function (name) {
    if(name && this.name != name){
        return;
    }
    this.pause();
    this.currentFrame = this.currentRawFrame = 0;
    this.playCount = 0;
    this.gotoFrame();
};

AnimationItem.prototype.goToAndStop = function (value, isFrame, name) {
    if(name && this.name != name){
        return;
    }
    if(isFrame){
        this.setCurrentRawFrameValue(value);
    }else{
        this.setCurrentRawFrameValue(value * this.frameModifier);
    }
    this.pause();
};

AnimationItem.prototype.goToAndPlay = function (value, isFrame, name) {
    this.goToAndStop(value, isFrame, name);
    this.play();
};

AnimationItem.prototype.advanceTime = function (value) {
    if(this.pendingSegment){
        this.pendingSegment = false;
        this.adjustSegment(this.segments.shift());
        if(this.isPaused){
            this.play();
        }
        return;
    }
    if (this.isPaused === true || this.isLoaded === false) {
        return;
    }
    this.setCurrentRawFrameValue(this.currentRawFrame + value * this.frameModifier);
};

AnimationItem.prototype.updateAnimation = function (perc) {
    this.setCurrentRawFrameValue(this.totalFrames * perc);
};

AnimationItem.prototype.moveFrame = function (value, name) {
    if(name && this.name != name){
        return;
    }
    this.setCurrentRawFrameValue(this.currentRawFrame+value);
};

AnimationItem.prototype.adjustSegment = function(arr){
    this.playCount = 0;
    if(arr[1] < arr[0]){
        if(this.frameModifier > 0){
            if(this.playSpeed < 0){
                this.setSpeed(-this.playSpeed);
            } else {
                this.setDirection(-1);
            }
        }
        this.totalFrames = arr[0] - arr[1];
        this.firstFrame = arr[1];
        this.setCurrentRawFrameValue(this.totalFrames - 0.001);
    } else if(arr[1] > arr[0]){
        if(this.frameModifier < 0){
            if(this.playSpeed < 0){
                this.setSpeed(-this.playSpeed);
            } else {
                this.setDirection(1);
            }
        }
        this.totalFrames = arr[1] - arr[0];
        this.firstFrame = arr[0];
        this.setCurrentRawFrameValue(0.001);
    }
    this.trigger('segmentStart');
};
AnimationItem.prototype.setSegment = function (init,end) {
    var pendingFrame = -1;
    if(this.isPaused) {
        if (this.currentRawFrame + this.firstFrame < init) {
            pendingFrame = init;
        } else if (this.currentRawFrame + this.firstFrame > end) {
            pendingFrame = end - init;
        }
    }

    this.firstFrame = init;
    this.totalFrames = end - init;
    if(pendingFrame !== -1) {
        this.goToAndStop(pendingFrame,true);
    }
}

AnimationItem.prototype.playSegments = function (arr,forceFlag) {
    if(typeof arr[0] === 'object'){
        var i, len = arr.length;
        for(i=0;i<len;i+=1){
            this.segments.push(arr[i]);
        }
    }else{
        this.segments.push(arr);
    }
    if(forceFlag){
        this.adjustSegment(this.segments.shift());
    }
    if(this.isPaused){
        this.play();
    }
};

AnimationItem.prototype.resetSegments = function (forceFlag) {
    this.segments.length = 0;
    this.segments.push([this.animationData.ip,this.animationData.op]);
    //this.segments.push([this.animationData.ip*this.frameRate,Math.floor(this.animationData.op - this.animationData.ip+this.animationData.ip*this.frameRate)]);
    if(forceFlag){
        this.adjustSegment(this.segments.shift());
    }
};
AnimationItem.prototype.checkSegments = function(){
    if(this.segments.length){
        this.pendingSegment = true;
    }
}

AnimationItem.prototype.remove = function (name) {
    if(name && this.name != name){
        return;
    }
    this.renderer.destroy();
};

AnimationItem.prototype.destroy = function (name) {
    if((name && this.name != name) || (this.renderer && this.renderer.destroyed)){
        return;
    }
    this.renderer.destroy();
    this.trigger('destroy');
    this._cbs = null;
    this.onEnterFrame = this.onLoopComplete = this.onComplete = this.onSegmentStart = this.onDestroy = null;
    this.renderer = null;
};

AnimationItem.prototype.setCurrentRawFrameValue = function(value){
    this.currentRawFrame = value;
    //console.log(this.totalFrames);
    var _completeFlag = false;
    if (this.currentRawFrame >= this.totalFrames) {
        this.checkSegments();
        if(this.loop === false){
            this.currentRawFrame = this.totalFrames;
            _completeFlag = true;
        }else{
            this.trigger('loopComplete');
            this.playCount += 1;
            if((this.loop !== true && this.playCount == this.loop) || this.pendingSegment){
                this.currentRawFrame = this.totalFrames;
                _completeFlag = true;
            } else {
                this.currentRawFrame = this.currentRawFrame % this.totalFrames;
            }
        }
    } else if (this.currentRawFrame < 0) {
        this.checkSegments();
        this.playCount -= 1;
        if(this.playCount < 0){
            this.playCount = 0;
        }
        if(this.loop === false  || this.pendingSegment){
            this.currentRawFrame = 0;
            _completeFlag = true;
        }else{
            this.trigger('loopComplete');
            this.currentRawFrame = (this.totalFrames + this.currentRawFrame) % this.totalFrames;
        }
    }

    this.gotoFrame();
    if(_completeFlag) {
        this.pause();
        this.trigger('complete');
    }
};

AnimationItem.prototype.setSpeed = function (val) {
    this.playSpeed = val;
    this.updaFrameModifier();
};

AnimationItem.prototype.setDirection = function (val) {
    this.playDirection = val < 0 ? -1 : 1;
    this.updaFrameModifier();
};

AnimationItem.prototype.updaFrameModifier = function () {
    this.frameModifier = this.frameMult * this.playSpeed * this.playDirection;
};

AnimationItem.prototype.getPath = function () {
    return this.path;
};

AnimationItem.prototype.getAssetsPath = function (assetData) {
    var path = '';
    if(this.assetsPath){
        var imagePath = assetData.p;
        if(imagePath.indexOf('images/') !== -1){
            imagePath = imagePath.split('/')[1];
        }
        path = this.assetsPath + imagePath;
    } else {
        path = this.path;
        path += assetData.u ? assetData.u : '';
        path += assetData.p;
    }
    return path;
};

AnimationItem.prototype.getAssetData = function (id) {
    var i = 0, len = this.assets.length;
    while (i < len) {
        if(id == this.assets[i].id){
            return this.assets[i];
        }
        i += 1;
    }
};

AnimationItem.prototype.hide = function () {
    this.renderer.hide();
};

AnimationItem.prototype.show = function () {
    this.renderer.show();
};

AnimationItem.prototype.getAssets = function () {
    return this.assets;
};

AnimationItem.prototype.trigger = function(name){
    if(this._cbs && this._cbs[name]){
        switch(name){
            case 'enterFrame':
                this.triggerEvent(name,new BMEnterFrameEvent(name,this.currentFrame,this.totalFrames,this.frameMult));
                break;
            case 'loopComplete':
                this.triggerEvent(name,new BMCompleteLoopEvent(name,this.loop,this.playCount,this.frameMult));
                break;
            case 'complete':
                this.triggerEvent(name,new BMCompleteEvent(name,this.frameMult));
                break;
            case 'segmentStart':
                this.triggerEvent(name,new BMSegmentStartEvent(name,this.firstFrame,this.totalFrames));
                break;
            case 'destroy':
                this.triggerEvent(name,new BMDestroyEvent(name,this));
                break;
            default:
                this.triggerEvent(name);
        }
    }
    if(name === 'enterFrame' && this.onEnterFrame){
        this.onEnterFrame.call(this,new BMEnterFrameEvent(name,this.currentFrame,this.totalFrames,this.frameMult));
    }
    if(name === 'loopComplete' && this.onLoopComplete){
        this.onLoopComplete.call(this,new BMCompleteLoopEvent(name,this.loop,this.playCount,this.frameMult));
    }
    if(name === 'complete' && this.onComplete){
        this.onComplete.call(this,new BMCompleteEvent(name,this.frameMult));
    }
    if(name === 'segmentStart' && this.onSegmentStart){
        this.onSegmentStart.call(this,new BMSegmentStartEvent(name,this.firstFrame,this.totalFrames));
    }
    if(name === 'destroy' && this.onDestroy){
        this.onDestroy.call(this,new BMDestroyEvent(name,this));
    }
};

AnimationItem.prototype.addEventListener = _addEventListener;
AnimationItem.prototype.removeEventListener = _removeEventListener;
AnimationItem.prototype.triggerEvent = _triggerEvent;

function CanvasRenderer(animationItem, config){
    this.animationItem = animationItem;
    this.renderConfig = {
        clearCanvas: (config && config.clearCanvas !== undefined) ? config.clearCanvas : true,
        context: (config && config.context) || null,
        progressiveLoad: (config && config.progressiveLoad) || false,
        preserveAspectRatio: (config && config.preserveAspectRatio) || 'xMidYMid meet',
        className: (config && config.className) || ''
    };
    this.renderConfig.dpr = (config && config.dpr) || 1;
    if (this.animationItem.wrapper) {
        this.renderConfig.dpr = (config && config.dpr) || window.devicePixelRatio || 1;
    }
    this.renderedFrame = -1;
    this.globalData = {
        frameNum: -1
    };
    this.contextData = {
        saved : Array.apply(null,{length:15}),
        savedOp: Array.apply(null,{length:15}),
        cArrPos : 0,
        cTr : new Matrix(),
        cO : 1
    };
    var i, len = 15;
    for(i=0;i<len;i+=1){
        this.contextData.saved[i] = Array.apply(null,{length:16});
    }
    this.elements = [];
    this.pendingElements = [];
    this.transformMat = new Matrix();
    this.completeLayers = false;
}
extendPrototype(BaseRenderer,CanvasRenderer);

CanvasRenderer.prototype.createBase = function (data) {
    return new CVBaseElement(data, this, this.globalData);
};

CanvasRenderer.prototype.createShape = function (data) {
    return new CVShapeElement(data, this, this.globalData);
};

CanvasRenderer.prototype.createText = function (data) {
    return new CVTextElement(data, this, this.globalData);
};

CanvasRenderer.prototype.createImage = function (data) {
    return new CVImageElement(data, this, this.globalData);
};

CanvasRenderer.prototype.createComp = function (data) {
    return new CVCompElement(data, this, this.globalData);
};

CanvasRenderer.prototype.createSolid = function (data) {
    return new CVSolidElement(data, this, this.globalData);
};

CanvasRenderer.prototype.ctxTransform = function(props){
    if(props[0] === 1 && props[1] === 0 && props[4] === 0 && props[5] === 1 && props[12] === 0 && props[13] === 0){
        return;
    }
    if(!this.renderConfig.clearCanvas){
        this.canvasContext.transform(props[0],props[1],props[4],props[5],props[12],props[13]);
        return;
    }
    this.transformMat.cloneFromProps(props);
    this.transformMat.transform(this.contextData.cTr.props[0],this.contextData.cTr.props[1],this.contextData.cTr.props[2],this.contextData.cTr.props[3],this.contextData.cTr.props[4],this.contextData.cTr.props[5],this.contextData.cTr.props[6],this.contextData.cTr.props[7],this.contextData.cTr.props[8],this.contextData.cTr.props[9],this.contextData.cTr.props[10],this.contextData.cTr.props[11],this.contextData.cTr.props[12],this.contextData.cTr.props[13],this.contextData.cTr.props[14],this.contextData.cTr.props[15])
    //this.contextData.cTr.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);
    this.contextData.cTr.cloneFromProps(this.transformMat.props);
    var trProps = this.contextData.cTr.props;
    this.canvasContext.setTransform(trProps[0],trProps[1],trProps[4],trProps[5],trProps[12],trProps[13]);
};

CanvasRenderer.prototype.ctxOpacity = function(op){
    if(op === 1){
        return;
    }
    if(!this.renderConfig.clearCanvas){
        this.canvasContext.globalAlpha *= op < 0 ? 0 : op;
        return;
    }
    this.contextData.cO *= op < 0 ? 0 : op;
    this.canvasContext.globalAlpha = this.contextData.cO;
};

CanvasRenderer.prototype.reset = function(){
    if(!this.renderConfig.clearCanvas){
        this.canvasContext.restore();
        return;
    }
    this.contextData.cArrPos = 0;
    this.contextData.cTr.reset();
    this.contextData.cO = 1;
};

CanvasRenderer.prototype.save = function(actionFlag){
    if(!this.renderConfig.clearCanvas){
        this.canvasContext.save();
        return;
    }
    if(actionFlag){
        this.canvasContext.save();
    }
    var props = this.contextData.cTr.props;
    if(this.contextData.saved[this.contextData.cArrPos] === null || this.contextData.saved[this.contextData.cArrPos] === undefined){
        this.contextData.saved[this.contextData.cArrPos] = new Array(16);
    }
    var i,arr = this.contextData.saved[this.contextData.cArrPos];
    for(i=0;i<16;i+=1){
        arr[i] = props[i];
    }
    this.contextData.savedOp[this.contextData.cArrPos] = this.contextData.cO;
    this.contextData.cArrPos += 1;
};

CanvasRenderer.prototype.restore = function(actionFlag){
    if(!this.renderConfig.clearCanvas){
        this.canvasContext.restore();
        return;
    }
    if(actionFlag){
        this.canvasContext.restore();
    }
    this.contextData.cArrPos -= 1;
    var popped = this.contextData.saved[this.contextData.cArrPos];
    var i,arr = this.contextData.cTr.props;
    for(i=0;i<16;i+=1){
        arr[i] = popped[i];
    }
    this.canvasContext.setTransform(popped[0],popped[1],popped[4],popped[5],popped[12],popped[13]);
    popped = this.contextData.savedOp[this.contextData.cArrPos];
    this.contextData.cO = popped;
    this.canvasContext.globalAlpha = popped;
};

CanvasRenderer.prototype.configAnimation = function(animData){
    if(this.animationItem.wrapper){
        this.animationItem.container = document.createElement('canvas');
        this.animationItem.container.style.width = '100%';
        this.animationItem.container.style.height = '100%';
        //this.animationItem.container.style.transform = 'translate3d(0,0,0)';
        //this.animationItem.container.style.webkitTransform = 'translate3d(0,0,0)';
        this.animationItem.container.style.transformOrigin = this.animationItem.container.style.mozTransformOrigin = this.animationItem.container.style.webkitTransformOrigin = this.animationItem.container.style['-webkit-transform'] = "0px 0px 0px";
        this.animationItem.wrapper.appendChild(this.animationItem.container);
        this.canvasContext = this.animationItem.container.getContext('2d');
        if(this.renderConfig.className) {
            this.animationItem.container.setAttribute('class', this.renderConfig.className);
        }
    }else{
        this.canvasContext = this.renderConfig.context;
    }
    this.data = animData;
    this.globalData.canvasContext = this.canvasContext;
    this.globalData.renderer = this;
    this.globalData.isDashed = false;
    this.globalData.totalFrames = Math.floor(animData.tf);
    this.globalData.compWidth = animData.w;
    this.globalData.compHeight = animData.h;
    this.globalData.frameRate = animData.fr;
    this.globalData.frameId = 0;
    this.globalData.compSize = {
        w: animData.w,
        h: animData.h
    };
    this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
    this.layers = animData.layers;
    this.transformCanvas = {};
    this.transformCanvas.w = animData.w;
    this.transformCanvas.h = animData.h;
    this.globalData.fontManager = new FontManager();
    this.globalData.fontManager.addChars(animData.chars);
    this.globalData.fontManager.addFonts(animData.fonts,document.body);
    this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
    this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
    this.globalData.elementLoaded = this.animationItem.elementLoaded.bind(this.animationItem);
    this.globalData.addPendingElement = this.animationItem.addPendingElement.bind(this.animationItem);
    this.globalData.transformCanvas = this.transformCanvas;
    this.elements = Array.apply(null,{length:animData.layers.length});

    this.updateContainerSize();
};

CanvasRenderer.prototype.updateContainerSize = function () {
    var elementWidth,elementHeight;
    if(this.animationItem.wrapper && this.animationItem.container){
        elementWidth = this.animationItem.wrapper.offsetWidth;
        elementHeight = this.animationItem.wrapper.offsetHeight;
        this.animationItem.container.setAttribute('width',elementWidth * this.renderConfig.dpr );
        this.animationItem.container.setAttribute('height',elementHeight * this.renderConfig.dpr);
    }else{
        elementWidth = this.canvasContext.canvas.width * this.renderConfig.dpr;
        elementHeight = this.canvasContext.canvas.height * this.renderConfig.dpr;
    }
    var elementRel,animationRel;
    if(this.renderConfig.preserveAspectRatio.indexOf('meet') !== -1 || this.renderConfig.preserveAspectRatio.indexOf('slice') !== -1){
        var par = this.renderConfig.preserveAspectRatio.split(' ');
        var fillType = par[1] || 'meet';
        var pos = par[0] || 'xMidYMid';
        var xPos = pos.substr(0,4);
        var yPos = pos.substr(4);
        elementRel = elementWidth/elementHeight;
        animationRel = this.transformCanvas.w/this.transformCanvas.h;
        if(animationRel>elementRel && fillType === 'meet' || animationRel<elementRel && fillType === 'slice'){
            this.transformCanvas.sx = elementWidth/(this.transformCanvas.w/this.renderConfig.dpr);
            this.transformCanvas.sy = elementWidth/(this.transformCanvas.w/this.renderConfig.dpr);
        }else{
            this.transformCanvas.sx = elementHeight/(this.transformCanvas.h / this.renderConfig.dpr);
            this.transformCanvas.sy = elementHeight/(this.transformCanvas.h / this.renderConfig.dpr);
        }

        if(xPos === 'xMid' && ((animationRel<elementRel && fillType==='meet') || (animationRel>elementRel && fillType === 'slice'))){
            this.transformCanvas.tx = (elementWidth-this.transformCanvas.w*(elementHeight/this.transformCanvas.h))/2*this.renderConfig.dpr;
        } else if(xPos === 'xMax' && ((animationRel<elementRel && fillType==='meet') || (animationRel>elementRel && fillType === 'slice'))){
            this.transformCanvas.tx = (elementWidth-this.transformCanvas.w*(elementHeight/this.transformCanvas.h))*this.renderConfig.dpr;
        } else {
            this.transformCanvas.tx = 0;
        }
        if(yPos === 'YMid' && ((animationRel>elementRel && fillType==='meet') || (animationRel<elementRel && fillType === 'slice'))){
            this.transformCanvas.ty = ((elementHeight-this.transformCanvas.h*(elementWidth/this.transformCanvas.w))/2)*this.renderConfig.dpr;
        } else if(yPos === 'YMax' && ((animationRel>elementRel && fillType==='meet') || (animationRel<elementRel && fillType === 'slice'))){
            this.transformCanvas.ty = ((elementHeight-this.transformCanvas.h*(elementWidth/this.transformCanvas.w)))*this.renderConfig.dpr;
        } else {
            this.transformCanvas.ty = 0;
        }

    }else if(this.renderConfig.preserveAspectRatio == 'none'){
        this.transformCanvas.sx = elementWidth/(this.transformCanvas.w/this.renderConfig.dpr);
        this.transformCanvas.sy = elementHeight/(this.transformCanvas.h/this.renderConfig.dpr);
        this.transformCanvas.tx = 0;
        this.transformCanvas.ty = 0;
    }else{
        this.transformCanvas.sx = this.renderConfig.dpr;
        this.transformCanvas.sy = this.renderConfig.dpr;
        this.transformCanvas.tx = 0;
        this.transformCanvas.ty = 0;
    }
    this.transformCanvas.props = [this.transformCanvas.sx,0,0,0,0,this.transformCanvas.sy,0,0,0,0,1,0,this.transformCanvas.tx,this.transformCanvas.ty,0,1];
    var i, len = this.elements.length;
    for(i=0;i<len;i+=1){
        if(this.elements[i] && this.elements[i].data.ty === 0){
            this.elements[i].resize(this.globalData.transformCanvas);
        }
    }
};

CanvasRenderer.prototype.destroy = function () {
    if(this.renderConfig.clearCanvas) {
        this.animationItem.wrapper.innerHTML = '';
    }
    var i, len = this.layers ? this.layers.length : 0;
    for (i = len - 1; i >= 0; i-=1) {
        if(this.elements[i]) {
            this.elements[i].destroy();
        }
    }
    this.elements.length = 0;
    this.globalData.canvasContext = null;
    this.animationItem.container = null;
    this.destroyed = true;
};

CanvasRenderer.prototype.renderFrame = function(num){
    if((this.renderedFrame == num && this.renderConfig.clearCanvas === true) || this.destroyed || num === null){
        return;
    }
    this.renderedFrame = num;
    this.globalData.frameNum = num - this.animationItem.firstFrame;
    this.globalData.frameId += 1;
    this.globalData.projectInterface.currentFrame = num;
    if(this.renderConfig.clearCanvas === true){
        this.reset();
        this.canvasContext.save();
        //this.canvasContext.canvas.width = this.canvasContext.canvas.width;
        this.canvasContext.clearRect(this.transformCanvas.tx, this.transformCanvas.ty, this.transformCanvas.w*this.transformCanvas.sx, this.transformCanvas.h*this.transformCanvas.sy);
    }else{
        this.save();
    }
    this.ctxTransform(this.transformCanvas.props);
    this.canvasContext.beginPath();
    this.canvasContext.rect(0,0,this.transformCanvas.w,this.transformCanvas.h);
    this.canvasContext.closePath();
    this.canvasContext.clip();

    //console.log('--------');
    //console.log('NEW: ',num);
    var i, len = this.layers.length;
    if(!this.completeLayers){
        this.checkLayers(num);
    }

    for (i = 0; i < len; i++) {
        if(this.completeLayers || this.elements[i]){
            this.elements[i].prepareFrame(num - this.layers[i].st);
        }
    }
    for (i = len - 1; i >= 0; i-=1) {
        if(this.completeLayers || this.elements[i]){
            this.elements[i].renderFrame();
        }
    }
    if(this.renderConfig.clearCanvas !== true){
        this.restore();
    } else {
        this.canvasContext.restore();
    }
};

CanvasRenderer.prototype.buildItem = function(pos){
    var elements = this.elements;
    if(elements[pos] || this.layers[pos].ty == 99){
        return;
    }
    var element = this.createItem(this.layers[pos], this,this.globalData);
    elements[pos] = element;
    element.initExpressions();
    if(this.layers[pos].ty === 0){
        element.resize(this.globalData.transformCanvas);
    }
};

CanvasRenderer.prototype.checkPendingElements  = function(){
    while(this.pendingElements.length){
        var element = this.pendingElements.pop();
        element.checkParenting();
    }
};

CanvasRenderer.prototype.hide = function(){
    this.animationItem.container.style.display = 'none';
};

CanvasRenderer.prototype.show = function(){
    this.animationItem.container.style.display = 'block';
};

CanvasRenderer.prototype.searchExtraCompositions = function(assets){
    var i, len = assets.length;
    var floatingContainer = createNS('g');
    for(i=0;i<len;i+=1){
        if(assets[i].xt){
            var comp = this.createComp(assets[i],this.globalData.comp,this.globalData);
            comp.initExpressions();
            //comp.compInterface = CompExpressionInterface(comp);
            //Expressions.addLayersInterface(comp.elements, this.globalData.projectInterface);
            this.globalData.projectInterface.registerComposition(comp);
        }
    }
};

function HybridRenderer(animationItem, config){
    this.animationItem = animationItem;
    this.layers = null;
    this.renderedFrame = -1;
    this.globalData = {
        frameNum: -1
    };
    this.renderConfig = {
        className: (config && config.className) || ''
    };
    this.pendingElements = [];
    this.elements = [];
    this.threeDElements = [];
    this.destroyed = false;
    this.camera = null;
    this.supports3d = true;

}

extendPrototype(BaseRenderer,HybridRenderer);

HybridRenderer.prototype.buildItem = SVGRenderer.prototype.buildItem;

HybridRenderer.prototype.checkPendingElements  = function(){
    while(this.pendingElements.length){
        var element = this.pendingElements.pop();
        element.checkParenting();
    }
};

HybridRenderer.prototype.appendElementInPos = function(element, pos){
    var newDOMElement = element.getBaseElement();
    if(!newDOMElement){
        return;
    }
    var layer = this.layers[pos];
    if(!layer.ddd || !this.supports3d){
        var i = 0;
        var nextDOMElement, nextLayer;
        while(i<pos){
            if(this.elements[i] && this.elements[i]!== true && this.elements[i].getBaseElement){
                nextLayer = this.elements[i];
                nextDOMElement = this.layers[i].ddd ? this.getThreeDContainerByPos(i) : nextLayer.getBaseElement();
            }
            i += 1;
        }
        if(nextDOMElement){
            if(!layer.ddd || !this.supports3d){
                this.layerElement.insertBefore(newDOMElement, nextDOMElement);
            }
        } else {
            if(!layer.ddd || !this.supports3d){
                this.layerElement.appendChild(newDOMElement);
            }
        }
    } else {
        this.addTo3dContainer(newDOMElement,pos);
    }
};


HybridRenderer.prototype.createBase = function (data) {
    return new SVGBaseElement(data, this.layerElement,this.globalData,this);
};

HybridRenderer.prototype.createShape = function (data) {
    if(!this.supports3d){
        return new IShapeElement(data, this.layerElement,this.globalData,this);
    }
    return new HShapeElement(data, this.layerElement,this.globalData,this);
};

HybridRenderer.prototype.createText = function (data) {
    if(!this.supports3d){
        return new SVGTextElement(data, this.layerElement,this.globalData,this);
    }
    return new HTextElement(data, this.layerElement,this.globalData,this);
};

HybridRenderer.prototype.createCamera = function (data) {
    this.camera = new HCameraElement(data, this.layerElement,this.globalData,this);
    return this.camera;
};

HybridRenderer.prototype.createImage = function (data) {
    if(!this.supports3d){
        return new IImageElement(data, this.layerElement,this.globalData,this);
    }
    return new HImageElement(data, this.layerElement,this.globalData,this);
};

HybridRenderer.prototype.createComp = function (data) {
    if(!this.supports3d){
        return new ICompElement(data, this.layerElement,this.globalData,this);
    }
    return new HCompElement(data, this.layerElement,this.globalData,this);

};

HybridRenderer.prototype.createSolid = function (data) {
    if(!this.supports3d){
        return new ISolidElement(data, this.layerElement,this.globalData,this);
    }
    return new HSolidElement(data, this.layerElement,this.globalData,this);
};

HybridRenderer.prototype.getThreeDContainerByPos = function(pos){
    var i = 0, len = this.threeDElements.length;
    while(i<len) {
        if(this.threeDElements[i].startPos <= pos && this.threeDElements[i].endPos >= pos) {
            return this.threeDElements[i].perspectiveElem;
        }
        i += 1;
    }
}

HybridRenderer.prototype.createThreeDContainer = function(pos){
    var perspectiveElem = document.createElement('div');
    styleDiv(perspectiveElem);
    perspectiveElem.style.width = this.globalData.compSize.w+'px';
    perspectiveElem.style.height = this.globalData.compSize.h+'px';
    perspectiveElem.style.transformOrigin = perspectiveElem.style.mozTransformOrigin = perspectiveElem.style.webkitTransformOrigin = "50% 50%";
    var container = document.createElement('div');
    styleDiv(container);
    container.style.transform = container.style.webkitTransform = 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';
    perspectiveElem.appendChild(container);
    this.resizerElem.appendChild(perspectiveElem);
    var threeDContainerData = {
        container:container,
        perspectiveElem:perspectiveElem,
        startPos: pos,
        endPos: pos
    };
    this.threeDElements.push(threeDContainerData);
    return threeDContainerData;
};

HybridRenderer.prototype.build3dContainers = function(){
    var i, len = this.layers.length;
    var lastThreeDContainerData;
    for(i=0;i<len;i+=1){
        if(this.layers[i].ddd){
            if(!lastThreeDContainerData){
                lastThreeDContainerData = this.createThreeDContainer(i);
            }
            lastThreeDContainerData.endPos = Math.max(lastThreeDContainerData.endPos,i);
        } else {
            lastThreeDContainerData = null;
        }
    }
};

HybridRenderer.prototype.addTo3dContainer = function(elem,pos){
    var i = 0, len = this.threeDElements.length;
    while(i<len){
        if(pos <= this.threeDElements[i].endPos){
            var j = this.threeDElements[i].startPos;
            var nextElement;
            while(j<pos){
                if(this.elements[j] && this.elements[j].getBaseElement){
                    nextElement = this.elements[j].getBaseElement();
                }
                j += 1;
            }
            if(nextElement){
                this.threeDElements[i].container.insertBefore(elem, nextElement);
            } else {
                this.threeDElements[i].container.appendChild(elem);
            }
            break;
        }
        i += 1;
    }
};

HybridRenderer.prototype.configAnimation = function(animData){
    var resizerElem = document.createElement('div');
    var wrapper = this.animationItem.wrapper;
    resizerElem.style.width = animData.w+'px';
    resizerElem.style.height = animData.h+'px';
    this.resizerElem = resizerElem;
    styleDiv(resizerElem);
    resizerElem.style.transformStyle = resizerElem.style.webkitTransformStyle = resizerElem.style.mozTransformStyle = "flat";
    if(this.renderConfig.className) {
      wrapper.setAttribute('class', this.renderConfig.className);
    }
    wrapper.appendChild(resizerElem);

    resizerElem.style.overflow = 'hidden';
    var svg = createNS('svg');
    svg.setAttribute('width','1');
    svg.setAttribute('height','1');
    styleDiv(svg);
    this.resizerElem.appendChild(svg);
    var defs = createNS('defs');
    svg.appendChild(defs);
    this.globalData.defs = defs;
    this.data = animData;
    //Mask animation
    this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
    this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
    this.globalData.elementLoaded = this.animationItem.elementLoaded.bind(this.animationItem);
    this.globalData.frameId = 0;
    this.globalData.compSize = {
        w: animData.w,
        h: animData.h
    };
    this.globalData.frameRate = animData.fr;
    this.layers = animData.layers;
    this.globalData.fontManager = new FontManager();
    this.globalData.fontManager.addChars(animData.chars);
    this.globalData.fontManager.addFonts(animData.fonts,svg);
    this.layerElement = this.resizerElem;
    this.build3dContainers();
    this.updateContainerSize();
};

HybridRenderer.prototype.destroy = function () {
    this.animationItem.wrapper.innerHTML = '';
    this.animationItem.container = null;
    this.globalData.defs = null;
    var i, len = this.layers ? this.layers.length : 0;
    for (i = 0; i < len; i++) {
        this.elements[i].destroy();
    }
    this.elements.length = 0;
    this.destroyed = true;
    this.animationItem = null;
};

HybridRenderer.prototype.updateContainerSize = function () {
    var elementWidth = this.animationItem.wrapper.offsetWidth;
    var elementHeight = this.animationItem.wrapper.offsetHeight;
    var elementRel = elementWidth/elementHeight;
    var animationRel = this.globalData.compSize.w/this.globalData.compSize.h;
    var sx,sy,tx,ty;
    if(animationRel>elementRel){
        sx = elementWidth/(this.globalData.compSize.w);
        sy = elementWidth/(this.globalData.compSize.w);
        tx = 0;
        ty = ((elementHeight-this.globalData.compSize.h*(elementWidth/this.globalData.compSize.w))/2);
    }else{
        sx = elementHeight/(this.globalData.compSize.h);
        sy = elementHeight/(this.globalData.compSize.h);
        tx = (elementWidth-this.globalData.compSize.w*(elementHeight/this.globalData.compSize.h))/2;
        ty = 0;
    }
    this.resizerElem.style.transform = this.resizerElem.style.webkitTransform = 'matrix3d(' + sx + ',0,0,0,0,'+sy+',0,0,0,0,1,0,'+tx+','+ty+',0,1)';
};

HybridRenderer.prototype.renderFrame = SVGRenderer.prototype.renderFrame;

HybridRenderer.prototype.hide = function(){
    this.resizerElem.style.display = 'none';
};

HybridRenderer.prototype.show = function(){
    this.resizerElem.style.display = 'block';
};

HybridRenderer.prototype.initItems = function(){
    this.buildAllItems();
    if(this.camera){
        this.camera.setup();
    } else {
        var cWidth = this.globalData.compSize.w;
        var cHeight = this.globalData.compSize.h;
        var i, len = this.threeDElements.length;
        for(i=0;i<len;i+=1){
            this.threeDElements[i].perspectiveElem.style.perspective = this.threeDElements[i].perspectiveElem.style.webkitPerspective = Math.sqrt(Math.pow(cWidth,2) + Math.pow(cHeight,2)) + 'px';
        }
    }
};

HybridRenderer.prototype.searchExtraCompositions = function(assets){
    var i, len = assets.length;
    var floatingContainer = document.createElement('div');
    for(i=0;i<len;i+=1){
        if(assets[i].xt){
            var comp = this.createComp(assets[i],floatingContainer,this.globalData.comp,null);
            comp.initExpressions();
            this.globalData.projectInterface.registerComposition(comp);
        }
    }
};

function CVBaseElement(data, comp,globalData){
    this.globalData = globalData;
    this.data = data;
    this.comp = comp;
    this.canvasContext = globalData.canvasContext;
    this.init();
}

createElement(BaseElement, CVBaseElement);

CVBaseElement.prototype.createElements = function(){
    this.checkParenting();
};

CVBaseElement.prototype.checkBlendMode = function(globalData){
    if(globalData.blendMode !== this.data.bm) {
        globalData.blendMode = this.data.bm;

        var blendModeValue = '';
        switch (this.data.bm) {
            case 0:
                blendModeValue = 'normal';
                break;
            case 1:
                blendModeValue = 'multiply';
                break;
            case 2:
                blendModeValue = 'screen';
                break;
            case 3:
                blendModeValue = 'overlay';
                break;
            case 4:
                blendModeValue = 'darken';
                break;
            case 5:
                blendModeValue = 'lighten';
                break;
            case 6:
                blendModeValue = 'color-dodge';
                break;
            case 7:
                blendModeValue = 'color-burn';
                break;
            case 8:
                blendModeValue = 'hard-light';
                break;
            case 9:
                blendModeValue = 'soft-light';
                break;
            case 10:
                blendModeValue = 'difference';
                break;
            case 11:
                blendModeValue = 'exclusion';
                break;
            case 12:
                blendModeValue = 'hue';
                break;
            case 13:
                blendModeValue = 'saturation';
                break;
            case 14:
                blendModeValue = 'color';
                break;
            case 15:
                blendModeValue = 'luminosity';
                break;
        }
        globalData.canvasContext.globalCompositeOperation = blendModeValue;
    }
};


CVBaseElement.prototype.renderFrame = function(parentTransform){
    if(this.data.ty === 3){
        return false;
    }
        this.checkBlendMode(this.data.ty === 0?this.parentGlobalData:this.globalData);

    if(!this.isVisible){
        return this.isVisible;
    }
    this.finalTransform.opMdf = this.finalTransform.op.mdf;
    this.finalTransform.matMdf = this.finalTransform.mProp.mdf;
    this.finalTransform.opacity = this.finalTransform.op.v;

    var mat;
    var finalMat = this.finalTransform.mat;

    if(this.hierarchy){
        var i, len = this.hierarchy.length;
        mat = this.finalTransform.mProp.v.props;
        finalMat.cloneFromProps(mat);
        for(i=0;i<len;i+=1){
            this.finalTransform.matMdf = this.hierarchy[i].finalTransform.mProp.mdf ? true : this.finalTransform.matMdf;
            mat = this.hierarchy[i].finalTransform.mProp.v.props;
            finalMat.transform(mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],mat[12],mat[13],mat[14],mat[15]);
        }
    }else{
        if(!parentTransform){
            finalMat.cloneFromProps(this.finalTransform.mProp.v.props);
        }else{
            mat = this.finalTransform.mProp.v.props;
            finalMat.cloneFromProps(mat);
        }
    }

    if(parentTransform){
        mat = parentTransform.mat.props;
        finalMat.transform(mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],mat[12],mat[13],mat[14],mat[15]);
        this.finalTransform.opacity *= parentTransform.opacity;
        this.finalTransform.opMdf = parentTransform.opMdf ? true : this.finalTransform.opMdf;
        this.finalTransform.matMdf = parentTransform.matMdf ? true : this.finalTransform.matMdf
    }

    if(this.data.hasMask){
        this.globalData.renderer.save(true);
        this.maskManager.renderFrame(this.data.ty === 0?null:finalMat);
    }
    if(this.data.hd){
        this.isVisible = false;
    }
    return this.isVisible;

};

CVBaseElement.prototype.addMasks = function(data){
    this.maskManager = new CVMaskElement(data,this,this.globalData);
};


CVBaseElement.prototype.destroy = function(){
    this.canvasContext = null;
    this.data = null;
    this.globalData = null;
    if(this.maskManager) {
        this.maskManager.destroy();
    }
};

CVBaseElement.prototype.mHelper = new Matrix();

function CVCompElement(data, comp,globalData){
    this._parent.constructor.call(this,data, comp,globalData);
    var compGlobalData = {};
    for(var s in globalData){
        if(globalData.hasOwnProperty(s)){
            compGlobalData[s] = globalData[s];
        }
    }
    compGlobalData.renderer = this;
    compGlobalData.compHeight = this.data.h;
    compGlobalData.compWidth = this.data.w;
    this.renderConfig = {
        clearCanvas: true
    };
    this.contextData = {
        saved : Array.apply(null,{length:15}),
        savedOp: Array.apply(null,{length:15}),
        cArrPos : 0,
        cTr : new Matrix(),
        cO : 1
    };
    this.completeLayers = false;
    var i, len = 15;
    for(i=0;i<len;i+=1){
        this.contextData.saved[i] = Array.apply(null,{length:16});
    }
    this.transformMat = new Matrix();
    this.parentGlobalData = this.globalData;
    var cv = document.createElement('canvas');
    //document.body.appendChild(cv);
    compGlobalData.canvasContext = cv.getContext('2d');
    this.canvasContext = compGlobalData.canvasContext;
    cv.width = this.data.w;
    cv.height = this.data.h;
    this.canvas = cv;
    this.globalData = compGlobalData;
    this.layers = data.layers;
    this.pendingElements = [];
    this.elements = Array.apply(null,{length:this.layers.length});
    if(this.data.tm){
        this.tm = PropertyFactory.getProp(this,this.data.tm,0,globalData.frameRate,this.dynamicProperties);
    }
    if(this.data.xt || !globalData.progressiveLoad){
        this.buildAllItems();
    }
}
createElement(CVBaseElement, CVCompElement);

CVCompElement.prototype.ctxTransform = CanvasRenderer.prototype.ctxTransform;
CVCompElement.prototype.ctxOpacity = CanvasRenderer.prototype.ctxOpacity;
CVCompElement.prototype.save = CanvasRenderer.prototype.save;
CVCompElement.prototype.restore = CanvasRenderer.prototype.restore;
CVCompElement.prototype.reset =  function(){
    this.contextData.cArrPos = 0;
    this.contextData.cTr.reset();
    this.contextData.cO = 1;
};
CVCompElement.prototype.resize = function(transformCanvas){
    var maxScale = Math.max(transformCanvas.sx,transformCanvas.sy);
    this.canvas.width = this.data.w*maxScale;
    this.canvas.height = this.data.h*maxScale;
    this.transformCanvas = {
        sc:maxScale,
        w:this.data.w*maxScale,
        h:this.data.h*maxScale,
        props:[maxScale,0,0,0,0,maxScale,0,0,0,0,1,0,0,0,0,1]
    }
    var i,len = this.elements.length;
    for( i = 0; i < len; i+=1 ){
        if(this.elements[i] && this.elements[i].data.ty === 0){
            this.elements[i].resize(transformCanvas);
        }
    }
};

CVCompElement.prototype.prepareFrame = function(num){
    this.globalData.frameId = this.parentGlobalData.frameId;
    this.globalData.mdf = false;
    this._parent.prepareFrame.call(this,num);
    if(this.isVisible===false && !this.data.xt){
        return;
    }
    var timeRemapped = num;
    if(this.tm){
        timeRemapped = this.tm.v;
        if(timeRemapped === this.data.op){
            timeRemapped = this.data.op - 1;
        }
    }
    this.renderedFrame = timeRemapped/this.data.sr;
    var i,len = this.elements.length;

    if(!this.completeLayers){
        this.checkLayers(num);
    }

    for( i = 0; i < len; i+=1 ){
        if(this.completeLayers || this.elements[i]){
            this.elements[i].prepareFrame(timeRemapped/this.data.sr - this.layers[i].st);
            if(this.elements[i].data.ty === 0 && this.elements[i].globalData.mdf){
                this.globalData.mdf = true;
            }
        }
    }
    if(this.globalData.mdf && !this.data.xt){
        this.canvasContext.clearRect(0, 0, this.data.w, this.data.h);
        this.ctxTransform(this.transformCanvas.props);
    }
};

CVCompElement.prototype.renderFrame = function(parentMatrix){
    if(this._parent.renderFrame.call(this,parentMatrix)===false){
        return;
    }
    if(this.globalData.mdf){
        var i,len = this.layers.length;
        for( i = len - 1; i >= 0; i -= 1 ){
            if(this.completeLayers || this.elements[i]){
                this.elements[i].renderFrame();
            }
        }
    }
    if(this.data.hasMask){
        this.globalData.renderer.restore(true);
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
    this.parentGlobalData.renderer.save();
    this.parentGlobalData.renderer.ctxTransform(this.finalTransform.mat.props);
    this.parentGlobalData.renderer.ctxOpacity(this.finalTransform.opacity);
    this.parentGlobalData.renderer.canvasContext.drawImage(this.canvas,0,0,this.data.w,this.data.h);
    this.parentGlobalData.renderer.restore();

    if(this.globalData.mdf){
        this.reset();
    }
};

CVCompElement.prototype.setElements = function(elems){
    this.elements = elems;
};

CVCompElement.prototype.getElements = function(){
    return this.elements;
};

CVCompElement.prototype.destroy = function(){
    var i,len = this.layers.length;
    for( i = len - 1; i >= 0; i -= 1 ){
        this.elements[i].destroy();
    }
    this.layers = null;
    this.elements = null;
    this._parent.destroy.call(this._parent);
};
CVCompElement.prototype.checkLayers = CanvasRenderer.prototype.checkLayers;
CVCompElement.prototype.buildItem = CanvasRenderer.prototype.buildItem;
CVCompElement.prototype.checkPendingElements = CanvasRenderer.prototype.checkPendingElements;
CVCompElement.prototype.addPendingElement = CanvasRenderer.prototype.addPendingElement;
CVCompElement.prototype.buildAllItems = CanvasRenderer.prototype.buildAllItems;
CVCompElement.prototype.createItem = CanvasRenderer.prototype.createItem;
CVCompElement.prototype.createImage = CanvasRenderer.prototype.createImage;
CVCompElement.prototype.createComp = CanvasRenderer.prototype.createComp;
CVCompElement.prototype.createSolid = CanvasRenderer.prototype.createSolid;
CVCompElement.prototype.createShape = CanvasRenderer.prototype.createShape;
CVCompElement.prototype.createText = CanvasRenderer.prototype.createText;
CVCompElement.prototype.createBase = CanvasRenderer.prototype.createBase;
CVCompElement.prototype.buildElementParenting = CanvasRenderer.prototype.buildElementParenting;
function CVImageElement(data, comp,globalData){
    this.assetData = globalData.getAssetData(data.refId);
    this._parent.constructor.call(this,data, comp,globalData);
    this.globalData.addPendingElement();
}
createElement(CVBaseElement, CVImageElement);

CVImageElement.prototype.createElements = function(){
    var imageLoaded = function(){
        this.globalData.elementLoaded();
        if(this.assetData.w !== this.img.width || this.assetData.h !== this.img.height){
            var canvas = document.createElement('canvas');
            canvas.width = this.assetData.w;
            canvas.height = this.assetData.h;
            var ctx = canvas.getContext('2d');

            var imgW = this.img.width;
            var imgH = this.img.height;
            var imgRel = imgW / imgH;
            var canvasRel = this.assetData.w/this.assetData.h;
            var widthCrop, heightCrop;
            if(imgRel>canvasRel){
                heightCrop = imgH;
                widthCrop = heightCrop*canvasRel;
            } else {
                widthCrop = imgW;
                heightCrop = widthCrop/canvasRel;
            }
            ctx.drawImage(this.img,(imgW-widthCrop)/2,(imgH-heightCrop)/2,widthCrop,heightCrop,0,0,this.assetData.w,this.assetData.h);
            this.img = canvas;
        }
    }.bind(this);
    var imageFailed = function(){
        this.failed = true;
        this.globalData.elementLoaded();
    }.bind(this);

    this.img = new Image();
    this.img.addEventListener('load', imageLoaded, false);
    this.img.addEventListener('error', imageFailed, false);
    var assetPath = this.globalData.getAssetsPath(this.assetData);
    this.img.src = assetPath;

    this._parent.createElements.call(this);

};

CVImageElement.prototype.renderFrame = function(parentMatrix){
    if(this.failed){
        return;
    }
    if(this._parent.renderFrame.call(this,parentMatrix)===false){
        return;
    }
    var ctx = this.canvasContext;
    this.globalData.renderer.save();
    var finalMat = this.finalTransform.mat.props;
    this.globalData.renderer.ctxTransform(finalMat);
    this.globalData.renderer.ctxOpacity(this.finalTransform.opacity);
    ctx.drawImage(this.img,0,0);
    this.globalData.renderer.restore(this.data.hasMask);
    if(this.firstFrame){
        this.firstFrame = false;
    }
};

CVImageElement.prototype.destroy = function(){
    this.img = null;
    this._parent.destroy.call(this._parent);
};

function CVMaskElement(data,element){
    this.data = data;
    this.element = element;
    this.dynamicProperties = [];
    this.masksProperties = this.data.masksProperties;
    this.viewData = Array.apply(null,{length:this.masksProperties.length});
    var i, len = this.masksProperties.length;
    for (i = 0; i < len; i++) {
        this.viewData[i] = ShapePropertyFactory.getShapeProp(this.element,this.masksProperties[i],3,this.dynamicProperties,null);
    }
}

CVMaskElement.prototype.prepareFrame = function(num){
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue(num);
        if(this.dynamicProperties[i].mdf){
            this.element.globalData.mdf = true;
        }
    }
};

CVMaskElement.prototype.renderFrame = function (transform) {
    var ctx = this.element.canvasContext;
    var i, len = this.data.masksProperties.length;
    var pt,pt2,pt3,data, hasMasks = false;
    for (i = 0; i < len; i++) {
        if(this.masksProperties[i].mode === 'n'){
            continue;
        }
        if(hasMasks === false){
            ctx.beginPath();
            hasMasks = true;
        }
        if (this.masksProperties[i].inv) {
            ctx.moveTo(0, 0);
            ctx.lineTo(this.element.globalData.compWidth, 0);
            ctx.lineTo(this.element.globalData.compWidth, this.element.globalData.compHeight);
            ctx.lineTo(0, this.element.globalData.compHeight);
            ctx.lineTo(0, 0);
        }
        data = this.viewData[i].v;
        pt = transform ? transform.applyToPointArray(data.v[0][0],data.v[0][1],0):data.v[0];
        ctx.moveTo(pt[0], pt[1]);
        var j, jLen = data._length;
        for (j = 1; j < jLen; j++) {
            pt = transform ? transform.applyToPointArray(data.o[j - 1][0],data.o[j - 1][1],0) : data.o[j - 1];
            pt2 = transform ? transform.applyToPointArray(data.i[j][0],data.i[j][1],0) : data.i[j];
            pt3 = transform ? transform.applyToPointArray(data.v[j][0],data.v[j][1],0) : data.v[j];
            ctx.bezierCurveTo(pt[0], pt[1], pt2[0], pt2[1], pt3[0], pt3[1]);
        }
        pt = transform ? transform.applyToPointArray(data.o[j - 1][0],data.o[j - 1][1],0) : data.o[j - 1];
        pt2 = transform ? transform.applyToPointArray(data.i[0][0],data.i[0][1],0) : data.i[0];
        pt3 = transform ? transform.applyToPointArray(data.v[0][0],data.v[0][1],0) : data.v[0];
        ctx.bezierCurveTo(pt[0], pt[1], pt2[0], pt2[1], pt3[0], pt3[1]);
    }
    if(hasMasks){
        ctx.clip();
    }
};

CVMaskElement.prototype.getMaskProperty = MaskElement.prototype.getMaskProperty;

CVMaskElement.prototype.destroy = function(){
    this.element = null;
};
function CVShapeElement(data, comp,globalData){
    this.shapes = [];
    this.shapesData = data.shapes;
    this.stylesList = [];
    this.itemsData = [];
    this.prevViewData = [];
    this.shapeModifiers = [];
    this.processedElements = [];
    this._parent.constructor.call(this,data, comp,globalData);
}
createElement(CVBaseElement, CVShapeElement);

CVShapeElement.prototype.transformHelper = {opacity:1,mat:new Matrix(),matMdf:false,opMdf:false};

CVShapeElement.prototype.dashResetter = [];

CVShapeElement.prototype.createElements = function(){

    this._parent.createElements.call(this);
    this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.dynamicProperties, true);
};

CVShapeElement.prototype.createStyleElement = function(data, dynamicProperties){
    var styleElem = {
        data: data,
        type: data.ty,
        elements: []
    };
    var elementData = {};
    if(data.ty == 'fl' || data.ty == 'st'){
        elementData.c = PropertyFactory.getProp(this,data.c,1,255,dynamicProperties);
        if(!elementData.c.k){
            styleElem.co = 'rgb('+bm_floor(elementData.c.v[0])+','+bm_floor(elementData.c.v[1])+','+bm_floor(elementData.c.v[2])+')';
        }
    }
    elementData.o = PropertyFactory.getProp(this,data.o,0,0.01,dynamicProperties);
    if(data.ty == 'st') {
        styleElem.lc = this.lcEnum[data.lc] || 'round';
        styleElem.lj = this.ljEnum[data.lj] || 'round';
        if(data.lj == 1) {
            styleElem.ml = data.ml;
        }
        elementData.w = PropertyFactory.getProp(this,data.w,0,null,dynamicProperties);
        if(!elementData.w.k){
            styleElem.wi = elementData.w.v;
        }
        if(data.d){
            var d = new DashProperty(this,data.d,'canvas',dynamicProperties);
            elementData.d = d;
            if(!elementData.d.k){
                styleElem.da = elementData.d.dashArray;
                styleElem.do = elementData.d.dashoffset[0];
            }
        }

    } else {

        styleElem.r = data.r === 2 ? 'evenodd' : 'nonzero';
    }
    this.stylesList.push(styleElem);
    elementData.style = styleElem;
    return elementData;
}

CVShapeElement.prototype.createGroupElement = function(data) {
    var elementData = {
        it: [],
        prevViewData: []
    };
    return elementData;
}

CVShapeElement.prototype.createTransformElement = function(data, dynamicProperties) {
    var elementData = {
        transform : {
            mat: new Matrix(),
            opacity: 1,
            matMdf:false,
            opMdf:false,
            op: PropertyFactory.getProp(this,data.o,0,0.01,dynamicProperties),
            //mProps: PropertyFactory.getProp(this,data,2,null,dynamicProperties)
            mProps: TransformPropertyFactory.getTransformProperty(this,data,dynamicProperties)
        },
        elements: []
    };
    return elementData;
}

CVShapeElement.prototype.createShapeElement = function(data, dynamicProperties) {
    var elementData = {
        nodes:[],
        trNodes:[],
        tr:[0,0,0,0,0,0]
    };
    var ty = 4;
    if(data.ty == 'rc'){
        ty = 5;
    }else if(data.ty == 'el'){
        ty = 6;
    }else if(data.ty == 'sr'){
        ty = 7;
    }
    elementData.sh = ShapePropertyFactory.getShapeProp(this,data,ty,dynamicProperties);
    this.shapes.push(elementData.sh);
    this.addShapeToModifiers(elementData);
    jLen = this.stylesList.length;
    var hasStrokes = false, hasFills = false;
    for(j=0;j<jLen;j+=1){
        if(!this.stylesList[j].closed){
            this.stylesList[j].elements.push(elementData);
            if(this.stylesList[j].type === 'st'){
                hasStrokes = true;
            }else{
                hasFills = true;
            }
        }
    }
    elementData.st = hasStrokes;
    elementData.fl = hasFills;
    return elementData;
}

CVShapeElement.prototype.reloadShapes = function(){
    this.firstFrame = true;
    var i, len = this.itemsData.length;
    for(i=0;i<len;i+=1){
        this.prevViewData[i] = this.itemsData[i];
    }
    this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.dynamicProperties, true);
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
    }
    this.renderModifiers();
}

CVShapeElement.prototype.searchShapes = function(arr,itemsData, prevViewData,dynamicProperties, render){
    var i, len = arr.length - 1;
    var j, jLen;
    var ownArrays = [], ownModifiers = [], processedPos;
    for(i=len;i>=0;i-=1){
        processedPos = this.searchProcessedElement(arr[i]);
        if(!processedPos){
            arr[i]._render = render;
        } else {
            itemsData[i] = prevViewData[processedPos - 1];
        }
        if(arr[i].ty == 'fl' || arr[i].ty == 'st'){
            if(!processedPos){
                itemsData[i] = this.createStyleElement(arr[i], dynamicProperties);
            } else {
                itemsData[i].style.closed = false;
            }
            
            ownArrays.push(itemsData[i].style);
        }else if(arr[i].ty == 'gr'){
            if(!processedPos){
                itemsData[i] = this.createGroupElement(arr[i]);
            } else {
                jLen = itemsData[i].it.length;
                for(j=0;j<jLen;j+=1){
                    itemsData[i].prevViewData[j] = itemsData[i].it[j];
                }
            }
            this.searchShapes(arr[i].it,itemsData[i].it,itemsData[i].prevViewData,dynamicProperties, render);
        }else if(arr[i].ty == 'tr'){
            if(!processedPos){
                itemsData[i] = this.createTransformElement(arr[i], dynamicProperties);
            }
        }else if(arr[i].ty == 'sh' || arr[i].ty == 'rc' || arr[i].ty == 'el' || arr[i].ty == 'sr'){
            if(!processedPos){
                itemsData[i] = this.createShapeElement(arr[i], dynamicProperties);
            }
            
        }else if(arr[i].ty == 'tm' || arr[i].ty == 'rd'){
            if(!processedPos){
                var modifier = ShapeModifiers.getModifier(arr[i].ty);
                modifier.init(this,arr[i],dynamicProperties);
                itemsData[i] = modifier;
                this.shapeModifiers.push(modifier);
            } else {
                modifier = itemsData[i];
                modifier.closed = false;
            }
            ownModifiers.push(modifier);
        } else if(arr[i].ty == 'rp'){
            if(!processedPos){
                modifier = ShapeModifiers.getModifier(arr[i].ty);
                itemsData[i] = modifier;
                modifier.init(this,arr,i,itemsData,dynamicProperties);
                this.shapeModifiers.push(modifier);
                render = false;
            }else{
                modifier = itemsData[i];
                modifier.closed = true;
            }
            ownModifiers.push(modifier);
        }
        this.addProcessedElement(arr[i], i + 1);
    }
    len = ownArrays.length;
    for(i=0;i<len;i+=1){
        ownArrays[i].closed = true;
    }
    len = ownModifiers.length;
    for(i=0;i<len;i+=1){
        ownModifiers[i].closed = true;
    }
};

CVShapeElement.prototype.addShapeToModifiers = IShapeElement.prototype.addShapeToModifiers;
CVShapeElement.prototype.renderModifiers = IShapeElement.prototype.renderModifiers;
CVShapeElement.prototype.lcEnum = IShapeElement.prototype.lcEnum;
CVShapeElement.prototype.ljEnum = IShapeElement.prototype.ljEnum;
CVShapeElement.prototype.searchProcessedElement = IShapeElement.prototype.searchProcessedElement;
CVShapeElement.prototype.addProcessedElement = IShapeElement.prototype.addProcessedElement;

CVShapeElement.prototype.renderFrame = function(parentMatrix){
    if(this._parent.renderFrame.call(this, parentMatrix)===false){
        return;
    }
    this.transformHelper.mat.reset();
    this.transformHelper.opacity = this.finalTransform.opacity;
    this.transformHelper.matMdf = false;
    this.transformHelper.opMdf = this.finalTransform.opMdf;
    this.renderModifiers();
    this.renderShape(this.transformHelper,null,null,true);
    if(this.data.hasMask){
        this.globalData.renderer.restore(true);
    }
};

CVShapeElement.prototype.renderShape = function(parentTransform,items,data,isMain){
    var i, len;
    if(!items){
        items = this.shapesData;
        len = this.stylesList.length;
        for(i=0;i<len;i+=1){
            this.stylesList[i].d = '';
            this.stylesList[i].mdf = false;
        }
    }
    if(!data){
        data = this.itemsData;
    }
    ///
    ///
    len = items.length - 1;
    var groupTransform,groupMatrix;
    groupTransform = parentTransform;
    for(i=len;i>=0;i-=1){
        if(items[i].ty == 'tr'){
            groupTransform = data[i].transform;
            var mtArr = data[i].transform.mProps.v.props;
            groupTransform.matMdf = groupTransform.mProps.mdf;
            groupTransform.opMdf = groupTransform.op.mdf;
            groupMatrix = groupTransform.mat;
            groupMatrix.cloneFromProps(mtArr);
            if(parentTransform){
                var props = parentTransform.mat.props;
                groupTransform.opacity = parentTransform.opacity;
                groupTransform.opacity *= data[i].transform.op.v;
                groupTransform.matMdf = parentTransform.matMdf ? true : groupTransform.matMdf;
                groupTransform.opMdf = parentTransform.opMdf ? true : groupTransform.opMdf;
                groupMatrix.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);
            }else{
                groupTransform.opacity = groupTransform.op.o;
            }
        }else if(items[i].ty == 'sh' || items[i].ty == 'el' || items[i].ty == 'rc' || items[i].ty == 'sr'){
            this.renderPath(items[i],data[i],groupTransform);
        }else if(items[i].ty == 'fl'){
            this.renderFill(items[i],data[i],groupTransform);
        }else if(items[i].ty == 'st'){
            this.renderStroke(items[i],data[i],groupTransform);
        }else if(items[i].ty == 'gr'){
            this.renderShape(groupTransform,items[i].it,data[i].it);
        }else if(items[i].ty == 'tm'){
            //
        }
    }
    if(!isMain){
        return;
    }
    len = this.stylesList.length;
    var j, jLen, k, kLen,elems,nodes, renderer = this.globalData.renderer, ctx = this.globalData.canvasContext, type;
    renderer.save();
    renderer.ctxTransform(this.finalTransform.mat.props);
    for(i=0;i<len;i+=1){
        type = this.stylesList[i].type;
        if((type === 'st' && this.stylesList[i].wi === 0) || !this.stylesList[i].data._render){
            continue;
        }
        renderer.save();
        elems = this.stylesList[i].elements;
        if(type === 'st'){
            ctx.strokeStyle = this.stylesList[i].co;
            ctx.lineWidth = this.stylesList[i].wi;
            ctx.lineCap = this.stylesList[i].lc;
            ctx.lineJoin = this.stylesList[i].lj;
            ctx.miterLimit = this.stylesList[i].ml || 0;
        }else{
            ctx.fillStyle = this.stylesList[i].co;
        }
        renderer.ctxOpacity(this.stylesList[i].coOp);
        if(type !== 'st'){
            ctx.beginPath();
        }
        jLen = elems.length;
        for(j=0;j<jLen;j+=1){
            if(type === 'st'){
                ctx.beginPath();
                if(this.stylesList[i].da){
                    ctx.setLineDash(this.stylesList[i].da);
                    ctx.lineDashOffset = this.stylesList[i].do;
                    this.globalData.isDashed = true;
                }else if(this.globalData.isDashed){
                    ctx.setLineDash(this.dashResetter);
                    this.globalData.isDashed = false;
                }
            }
            nodes = elems[j].trNodes;
            kLen = nodes.length;

            for(k=0;k<kLen;k+=1){
                if(nodes[k].t == 'm'){
                    ctx.moveTo(nodes[k].p[0],nodes[k].p[1]);
                }else if(nodes[k].t == 'c'){
                    ctx.bezierCurveTo(nodes[k].p1[0],nodes[k].p1[1],nodes[k].p2[0],nodes[k].p2[1],nodes[k].p3[0],nodes[k].p3[1]);
                }else{
                    ctx.closePath();
                }
            }
            if(type === 'st'){
                ctx.stroke();
            }
        }
        if(type !== 'st'){
            ctx.fill(this.stylesList[i].r);
        }
        renderer.restore();
    }
    renderer.restore();
    if(this.firstFrame){
        this.firstFrame = false;
    }
};
CVShapeElement.prototype.renderPath = function(pathData,itemData,groupTransform){
    var len, i, j,jLen;
    var redraw = groupTransform.matMdf || itemData.sh.mdf || this.firstFrame;
    if(redraw) {
        var paths = itemData.sh.paths, groupTransformMat = groupTransform.mat;
        jLen = paths._length;
        var pathStringTransformed = itemData.trNodes;
        pathStringTransformed.length = 0;
        for(j=0;j<jLen;j+=1){
            var pathNodes = paths.shapes[j];
            if(pathNodes && pathNodes.v){
                len = pathNodes._length;
                for (i = 1; i < len; i += 1) {
                    if (i == 1) {
                        pathStringTransformed.push({
                            t: 'm',
                            p: groupTransformMat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                        });
                    }
                    pathStringTransformed.push({
                        t: 'c',
                        p1: groupTransformMat.applyToPointArray(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1], 0),
                        p2: groupTransformMat.applyToPointArray(pathNodes.i[i][0], pathNodes.i[i][1], 0),
                        p3: groupTransformMat.applyToPointArray(pathNodes.v[i][0], pathNodes.v[i][1], 0)
                    });
                }
                if (len == 1) {
                    pathStringTransformed.push({
                        t: 'm',
                        p: groupTransformMat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                    });
                }
                if (pathNodes.c && len) {
                    pathStringTransformed.push({
                        t: 'c',
                        p1: groupTransformMat.applyToPointArray(pathNodes.o[i - 1][0], pathNodes.o[i - 1][1], 0),
                        p2: groupTransformMat.applyToPointArray(pathNodes.i[0][0], pathNodes.i[0][1], 0),
                        p3: groupTransformMat.applyToPointArray(pathNodes.v[0][0], pathNodes.v[0][1], 0)
                    });
                    pathStringTransformed.push({
                        t: 'z'
                    });
                }
                itemData.lStr = pathStringTransformed;
            }

        }

        if (itemData.st) {
            for (i = 0; i < 16; i += 1) {
                itemData.tr[i] = groupTransform.mat.props[i];
            }
        }
        itemData.trNodes = pathStringTransformed;

    }
};



CVShapeElement.prototype.renderFill = function(styleData,itemData, groupTransform){
    var styleElem = itemData.style;

    if(itemData.c.mdf || this.firstFrame){
        styleElem.co = 'rgb('+bm_floor(itemData.c.v[0])+','+bm_floor(itemData.c.v[1])+','+bm_floor(itemData.c.v[2])+')';
    }
    if(itemData.o.mdf || groupTransform.opMdf || this.firstFrame){
        styleElem.coOp = itemData.o.v*groupTransform.opacity;
    }
};

CVShapeElement.prototype.renderStroke = function(styleData,itemData, groupTransform){
    var styleElem = itemData.style;
    //TODO fix dashes
    var d = itemData.d;
    if(d && (d.mdf  || this.firstFrame)){
        styleElem.da = d.dashArray;
        styleElem.do = d.dashoffset[0];
    }
    if(itemData.c.mdf || this.firstFrame){
        styleElem.co = 'rgb('+bm_floor(itemData.c.v[0])+','+bm_floor(itemData.c.v[1])+','+bm_floor(itemData.c.v[2])+')';
    }
    if(itemData.o.mdf || groupTransform.opMdf || this.firstFrame){
        styleElem.coOp = itemData.o.v*groupTransform.opacity;
    }
    if(itemData.w.mdf || this.firstFrame){
        styleElem.wi = itemData.w.v;
    }
};


CVShapeElement.prototype.destroy = function(){
    this.shapesData = null;
    this.globalData = null;
    this.canvasContext = null;
    this.stylesList.length = 0;
    this.itemsData.length = 0;
    this._parent.destroy.call(this._parent);
};


function CVSolidElement(data, comp,globalData){
    this._parent.constructor.call(this,data, comp,globalData);
}
createElement(CVBaseElement, CVSolidElement);

CVSolidElement.prototype.renderFrame = function(parentMatrix){
    if(this._parent.renderFrame.call(this, parentMatrix)===false){
        return;
    }
    var ctx = this.canvasContext;
    this.globalData.renderer.save();
    this.globalData.renderer.ctxTransform(this.finalTransform.mat.props);
    this.globalData.renderer.ctxOpacity(this.finalTransform.opacity);
    ctx.fillStyle=this.data.sc;
    ctx.fillRect(0,0,this.data.sw,this.data.sh);
    this.globalData.renderer.restore(this.data.hasMask);
    if(this.firstFrame){
        this.firstFrame = false;
    }
};
function CVTextElement(data, comp, globalData){
    this.textSpans = [];
    this.yOffset = 0;
    this.fillColorAnim = false;
    this.strokeColorAnim = false;
    this.strokeWidthAnim = false;
    this.stroke = false;
    this.fill = false;
    this.justifyOffset = 0;
    this.currentRender = null;
    this.renderType = 'canvas';
    this.values = {
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(0,0,0,0)',
        sWidth: 0,
        fValue: ''
    }
    this._parent.constructor.call(this,data,comp, globalData);
}
createElement(CVBaseElement, CVTextElement);

extendPrototype(ITextElement, CVTextElement);

CVTextElement.prototype.tHelper = document.createElement('canvas').getContext('2d');

CVTextElement.prototype.createElements = function(){

    this._parent.createElements.call(this);
    //console.log('this.data: ',this.data);

};

CVTextElement.prototype.buildNewText = function(){
    var documentData = this.textProperty.currentData;
    this.renderedLetters = Array.apply(null,{length:documentData.l ? documentData.l.length : 0});

    var hasFill = false;
    if(documentData.fc) {
        hasFill = true;
        this.values.fill = this.buildColor(documentData.fc);
    }else{
        this.values.fill = 'rgba(0,0,0,0)';
    }
    this.fill = hasFill;
    var hasStroke = false;
    if(documentData.sc){
        hasStroke = true;
        this.values.stroke = this.buildColor(documentData.sc);
        this.values.sWidth = documentData.sw;
    }
    var fontData = this.globalData.fontManager.getFontByName(documentData.f);
    var i, len;
    var letters = documentData.l;
    var matrixHelper = this.mHelper;
    this.stroke = hasStroke;
    this.values.fValue = documentData.s + 'px '+ this.globalData.fontManager.getFontByName(documentData.f).fFamily;
    len = documentData.t.length;
    //this.tHelper.font = this.values.fValue;
    var charData, shapeData, k, kLen, shapes, j, jLen, pathNodes, commands, pathArr, singleShape = this.data.singleShape;
    var trackingOffset = documentData.tr/1000*documentData.s;
    var xPos = 0, yPos = 0, firstLine = true;
    var cnt = 0;
    for (i = 0; i < len; i += 1) {
        charData = this.globalData.fontManager.getCharData(documentData.t.charAt(i), fontData.fStyle, this.globalData.fontManager.getFontByName(documentData.f).fFamily);
        shapeData = charData && charData.data || {};
        matrixHelper.reset();
        if(singleShape && letters[i].n) {
            xPos = -trackingOffset;
            yPos += documentData.yOffset;
            yPos += firstLine ? 1 : 0;
            firstLine = false;
        }

        shapes = shapeData.shapes ? shapeData.shapes[0].it : [];
        jLen = shapes.length;
        matrixHelper.scale(documentData.s/100,documentData.s/100);
        if(singleShape){
            this.applyTextPropertiesToMatrix(documentData, matrixHelper, letters[i].line, xPos, yPos);
        }
        commands = Array.apply(null,{length:jLen})
        for(j=0;j<jLen;j+=1){
            kLen = shapes[j].ks.k.i.length;
            pathNodes = shapes[j].ks.k;
            pathArr = [];
            for(k=1;k<kLen;k+=1){
                if(k==1){
                    pathArr.push(matrixHelper.applyToX(pathNodes.v[0][0],pathNodes.v[0][1],0),matrixHelper.applyToY(pathNodes.v[0][0],pathNodes.v[0][1],0));
                }
                pathArr.push(matrixHelper.applyToX(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToY(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToX(pathNodes.i[k][0],pathNodes.i[k][1],0),matrixHelper.applyToY(pathNodes.i[k][0],pathNodes.i[k][1],0),matrixHelper.applyToX(pathNodes.v[k][0],pathNodes.v[k][1],0),matrixHelper.applyToY(pathNodes.v[k][0],pathNodes.v[k][1],0));
            }
            pathArr.push(matrixHelper.applyToX(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToY(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToX(pathNodes.i[0][0],pathNodes.i[0][1],0),matrixHelper.applyToY(pathNodes.i[0][0],pathNodes.i[0][1],0),matrixHelper.applyToX(pathNodes.v[0][0],pathNodes.v[0][1],0),matrixHelper.applyToY(pathNodes.v[0][0],pathNodes.v[0][1],0));
            commands[j] = pathArr;
        }
        if(singleShape){
            xPos += letters[i].l;
            xPos += trackingOffset;
        }
        if(this.textSpans[cnt]){
            this.textSpans[cnt].elem = commands;
        } else {
            this.textSpans[cnt] = {elem: commands};
        }
        cnt +=1;
    }
}

CVTextElement.prototype.renderFrame = function(parentMatrix){
    if(this._parent.renderFrame.call(this, parentMatrix)===false){
        return;
    }
    var ctx = this.canvasContext;
    var finalMat = this.finalTransform.mat.props;
    this.globalData.renderer.save();
    this.globalData.renderer.ctxTransform(finalMat);
    this.globalData.renderer.ctxOpacity(this.finalTransform.opacity);
    ctx.font = this.values.fValue;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;

    if(!this.data.singleShape){
        this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
    }

    var  i,len, j, jLen, k, kLen;
    var renderedLetters = this.textAnimator.renderedLetters;

    var letters = this.textProperty.currentData.l;

    len = letters.length;
    var renderedLetter;
    var lastFill = null, lastStroke = null, lastStrokeW = null, commands, pathArr;
    for(i=0;i<len;i+=1){
        if(letters[i].n){
            continue;
        }
        renderedLetter = renderedLetters[i];
        if(renderedLetter){
            this.globalData.renderer.save();
            this.globalData.renderer.ctxTransform(renderedLetter.p);
            this.globalData.renderer.ctxOpacity(renderedLetter.o);
        }
        if(this.fill){
            if(renderedLetter && renderedLetter.fc){
                if(lastFill !== renderedLetter.fc){
                    lastFill = renderedLetter.fc;
                    ctx.fillStyle = renderedLetter.fc;
                }
            }else if(lastFill !== this.values.fill){
                lastFill = this.values.fill;
                ctx.fillStyle = this.values.fill;
            }
            commands = this.textSpans[i].elem;
            jLen = commands.length;
            this.globalData.canvasContext.beginPath();
            for(j=0;j<jLen;j+=1) {
                pathArr = commands[j];
                kLen = pathArr.length;
                this.globalData.canvasContext.moveTo(pathArr[0], pathArr[1]);
                for (k = 2; k < kLen; k += 6) {
                    this.globalData.canvasContext.bezierCurveTo(pathArr[k], pathArr[k + 1], pathArr[k + 2], pathArr[k + 3], pathArr[k + 4], pathArr[k + 5]);
                }
            }
            this.globalData.canvasContext.closePath();
            this.globalData.canvasContext.fill();
            ///ctx.fillText(this.textSpans[i].val,0,0);
        }
        if(this.stroke){
            if(renderedLetter && renderedLetter.sw){
                if(lastStrokeW !== renderedLetter.sw){
                    lastStrokeW = renderedLetter.sw;
                    ctx.lineWidth = renderedLetter.sw;
                }
            }else if(lastStrokeW !== this.values.sWidth){
                lastStrokeW = this.values.sWidth;
                ctx.lineWidth = this.values.sWidth;
            }
            if(renderedLetter && renderedLetter.sc){
                if(lastStroke !== renderedLetter.sc){
                    lastStroke = renderedLetter.sc;
                    ctx.strokeStyle = renderedLetter.sc;
                }
            }else if(lastStroke !== this.values.stroke){
                lastStroke = this.values.stroke;
                ctx.strokeStyle = this.values.stroke;
            }
            commands = this.textSpans[i].elem;
            jLen = commands.length;
            this.globalData.canvasContext.beginPath();
            for(j=0;j<jLen;j+=1) {
                pathArr = commands[j];
                kLen = pathArr.length;
                this.globalData.canvasContext.moveTo(pathArr[0], pathArr[1]);
                for (k = 2; k < kLen; k += 6) {
                    this.globalData.canvasContext.bezierCurveTo(pathArr[k], pathArr[k + 1], pathArr[k + 2], pathArr[k + 3], pathArr[k + 4], pathArr[k + 5]);
                }
            }
            this.globalData.canvasContext.closePath();
            this.globalData.canvasContext.stroke();
            ///ctx.strokeText(letters[i].val,0,0);
        }
        if(renderedLetter) {
            this.globalData.renderer.restore();
        }
    }
    /*if(this.data.hasMask){
     this.globalData.renderer.restore(true);
     }*/
    this.globalData.renderer.restore(this.data.hasMask);
    if(this.firstFrame){
        this.firstFrame = false;
    }
};
function HBaseElement(data,parentContainer,globalData,comp, placeholder){
    this.globalData = globalData;
    this.comp = comp;
    this.data = data;
    this.matteElement = null;
    this.parentContainer = parentContainer;
    this.layerId = placeholder ? placeholder.layerId : 'ly_'+randomString(10);
    this.placeholder = placeholder;
    this.init();
};

createElement(BaseElement, HBaseElement);
HBaseElement.prototype.checkBlendMode = function(){

};
HBaseElement.prototype.setBlendMode = BaseElement.prototype.setBlendMode;

/*HBaseElement.prototype.appendNodeToParent = function(node) {
    if(this.data.hd){
        return;
    }
    if(this.placeholder){
        var g = this.placeholder.phElement;
        g.parentNode.insertBefore(node, g);
        //g.parentNode.removeChild(g);
    }else{
        this.parentContainer.appendChild(node);
    }
};*/


HBaseElement.prototype.getBaseElement = function(){
    return this.baseElement;
};

HBaseElement.prototype.createElements = function(){
    if(this.data.hasMask){
        this.layerElement = createNS('svg');
        styleDiv(this.layerElement);
        //this.appendNodeToParent(this.layerElement);
        this.baseElement = this.layerElement;
        this.maskedElement = this.layerElement;
    }else{
        this.layerElement = this.parentContainer;
    }
    this.transformedElement = this.layerElement;
    if(this.data.ln && (this.data.ty === 4 || this.data.ty === 0)){
        if(this.layerElement === this.parentContainer){
            this.layerElement = createNS('g');
            //this.appendNodeToParent(this.layerElement);
            this.baseElement = this.layerElement;
        }
        this.layerElement.setAttribute('id',this.data.ln);
    }
    this.setBlendMode();
    if(this.layerElement !== this.parentContainer){
        this.placeholder = null;
    }
    this.checkParenting();
};

HBaseElement.prototype.renderFrame = function(parentTransform){
    if(this.data.ty === 3){
        return false;
    }

    if(this.currentFrameNum === this.lastNum || !this.isVisible){
        return this.isVisible;
    }
    this.lastNum = this.currentFrameNum;

    this.finalTransform.opMdf = this.finalTransform.op.mdf;
    this.finalTransform.matMdf = this.finalTransform.mProp.mdf;
    this.finalTransform.opacity = this.finalTransform.op.v;
    if(this.firstFrame){
        this.finalTransform.opMdf = true;
        this.finalTransform.matMdf = true;
    }

    var mat;
    var finalMat = this.finalTransform.mat;

    if(this.hierarchy){
        var i, len = this.hierarchy.length;

        mat = this.finalTransform.mProp.v.props;
        finalMat.cloneFromProps(mat);
        for(i=0;i<len;i+=1){
            this.finalTransform.matMdf = this.hierarchy[i].finalTransform.mProp.mdf ? true : this.finalTransform.matMdf;
            mat = this.hierarchy[i].finalTransform.mProp.v.props;
            finalMat.transform(mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],mat[12],mat[13],mat[14],mat[15]);
        }
    }else{
        if(this.isVisible && this.finalTransform.matMdf){
            if(!parentTransform){
                finalMat.cloneFromProps(this.finalTransform.mProp.v.props);
            }else{
                mat = this.finalTransform.mProp.v.props;
                finalMat.cloneFromProps(mat);
            }
        }
    }
    if(this.data.hasMask){
        this.maskManager.renderFrame(finalMat);
    }

    if(parentTransform){
        mat = parentTransform.mat.props;
        finalMat.cloneFromProps(mat);
        this.finalTransform.opacity *= parentTransform.opacity;
        this.finalTransform.opMdf = parentTransform.opMdf ? true : this.finalTransform.opMdf;
        this.finalTransform.matMdf = parentTransform.matMdf ? true : this.finalTransform.matMdf
    }

    if(this.finalTransform.matMdf){
        this.transformedElement.style.transform = this.transformedElement.style.webkitTransform = finalMat.toCSS();
        this.finalMat = finalMat;
    }
    if(this.finalTransform.opMdf){
        this.transformedElement.style.opacity = this.finalTransform.opacity;
    }
    return this.isVisible;
};

HBaseElement.prototype.destroy = function(){
    this.layerElement = null;
    this.transformedElement = null;
    this.parentContainer = null;
    if(this.matteElement) {
        this.matteElement = null;
    }
    if(this.maskManager) {
        this.maskManager.destroy();
        this.maskManager = null;
    }
};

HBaseElement.prototype.getDomElement = function(){
    return this.layerElement;
};
HBaseElement.prototype.addMasks = function(data){
    this.maskManager = new MaskElement(data,this,this.globalData);
};

HBaseElement.prototype.hide = function(){
};

HBaseElement.prototype.setMatte = function(){

}

HBaseElement.prototype.buildElementParenting = HybridRenderer.prototype.buildElementParenting;
function HSolidElement(data,parentContainer,globalData,comp, placeholder){
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(HBaseElement, HSolidElement);

HSolidElement.prototype.createElements = function(){
    var parent = document.createElement('div');
    styleDiv(parent);
    var cont = createNS('svg');
    styleDiv(cont);
    cont.setAttribute('width',this.data.sw);
    cont.setAttribute('height',this.data.sh);
    parent.appendChild(cont);
    this.layerElement = parent;
    this.transformedElement = parent;
    //this.appendNodeToParent(parent);
    this.baseElement = parent;
    this.innerElem = parent;
    if(this.data.ln){
        this.innerElem.setAttribute('id',this.data.ln);
    }
    if(this.data.bm !== 0){
        this.setBlendMode();
    }
    var rect = createNS('rect');
    rect.setAttribute('width',this.data.sw);
    rect.setAttribute('height',this.data.sh);
    rect.setAttribute('fill',this.data.sc);
    cont.appendChild(rect);
    if(this.data.hasMask){
        this.maskedElement = rect;
    }
    this.checkParenting();
};



HSolidElement.prototype.hide = SVGBaseElement.prototype.hide;
HSolidElement.prototype.show = SVGBaseElement.prototype.show;
HSolidElement.prototype.renderFrame = IImageElement.prototype.renderFrame;
HSolidElement.prototype.destroy = IImageElement.prototype.destroy;
function HCompElement(data,parentContainer,globalData,comp, placeholder){
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
    this.layers = data.layers;
    this.supports3d = true;
    this.completeLayers = false;
    this.pendingElements = [];
    this.elements = Array.apply(null,{length:this.layers.length});
    if(this.data.tm){
        this.tm = PropertyFactory.getProp(this,this.data.tm,0,globalData.frameRate,this.dynamicProperties);
    }
    if(this.data.hasMask) {
        this.supports3d = false;
    }
    if(this.data.xt){
        this.layerElement = document.createElement('div');
    }
    this.buildAllItems();

}
createElement(HBaseElement, HCompElement);

HCompElement.prototype.createElements = function(){
    var divElement = document.createElement('div');
    styleDiv(divElement);
    if(this.data.ln){
        divElement.setAttribute('id',this.data.ln);
    }
    divElement.style.clip = 'rect(0px, '+this.data.w+'px, '+this.data.h+'px, 0px)';
    if(this.data.hasMask){
        var compSvg = createNS('svg');
        styleDiv(compSvg);
        compSvg.setAttribute('width',this.data.w);
        compSvg.setAttribute('height',this.data.h);
        var g = createNS('g');
        compSvg.appendChild(g);
        divElement.appendChild(compSvg);
        this.maskedElement = g;
        this.baseElement = divElement;
        this.layerElement = g;
        this.transformedElement = divElement;
    }else{
        this.layerElement = divElement;
        this.baseElement = this.layerElement;
        this.transformedElement = divElement;
    }
    //this.appendNodeToParent(this.layerElement);
    this.checkParenting();
};

HCompElement.prototype.hide = ICompElement.prototype.hide;
HCompElement.prototype.prepareFrame = ICompElement.prototype.prepareFrame;
HCompElement.prototype.setElements = ICompElement.prototype.setElements;
HCompElement.prototype.getElements = ICompElement.prototype.getElements;
HCompElement.prototype.destroy = ICompElement.prototype.destroy;

HCompElement.prototype.renderFrame = function(parentMatrix){
    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    var i,len = this.layers.length;
    if(renderParent===false){
        this.hide();
        return;
    }

    this.hidden = false;

    for( i = 0; i < len; i+=1 ){
        if(this.completeLayers || this.elements[i]){
            this.elements[i].renderFrame();
        }
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
};

HCompElement.prototype.checkLayers = BaseRenderer.prototype.checkLayers;
HCompElement.prototype.buildItem = HybridRenderer.prototype.buildItem;
HCompElement.prototype.checkPendingElements = HybridRenderer.prototype.checkPendingElements;
HCompElement.prototype.addPendingElement = HybridRenderer.prototype.addPendingElement;
HCompElement.prototype.buildAllItems = BaseRenderer.prototype.buildAllItems;
HCompElement.prototype.createItem = HybridRenderer.prototype.createItem;
HCompElement.prototype.buildElementParenting = HybridRenderer.prototype.buildElementParenting;
HCompElement.prototype.createImage = HybridRenderer.prototype.createImage;
HCompElement.prototype.createComp = HybridRenderer.prototype.createComp;
HCompElement.prototype.createSolid = HybridRenderer.prototype.createSolid;
HCompElement.prototype.createShape = HybridRenderer.prototype.createShape;
HCompElement.prototype.createText = HybridRenderer.prototype.createText;
HCompElement.prototype.createBase = HybridRenderer.prototype.createBase;
HCompElement.prototype.appendElementInPos = HybridRenderer.prototype.appendElementInPos;
function HShapeElement(data,parentContainer,globalData,comp, placeholder){
    this.shapes = [];
    this.shapesData = data.shapes;
    this.stylesList = [];
    this.itemsData = [];
    this.prevViewData = [];
    this.shapeModifiers = [];
    this.processedElements = [];
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
    this.currentBBox = {
        x:999999,
        y: -999999,
        h: 0,
        w: 0
    };
}
createElement(HBaseElement, HShapeElement);
var parent = HShapeElement.prototype._parent;
extendPrototype(IShapeElement, HShapeElement);
HShapeElement.prototype._parent = parent;
HShapeElement.prototype._renderShapeFrame = HShapeElement.prototype.renderFrame;

HShapeElement.prototype.createElements = function(){
    var parent = document.createElement('div');
    styleDiv(parent);
    var cont = createNS('svg');
    styleDiv(cont);
    var size = this.comp.data ? this.comp.data : this.globalData.compSize;
    cont.setAttribute('width',size.w);
    cont.setAttribute('height',size.h);
    if(this.data.hasMask){
        var g = createNS('g');
        parent.appendChild(cont);
        cont.appendChild(g);
        this.maskedElement = g;
        this.layerElement = g;
        this.shapesContainer = g;
    }else{
        parent.appendChild(cont);
        this.layerElement = cont;
        this.shapesContainer = createNS('g');
        this.layerElement.appendChild(this.shapesContainer);
    }
    if(!this.data.hd){
        //this.parentContainer.appendChild(parent);
        this.baseElement = parent;
    }
    this.innerElem = parent;
    if(this.data.ln){
        this.innerElem.setAttribute('id',this.data.ln);
    }

    this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.layerElement,this.dynamicProperties,0, [], true);
    this.buildExpressionInterface();
    this.layerElement = parent;
    this.transformedElement = parent;
    this.shapeCont = cont;
    if(this.data.bm !== 0){
        this.setBlendMode();
    }
    this.checkParenting();
};

HShapeElement.prototype.renderFrame = function(parentMatrix){
    var firstFrame = this.firstFrame;
    this._renderShapeFrame();

    if(this.isVisible && (this.elemMdf || firstFrame)){
        var boundingBox = this.shapeCont.getBBox();
        var changed = false;
        if(this.currentBBox.w !== boundingBox.width){
            this.currentBBox.w = boundingBox.width;
            this.shapeCont.setAttribute('width',boundingBox.width);
            changed = true;
        }
        if(this.currentBBox.h !== boundingBox.height){
            this.currentBBox.h = boundingBox.height;
            this.shapeCont.setAttribute('height',boundingBox.height);
            changed = true;
        }
        if(changed  || this.currentBBox.x !== boundingBox.x  || this.currentBBox.y !== boundingBox.y){
            this.currentBBox.w = boundingBox.width;
            this.currentBBox.h = boundingBox.height;
            this.currentBBox.x = boundingBox.x;
            this.currentBBox.y = boundingBox.y;

            this.shapeCont.setAttribute('viewBox',this.currentBBox.x+' '+this.currentBBox.y+' '+this.currentBBox.w+' '+this.currentBBox.h);
            this.shapeCont.style.transform = this.shapeCont.style.webkitTransform = 'translate(' + this.currentBBox.x + 'px,' + this.currentBBox.y + 'px)';
        }
    }

};
function HTextElement(data,parentContainer,globalData,comp, placeholder){
    this.textSpans = [];
    this.textPaths = [];
    this.currentBBox = {
        x:999999,
        y: -999999,
        h: 0,
        w: 0
    }
    this.renderType = 'svg';
    this.isMasked = false;
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);

}
createElement(HBaseElement, HTextElement);

extendPrototype(ITextElement, HTextElement);

HTextElement.prototype.createElements = function(){
    this.isMasked = this.checkMasks();
    var parent = document.createElement('div');
    styleDiv(parent);
    this.layerElement = parent;
    this.transformedElement = parent;
    if(this.isMasked){
        this.renderType = 'svg';
        var cont = createNS('svg');
        styleDiv(cont);
        this.cont = cont;
        this.compW = this.comp.data.w;
        this.compH = this.comp.data.h;
        cont.setAttribute('width',this.compW);
        cont.setAttribute('height',this.compH);
        var g = createNS('g');
        cont.appendChild(g);
        parent.appendChild(cont);
        this.maskedElement = g;
        this.innerElem = g;
    } else {
        this.renderType = 'html';
        this.innerElem = parent;
    }
    this.baseElement = parent;

    this.checkParenting();

};

HTextElement.prototype.buildNewText = function(){
    var documentData = this.textProperty.currentData;
    this.renderedLetters = Array.apply(null,{length:this.textProperty.currentData.l ? this.textProperty.currentData.l.length : 0});
    var innerElemStyle = this.innerElem.style;
    innerElemStyle.color = innerElemStyle.fill = documentData.fc ? this.buildColor(documentData.fc) : 'rgba(0,0,0,0)';
    if(documentData.sc){
        innerElemStyle.stroke = this.buildColor(documentData.sc);
        innerElemStyle.strokeWidth = documentData.sw+'px';
    }
    var fontData = this.globalData.fontManager.getFontByName(documentData.f);
    if(!this.globalData.fontManager.chars){
        innerElemStyle.fontSize = documentData.s+'px';
        innerElemStyle.lineHeight = documentData.s+'px';
        if(fontData.fClass){
            this.innerElem.className = fontData.fClass;
        } else {
            innerElemStyle.fontFamily = fontData.fFamily;
            var fWeight = documentData.fWeight, fStyle = documentData.fStyle;
            innerElemStyle.fontStyle = fStyle;
            innerElemStyle.fontWeight = fWeight;
        }
    }
    var i, len;

    var letters = documentData.l;
    len = letters.length;
    var tSpan,tParent,tCont;
    var matrixHelper = this.mHelper;
    var shapes, shapeStr = '';
    var cnt = 0;
    for (i = 0;i < len ;i += 1) {
        if(this.globalData.fontManager.chars){
            if(!this.textPaths[cnt]){
                tSpan = createNS('path');
                tSpan.setAttribute('stroke-linecap', 'butt');
                tSpan.setAttribute('stroke-linejoin','round');
                tSpan.setAttribute('stroke-miterlimit','4');
            } else {
                tSpan = this.textPaths[cnt];
            }
            if(!this.isMasked){
                if(this.textSpans[cnt]){
                    tParent = this.textSpans[cnt];
                    tCont = tParent.children[0];
                } else {

                    tParent = document.createElement('div');
                    tCont = createNS('svg');
                    tCont.appendChild(tSpan);
                    styleDiv(tParent);
                }
            }
        }else{
            if(!this.isMasked){
                if(this.textSpans[cnt]){
                    tParent = this.textSpans[cnt];
                    tSpan = this.textPaths[cnt];
                } else {
                    tParent = document.createElement('span');
                    styleDiv(tParent);
                    tSpan = document.createElement('span');
                    styleDiv(tSpan);
                    tParent.appendChild(tSpan);
                }
            } else {
                tSpan = this.textPaths[cnt] ? this.textPaths[cnt] : createNS('text');
            }
        }
        //tSpan.setAttribute('visibility', 'hidden');
        if(this.globalData.fontManager.chars){
            var charData = this.globalData.fontManager.getCharData(documentData.t.charAt(i), fontData.fStyle, this.globalData.fontManager.getFontByName(documentData.f).fFamily);
            var shapeData;
            if(charData){
                shapeData = charData.data;
            } else {
                shapeData = null;
            }
            matrixHelper.reset();
            if(shapeData && shapeData.shapes){
                shapes = shapeData.shapes[0].it;
                matrixHelper.scale(documentData.s/100,documentData.s/100);
                shapeStr = this.createPathShape(matrixHelper,shapes);
                tSpan.setAttribute('d',shapeStr);
            }
            if(!this.isMasked){
                this.innerElem.appendChild(tParent);
                if(shapeData && shapeData.shapes){
                    document.body.appendChild(tCont);

                    var boundingBox = tCont.getBBox();
                    tCont.setAttribute('width',boundingBox.width + 2);
                    tCont.setAttribute('height',boundingBox.height + 2);
                    tCont.setAttribute('viewBox',(boundingBox.x-1)+' '+ (boundingBox.y-1)+' '+ (boundingBox.width+2)+' '+ (boundingBox.height+2));
                    tCont.style.transform = tCont.style.webkitTransform = 'translate(' + (boundingBox.x-1) + 'px,' + (boundingBox.y-1) + 'px)';

                    letters[i].yOffset = boundingBox.y-1;
                    tParent.appendChild(tCont);

                } else{
                    tCont.setAttribute('width',1);
                    tCont.setAttribute('height',1);
                }
            }else{
                this.innerElem.appendChild(tSpan);
            }
        }else{
            tSpan.textContent = letters[i].val;
            tSpan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve");
            if(!this.isMasked){
                this.innerElem.appendChild(tParent);
                //
                tSpan.style.transform = tSpan.style.webkitTransform = 'translate3d(0,'+ -documentData.s/1.2+'px,0)';
            } else {
                this.innerElem.appendChild(tSpan);
            }
        }
        //
        if(!this.isMasked){
            this.textSpans[cnt] = tParent;
        }else{
            this.textSpans[cnt] = tSpan;
        }
        this.textSpans[cnt].style.display = 'block';
        this.textPaths[cnt] = tSpan;
        cnt += 1;
    }
    while(cnt < this.textSpans.length){
        this.textSpans[cnt].style.display = 'none';
        cnt += 1;
    }
}

HTextElement.prototype.hide = SVGTextElement.prototype.hide;

HTextElement.prototype.renderFrame = function(parentMatrix){

    var renderParent = this._parent.renderFrame.call(this,parentMatrix);
    if(renderParent===false){
        this.hide();
        return;
    }
    if(this.hidden){
        this.hidden = false;
        this.innerElem.style.display = 'block';
        this.layerElement.style.display = 'block';
    }

    if(this.data.singleShape){
        if(!this.firstFrame && !this.lettersChangedFlag){
            return;
        } else {
            // Todo Benchmark if using this is better than getBBox
             if(this.isMasked && this.finalTransform.matMdf){
                 this.cont.setAttribute('viewBox',-this.finalTransform.mProp.p.v[0]+' '+ -this.finalTransform.mProp.p.v[1]+' '+this.compW+' '+this.compH);
                this.cont.style.transform = this.cont.style.webkitTransform = 'translate(' + -this.finalTransform.mProp.p.v[0] + 'px,' + -this.finalTransform.mProp.p.v[1] + 'px)';
             }
        }
    }

    this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
    if(!this.lettersChangedFlag && !this.textAnimator.lettersChangedFlag){
        return;
    }
    var  i,len, count = 0;
    var renderedLetters = this.textAnimator.renderedLetters;

    var letters = this.textProperty.currentData.l;

    len = letters.length;
    var renderedLetter, textSpan, textPath;
    for(i=0;i<len;i+=1){
        if(letters[i].n){
            count += 1;
            continue;
        }
        textSpan = this.textSpans[i];
        textPath = this.textPaths[i];
        renderedLetter = renderedLetters[count];
        count += 1;
        if(!this.isMasked){
            textSpan.style.transform = textSpan.style.webkitTransform = renderedLetter.m;
        }else{
            textSpan.setAttribute('transform',renderedLetter.m);
        }
        ////textSpan.setAttribute('opacity',renderedLetter.o);
        textSpan.style.opacity = renderedLetter.o;
        if(renderedLetter.sw){
            textPath.setAttribute('stroke-width',renderedLetter.sw);
        }
        if(renderedLetter.sc){
            textPath.setAttribute('stroke',renderedLetter.sc);
        }
        if(renderedLetter.fc){
            textPath.setAttribute('fill',renderedLetter.fc);
            textPath.style.color = renderedLetter.fc;
        }
    }
    if(this.isVisible && (this.elemMdf || this.firstFrame)){
        if(this.innerElem.getBBox){
            var boundingBox = this.innerElem.getBBox();

            if(this.currentBBox.w !== boundingBox.width){
                this.currentBBox.w = boundingBox.width;
                this.cont.setAttribute('width',boundingBox.width);
            }
            if(this.currentBBox.h !== boundingBox.height){
                this.currentBBox.h = boundingBox.height;
                this.cont.setAttribute('height',boundingBox.height);
            }

            var margin = 1;
            if(this.currentBBox.w !== (boundingBox.width + margin*2) || this.currentBBox.h !== (boundingBox.height + margin*2)  || this.currentBBox.x !== (boundingBox.x - margin)  || this.currentBBox.y !== (boundingBox.y - margin)){
                this.currentBBox.w = boundingBox.width + margin*2;
                this.currentBBox.h = boundingBox.height + margin*2;
                this.currentBBox.x = boundingBox.x - margin;
                this.currentBBox.y = boundingBox.y - margin;

                this.cont.setAttribute('viewBox',this.currentBBox.x+' '+this.currentBBox.y+' '+this.currentBBox.w+' '+this.currentBBox.h);
                this.cont.style.transform = this.cont.style.webkitTransform = 'translate(' + this.currentBBox.x + 'px,' + this.currentBBox.y + 'px)';
            }
        }
    }
    if(this.firstFrame){
        this.firstFrame = false;
    }
}
function HImageElement(data,parentContainer,globalData,comp, placeholder){
    this.assetData = globalData.getAssetData(data.refId);
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
}
createElement(HBaseElement, HImageElement);

HImageElement.prototype.createElements = function(){

    var assetPath = this.globalData.getAssetsPath(this.assetData);
    var img = new Image();

    if(this.data.hasMask){
        var parent = document.createElement('div');
        styleDiv(parent);
        var cont = createNS('svg');
        styleDiv(cont);
        cont.setAttribute('width',this.assetData.w);
        cont.setAttribute('height',this.assetData.h);
        parent.appendChild(cont);
        this.imageElem = createNS('image');
        this.imageElem.setAttribute('width',this.assetData.w+"px");
        this.imageElem.setAttribute('height',this.assetData.h+"px");
        this.imageElem.setAttributeNS('http://www.w3.org/1999/xlink','href',assetPath);
        cont.appendChild(this.imageElem);
        this.layerElement = parent;
        this.transformedElement = parent;
        this.baseElement = parent;
        this.innerElem = parent;
        this.maskedElement = this.imageElem;
    } else {
        styleDiv(img);
        this.layerElement = img;
        this.baseElement = img;
        this.innerElem = img;
        this.transformedElement = img;
    }
    img.src = assetPath;
    if(this.data.ln){
        this.innerElem.setAttribute('id',this.data.ln);
    }
    this.checkParenting();
};

HImageElement.prototype.show = HSolidElement.prototype.show;
HImageElement.prototype.hide = HSolidElement.prototype.hide;
HImageElement.prototype.renderFrame = HSolidElement.prototype.renderFrame;
HImageElement.prototype.destroy = HSolidElement.prototype.destroy;
function HCameraElement(data,parentContainer,globalData,comp, placeholder){
    this._parent.constructor.call(this,data,parentContainer,globalData,comp, placeholder);
    var getProp = PropertyFactory.getProp;
    this.pe = getProp(this,data.pe,0,0,this.dynamicProperties);
    if(data.ks.p.s){
        this.px = getProp(this,data.ks.p.x,1,0,this.dynamicProperties);
        this.py = getProp(this,data.ks.p.y,1,0,this.dynamicProperties);
        this.pz = getProp(this,data.ks.p.z,1,0,this.dynamicProperties);
    }else{
        this.p = getProp(this,data.ks.p,1,0,this.dynamicProperties);
    }
    if(data.ks.a){
        this.a = getProp(this,data.ks.a,1,0,this.dynamicProperties);
    }
    if(data.ks.or.k.length && data.ks.or.k[0].to){
        var i,len = data.ks.or.k.length;
        for(i=0;i<len;i+=1){
            data.ks.or.k[i].to = null;
            data.ks.or.k[i].ti = null;
        }
    }
    this.or = getProp(this,data.ks.or,1,degToRads,this.dynamicProperties);
    this.or.sh = true;
    this.rx = getProp(this,data.ks.rx,0,degToRads,this.dynamicProperties);
    this.ry = getProp(this,data.ks.ry,0,degToRads,this.dynamicProperties);
    this.rz = getProp(this,data.ks.rz,0,degToRads,this.dynamicProperties);
    this.mat = new Matrix();
}
createElement(HBaseElement, HCameraElement);

HCameraElement.prototype.setup = function() {
    var i, len = this.comp.threeDElements.length, comp;
    for(i=0;i<len;i+=1){
        //[perspectiveElem,container]
        comp = this.comp.threeDElements[i];
        comp.perspectiveElem.style.perspective = comp.perspectiveElem.style.webkitPerspective = this.pe.v+'px';
        comp.container.style.transformOrigin = comp.container.style.mozTransformOrigin = comp.container.style.webkitTransformOrigin = "0px 0px 0px";
        comp.perspectiveElem.style.transform = comp.perspectiveElem.style.webkitTransform = 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';
    }
};

HCameraElement.prototype.createElements = function(){
};

HCameraElement.prototype.hide = function(){
};

HCameraElement.prototype.renderFrame = function(){
    var mdf = this.firstFrame;
    var i, len;
    if(this.hierarchy){
        len = this.hierarchy.length;
        for(i=0;i<len;i+=1){
            mdf = this.hierarchy[i].finalTransform.mProp.mdf ? true : mdf;
        }
    }
    if(mdf || (this.p && this.p.mdf) || (this.px && (this.px.mdf || this.py.mdf || this.pz.mdf)) || this.rx.mdf || this.ry.mdf || this.rz.mdf || this.or.mdf || (this.a && this.a.mdf)) {
        this.mat.reset();

        if(this.p){
            this.mat.translate(-this.p.v[0],-this.p.v[1],this.p.v[2]);
        }else{
            this.mat.translate(-this.px.v,-this.py.v,this.pz.v);
        }
        if(this.a){
            var diffVector = [this.p.v[0]-this.a.v[0],this.p.v[1]-this.a.v[1],this.p.v[2]-this.a.v[2]];
            var mag = Math.sqrt(Math.pow(diffVector[0],2)+Math.pow(diffVector[1],2)+Math.pow(diffVector[2],2));
            //var lookDir = getNormalizedPoint(getDiffVector(this.a.v,this.p.v));
            var lookDir = [diffVector[0]/mag,diffVector[1]/mag,diffVector[2]/mag];
            var lookLengthOnXZ = Math.sqrt( lookDir[2]*lookDir[2] + lookDir[0]*lookDir[0] );
            var m_rotationX = (Math.atan2( lookDir[1], lookLengthOnXZ ));
            var m_rotationY = (Math.atan2( lookDir[0], -lookDir[2]));
            this.mat.rotateY(m_rotationY).rotateX(-m_rotationX);

        }
        this.mat.rotateX(-this.rx.v).rotateY(-this.ry.v).rotateZ(this.rz.v);
        this.mat.rotateX(-this.or.v[0]).rotateY(-this.or.v[1]).rotateZ(this.or.v[2]);
        this.mat.translate(this.globalData.compSize.w/2,this.globalData.compSize.h/2,0);
        this.mat.translate(0,0,this.pe.v);
        if(this.hierarchy){
            var mat;
            len = this.hierarchy.length;
            for(i=0;i<len;i+=1){
                mat = this.hierarchy[i].finalTransform.mProp.iv.props;
                this.mat.transform(mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],-mat[12],-mat[13],mat[14],mat[15]);
            }
        }
        len = this.comp.threeDElements.length;
        var comp;
        for(i=0;i<len;i+=1){
            comp = this.comp.threeDElements[i];
            comp.container.style.transform = comp.container.style.webkitTransform = this.mat.toCSS();
        }
    }
    this.firstFrame = false;
};

HCameraElement.prototype.destroy = function(){
};
var Expressions = (function(){
    var ob = {};
    ob.initExpressions = initExpressions;


    function initExpressions(animation){
        animation.renderer.compInterface = CompExpressionInterface(animation.renderer);
        animation.renderer.globalData.projectInterface.registerComposition(animation.renderer);
    }
   return ob;
}());

expressionsPlugin = Expressions;

(function addPropertyDecorator() {

    function getStaticValueAtTime() {
        return this.pv;
    }

    function loopOut(type,duration,durationFlag){
        if(!this.k || !this.keyframes){
            return this.pv;
        }
        type = type.toLowerCase();
        var currentFrame = this.comp.renderedFrame;
        var keyframes = this.keyframes;
        var lastKeyFrame = keyframes[keyframes.length - 1].t;
        if(currentFrame<=lastKeyFrame){
            return this.pv;
        }else{
            var cycleDuration, firstKeyFrame;
            if(!durationFlag){
                if(!duration || duration > keyframes.length - 1){
                    duration = keyframes.length - 1;
                }
                firstKeyFrame = keyframes[keyframes.length - 1 - duration].t;
                cycleDuration = lastKeyFrame - firstKeyFrame;
            } else {
                if(!duration){
                    cycleDuration = Math.max(0,lastKeyFrame - this.elem.data.ip);
                } else {
                    cycleDuration = Math.abs(lastKeyFrame - elem.comp.globalData.frameRate*duration);
                }
                firstKeyFrame = lastKeyFrame - cycleDuration;
            }
            var i, len, ret;
            if(type === 'pingpong') {
                var iterations = Math.floor((currentFrame - firstKeyFrame)/cycleDuration);
                if(iterations % 2 !== 0){
                    return this.getValueAtTime(((cycleDuration - (currentFrame - firstKeyFrame) % cycleDuration +  firstKeyFrame)) / this.comp.globalData.frameRate, 0);
                }
            } else if(type === 'offset'){
                var initV = this.getValueAtTime(firstKeyFrame / this.comp.globalData.frameRate, 0);
                var endV = this.getValueAtTime(lastKeyFrame / this.comp.globalData.frameRate, 0);
                var current = this.getValueAtTime(((currentFrame - firstKeyFrame) % cycleDuration +  firstKeyFrame) / this.comp.globalData.frameRate, 0);
                var repeats = Math.floor((currentFrame - firstKeyFrame)/cycleDuration);
                if(this.pv.length){
                    ret = new Array(initV.length);
                    len = ret.length;
                    for(i=0;i<len;i+=1){
                        ret[i] = (endV[i]-initV[i])*repeats + current[i];
                    }
                    return ret;
                }
                return (endV-initV)*repeats + current;
            } else if(type === 'continue'){
                var lastValue = this.getValueAtTime(lastKeyFrame / this.comp.globalData.frameRate, 0);
                var nextLastValue = this.getValueAtTime((lastKeyFrame - 0.001) / this.comp.globalData.frameRate, 0);
                if(this.pv.length){
                    ret = new Array(lastValue.length);
                    len = ret.length;
                    for(i=0;i<len;i+=1){
                        ret[i] = lastValue[i] + (lastValue[i]-nextLastValue[i])*((currentFrame - lastKeyFrame)/ this.comp.globalData.frameRate)/0.0005;
                    }
                    return ret;
                }
                return lastValue + (lastValue-nextLastValue)*(((currentFrame - lastKeyFrame))/0.001);
            }
            return this.getValueAtTime((((currentFrame - firstKeyFrame) % cycleDuration +  firstKeyFrame)) / this.comp.globalData.frameRate, 0);
        }
    }

    function loopIn(type,duration, durationFlag) {
        if(!this.k){
            return this.pv;
        }
        type = type.toLowerCase();
        var currentFrame = this.comp.renderedFrame;
        var keyframes = this.keyframes;
        var firstKeyFrame = keyframes[0].t;
        if(currentFrame>=firstKeyFrame){
            return this.pv;
        }else{
            var cycleDuration, lastKeyFrame;
            if(!durationFlag){
                if(!duration || duration > keyframes.length - 1){
                    duration = keyframes.length - 1;
                }
                lastKeyFrame = keyframes[duration].t;
                cycleDuration = lastKeyFrame - firstKeyFrame;
            } else {
                if(!duration){
                    cycleDuration = Math.max(0,this.elem.data.op - firstKeyFrame);
                } else {
                    cycleDuration = Math.abs(elem.comp.globalData.frameRate*duration);
                }
                lastKeyFrame = firstKeyFrame + cycleDuration;
            }
            var i, len, ret;
            if(type === 'pingpong') {
                var iterations = Math.floor((firstKeyFrame - currentFrame)/cycleDuration);
                if(iterations % 2 === 0){
                    return this.getValueAtTime((((firstKeyFrame - currentFrame)%cycleDuration +  firstKeyFrame)) / this.comp.globalData.frameRate, 0);
                }
            } else if(type === 'offset'){
                var initV = this.getValueAtTime(firstKeyFrame / this.comp.globalData.frameRate, 0);
                var endV = this.getValueAtTime(lastKeyFrame / this.comp.globalData.frameRate, 0);
                var current = this.getValueAtTime((cycleDuration - (firstKeyFrame - currentFrame)%cycleDuration +  firstKeyFrame) / this.comp.globalData.frameRate, 0);
                var repeats = Math.floor((firstKeyFrame - currentFrame)/cycleDuration)+1;
                if(this.pv.length){
                    ret = new Array(initV.length);
                    len = ret.length;
                    for(i=0;i<len;i+=1){
                        ret[i] = current[i]-(endV[i]-initV[i])*repeats;
                    }
                    return ret;
                }
                return current-(endV-initV)*repeats;
            } else if(type === 'continue'){
                var firstValue = this.getValueAtTime(firstKeyFrame / this.comp.globalData.frameRate, 0);
                var nextFirstValue = this.getValueAtTime((firstKeyFrame + 0.001) / this.comp.globalData.frameRate, 0);
                if(this.pv.length){
                    ret = new Array(firstValue.length);
                    len = ret.length;
                    for(i=0;i<len;i+=1){
                        ret[i] = firstValue[i] + (firstValue[i]-nextFirstValue[i])*(firstKeyFrame - currentFrame)/0.001;
                    }
                    return ret;
                }
                return firstValue + (firstValue-nextFirstValue)*(firstKeyFrame - currentFrame)/0.001;
            }
            return this.getValueAtTime(((cycleDuration - (firstKeyFrame - currentFrame) % cycleDuration +  firstKeyFrame)) / this.comp.globalData.frameRate, 0);
        }
    }

    function getValueAtTime(frameNum) {
        if(!this._cachingAtTime) {
            this._cachingAtTime = {lastValue:-99999,lastIndex:0};
        }
        if(frameNum !== this._cachingAtTime.lastFrame) {
            frameNum *= this.elem.globalData.frameRate;
            frameNum -= this.offsetTime;
            var i = this._caching.lastFrame < frameNum ? this._caching.lastIndex : 0;
            var interpolationResult = this.interpolateValue(frameNum, i, this.pv, this._cachingAtTime);
            this._cachingAtTime.lastIndex = interpolationResult.iterationIndex;
            this._cachingAtTime.value = interpolationResult.value;
            this._cachingAtTime.lastFrame = frameNum;
        }
        return this._cachingAtTime.value;

    }

    function getVelocityAtTime(frameNum) {
        if(this.vel !== undefined){
            return this.vel;
        }
        var delta = -0.01;
        //frameNum += this.elem.data.st;
        var v1 = this.getValueAtTime(frameNum);
        var v2 = this.getValueAtTime(frameNum + delta);
        var velocity;
        if(v1.length){
            velocity = createTypedArray('float32', v1.length);
            var i;
            for(i=0;i<v1.length;i+=1){
                //removing frameRate
                //if needed, don't add it here
                //velocity[i] = this.elem.globalData.frameRate*((v2[i] - v1[i])/delta);
                velocity[i] = (v2[i] - v1[i])/delta;
            }
        } else {
            velocity = (v2 - v1)/delta;
        }
        return velocity;
    };

    function setGroupProperty(propertyGroup){
        this.propertyGroup = propertyGroup;
    }

    function searchExpressions(elem,data,prop){
        if(data.x){
            prop.k = true;
            prop.x = true;
            if(prop.getValue) {
                prop.getPreValue = prop.getValue;
            }
            prop.getValue = ExpressionManager.initiateExpression.bind(prop)(elem,data,prop);
        }
    }

    function getTransformValueAtTime(time) {
        //console.log('time:', time)
    }

    function getTransformStaticValueAtTime(time) {

    }

    var TextExpressionSelectorProp = (function(){

        function getValueProxy(index,total){
            this.textIndex = index+1;
            this.textTotal = total;
            this.getValue();
            return this.v;
        }

        return function TextExpressionSelectorProp(elem,data){
            this.pv = 1;
            this.comp = elem.comp;
            this.elem = elem;
            this.mult = .01;
            this.type = 'textSelector';
            this.textTotal = data.totalChars;
            this.selectorValue = 100;
            this.lastValue = [1,1,1];
            searchExpressions.bind(this)(elem,data,this);
            this.getMult = getValueProxy;
            this.getVelocityAtTime = getVelocityAtTime;
            if(this.kf){
                this.getValueAtTime = getValueAtTime.bind(this);
            } else {
                this.getValueAtTime = getStaticValueAtTime.bind(this);
            }
            this.setGroupProperty = setGroupProperty;
        }
    }());

    var getTransformProperty = TransformPropertyFactory.getTransformProperty;
    TransformPropertyFactory.getTransformProperty = function(elem, data, arr) {
        var prop = getTransformProperty(elem, data, arr);
        if(prop.dynamicProperties.length) {
            prop.getValueAtTime = getTransformValueAtTime.bind(prop);
        } else {
            prop.getValueAtTime = getTransformStaticValueAtTime.bind(prop);
        }
        prop.setGroupProperty = setGroupProperty;
        return prop;
    }

    var propertyGetProp = PropertyFactory.getProp;
    PropertyFactory.getProp = function(elem,data,type, mult, arr){
        var prop = propertyGetProp(elem,data,type, mult, arr);
        //prop.getVelocityAtTime = getVelocityAtTime;
        //prop.loopOut = loopOut;
        //prop.loopIn = loopIn;
        if(prop.kf){
            prop.getValueAtTime = getValueAtTime.bind(prop);
        } else {
            prop.getValueAtTime = getStaticValueAtTime.bind(prop);
        }
        prop.setGroupProperty = setGroupProperty;
        prop.loopOut = loopOut;
        prop.loopIn = loopIn;
        prop.getVelocityAtTime = getVelocityAtTime;
        prop.numKeys = data.a === 1 ? data.k.length : 0;
        var isAdded = prop.k;
        prop.propertyIndex = data.ix;
        searchExpressions(elem,data,prop);
        if(!isAdded && prop.x){
            arr.push(prop);
        }

        return prop;
    }

    function getShapeValueAtTime(frameNum) {
        if (!this._shapeValueAtTime) {
            this._lastIndexAtTime = 0;
            this._lastTimeAtTime = -999999;
            this._shapeValueAtTime = shape_pool.clone(this.pv);
        }
        if(frameNum !== this._lastTimeAtTime) {
            this._lastTimeAtTime = frameNum;
            frameNum *= this.elem.globalData.frameRate;
            var interpolationResult = this.interpolateShape(frameNum, this._lastIndexAtTime, this._shapeValueAtTime, false);
            this._lastIndexAtTime = interpolationResult.iterationIndex;
        }
        return this._shapeValueAtTime;
    }

    var ShapePropertyConstructorFunction = ShapePropertyFactory.getConstructorFunction();
    var KeyframedShapePropertyConstructorFunction = ShapePropertyFactory.getKeyframedConstructorFunction();

    ShapePropertyConstructorFunction.prototype.vertices = function(prop, time){
        var shapePath = this.v;
        if(time !== undefined) {
            shapePath = this.getValueAtTime(time, 0);
        }
        var i, len = shapePath._length;
        var vertices = shapePath[prop];
        var points = shapePath.v;
        var arr = Array.apply(null,{length:len})
        for(i = 0; i < len; i += 1) {
            if(prop === 'i' || prop === 'o') {
                arr[i] = [vertices[i][0] - points[i][0], vertices[i][1] - points[i][1]]
            } else {
                arr[i] = [vertices[i][0], vertices[i][1]]
            }
            
        }
        return arr;
    }

    ShapePropertyConstructorFunction.prototype.points = function(time){
        return this.vertices('v', time);
    }

    ShapePropertyConstructorFunction.prototype.inTangents = function(time){
        return this.vertices('i', time);
    }

    ShapePropertyConstructorFunction.prototype.outTangents = function(time){
        return this.vertices('o', time);
    }

    ShapePropertyConstructorFunction.prototype.isClosed = function(){
        return this.v.c;
    }

    ShapePropertyConstructorFunction.prototype.pointOnPath = function(perc, time){
        var shapePath = this.v;
        if(time !== undefined) {
            shapePath = this.getValueAtTime(time, 0);
        }
        if(!this._segmentsLength) {
            this._segmentsLength = bez.getSegmentsLength(shapePath);
        }

        var segmentsLength = this._segmentsLength;
        var lengths = segmentsLength.lengths;
        var lengthPos = segmentsLength.totalLength * perc;
        var i = 0, len = lengths.length;
        var j = 0, jLen;
        var accumulatedLength = 0;
        var segments;
        while(i < len) {
            if(accumulatedLength + lengths[i].addedLength > lengthPos) {
                segments = lengths[i].segments;
                var initIndex = i;
                var endIndex = (shapePath.c && i === len - 1) ? 0 : i + 1;
                var segmentPerc = (lengthPos - accumulatedLength)/lengths[i].addedLength;
                var pt = bez.getPointInSegment(shapePath.v[initIndex], shapePath.v[endIndex], shapePath.o[initIndex], shapePath.i[endIndex], segmentPerc, lengths[i])
                break;
            } else {
                accumulatedLength += lengths[i].addedLength;
            }
            i += 1;
        }
        if(!pt){
            pt = shapePath.c ? [shapePath.v[0][0],shapePath.v[0][1]]:[shapePath.v[shapePath._length-1][0],shapePath.v[shapePath._length-1][1]]
        }
        return pt;
    }

    ShapePropertyConstructorFunction.prototype.vectorOnPath = function(perc, time, vectorType){
        //perc doesn't use triple equality because can be a Number object, not a primitive.
        perc = perc == 1 ? this.v.c ? 0 : 0.999 : perc;
        var pt1 = this.pointOnPath(perc, time);
        var pt2 = this.pointOnPath(perc + 0.001, time);
        var xLength = pt2[0] - pt1[0];
        var yLength = pt2[1] - pt1[1];
        var magnitude = Math.sqrt(Math.pow(xLength,2) + Math.pow(yLength,2));
        var unitVector = vectorType === 'tangent' ? [xLength/magnitude, yLength/magnitude] : [-yLength/magnitude, xLength/magnitude];
        return unitVector;
    }

    ShapePropertyConstructorFunction.prototype.tangentOnPath = function(perc, time){
        return this.vectorOnPath(perc, time, 'tangent');
    }

    ShapePropertyConstructorFunction.prototype.normalOnPath = function(perc, time){
        return this.vectorOnPath(perc, time, 'normal');
    }

    ShapePropertyConstructorFunction.prototype.setGroupProperty = setGroupProperty;
    ShapePropertyConstructorFunction.prototype.getValueAtTime = getStaticValueAtTime;

    KeyframedShapePropertyConstructorFunction.prototype.vertices = ShapePropertyConstructorFunction.prototype.vertices;
    KeyframedShapePropertyConstructorFunction.prototype.points = ShapePropertyConstructorFunction.prototype.points;
    KeyframedShapePropertyConstructorFunction.prototype.inTangents = ShapePropertyConstructorFunction.prototype.inTangents;
    KeyframedShapePropertyConstructorFunction.prototype.outTangents = ShapePropertyConstructorFunction.prototype.outTangents;
    KeyframedShapePropertyConstructorFunction.prototype.isClosed = ShapePropertyConstructorFunction.prototype.isClosed;
    KeyframedShapePropertyConstructorFunction.prototype.pointOnPath = ShapePropertyConstructorFunction.prototype.pointOnPath;
    KeyframedShapePropertyConstructorFunction.prototype.vectorOnPath = ShapePropertyConstructorFunction.prototype.vectorOnPath;
    KeyframedShapePropertyConstructorFunction.prototype.tangentOnPath = ShapePropertyConstructorFunction.prototype.tangentOnPath;
    KeyframedShapePropertyConstructorFunction.prototype.normalOnPath = ShapePropertyConstructorFunction.prototype.normalOnPath;
    KeyframedShapePropertyConstructorFunction.prototype.setGroupProperty = ShapePropertyConstructorFunction.prototype.setGroupProperty;
    KeyframedShapePropertyConstructorFunction.prototype.getValueAtTime = getShapeValueAtTime;

    var propertyGetShapeProp = ShapePropertyFactory.getShapeProp;
    ShapePropertyFactory.getShapeProp = function(elem,data,type, arr, trims){
        var prop = propertyGetShapeProp(elem,data,type, arr, trims);
        var isAdded = prop.k;
        prop.propertyIndex = data.ix;
        if(type === 3){
            searchExpressions(elem,data.pt,prop);
        } else if(type === 4){
            searchExpressions(elem,data.ks,prop);
        }
        if(!isAdded && prop.x){
            arr.push(prop);
        }
        return prop;
    }

    var propertyGetTextProp = TextSelectorProp.getTextSelectorProp;
    TextSelectorProp.getTextSelectorProp = function(elem, data,arr){
        if(data.t === 1){
            return new TextExpressionSelectorProp(elem, data,arr);
        } else {
            return propertyGetTextProp(elem,data,arr);
        }
    }
}());
(function addTextPropertyDecorator() {

    function searchExpressions(){
        if(this.data.d.x){
            this.comp = this.elem.comp;
            if(this.getValue) {
                this.getPreValue = this.getValue;
            }
            this.calculateExpression = ExpressionManager.initiateExpression.bind(this)(this.elem,this.data.d,this);
            this.getValue = this.getExpressionValue;
            return true;
        }
        return false;
    }

    TextProperty.prototype.searchProperty = function(){
        this.kf = this.searchExpressions() || this.data.d.k.length > 1;
        return this.kf;
    }

    TextProperty.prototype.getExpressionValue = function(num){
        this.calculateExpression();
        if(this.mdf) {
            this.currentData.t = this.v.toString();
            this.completeTextData(this.currentData);
        }
    }

    TextProperty.prototype.searchExpressions = searchExpressions;
    
}());
var ExpressionManager = (function(){
    var ob = {};
    var Math = BMMath;
    var window = null;
    var document = null;

    function duplicatePropertyValue(value, mult){
        mult = mult || 1;

        if(typeof value === 'number'  || value instanceof Number){
            return value*mult;
        }else if(value.i){
            return JSON.parse(JSON.stringify(value));
        }else{
            var arr = createTypedArray('int16', value.length);
            var i, len = value.length;
            for(i=0;i<len;i+=1){
                arr[i]=value[i]*mult;
            }
            return arr;
        }
    }

    function isTypeOfArray(arr) {
        return arr.constructor === Array || arr.constructor === Float32Array;
    }

    function shapesEqual(shape1, shape2) {
        if(shape1._length !== shape2._length || shape1.c !== shape2.c){
            return false;
        }
        var i, len = shape1._length;
        for(i = 0; i < len; i += 1) {
            if(shape1.v[i][0] !== shape2.v[i][0] || shape1.v[i][1] !== shape2.v[i][1]
                || shape1.o[i][0] !== shape2.o[i][0] || shape1.o[i][1] !== shape2.o[i][1]
                || shape1.i[i][0] !== shape2.i[i][0] || shape1.i[i][1] !== shape2.i[i][1]){
                return false;
            }
        }
        return true;
    }

    function $bm_neg(a){
        var tOfA = typeof a;
        if(tOfA === 'number' || tOfA === 'boolean'  || a instanceof Number ){
            return -a;
        }
        if(isTypeOfArray(a)){
            var i, lenA = a.length;
            var retArr = [];
            for(i=0;i<lenA;i+=1){
                retArr[i] = -a[i];
            }
            return retArr;
        }
    }

    function sum(a,b) {
        var tOfA = typeof a;
        var tOfB = typeof b;
        if(tOfA === 'string' || tOfB === 'string'){
            return a + b;
        }
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string'  || b instanceof Number)) {
            return a + b;
        }
        if(isTypeOfArray(a) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string' || b instanceof Number )){
            a[0] = a[0] + b;
            return a;
        }
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number ) && isTypeOfArray(b)){
            b[0] = a + b[0];
            return b;
        }
        if(isTypeOfArray(a) && isTypeOfArray(b)){
            
            var i = 0, lenA = a.length, lenB = b.length;
            var retArr = [];
            while(i<lenA || i < lenB){
                if((typeof a[i] === 'number' || a[i] instanceof Number) && (typeof b[i] === 'number' || b[i] instanceof Number)){
                    retArr[i] = a[i] + b[i];
                }else{
                    retArr[i] = b[i] == undefined ? a[i] : a[i] || b[i];
                }
                i += 1;
            }
            return retArr;
        }
        return 0;
    }
    var add = sum;

    function sub(a,b) {
        var tOfA = typeof a;
        var tOfB = typeof b;
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number ) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string' || b instanceof Number )) {
            if(tOfA === 'string') {
                a = parseInt(a);
            }
            if(tOfB === 'string') {
                b = parseInt(b);
            }
            return a - b;
        }
        if( isTypeOfArray(a) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string' || b instanceof Number )){
            a[0] = a[0] - b;
            return a;
        }
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number ) &&  isTypeOfArray(b)){
            b[0] = a - b[0];
            return b;
        }
        if(isTypeOfArray(a) && isTypeOfArray(b)){
            var i = 0, lenA = a.length, lenB = b.length;
            var retArr = [];
            while(i<lenA || i < lenB){
                if((typeof a[i] === 'number' || a[i] instanceof Number) && typeof (typeof b[i] === 'number' || b[i] instanceof Number)){
                    retArr[i] = a[i] - b[i];
                }else{
                    retArr[i] = b[i] == undefined ? a[i] : a[i] || b[i];
                }
                i += 1;
            }
            return retArr;
        }
        return 0;
    }

    function mul(a,b) {
        var tOfA = typeof a;
        var tOfB = typeof b;
        var arr;
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number ) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string' || b instanceof Number )) {
            return a * b;
        }

        var i, len;
        if(isTypeOfArray(a) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string' || b instanceof Number )){
            len = a.length;
            arr = createTypedArray('float32', len);
            for(i=0;i<len;i+=1){
                arr[i] = a[i] * b;
            }
            return arr;
        }
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number ) && isTypeOfArray(b)){
            len = b.length;
            arr = createTypedArray('float32', len);
            for(i=0;i<len;i+=1){
                arr[i] = a * b[i];
            }
            return arr;
        }
        return 0;
    }

    function div(a,b) {
        var tOfA = typeof a;
        var tOfB = typeof b;
        var arr;
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number ) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string' || b instanceof Number )) {
            return a / b;
        }
        var i, len;
        if(isTypeOfArray(a) && (tOfB === 'number' || tOfB === 'boolean' || tOfB === 'string' || b instanceof Number  )){
            len = a.length;
            arr = createTypedArray('float32', len);
            for(i=0;i<len;i+=1){
                arr[i] = a[i] / b;
            }
            return arr;
        }
        if((tOfA === 'number' || tOfA === 'boolean' || tOfA === 'string' || a instanceof Number ) && isTypeOfArray(b)){
            len = b.length;
            arr = createTypedArray('float32', len);
            for(i=0;i<len;i+=1){
                arr[i] = a / b[i];
            }
            return arr;
        }
        return 0;
    }
    function mod(a,b) {
        if(typeof a === 'string') {
            a = parseInt(a);
        }
        if(typeof b === 'string') {
            b = parseInt(b);
        }
        return a % b;
    }

    function clamp(num, min, max) {
        if(min > max){
            var mm = max;
            max = min;
            min = mm;
        }
        return Math.min(Math.max(num, min), max);
    }

    function radiansToDegrees(val) {
        return val/degToRads;
    }
    var radians_to_degrees = radiansToDegrees;

    function degreesToRadians(val) {
        return val*degToRads;
    }
    var degrees_to_radians = radiansToDegrees;

    var helperLengthArray = [0,0,0,0,0,0];

    function length(arr1,arr2){
        if(typeof arr1 === 'number' || arr1 instanceof Number){
            arr2 = arr2 || 0;
            return Math.abs(arr1 - arr2);
        }
        if(!arr2){
            arr2 = helperLengthArray;
        }
        var i,len = Math.min(arr1.length,arr2.length);
        var addedLength = 0;
        for(i=0;i<len;i+=1){
            addedLength += Math.pow(arr2[i]-arr1[i],2);
        }
        return Math.sqrt(addedLength);
    }

    function normalize(vec){
        return div(vec, length(vec));
    }

    function rgbToHsl(val){
        var r = val[0]; var g = val[1]; var b = val[2];
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0; // achromatic
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l,val[3]];
    }
    function hslToRgb(val){
        var h = val[0];
        var s = val[1];
        var l = val[2];

        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r, g , b, val[3]];
    }

    function linear(t, tMin, tMax, value1, value2){
        if(value1 === undefined || value2 === undefined){
            return linear(t,0,1,tMin,tMax);
        }
        if(t <= tMin) {
            return value1;
        }else if(t >= tMax){
            return value2;
        }
        var perc = tMax === tMin ? 0 : (t-tMin)/(tMax-tMin);
        if(!value1.length){
            return value1 + (value2-value1)*perc;
        }
        var i, len = value1.length;
        var arr = createTypedArray('float32', len);
        for(i=0;i<len;i+=1){
            arr[i] = value1[i] + (value2[i]-value1[i])*perc;
        }
        return arr;
    }
    function random(min,max){
        if(max === undefined){
            if(min === undefined){
                min = 0;
                max = 1;
            } else {
                max = min;
                min = undefined;
            }
        }
        if(max.length){
            var i, len = max.length;
            if(!min){
                min = createTypedArray('float32', len);
            }
            var arr = createTypedArray('float32', len);
            var rnd = BMMath.random();
            for(i=0;i<len;i+=1){
                arr[i] = min[i] + rnd*(max[i]-min[i])
            }
            return arr;
        }
        if(min === undefined){
            min = 0;
        }
        var rndm = BMMath.random();
        return min + rndm*(max-min);
    }

    function createPath(points, inTangents, outTangents, closed) {
        inTangents = inTangents && inTangents.length ? inTangents : points;
        outTangents = outTangents && outTangents.length ? outTangents : points;
        var path = shape_pool.newShape();
        var len = points.length;
        path.setPathData(closed, len);
        for(i = 0; i < len; i += 1) {
            path.setTripleAt(points[i][0],points[i][1],outTangents[i][0] + points[i][0],outTangents[i][1] + points[i][1],inTangents[i][0] + points[i][0],inTangents[i][1] + points[i][1],i,true)
        }
        return path
    }

    function initiateExpression(elem,data,property){
        var val = data.x;
        var needsVelocity = /velocity(?![\w\d])/.test(val);
        var _needsRandom = val.indexOf('random') !== -1;
        var elemType = elem.data.ty;
        var transform,content,effect;
        var thisComp = elem.comp;
        var thisProperty = property;
        elem.comp.frameDuration = 1/elem.comp.globalData.frameRate;
        var inPoint = elem.data.ip/elem.comp.globalData.frameRate;
        var outPoint = elem.data.op/elem.comp.globalData.frameRate;
        var width = elem.data.sw ? elem.data.sw : 0;
        var height = elem.data.sh ? elem.data.sh : 0;
        var loopIn, loop_in, loopOut, loop_out;
        var toWorld,fromWorld,fromComp,fromCompToSurface,anchorPoint,thisLayer,thisComp,mask,valueAtTime,velocityAtTime;
        var fn = new Function();
        //var fnStr = 'var fn = function(){'+val+';this.v = $bm_rt;}';
        //eval(fnStr);

        var fn = eval('[function(){' + val+';if($bm_rt.__shapeObject){this.v=shape_pool.clone($bm_rt.v);}else{this.v=$bm_rt;}}' + ']')[0];
        var bindedFn = fn.bind(this);
        var numKeys = property.kf ? data.k.length : 0;

        var wiggle = function wiggle(freq,amp){
            var i,j, len = this.pv.length ? this.pv.length : 1;
            var addedAmps = createTypedArray('float32', len);
            freq = 5;
            var iterations = Math.floor(time*freq);
            i = 0;
            j = 0;
            while(i<iterations){
                //var rnd = BMMath.random();
                for(j=0;j<len;j+=1){
                    addedAmps[j] += -amp + amp*2*BMMath.random();
                    //addedAmps[j] += -amp + amp*2*rnd;
                }
                i += 1;
            }
            //var rnd2 = BMMath.random();
            var periods = time*freq;
            var perc = periods - Math.floor(periods);
            var arr = createTypedArray('float32', len);
            if(len>1){
                for(j=0;j<len;j+=1){
                    arr[j] = this.pv[j] + addedAmps[j] + (-amp + amp*2*BMMath.random())*perc;
                    //arr[j] = this.pv[j] + addedAmps[j] + (-amp + amp*2*rnd)*perc;
                    //arr[i] = this.pv[i] + addedAmp + amp1*perc + amp2*(1-perc);
                }
                return arr;
            } else {
                return this.pv + addedAmps[0] + (-amp + amp*2*BMMath.random())*perc;
            }
        }.bind(this);

        if(thisProperty.loopIn) {
            loopIn = thisProperty.loopIn.bind(thisProperty);
            loop_in = loopIn;
        }

        if(thisProperty.loopOut) {
            loopOut = thisProperty.loopOut.bind(thisProperty);
            loop_out = loopOut;
        }

        var loopInDuration = function loopInDuration(type,duration){
            return loopIn(type,duration,true);
        }.bind(this);

        var loopOutDuration = function loopOutDuration(type,duration){
            return loopOut(type,duration,true);
        }.bind(this);

        if(this.getValueAtTime) {
            valueAtTime = this.getValueAtTime.bind(this);
        }

        if(this.getVelocityAtTime) {
            velocityAtTime = this.getVelocityAtTime.bind(this);
        }

        var comp = elem.comp.globalData.projectInterface.bind(elem.comp.globalData.projectInterface);

        function lookAt(elem1,elem2){
            var fVec = [elem2[0]-elem1[0],elem2[1]-elem1[1],elem2[2]-elem1[2]];
            var pitch = Math.atan2(fVec[0],Math.sqrt(fVec[1]*fVec[1]+fVec[2]*fVec[2]))/degToRads;
            var yaw = -Math.atan2(fVec[1],fVec[2])/degToRads;
            return [yaw,pitch,0];
        };

        function easeOut(t, tMin, tMax, val1, val2){
            if(val1 === undefined){
                val1 = tMin;
                val2 = tMax;
            } else {
                t = (t - tMin) / (tMax - tMin);
            }
            return -(val2-val1) * t*(t-2) + val1;
        };

        function easeIn(t, tMin, tMax, val1, val2){
            if(val1 === undefined){
                val1 = tMin;
                val2 = tMax;
            } else {
                t = (t - tMin) / (tMax - tMin);
            }
            return (val2-val1)*t*t + val1;
        };

        function nearestKey(time){
            var i, len = data.k.length,index,keyTime;
            if(!data.k.length || typeof(data.k[0]) === 'number'){
                index = 0;
                keyTime = 0;
            } else {
                index = -1;
                time *= elem.comp.globalData.frameRate;
                if (time < data.k[0].t) {
                    index = 1;
                    keyTime = data.k[0].t;
                } else {
                    for(i=0;i<len-1;i+=1){
                        if(time === data.k[i].t){
                            index = i + 1;
                            keyTime = data.k[i].t;
                            break;
                        }else if(time>data.k[i].t && time<data.k[i+1].t){
                            if(time-data.k[i].t > data.k[i+1].t - time){
                                index = i + 2;
                                keyTime = data.k[i+1].t;
                            } else {
                                index = i + 1;
                                keyTime = data.k[i].t;
                            }
                            break;
                        }
                    }
                    if(index === -1){
                        index = i + 1;
                        keyTime = data.k[i].t;
                    }
                }
                
            }
            var ob = {};
            ob.index = index;
            ob.time = keyTime/elem.comp.globalData.frameRate;
            return ob;
        };

        function key(ind){
            var ob, i, len;
            if(!data.k.length || typeof(data.k[0]) === 'number'){
                throw new Error('The property has no keyframe at index ' + ind);
            }
            ind -= 1;
            ob = {
                time: data.k[ind].t/elem.comp.globalData.frameRate
            };
            var arr;
            if(ind === data.k.length - 1 && !data.k[ind].h){
                arr = data.k[ind-1].e;
            }else{
                arr = data.k[ind].s;
            }
            len = arr.length;
            for(i=0;i<len;i+=1){
                ob[i] = arr[i];
            }
            return ob;
        };

        function framesToTime(frames,fps){
            if(!fps){
                fps = elem.comp.globalData.frameRate;
            }
            return frames/fps;
        };

        function timeToFrames(t,fps){
            if(!t && t !== 0){
                t = time;
            }
            if(!fps){
                fps = elem.comp.globalData.frameRate;
            }
            return t*fps;
        };

        function seedRandom(seed){
            BMMath.seedrandom(randSeed + seed);
        };

        function sourceRectAtTime() {
            return elem.sourceRectAtTime();
        }

        var time,velocity, value,textIndex,textTotal,selectorValue;
        var index = elem.data.ind;
        var hasParent = !!(elem.hierarchy && elem.hierarchy.length);
        var parent;
        var randSeed = Math.floor(Math.random()*1000000);
        function executeExpression(){
            if(_needsRandom){
                seedRandom(randSeed);
            }
            if(this.frameExpressionId === elem.globalData.frameId && this.type !== 'textSelector'){
                return;
            }
            if(this.lock){
                this.v = duplicatePropertyValue(this.pv,this.mult);
                return true;
            }
            if(this.type === 'textSelector'){
                textIndex = this.textIndex;
                textTotal = this.textTotal;
                selectorValue = this.selectorValue;
            }
            if(!thisLayer){
                thisLayer = elem.layerInterface;
                thisComp = elem.comp.compInterface;
                toWorld = thisLayer.toWorld.bind(thisLayer);
                fromWorld = thisLayer.fromWorld.bind(thisLayer);
                fromComp = thisLayer.fromComp.bind(thisLayer);
                mask = thisLayer.mask ? thisLayer.mask.bind(thisLayer):null;
                fromCompToSurface = fromComp;
            }
            if(!transform){
                transform = elem.layerInterface("ADBE Transform Group");
                anchorPoint = transform.anchorPoint;
            }
            
            if(elemType === 4 && !content){
                content = thisLayer("ADBE Root Vectors Group");
            }
            if(!effect){
                effect = thisLayer(4);
            }
            hasParent = !!(elem.hierarchy && elem.hierarchy.length);
            if(hasParent && !parent){
                parent = elem.hierarchy[0].layerInterface;
            }
            this.lock = true;
            if(this.getPreValue){
                this.getPreValue();
            }
            value = this.pv;
            time = this.comp.renderedFrame/this.comp.globalData.frameRate;
            if(needsVelocity){
                velocity = velocityAtTime(time);
            }
            bindedFn();
            this.frameExpressionId = elem.globalData.frameId;
            var i,len;
            if(this.mult){
                if(typeof this.v === 'number' || this.v instanceof Number || this.v instanceof String || typeof this.v === 'string'){
                    this.v *= this.mult;
                }else if(this.v.length === 1){
                    this.v = this.v[0] * this.mult;
                }else{
                    len = this.v.length;
                    if(value === this.v){
                        this.v = len === 2 ? [value[0],value[1]] : [value[0],value[1],value[2]];
                    }
                    for(i = 0; i < len; i += 1){
                        this.v[i] *= this.mult;
                    }
                }
            }
            if(this.v.length === 1){
                this.v = this.v[0];
            }
            if(typeof this.v === 'number' || this.v instanceof Number || this.v instanceof String || typeof this.v === 'string'){
                if(this.lastValue !== this.v){
                    this.lastValue = this.v;
                    this.mdf = true;
                }
            }else if( this.v._length){
                if(!shapesEqual(this.v,this.localShapeCollection.shapes[0])){
                    this.mdf = true;
                    this.localShapeCollection.releaseShapes();
                    this.localShapeCollection.addShape(shape_pool.clone(this.v));
                }
            }else{
                len = this.v.length;
                for(i = 0; i < len; i += 1){
                    if(this.v[i] !== this.lastValue[i]){
                        this.lastValue[i] = this.v[i];
                        this.mdf = true;
                    }
                }
            }
            this.lock = false;
        }
        return executeExpression;
    };

    ob.initiateExpression = initiateExpression;
    return ob;
}());
var ShapeExpressionInterface = (function(){
    var ob = {
        createShapeInterface:createShapeInterface,
        createGroupInterface:createGroupInterface,
        createTrimInterface:createTrimInterface,
        createStrokeInterface:createStrokeInterface,
        createTransformInterface:createTransformInterface,
        createEllipseInterface:createEllipseInterface,
        createStarInterface:createStarInterface,
        createRectInterface:createRectInterface,
        createRoundedInterface:createRoundedInterface,
        createRepatearInterface:createRepatearInterface,
        createPathInterface:createPathInterface,
        createFillInterface:createFillInterface
    };
    function createShapeInterface(shapes,view,propertyGroup){
        return shapeInterfaceFactory(shapes,view,propertyGroup);
    }
    function createGroupInterface(shapes,view,propertyGroup){
        return groupInterfaceFactory(shapes,view,propertyGroup);
    }
    function createFillInterface(shape,view,propertyGroup){
        return fillInterfaceFactory(shape,view,propertyGroup);
    }
    function createStrokeInterface(shape,view,propertyGroup){
        return strokeInterfaceFactory(shape,view,propertyGroup);
    }
    function createTrimInterface(shape,view,propertyGroup){
        return trimInterfaceFactory(shape,view,propertyGroup);
    }
    function createTransformInterface(shape,view,propertyGroup){
        return transformInterfaceFactory(shape,view,propertyGroup);
    }
    function createEllipseInterface(shape,view,propertyGroup){
        return ellipseInterfaceFactory(shape,view,propertyGroup);
    }
    function createStarInterface(shape,view,propertyGroup){
        return starInterfaceFactory(shape,view,propertyGroup);
    }
    function createRectInterface(shape,view,propertyGroup){
        return rectInterfaceFactory(shape,view,propertyGroup);
    }
    function createRoundedInterface(shape,view,propertyGroup){
        return roundedInterfaceFactory(shape,view,propertyGroup);
    }
    function createRepatearInterface(shape,view,propertyGroup){
        return repeaterInterfaceFactory(shape,view,propertyGroup);
    }
    function createPathInterface(shape,view,propertyGroup){
        return pathInterfaceFactory(shape,view,propertyGroup);
    }

    function iterateElements(shapes,view, propertyGroup){
        var arr = [];
        var i, len = shapes ? shapes.length : 0;
        for(i=0;i<len;i+=1){
            if(shapes[i].ty == 'gr'){
                arr.push(ShapeExpressionInterface.createGroupInterface(shapes[i],view[i],propertyGroup));
            }else if(shapes[i].ty == 'fl'){
                arr.push(ShapeExpressionInterface.createFillInterface(shapes[i],view[i],propertyGroup));
            }else if(shapes[i].ty == 'st'){
                arr.push(ShapeExpressionInterface.createStrokeInterface(shapes[i],view[i],propertyGroup));
            }else if(shapes[i].ty == 'tm'){
                arr.push(ShapeExpressionInterface.createTrimInterface(shapes[i],view[i],propertyGroup));
            }else if(shapes[i].ty == 'tr'){
                //arr.push(ShapeExpressionInterface.createTransformInterface(shapes[i],view[i],propertyGroup));
            }else if(shapes[i].ty == 'el'){
                arr.push(ShapeExpressionInterface.createEllipseInterface(shapes[i],view[i],propertyGroup));
            }else if(shapes[i].ty == 'sr'){
                arr.push(ShapeExpressionInterface.createStarInterface(shapes[i],view[i],propertyGroup));
            } else if(shapes[i].ty == 'sh'){
                arr.push(ShapeExpressionInterface.createPathInterface(shapes[i],view[i],propertyGroup));
            } else if(shapes[i].ty == 'rc'){
                arr.push(ShapeExpressionInterface.createRectInterface(shapes[i],view[i],propertyGroup));
            } else if(shapes[i].ty == 'rd'){
                arr.push(ShapeExpressionInterface.createRoundedInterface(shapes[i],view[i],propertyGroup));
            } else if(shapes[i].ty == 'rp'){
                arr.push(ShapeExpressionInterface.createRepatearInterface(shapes[i],view[i],propertyGroup));
            } else{
                //console.log(shapes[i].ty);
            }
        }
        return arr;
    }

    var shapeInterfaceFactory = (function(){
        return function(shapes,view,propertyGroup){
            var interfaces;
            function _interfaceFunction(value){
                if(typeof value === 'number'){
                    return interfaces[value-1];
                } else {
                    var i = 0, len = interfaces.length;
                    while(i<len){
                        if(interfaces[i]._name === value){
                            return interfaces[i];
                        }
                        i+=1;
                    }
                }
            }
            _interfaceFunction.propertyGroup = propertyGroup;
            interfaces = iterateElements(shapes, view, _interfaceFunction);
            return _interfaceFunction;
        }
    }());

    var contentsInterfaceFactory = (function(){
       return function(shape,view, propertyGroup){
           var interfaces;
           var interfaceFunction = function _interfaceFunction(value){
               var i = 0, len = interfaces.length;
                while(i<len){
                    if(interfaces[i]._name === value || interfaces[i].mn === value || interfaces[i].propertyIndex === value || interfaces[i].ix === value || interfaces[i].ind === value){
                       return interfaces[i];
                    }
                    i+=1;
                }
                if(typeof value === 'number'){
                   return interfaces[value-1];
                }
           };
           interfaceFunction.propertyGroup = function(val){
               if(val === 1){
                   return interfaceFunction;
               } else{
                   return propertyGroup(val-1);
               }
           };
           interfaces = iterateElements(shape.it, view.it, interfaceFunction.propertyGroup);
           interfaceFunction.numProperties = interfaces.length;
           interfaceFunction.propertyIndex = shape.cix;

           return interfaceFunction;
       }
    }());

    var groupInterfaceFactory = (function(){
        return function(shape,view, propertyGroup){
            var interfaceFunction = function _interfaceFunction(value){
                switch(value){
                    case 'ADBE Vectors Group':
                    case 'Contents':
                    case 2:
                        return interfaceFunction.content;
                    case 'ADBE Vector Transform Group':
                    case 3:
                    default:
                        return interfaceFunction.transform;
                }
            }
            interfaceFunction.propertyGroup = function(val){
                if(val === 1){
                    return interfaceFunction;
                } else{
                    return propertyGroup(val-1);
                }
            };
            var content = contentsInterfaceFactory(shape,view,interfaceFunction.propertyGroup);
            var transformInterface = ShapeExpressionInterface.createTransformInterface(shape.it[shape.it.length - 1],view.it[view.it.length - 1],interfaceFunction.propertyGroup);
            interfaceFunction.content = content;
            interfaceFunction.transform = transformInterface;
            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            //interfaceFunction.content = interfaceFunction;
            interfaceFunction.numProperties = shape.np;
            interfaceFunction.propertyIndex = shape.ix;
            interfaceFunction.nm = shape.nm;
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var fillInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){

            function interfaceFunction(val){
                if(val === 'Color' || val === 'color'){
                    return interfaceFunction.color;
                } else if(val === 'Opacity' || val === 'opacity'){
                    return interfaceFunction.opacity;
                }
            }
            Object.defineProperty(interfaceFunction, 'color', {
                get: function(){
                    return ExpressionValue(view.c, 1 / view.c.mult, 'color');
                }
            });
            Object.defineProperty(interfaceFunction, 'opacity', {
                get: function(){
                    return ExpressionValue(view.o, 100);
                }
            });
            Object.defineProperty(interfaceFunction, '_name', { value: shape.nm });
            Object.defineProperty(interfaceFunction, 'mn', { value: shape.mn });

            view.c.setGroupProperty(propertyGroup);
            view.o.setGroupProperty(propertyGroup);
            return interfaceFunction;
        }
    }());

    var strokeInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val === 1){
                    return ob;
                } else{
                    return propertyGroup(val-1);
                }
            };
            function _dashPropertyGroup(val){
                if(val === 1){
                    return dashOb;
                } else{
                    return _propertyGroup(val-1);
                }
            };
            function addPropertyToDashOb(i) {
                Object.defineProperty(dashOb, shape.d[i].nm, {
                    get: function(){
                        return ExpressionValue(view.d.dataProps[i].p)
                    }
                });
            }
            var i, len = shape.d ? shape.d.length : 0;
            var dashOb = {}
            for (i = 0; i < len; i += 1) {
                addPropertyToDashOb(i);
                view.d.dataProps[i].p.setGroupProperty(_dashPropertyGroup);
            }

            function interfaceFunction(val){
                if(val === 'Color' || val === 'color'){
                    return interfaceFunction.color;
                } else if(val === 'Opacity' || val === 'opacity'){
                    return interfaceFunction.opacity;
                } else if(val === 'Stroke Width' || val === 'stroke width'){
                    return interfaceFunction.strokeWidth;
                }
            }
            Object.defineProperty(interfaceFunction, 'color', {
                get: function(){
                    return ExpressionValue(view.c, 1 / view.c.mult, 'color');
                }
            });
            Object.defineProperty(interfaceFunction, 'opacity', {
                get: function(){
                    return ExpressionValue(view.o, 100);
                }
            });
            Object.defineProperty(interfaceFunction, 'strokeWidth', {
                get: function(){
                    return ExpressionValue(view.w);
                }
            });
            Object.defineProperty(interfaceFunction, 'dash', {
                get: function(){
                    return dashOb;
                }
            });
            Object.defineProperty(interfaceFunction, '_name', { value: shape.nm });
            Object.defineProperty(interfaceFunction, 'mn', { value: shape.mn });

            view.c.setGroupProperty(_propertyGroup);
            view.o.setGroupProperty(_propertyGroup);
            view.w.setGroupProperty(_propertyGroup);
            return interfaceFunction;
        }
    }());

    var trimInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            interfaceFunction.propertyIndex = shape.ix;

            view.s.setGroupProperty(_propertyGroup);
            view.e.setGroupProperty(_propertyGroup);
            view.o.setGroupProperty(_propertyGroup);

            function interfaceFunction(val){
                if(val === shape.e.ix || val === 'End' || val === 'end'){
                    return interfaceFunction.end;
                }
                if(val === shape.s.ix){
                    return interfaceFunction.start;
                }
                if(val === shape.o.ix){
                    return interfaceFunction.offset;
                }
            }
            interfaceFunction.propertyIndex = shape.ix;
            Object.defineProperty(interfaceFunction, 'start', {
                get: function(){
                    return ExpressionValue(view.s, 1 / view.s.mult);
                }
            });
            Object.defineProperty(interfaceFunction, 'end', {
                get: function(){
                    return ExpressionValue(view.e, 1 / view.e.mult);
                }
            });
            Object.defineProperty(interfaceFunction, 'offset', {
                get: function(){
                    return ExpressionValue(view.o);
                }
            });
            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var transformInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            view.transform.mProps.o.setGroupProperty(_propertyGroup);
            view.transform.mProps.p.setGroupProperty(_propertyGroup);
            view.transform.mProps.a.setGroupProperty(_propertyGroup);
            view.transform.mProps.s.setGroupProperty(_propertyGroup);
            view.transform.mProps.r.setGroupProperty(_propertyGroup);
            if(view.transform.mProps.sk){
                view.transform.mProps.sk.setGroupProperty(_propertyGroup);
                view.transform.mProps.sa.setGroupProperty(_propertyGroup);
            }
            view.transform.op.setGroupProperty(_propertyGroup);

            function interfaceFunction(value){
                if(shape.a.ix === value){
                    return interfaceFunction.anchorPoint;
                }
                if(shape.o.ix === value){
                    return interfaceFunction.opacity;
                }
                if(shape.p.ix === value){
                    return interfaceFunction.position;
                }
                if(shape.r.ix === value){
                    return interfaceFunction.rotation;
                }
                if(shape.s.ix === value){
                    return interfaceFunction.scale;
                }
                if(shape.sk && shape.sk.ix === value){
                    return interfaceFunction.skew;
                }
                if(shape.sa && shape.sa.ix === value){
                    return interfaceFunction.skewAxis;
                }
                if(value === 'Opacity') {
                    return interfaceFunction.opacity;
                }
                if(value === 'Position') {
                    return interfaceFunction.position;
                }
                if(value === 'Anchor Point') {
                    return interfaceFunction.anchorPoint;
                }
                if(value === 'Scale') {
                    return interfaceFunction.scale;
                }
                if(value === 'Rotation' || value === 'ADBE Vector Rotation') {
                    return interfaceFunction.rotation;
                }
                if(value === 'Skew') {
                    return interfaceFunction.skew;
                }
                if(value === 'Skew Axis') {
                    return interfaceFunction.skewAxis;
                }

            }
            Object.defineProperty(interfaceFunction, 'opacity', {
                get: function(){
                    return ExpressionValue(view.transform.mProps.o, 1/view.transform.mProps.o.mult);
                }
            });
            Object.defineProperty(interfaceFunction, 'position', {
                get: function(){
                    return ExpressionValue(view.transform.mProps.p);
                }
            });
            Object.defineProperty(interfaceFunction, 'anchorPoint', {
                get: function(){
                    return ExpressionValue(view.transform.mProps.a);
                }
            });
            var scaleArray = [];
            Object.defineProperty(interfaceFunction, 'scale', {
                get: function(){
                    return ExpressionValue(view.transform.mProps.s, 1 / view.transform.mProps.s.mult);
                }
            });
            Object.defineProperty(interfaceFunction, 'rotation', {
                get: function(){
                    return ExpressionValue(view.transform.mProps.r, 1 / view.transform.mProps.r.mult);
                }
            });
            Object.defineProperty(interfaceFunction, 'skew', {
                get: function(){
                    return ExpressionValue(view.transform.mProps.sk);
                }
            });
            Object.defineProperty(interfaceFunction, 'skewAxis', {
                get: function(){
                    return ExpressionValue(view.transform.mProps.sa);
                }
            });
            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            interfaceFunction.ty = 'tr';
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var ellipseInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            interfaceFunction.propertyIndex = shape.ix;
            var prop = view.sh.ty === 'tm' ? view.sh.prop : view.sh;
            prop.s.setGroupProperty(_propertyGroup);
            prop.p.setGroupProperty(_propertyGroup);
            function interfaceFunction(value){
                if(shape.p.ix === value){
                    return interfaceFunction.position;
                }
                if(shape.s.ix === value){
                    return interfaceFunction.size;
                }
            }
            Object.defineProperty(interfaceFunction, 'size', {
                get: function(){
                    return ExpressionValue(prop.s);
                }
            });
            Object.defineProperty(interfaceFunction, 'position', {
                get: function(){
                    return ExpressionValue(prop.p);
                }
            });
            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var starInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            var prop = view.sh.ty === 'tm' ? view.sh.prop : view.sh;
            interfaceFunction.propertyIndex = shape.ix;
            prop.or.setGroupProperty(_propertyGroup);
            prop.os.setGroupProperty(_propertyGroup);
            prop.pt.setGroupProperty(_propertyGroup);
            prop.p.setGroupProperty(_propertyGroup);
            prop.r.setGroupProperty(_propertyGroup);
            if(shape.ir){
                prop.ir.setGroupProperty(_propertyGroup);
                prop.is.setGroupProperty(_propertyGroup);
            }

            function interfaceFunction(value){
                if(shape.p.ix === value){
                    return interfaceFunction.position;
                }
                if(shape.r.ix === value){
                    return interfaceFunction.rotation;
                }
                if(shape.pt.ix === value){
                    return interfaceFunction.points;
                }
                if(shape.or.ix === value || 'ADBE Vector Star Outer Radius' === value){
                    return interfaceFunction.outerRadius;
                }
                if(shape.os.ix === value){
                    return interfaceFunction.outerRoundness;
                }
                if(shape.ir && (shape.ir.ix === value || 'ADBE Vector Star Inner Radius' === value)){
                    return interfaceFunction.innerRadius;
                }
                if(shape.is && shape.is.ix === value){
                    return interfaceFunction.innerRoundness;
                }

            }
            Object.defineProperty(interfaceFunction, 'position', {
                get: function(){
                    return ExpressionValue(prop.p);
                }
            });
            Object.defineProperty(interfaceFunction, 'rotation', {
                get: function(){
                    return ExpressionValue(prop.r, 1 / prop.r.mult);
                }
            });
            Object.defineProperty(interfaceFunction, 'points', {
                get: function(){
                    return ExpressionValue(prop.pt);
                }
            });
            Object.defineProperty(interfaceFunction, 'outerRadius', {
                get: function(){
                    return ExpressionValue(prop.or);
                }
            });
            Object.defineProperty(interfaceFunction, 'outerRoundness', {
                get: function(){
                    return ExpressionValue(prop.os);
                }
            });
            Object.defineProperty(interfaceFunction, 'innerRadius', {
                get: function(){
                    if(!prop.ir){
                        return 0;
                    }
                    return ExpressionValue(prop.ir);
                }
            });
            Object.defineProperty(interfaceFunction, 'innerRoundness', {
                get: function(){
                    if(!prop.is){
                        return 0;
                    }
                    return ExpressionValue(prop.is, 1 / prop.is.mult);
                }
            });
            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var rectInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            var prop = view.sh.ty === 'tm' ? view.sh.prop : view.sh;
            interfaceFunction.propertyIndex = shape.ix;
            prop.p.setGroupProperty(_propertyGroup);
            prop.s.setGroupProperty(_propertyGroup);
            prop.r.setGroupProperty(_propertyGroup);

            function interfaceFunction(value){
                if(shape.p.ix === value){
                    return interfaceFunction.position;
                }
                if(shape.r.ix === value){
                    return interfaceFunction.roundness;
                }
                if(shape.s.ix === value || value === 'Size' || value === 'ADBE Vector Rect Size'){
                    return interfaceFunction.size;
                }

            }
            Object.defineProperty(interfaceFunction, 'position', {
                get: function(){
                    return ExpressionValue(prop.p);
                }
            });
            Object.defineProperty(interfaceFunction, 'roundness', {
                get: function(){
                    return ExpressionValue(prop.r);
                }
            });
            Object.defineProperty(interfaceFunction, 'size', {
                get: function(){
                    return ExpressionValue(prop.s);
                }
            });

            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var roundedInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            var prop = view;
            interfaceFunction.propertyIndex = shape.ix;
            prop.rd.setGroupProperty(_propertyGroup);

            function interfaceFunction(value){
                if(shape.r.ix === value || 'Round Corners 1' === value){
                    return interfaceFunction.radius;
                }

            }
            Object.defineProperty(interfaceFunction, 'radius', {
                get: function(){
                    return ExpressionValue(prop.rd);
                }
            });

            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var repeaterInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            var prop = view;
            interfaceFunction.propertyIndex = shape.ix;
            prop.c.setGroupProperty(_propertyGroup);
            prop.o.setGroupProperty(_propertyGroup);

            function interfaceFunction(value){
                if(shape.c.ix === value || 'Copies' === value){
                    return interfaceFunction.copies;
                } else if(shape.o.ix === value || 'Offset' === value){
                    return interfaceFunction.offset;
                }

            }
            Object.defineProperty(interfaceFunction, 'copies', {
                get: function(){
                    return ExpressionValue(prop.c);
                }
            });

            Object.defineProperty(interfaceFunction, 'offset', {
                get: function(){
                    return ExpressionValue(prop.o);
                }
            });

            Object.defineProperty(interfaceFunction, '_name', {
                get: function(){
                    return shape.nm;
                }
            });
            interfaceFunction.mn = shape.mn;
            return interfaceFunction;
        }
    }());

    var pathInterfaceFactory = (function(){
        return function(shape,view,propertyGroup){
            var prop = view.sh;
            function _propertyGroup(val){
                if(val == 1){
                    return interfaceFunction;
                } else {
                    return propertyGroup(--val);
                }
            }
            prop.setGroupProperty(_propertyGroup);

            function interfaceFunction(val){
                if(val === 'Shape' || val === 'shape' || val === 'Path' || val === 'path' || val === 'ADBE Vector Shape' || val === 2){
                    return interfaceFunction.path;
                }
            }

            Object.defineProperty(interfaceFunction, 'path', {
                get: function(){
                    if(prop.k){
                        prop.getValue();
                    }
                    return prop;
                    //return shape_pool.clone(prop.v);
                }
            });
            Object.defineProperty(interfaceFunction, 'shape', {
                get: function(){
                    if(prop.k){
                        prop.getValue();
                    }
                    return prop;
                    //return shape_pool.clone(prop.v);
                }
            });
            Object.defineProperty(interfaceFunction, '_name', { value: shape.nm });
            Object.defineProperty(interfaceFunction, 'ix', { value: shape.ix });
            Object.defineProperty(interfaceFunction, 'mn', { value: shape.mn });
            return interfaceFunction;
        }
    }());


    return ob;
}())

var TextExpressionInterface = (function(){
	return function(elem){
        var _prevValue, _sourceText;
        function _thisLayerFunction(){
        }
        Object.defineProperty(_thisLayerFunction, "sourceText", {
            get: function(){
                var stringValue = elem.textProperty.currentData.t;
                if(elem.textProperty.currentData.t !== _prevValue) {
                    elem.textProperty.currentData.t = _prevValue;
                    _sourceText = new String(stringValue);
                    //If stringValue is an empty string, eval returns undefined, so it has to be returned as a String primitive
                    _sourceText.value = stringValue ? stringValue : new String(stringValue);
                }
                return _sourceText;
            }
        });
        return _thisLayerFunction;
    }
}())
var LayerExpressionInterface = (function (){
    function toWorld(arr, time){
        var toWorldMat = new Matrix();
        toWorldMat.reset();
        var transformMat;
        if(time) {
            //Todo implement value at time on transform properties
            //transformMat = this._elem.finalTransform.mProp.getValueAtTime(time);
            transformMat = this._elem.finalTransform.mProp;
        } else {
            transformMat = this._elem.finalTransform.mProp;
        }
        transformMat.applyToMatrix(toWorldMat);
        if(this._elem.hierarchy && this._elem.hierarchy.length){
            var i, len = this._elem.hierarchy.length;
            for(i=0;i<len;i+=1){
                this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(toWorldMat);
            }
            return toWorldMat.applyToPointArray(arr[0],arr[1],arr[2]||0);
        }
        return toWorldMat.applyToPointArray(arr[0],arr[1],arr[2]||0);
    }
    function fromWorld(arr, time){
        var toWorldMat = new Matrix();
        toWorldMat.reset();
        var transformMat;
        if(time) {
            //Todo implement value at time on transform properties
            //transformMat = this._elem.finalTransform.mProp.getValueAtTime(time);
            transformMat = this._elem.finalTransform.mProp;
        } else {
            transformMat = this._elem.finalTransform.mProp;
        }
        transformMat.applyToMatrix(toWorldMat);
        if(this._elem.hierarchy && this._elem.hierarchy.length){
            var i, len = this._elem.hierarchy.length;
            for(i=0;i<len;i+=1){
                this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(toWorldMat);
            }
            return toWorldMat.inversePoint(arr);
        }
        return toWorldMat.inversePoint(arr);
    }
    function fromComp(arr){
        var toWorldMat = new Matrix();
        toWorldMat.reset();
        this._elem.finalTransform.mProp.applyToMatrix(toWorldMat);
        if(this._elem.hierarchy && this._elem.hierarchy.length){
            var i, len = this._elem.hierarchy.length;
            for(i=0;i<len;i+=1){
                this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(toWorldMat);
            }
            return toWorldMat.inversePoint(arr);
        }
        return toWorldMat.inversePoint(arr);
    }


    return function(elem){

        var transformInterface = TransformExpressionInterface(elem.transform);

        function _registerMaskInterface(maskManager){
            _thisLayerFunction.mask = new MaskManagerInterface(maskManager, elem);
        }
        function _registerEffectsInterface(effects){
            _thisLayerFunction.effect = effects;
        }

        function _thisLayerFunction(name){
            switch(name){
                case "ADBE Root Vectors Group":
                case "Contents":
                case 2:
                    return _thisLayerFunction.shapeInterface;
                case 1:
                case 6:
                case "Transform":
                case "transform":
                case "ADBE Transform Group":
                    return transformInterface;
                case 4:
                case "ADBE Effect Parade":
                    return _thisLayerFunction.effect;
            }
        }
        _thisLayerFunction.toWorld = toWorld;
        _thisLayerFunction.fromWorld = fromWorld;
        _thisLayerFunction.toComp = toWorld;
        _thisLayerFunction.fromComp = fromComp;
        _thisLayerFunction.sourceRectAtTime = elem.sourceRectAtTime.bind(elem);
        _thisLayerFunction._elem = elem;
        Object.defineProperty(_thisLayerFunction, 'hasParent', {
            get: function(){
                return !!elem.hierarchy;
            }
        });
        Object.defineProperty(_thisLayerFunction, 'parent', {
            get: function(){
                return elem.hierarchy[0].layerInterface;
            }
        });
        Object.defineProperty(_thisLayerFunction, "rotation", getDescriptor(transformInterface, 'rotation'));
        Object.defineProperty(_thisLayerFunction, "scale", getDescriptor(transformInterface, 'scale'));
        Object.defineProperty(_thisLayerFunction, "position", getDescriptor(transformInterface, 'position'));
        Object.defineProperty(_thisLayerFunction, "opacity", getDescriptor(transformInterface, 'opacity'));
        var anchorPointDescriptor = getDescriptor(transformInterface, 'anchorPoint');
        Object.defineProperty(_thisLayerFunction, "anchorPoint", anchorPointDescriptor);
        Object.defineProperty(_thisLayerFunction, "anchor_point", anchorPointDescriptor);

        Object.defineProperty(_thisLayerFunction, "transform", {
            get: function () {
                return transformInterface;
            }
        });

        Object.defineProperty(_thisLayerFunction, "_name", { value:elem.data.nm });

        Object.defineProperty(_thisLayerFunction, "active", {
            get: function(){
                return elem.isVisible;
            }
        });

        _thisLayerFunction.startTime = elem.data.st;
        _thisLayerFunction.index = elem.data.ind;
        _thisLayerFunction.source = elem.data.refId;
        _thisLayerFunction.height = elem.data.ty === 0 ? elem.data.h : 100;
        _thisLayerFunction.width = elem.data.ty === 0 ? elem.data.w : 100;

        _thisLayerFunction.registerMaskInterface = _registerMaskInterface;
        _thisLayerFunction.registerEffectsInterface = _registerEffectsInterface;
        return _thisLayerFunction;
    }
}());

var CompExpressionInterface = (function (){
    return function(comp){
        function _thisLayerFunction(name){
            var i=0, len = comp.layers.length;
            while(i<len){
                if(comp.layers[i].nm === name || comp.layers[i].ind === name){
                    return comp.elements[i].layerInterface;
                }
                i += 1;
            }
            return {active:false}
        }
        Object.defineProperty(_thisLayerFunction, "_name", { value:comp.data.nm });
        _thisLayerFunction.layer = _thisLayerFunction;
        _thisLayerFunction.pixelAspect = 1;
        _thisLayerFunction.height = comp.globalData.compSize.h;
        _thisLayerFunction.width = comp.globalData.compSize.w;
        _thisLayerFunction.pixelAspect = 1;
        _thisLayerFunction.frameDuration = 1/comp.globalData.frameRate;
        return _thisLayerFunction;
    }
}());
var TransformExpressionInterface = (function (){
    return function(transform){
        function _thisFunction(name){
            switch(name){
                case "scale":
                case "Scale":
                case "ADBE Scale":
                case 6:
                    return _thisFunction.scale;
                case "rotation":
                case "Rotation":
                case "ADBE Rotation":
                case "ADBE Rotate Z":
                case 10:
                    return _thisFunction.rotation;
                case "position":
                case "Position":
                case "ADBE Position":
                case 2:
                    return _thisFunction.position;
                case "anchorPoint":
                case "AnchorPoint":
                case "Anchor Point":
                case "ADBE AnchorPoint":
                case 1:
                    return _thisFunction.anchorPoint;
                case "opacity":
                case "Opacity":
                case 11:
                    return _thisFunction.opacity;
            }
        }

        Object.defineProperty(_thisFunction, "rotation", {
            get: function(){
                if(transform.r) {
                    return ExpressionValue(transform.r, 1/degToRads);
                } else {
                    return ExpressionValue(transform.rz, 1/degToRads);
                }
            }
        });
        Object.defineProperty(_thisFunction, "scale", {
            get: function () {
                return ExpressionValue(transform.s, 100);
            }
        });

        Object.defineProperty(_thisFunction, "position", {
            get: function () {
                if(transform.p) {
                    return ExpressionValue(transform.p);
                } else {
                    return [transform.px.v, transform.py.v, transform.pz ? transform.pz.v : 0];
                };
            }
        });

        Object.defineProperty(_thisFunction, "xPosition", {
            get: function () {
                return ExpressionValue(transform.px);
            }
        });

        Object.defineProperty(_thisFunction, "yPosition", {
            get: function () {
                return ExpressionValue(transform.py);
            }
        });

        Object.defineProperty(_thisFunction, "zPosition", {
            get: function () {
                return ExpressionValue(transform.pz);
            }
        });

        Object.defineProperty(_thisFunction, "anchorPoint", {
            get: function () {
                return ExpressionValue(transform.a);
            }
        });

        Object.defineProperty(_thisFunction, "opacity", {
            get: function () {
                return ExpressionValue(transform.o, 100);
            }
        });

        Object.defineProperty(_thisFunction, "skew", {
            get: function () {
                return ExpressionValue(transform.sk);
            }
        });

        Object.defineProperty(_thisFunction, "skewAxis", {
            get: function () {
                return ExpressionValue(transform.sa);
            }
        });

        Object.defineProperty(_thisFunction, "orientation", {
            get: function () {
                return ExpressionValue(transform.or);
            }
        });

        return _thisFunction;
    }
}());
var ProjectInterface = (function (){

    function registerComposition(comp){
        this.compositions.push(comp);
    }

    return function(){
        function _thisProjectFunction(name){
            var i = 0, len = this.compositions.length;
            while(i<len){
                if(this.compositions[i].data && this.compositions[i].data.nm === name){
                    if(this.compositions[i].prepareFrame) {
                        this.compositions[i].prepareFrame(this.compositions[i].data.xt ? this.currentFrame : this.compositions[i].currentFrameNum);
                    }
                    return this.compositions[i].compInterface;
                }
                i+=1;
            }
        }

        _thisProjectFunction.compositions = [];
        _thisProjectFunction.currentFrame = 0;

        _thisProjectFunction.registerComposition = registerComposition;



        return _thisProjectFunction;
    }
}());
var EffectsExpressionInterface = (function (){
    var ob = {
        createEffectsInterface: createEffectsInterface
    };

    function createEffectsInterface(elem, propertyGroup){
        if(elem.effects){

            var effectElements = [];
            var effectsData = elem.data.ef;
            var i, len = elem.effects.effectElements.length;
            for(i=0;i<len;i+=1){
                effectElements.push(createGroupInterface(effectsData[i],elem.effects.effectElements[i],propertyGroup,elem));
            }

            return function(name){
                var effects = elem.data.ef, i = 0, len = effects.length;
                while(i<len) {
                    if(name === effects[i].nm || name === effects[i].mn || name === effects[i].ix){
                        return effectElements[i];
                    }
                    i += 1;
                }
            }
        }
    }

    function createGroupInterface(data,elements, propertyGroup, elem){
        var effectElements = [];
        var i, len = data.ef.length;
        for(i=0;i<len;i+=1){
            if(data.ef[i].ty === 5){
                effectElements.push(createGroupInterface(data.ef[i],elements.effectElements[i],elements.effectElements[i].propertyGroup, elem));
            } else {
                effectElements.push(createValueInterface(elements.effectElements[i],data.ef[i].ty, elem, _propertyGroup));
            }
        }

        function _propertyGroup(val) {
            if(val === 1){
               return groupInterface;
            } else{
               return propertyGroup(val-1);
            }
        }

        var groupInterface = function(name){
            var effects = data.ef, i = 0, len = effects.length;
            while(i<len) {
                if(name === effects[i].nm || name === effects[i].mn || name === effects[i].ix){
                    if(effects[i].ty === 5){
                        return effectElements[i];
                    } else {
                        return effectElements[i]();
                    }
                }
                i += 1;
            }
            return effectElements[0]();
        }

        groupInterface.propertyGroup = _propertyGroup;

        if(data.mn === 'ADBE Color Control'){
            Object.defineProperty(groupInterface, 'color', {
                get: function(){
                    return effectElements[0]();
                }
            });
        }
        Object.defineProperty(groupInterface, 'numProperties', {
            get: function(){
                return data.np;
            }
        });
        groupInterface.active = data.en !== 0;
        return groupInterface
    }

    function createValueInterface(element, type, elem, propertyGroup){
        function interfaceFunction(){
            if(type === 10){
                return elem.comp.compInterface(element.p.v);
            }
            return ExpressionValue(element.p);
        }

        if(element.p.setGroupProperty) {
            element.p.setGroupProperty(propertyGroup);
        }

        return interfaceFunction;
    }

    return ob;

}());
var MaskManagerInterface = (function(){

	function MaskInterface(mask, data){
		this._mask = mask;
		this._data = data;
	}
	Object.defineProperty(MaskInterface.prototype, 'maskPath', {
        get: function(){
                if(this._mask.prop.k){
                    this._mask.prop.getValue();
                }
                return this._mask.prop;
            }
        });

	var MaskManager = function(maskManager, elem){
		var _maskManager = maskManager;
		var _elem = elem;
		var _masksInterfaces = Array.apply(null,{length: maskManager.viewData.length});
		var i, len = maskManager.viewData.length;
		for(i = 0; i < len; i += 1) {
			_masksInterfaces[i] = new MaskInterface(maskManager.viewData[i], maskManager.masksProperties[i]);
		}

		var maskFunction = function(name){
			i = 0;
		    while(i<len){
		        if(maskManager.masksProperties[i].nm === name){
		            return _masksInterfaces[i];
		        }
		        i += 1;
		    }
		}
		return maskFunction
	}
	return MaskManager
}())


var ExpressionValue = (function() {
	return function(elementProp, mult, type) {
        var expressionValue, arrayValue;

		if (elementProp.k) {
            elementProp.getValue();
        }
        var i, len, arrValue;
        if (type) {
        	if(type === 'color') {
        		len = 4;
                expressionValue = createTypedArray('float32', len);
                arrValue = createTypedArray('float32', len);
		        for (i = 0; i < len; i += 1) {
		            expressionValue[i] = arrValue[i] = (mult && i < 3) ? elementProp.v[i] * mult : 1;
		        }
	        	expressionValue.value = arrValue;
        	}
        } else if (typeof elementProp.v === 'number' || elementProp.v instanceof Number){
            expressionValue = mult ? new Number(elementProp.v * mult) : new Number(elementProp.v);
            expressionValue.value = mult ? elementProp.v * mult : elementProp.v;
        } else {
        	len = elementProp.v.length;
            expressionValue = createTypedArray('float32', len);
            arrValue = createTypedArray('float32', len);
	        for (i = 0; i < len; i += 1) {
	            expressionValue[i] = arrValue[i] = mult ? elementProp.v[i] * mult : elementProp.v[i];
	        }
	        expressionValue.value = arrValue;
        }
        
        expressionValue.numKeys = elementProp.keyframes ? elementProp.keyframes.length : 0;
        expressionValue.key = function(pos) {
            if (!expressionValue.numKeys) {
                return 0;
            } else {
                return elementProp.keyframes[pos-1].t;
            }
        };
        expressionValue.valueAtTime = elementProp.getValueAtTime;
        expressionValue.propertyGroup = elementProp.propertyGroup;
        return expressionValue;
	}
}())
function SliderEffect(data,elem, dynamicProperties){
    this.p = PropertyFactory.getProp(elem,data.v,0,0,dynamicProperties);
}
function AngleEffect(data,elem, dynamicProperties){
    this.p = PropertyFactory.getProp(elem,data.v,0,0,dynamicProperties);
}
function ColorEffect(data,elem, dynamicProperties){
    this.p = PropertyFactory.getProp(elem,data.v,1,0,dynamicProperties);
}
function PointEffect(data,elem, dynamicProperties){
    this.p = PropertyFactory.getProp(elem,data.v,1,0,dynamicProperties);
}
function LayerIndexEffect(data,elem, dynamicProperties){
    this.p = PropertyFactory.getProp(elem,data.v,0,0,dynamicProperties);
}
function MaskIndexEffect(data,elem, dynamicProperties){
    this.p = PropertyFactory.getProp(elem,data.v,0,0,dynamicProperties);
}
function CheckboxEffect(data,elem, dynamicProperties){
    this.p = PropertyFactory.getProp(elem,data.v,0,0,dynamicProperties);
}
function NoValueEffect(){
    this.p = {};
}
function EffectsManager(data,element,dynamicProperties){
    var effects = data.ef;
    this.effectElements = [];
    var i,len = effects.length;
    var effectItem;
    for(i=0;i<len;i++) {
        effectItem = new GroupEffect(effects[i],element,dynamicProperties);
        this.effectElements.push(effectItem);
    }
}

function GroupEffect(data,element,dynamicProperties){
    this.dynamicProperties = [];
    this.init(data,element,this.dynamicProperties);
    if(this.dynamicProperties.length){
        dynamicProperties.push(this);
    }
}

GroupEffect.prototype.getValue = function(){
    this.mdf = false;
    var i, len = this.dynamicProperties.length;
    for(i=0;i<len;i+=1){
        this.dynamicProperties[i].getValue();
        this.mdf = this.dynamicProperties[i].mdf ? true : this.mdf;
    }
};

GroupEffect.prototype.init = function(data,element,dynamicProperties){
    this.data = data;
    this.mdf = false;
    this.effectElements = [];
    var i, len = this.data.ef.length;
    var eff, effects = this.data.ef;
    for(i=0;i<len;i+=1){
        switch(effects[i].ty){
            case 0:
                eff = new SliderEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 1:
                eff = new AngleEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 2:
                eff = new ColorEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 3:
                eff = new PointEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 4:
            case 7:
                eff = new CheckboxEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 10:
                eff = new LayerIndexEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 11:
                eff = new MaskIndexEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 5:
                eff = new EffectsManager(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
            case 6:
            default:
                eff = new NoValueEffect(effects[i],element,dynamicProperties);
                this.effectElements.push(eff);
                break;
        }
    }
};
    var lottiejs = {};

    function setLocationHref (href) {
        locationHref = href;
    }
    function play(animation){
        animationManager.play(animation);
    }

    function pause(animation) {
        animationManager.pause(animation);
    }

    function togglePause(animation) {
        animationManager.togglePause(animation);
    }

    function setSpeed(value, animation) {
        animationManager.setSpeed(value, animation);
    }

    function setDirection(value, animation) {
        animationManager.setDirection(value, animation);
    }

    function stop(animation) {
        animationManager.stop(animation);
    }

    function moveFrame(value) {
        animationManager.moveFrame(value);
    }

    function searchAnimations() {
        if (standalone === true) {
            animationManager.searchAnimations(animationData, standalone, renderer);
        } else {
            animationManager.searchAnimations();
        }
    }

    function registerAnimation(elem) {
        return animationManager.registerAnimation(elem);
    }

    function resize() {
        animationManager.resize();
    }

    /*function start() {
        animationManager.start();
    }*/

    function goToAndStop(val, isFrame, animation) {
        animationManager.goToAndStop(val, isFrame, animation);
    }

    function setSubframeRendering(flag) {
        subframeEnabled = flag;
    }

    function loadAnimation(params) {
        if (standalone === true) {
            params.animationData = JSON.parse(animationData);
        }
        return animationManager.loadAnimation(params);
    }

    function destroy(animation) {
        return animationManager.destroy(animation);
    }

    function setQuality(value) {
        if (typeof value === 'string') {
            switch (value) {
                case 'high':
                    defaultCurveSegments = 200;
                    break;
                case 'medium':
                    defaultCurveSegments = 50;
                    break;
                case 'low':
                    defaultCurveSegments = 10;
                    break;
            }
        } else if (!isNaN(value) && value > 1) {
            defaultCurveSegments = value;
        }
        if (defaultCurveSegments >= 50) {
            roundValues(false);
        } else {
            roundValues(true);
        }
    }

    function inBrowser() {
        return typeof navigator !== 'undefined';
    }

    function installPlugin(type, plugin) {
        if (type === 'expressions') {
            expressionsPlugin = plugin;
        }
    }

    function getFactory(name) {
        switch (name) {
            case "propertyFactory":
                return PropertyFactory;
            case "shapePropertyFactory":
                return ShapePropertyFactory;
            case "matrix":
                return Matrix;
        }
    }
    lottiejs.play = play;
    lottiejs.pause = pause;
    lottiejs.setLocationHref = setLocationHref;
    lottiejs.togglePause = togglePause;
    lottiejs.setSpeed = setSpeed;
    lottiejs.setDirection = setDirection;
    lottiejs.stop = stop;
    lottiejs.moveFrame = moveFrame;
    lottiejs.searchAnimations = searchAnimations;
    lottiejs.registerAnimation = registerAnimation;
    lottiejs.loadAnimation = loadAnimation;
    lottiejs.setSubframeRendering = setSubframeRendering;
    lottiejs.resize = resize;
    //lottiejs.start = start;
    lottiejs.goToAndStop = goToAndStop;
    lottiejs.destroy = destroy;
    lottiejs.setQuality = setQuality;
    lottiejs.inBrowser = inBrowser;
    lottiejs.installPlugin = installPlugin;
    lottiejs.__getFactory = getFactory;
    lottiejs.version = '5.0.6';

    function checkReady() {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            searchAnimations();
        }
    }

    function getQueryVariable(variable) {
        var vars = queryString.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
    }
    var standalone = '__[STANDALONE]__';
    var animationData = '__[ANIMATIONDATA]__';
    var renderer = '';
    if (standalone) {
        var scripts = document.getElementsByTagName('script');
        var index = scripts.length - 1;
        var myScript = scripts[index] || {
            src: ''
        };
        var queryString = myScript.src.replace(/^[^\?]+\??/, '');
        renderer = getQueryVariable('renderer');
    }
    var readyStateCheckInterval = setInterval(checkReady, 100);
    return lottiejs;
}));