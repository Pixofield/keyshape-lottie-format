
// Keyshape Importer for Bodymovin / Lottie

// gets a filename URL, byte array and string to check if this importer can read the file
function doRecognize(filenameUrl, arrray, str)
{
    let hasBodymovinText = str.indexOf('layers') > 0 || str.indexOf('assets') > 0;
    if (filenameUrl.href.toLowerCase().endsWith(".json") && hasBodymovinText) {
        return 100;
    }
    return 0;
}

let globalFrameDur = 100;

// map from id to asset object
let globalAssets = {};

let globalTimeOffset = 0;

let globalIp = 0;
let globalOp = 0;

let globalVersion;

function isUndefined(val)
{
    return typeof val == 'undefined';
}

function frameToTime(fr)
{
    return Math.round(fr * globalFrameDur + globalTimeOffset);
}

function copyName(obj, element)
{
    if (obj.ln) {
        element.setProperty("id", obj.ln);
    } else if (obj.nm) {
        element.setProperty("id", obj.nm);
    }
    if (obj.hd) {
        element.setProperty("display", "none");
    }
}

function parsePathData(data, legacyClose)
{
    if (!Array.isArray(data.v) || !Array.isArray(data.i) || !Array.isArray(data.o)) {
        return "";
    }
    let pathValue = "";
    let pt, i = 0;
    for (i = 0; i < data.v.length - 1; i++) {
        if (!Array.isArray(data.v[i]) || !Array.isArray(data.o[i]) || !Array.isArray(data.i[i])) {
            break;
        }
        if (data.v[i].lengh < 2 || data.o[i].length < 2 || data.i[i].length < 2) {
            break;
        }
        if (i === 0) {
            pt = [ data.v[0][0], data.v[0][1] ];
            pathValue += 'M' + pt[0] + ' ' + pt[1];
        }
        if (!Array.isArray(data.v[i + 1]) || !Array.isArray(data.i[i + 1]) ||
            data.v[i + 1].lengh < 2 || data.i[i + 1].length < 2) {
            break;
        }
        pt = [ data.o[i][0] + data.v[i][0], data.o[i][1] + data.v[i][1] ];
        pathValue += ' C' + pt[0] + ',' + pt[1];
        pt = [ data.i[i + 1][0] + data.v[i + 1][0], data.i[i + 1][1] + data.v[i + 1][1] ];
        pathValue += ' ' + pt[0] + ',' + pt[1];
        pt = [ data.v[i + 1][0], data.v[i + 1][1] ];
        pathValue += ' ' + pt[0] + ',' + pt[1];
    }
    if (data.c || legacyClose) {
        pt = [ data.o[i][0] + data.v[i][0], data.o[i][1] + data.v[i][1] ];
        pathValue += ' C' + pt[0] + ',' + pt[1];
        pt = [ data.i[0][0] + data.v[0][0], data.i[0][1] + data.v[0][1] ];
        pathValue += ' ' + pt[0] + ',' + pt[1];
        pt = [ data.v[0][0], data.v[0][1] ];
        pathValue += ' ' + pt[0] + ',' + pt[1];
        pathValue += 'Z';
    }
    pathValue += ' ';
    return pathValue;
}

function copyPathData(obj, element, dir, legacyClose)
{
    if (obj.a != 1 && !Array.isArray(obj.k)) {
        let pathData = parsePathData(obj.k, legacyClose);
        element.setProperty("d", pathData);
    } else {
        for (let i = 0; i < obj.k.length; ++i) {
            let kf = parseKeyframe(obj, i);
            if (kf) {
                let pathData = parsePathData(kf.value[0], legacyClose);
                element.timeline().setKeyframe("d", kf.time, pathData, kf.easing);
            }
        }
    }
}

function findType(array, type)
{
    let res = array.filter(x => x.ty === type);
    if (res.length > 0) {
        return res[0];
    }
}

function convertEasing(k, nextk, inx = 0)
{
    if (k.h) {
        // recognize Keyshape written step start easing
        if (nextk && nextk.h && k.t + 0.01 >= nextk.t) {
            return "steps(1, start)";
        }
        return "steps(1)";
    }
    let i = k.i || { x: [ 0.833 ], y: [ 0.833 ] };
    let o = k.o || { x: [ 0.167 ], y: [ 0.167 ] };
    // sometimes i and o are plain numbers
    if (typeof i.x == 'number') { i.x = [ i.x ]; }
    if (typeof i.y == 'number') { i.y = [ i.y ]; }
    if (typeof o.x == 'number') { o.x = [ o.x ]; }
    if (typeof o.y == 'number') { o.y = [ o.y ]; }
    let ix = i.x.length > inx ? i.x[inx] : i.x[0];
    let iy = i.y.length > inx ? i.y[inx] : i.y[0];
    let ox = o.x.length > inx ? o.x[inx] : o.x[0];
    let oy = o.y.length > inx ? o.y[inx] : o.y[0];
    if (ix == iy && ox == oy) {
        return "linear";
    }
    return "cubic-bezier("+ox+","+oy+","+ix+","+iy+")";
}

function parseKeyframe(obj, i)
{
    let k = obj.k[i];
    let prevk = i > 0 ? obj.k[i-1] : false;
    if (prevk && prevk.h && k.h && prevk.t + 0.01 >= k.t) { // skip step start second keyframe
        return false;
    }
    // TODO: times can be negative
    let startTime = frameToTime(k.t);
    if (startTime >= 0 && (k.s || (prevk && prevk.e) )) {
        let val = k.s ? k.s : prevk.e;
        let nextk = i < obj.k.length-1 ? obj.k[i+1] : false;
        let ease = convertEasing(k, nextk);
        return { time: startTime, value: val, easing: ease };
    }
    return false;
}

function copyKfs(kfs, element, targetProperty)
{
    let keys = Array.from(kfs.keys());
    for (let i = keys.length-1; i >= 0; --i) {
        let kf = kfs.get(keys[i]);
        element.timeline().setKeyframe(targetProperty, keys[i], kf.v, kf.e);
    }
}

function readProperty(obj, multiplier)
{
    if (obj.a != 1 && !Array.isArray(obj.k)) {
        return obj.k*multiplier;
    }
    let kfs = new Map();
    for (let i = 0; i < obj.k.length; ++i) {
        let kf = parseKeyframe(obj, i);
        if (kf) {
            kfs.set(kf.time, { v: kf.value[0]*multiplier, e: kf.easing });
        }
    }
    if (kfs.size == 0) { // couldn't get any keyframes (negative times?) -> return the first one
        let val = obj.k[0]?.s[0];
        if (isUndefined(val)) {
            return 0;
        }
        return val*multiplier;
    }
    return Array.from(kfs, function([key, value]) {
        return { "time": key, "value": value.v, "easing": value.e };
    });
}

function copyProperty(obj, element, targetProperty, processor)
{
    if (!processor) processor = function(val) { return val; };
    if (obj.a != 1 && !Array.isArray(obj.k)) {
        element.setProperty(targetProperty, processor(obj.k));
    } else {
        let kfs = new Map();
        for (let i = 0; i < obj.k.length; ++i) {
            let kf = parseKeyframe(obj, i);
            if (kf) {
                kfs.set(kf.time, { v: processor(kf.value[0]), e: kf.easing });
            }
        }
        copyKfs(kfs, element, targetProperty);
    }
}

function copyPropertyXY(obj, element, targetPropertyX, targetPropertyY, processor)
{
    if (!processor) processor = function(val) { return val; };
    if (obj.a != 1 && isUndefined(obj.k[0].t)) {
        element.setProperty(targetPropertyX, processor(obj.k[0], "x"));
        element.setProperty(targetPropertyY, processor(obj.k[1], "y"));
    } else {
        let kfsx = new Map();
        let kfsy = new Map();
        let sameEase = true;
        for (let i = 0; i < obj.k.length; ++i) {
            let k = obj.k[i];
            let prevk = i > 0 ? obj.k[i-1] : false;
            if (prevk && prevk.h && k.h && prevk.t + 0.01 >= k.t) { // skip step start second keyframe
                continue;
            }
            // TODO: times can be negative
            let startTime = frameToTime(k.t);
            if (startTime >= 0 && (k.s || (prevk && prevk.e) )) {
                let valueX = k.s ? k.s[0] : prevk.e[0];
                let valueY = k.s ? k.s[1] : prevk.e[1];
                let nextk = i < obj.k.length-1 ? obj.k[i+1] : false;
                let easeX = convertEasing(k, nextk, 0);
                let easeY = convertEasing(k, nextk, 1);
                kfsx.set(startTime, { v: processor(valueX, "x"), e: easeX });
                kfsy.set(startTime, { v: processor(valueY, "y"), e: easeY });
                if (easeX != easeY) {
                    sameEase = false;
                }
            }
        }
        if (!sameEase) {
            element.timeline().setSeparated(targetPropertyX, true);
        }
        copyKfs(kfsx, element, targetPropertyX);
        copyKfs(kfsy, element, targetPropertyY);
    }
}

function copyMotionPath(obj, element)
{
    if (obj.a != 1 && isUndefined(obj.k[0].t)) {
        element.setProperty("ks:positionX", obj.k[0]);
        element.setProperty("ks:positionY", obj.k[1]);
    } else {
        let data = { v: new Map(), i: new Map(), o: new Map() };
        let kfsx = new Map();
        let kfsy = new Map();
        let prevStartTime = -1;
        for (let i = 0; i < obj.k.length; ++i) {
            let k = obj.k[i];
            let prevk = i > 0 ? obj.k[i-1] : false;
            if (prevk && prevk.h && k.h && prevk.t + 0.01 >= k.t) { // skip step start second keyframe
                continue;
            }
            // TODO: times can be negative
            let startTime = frameToTime(k.t);
            if (startTime >= 0 && (k.s || (prevk && prevk.e) )) {
                // ensure keyframes don't overwrite each other, otherwise kf count differs
                // from path node count
                if (startTime <= prevStartTime) {
                    startTime = prevStartTime+1;
                }
                let valueX = k.s ? k.s[0] : prevk.e[0];
                let valueY = k.s ? k.s[1] : prevk.e[1];
                let nextk = i < obj.k.length-1 ? obj.k[i+1] : false;
                kfsx.set(startTime, { v: valueX, e: convertEasing(k, nextk) });
                kfsy.set(startTime, { v: valueY, e: convertEasing(k, nextk) });
                data.v.set(startTime, [ valueX, valueY ]);

                // nextval is next kf value or this kf end value or this kf value
                let nextval;
                if (i < obj.k.length-1 && obj.k[i+1].s) {
                    nextval = obj.k[i+1].s;
                } else if (k.e) {
                    nextval = k.e;
                } else {
                    nextval = [ valueX, valueY ];
                }
                let to = k.to ? k.to : [ 0, 0 ];
                let ti = k.ti ? k.ti : [ 0, 0 ];
                data.i.set(startTime, [ valueX + to[0], valueY + to[1] ]);
                data.o.set(startTime, [ nextval[0] + ti[0], nextval[1] + ti[1] ]);
                prevStartTime = startTime;
            }
        }
        copyKfs(kfsx, element, "ks:positionX");
        copyKfs(kfsy, element, "ks:positionY");
        var mp = "";
        // this assumes that times were in increasing order
        let prevTime = 0;
        for (let time of data.v.keys()) {
            let v = data.v.get(time);
            if (mp.length == 0) {
                mp += "M"+v[0]+","+v[1]+" ";
                continue;
            }
            let i = data.i.get(prevTime);
            let o = data.o.get(prevTime);
            if (i && o) {
                mp += "C"+i[0]+","+i[1]+" "+o[0]+","+o[1]+" "+v[0]+","+v[1]+" ";
            } else {
                mp += "L"+v[0]+","+v[1]+" ";
            }
            prevTime = time;
        }
        if (mp.length > 0) {
            element.timeline().setMotionPath(mp);
        }
    }
}

function copyTransform(obj, element, readMotionPath = true)
{
    if (!obj) { return; }
    if (obj.p) {
        if (obj.p.s) { // separated position
            element.timeline().setSeparated("ks:positionX", true);
            copyProperty(obj.p.x, element, "ks:positionX");
            copyProperty(obj.p.y, element, "ks:positionY");
        } else {
            if (readMotionPath) {
                copyMotionPath(obj.p, element);
            } else {
                copyPropertyXY(obj.p, element, "ks:positionX", "ks:positionY");
            }
        }
    }
    if (obj.s) {
        copyPropertyXY(obj.s, element, "ks:scaleX", "ks:scaleY", function(val) { return val/100; });
    }
    if (obj.r) {
        copyProperty(obj.r, element, "ks:rotation");
    } else if (obj.rz) { // TODO: this should maybe check that ddd==1
        copyProperty(obj.rz, element, "ks:rotation");
    }

    if (obj.sk) {
        let prop = "ks:skewX";
        let mult = -1;
        if (obj.sa) {
            let sa = animatedToValue(obj.sa);
            if (sa == 90 || sa == 270) {
                prop = "ks:skewY";
                mult = 1;
            }
        }
        copyProperty(obj.sk, element, prop, function(val) { return val*mult; });
    }
    if (obj.a) {
        copyPropertyXY(obj.a, element, "ks:anchorX", "ks:anchorY", function(val) { return val*-1; });
    }
}

function copyOpacity(obj, element)
{
    if (!obj) { return; }
    if (obj.o) {
        copyProperty(obj.o, element, "opacity", function(val) { return val/100; });
    }
}

function hex(val)
{
    return val < 16 ? "0"+val.toString(16) : val.toString(16);
}

function hexColor(r, g, b)
{
    let mult = globalVersion != "4.0.0" ? 255 : 1; // old versions have color range [0, 255]
    return "#" + hex(Math.round(r*mult)) + hex(Math.round(g*mult)) + hex(Math.round(b*mult));
}

function colorToCss(r, g, b, a)
{
    if (a == 1) {
        return hexColor(r, g, b);
    }
    let mult = globalVersion != "4.0.0" ? 255 : 1; // old versions have color range [0, 255]
    return "rgba(" + Math.round(r*mult) + "," +
                     Math.round(g*mult) + "," +
                     Math.round(b*mult) + "," + a + ")";
}

function colorObjToCss(colorobj)
{
    let r = colorobj[0];
    let g = colorobj[1];
    let b = colorobj[2];
    let a = colorobj[3];
    return colorToCss(r, g, b, a);
}

function copyColor(obj, element, prop)
{
    // color
    if (obj.c) {
        if (obj.c.a != 1) {
            element.setProperty(prop, colorObjToCss(obj.c.k));
        } else {
            for (let i = 0; i < obj.c.k.length; ++i) {
                let kf = parseKeyframe(obj.c, i);
                if (kf) {
                    element.timeline().setKeyframe(prop, kf.time, colorObjToCss(kf.value), kf.easing);
                }
            }
        }
    }
}

function len(p1, p2)
{
    let dx = p2[0] - p1[0];
    let dy = p2[1] - p1[1];
    return Math.sqrt(dx*dx + dy*dy);
}

function copyGradient(obj, element, prop)
{
    if (obj.s.a == 1 || obj.e.a == 1 || obj.g.k.a == 1) { // animations are not supported
        element.setProperty(prop, "#000000");
        return;
    }
    let start = obj.s.k;
    let end = obj.e.k;
    let grad;
    if (obj.t == 2) {
        let rad = len(start, end);
        grad = "-ks-radial-gradient("+rad+" "+start[0]+" "+start[1]+" "+start[0]+" "+start[1];
    } else {
        grad = "-ks-linear-gradient("+start[0]+" "+start[1]+" "+end[0]+" "+end[1];
    }
    grad +=" pad matrix(1 0 0 1 0 0), ";
    let cs = [];
    let stops = obj.g.k.k;
    for (let i = 0; i < obj.g.p; ++i) {
        let offset = stops[i * 4] * 100;
        let r = stops[i * 4 + 1];
        let g = stops[i * 4 + 2];
        let b = stops[i * 4 + 3];
        // note: this ignores opacity offset
        let alphainx = obj.g.p*4 + i*2 + 1;
        let a = stops.length > alphainx ? stops[alphainx] : 1;
        cs.push(colorToCss(r, g, b, a)+" "+offset+"%");
    }
    grad += cs.join(', ') + ")";
    element.setProperty(prop, grad);
}

function copyFill(obj, element)
{
    if (!obj || !obj.o) { return; }
    if (element.tagName != "rect" && element.tagName != "ellipse" && element.tagName != "path") {
        return;
    }
    if (element.getProperty("fill") != "none") {
        return;
    }
    if (obj.ty == "fl") {
        copyColor(obj, element, "fill");
    } else {
        copyGradient(obj, element, "fill");
    }
    if (obj.o) {
        copyProperty(obj.o, element, "fill-opacity", function(val) { return val/100; });
    }
    if (obj.r) {
        if (obj.r == 2) {
            element.setProperty("fill-rule", "evenodd");
        } else {
            element.setProperty("fill-rule", "nonzero");
        }
    }
}

function appendDashValue(kfs, dash)
{
    if (kfs.size == 0) {
        kfs.set(0, { v: dash });
    } else if (kfs.size == 1) {
        kfs.set(kfs.keys().next().value, { v: kfs.values().next().value.v + " " + dash });
    } else {
        for (let key of kfs.keys()) {
            let newval = kfs.get(key).v + " " + dash;
            kfs.set(key, { v: newval });
        }
    }
}

function combineDashKfs(kfs, dkfs)
{
    for (let time of dkfs.keys()) {
        let oldkf = kfs.get(time);
        if (oldkf) {
            kfs.set(time, { v: oldkf.v + " " + dkfs.get(time).v, e: oldkf.e });
        }
    }
}

function copyDash(dashArray, element)
{
    let kfs = new Map();
    for (let obj of dashArray) {
        if (obj.n != "d" && obj.n != "g") {
            continue;
        }
        if (obj.v.a != 1) {
            appendDashValue(kfs, obj.v.k);
        } else {
            let dkfs = new Map();
            for (let i = 0; i < obj.v.k.length; ++i) {
                let kf = parseKeyframe(obj.v, i);
                if (kf) {
                    dkfs.set(kf.time, { v: kf.value[0], e: kf.easing });
                }
            }
            if (kfs.size == 0) {
                kfs = dkfs;
            } else {
                combineDashKfs(kfs, dkfs);
            }
        }
    }
    if (kfs.size == 1) {
        element.setProperty("stroke-dasharray", kfs.values().next().value.v);
    } else if (kfs.size > 1) {
        let sorted = new Map([...kfs.entries()].sort());
        copyKfs(sorted, element, "stroke-dasharray");
    }
    for (let obj of dashArray) {
        if (obj.n == "o") {
            copyProperty(obj.v, element, "stroke-dashoffset");
            break;
        }
    }
}

const linecaps = [ "butt", "round", "square" ];
const linejoins = [ "miter", "round", "bevel" ];

function copyStroke(obj, element)
{
    if (!obj || !obj.o) { return; }
    if (element.tagName != "rect" && element.tagName != "ellipse" && element.tagName != "path") {
        return;
    }
    if (element.getProperty("stroke") != "none") {
        return;
    }
    if (obj.ty == "st") {
        copyColor(obj, element, "stroke");
    } else {
        copyGradient(obj, element, "stroke");
    }
    if (obj.o) {
        copyProperty(obj.o, element, "stroke-opacity", function(val) { return val/100; });
    }
    if (obj.w) {
        copyProperty(obj.w, element, "stroke-width");
    }
    if (obj.ml) {
        element.setProperty("stroke-miterlimit", obj.ml);
    }
    let lc = obj.lc ? obj.lc : 2;
    element.setProperty("stroke-linecap", linecaps[obj.lc-1] || "round");
    let lj = obj.lj ? obj.lj : 2;
    element.setProperty("stroke-linejoin", linejoins[obj.lj-1] || "round");
    if (obj.d) {
        copyDash(obj.d, element);
    }
}

// returns a single value
function animatedToValue(value)
{
    return value.a == 1 || Array.isArray(value.k) ? value.k[0].s[0] : value.k;
}

// returns an 2/3 dim array
function multiDimAnimatedToValue(value)
{
    return value.a == 1 || !isUndefined(value.k[0].t) ? value.k[0].s : value.k;
}

const EllipseK = 4*(Math.sqrt(2)-1)/3;

function createRect(shape, posx, posy)
{
    var p = multiDimAnimatedToValue(shape.p);
    var s = multiDimAnimatedToValue(shape.s);
    let rad = animatedToValue(shape.r);
    var midx = p[0], midy = p[1], sw = s[0]/2, sh = s[1]/2;
    if (rad == 0) {
        let l = -sw + posx, t = -sh + posy, r = sw + posx, b = sh + posy;
        if (shape.d !== 3) {
            return "M" + r + "," + t +
                   "L" + r + "," + b +
                   "L" + l + "," + b +
                   "L" + l + "," + t +
                   "L" + r + "," + t + "Z";
        } else {
            return "M" + r + "," + t +
                   "L" + l + "," + t +
                   "L" + l + "," + b +
                   "L" + r + "," + b +
                   "L" + r + "," + t + "Z";
        }
    } else {
        if (rad > sw) { rad = sw; }
        if (rad > sh) { rad = sh; }
        let rk = EllipseK * rad;
        let l = -sw + posx, t = -sh + posy, r = sw + posx, b = sh + posy;
        if (shape.d !== 3) {
            return "M" + (r) + "," + (t+rad) +
                   "L" + (r) + "," + (b-rad) +
                   "C" + (r) + "," + (b-rad+rk) + "," + (r-rk) + "," + (b) + "," + (r-rad) + "," + (b) +
                   "L" + (l+rad) + "," + (b) +
                   "C" + (l+rad-rk) + "," + (b) + "," + (l) + "," + (b-rad+rk) + "," + (l) + "," + (b-rad) +
                   "L" + (l) + "," + (t+rad) +
                   "C" + (l) + "," + (t+rad-rk) + "," + (l+rk) + "," + (t) + "," + (l+rad) + "," + (t) +
                   "L" + (r-rad) + "," + (t) +
                   "C" + (r-rad+rk) + "," + (t) + "," + (r) + "," + (t+rad-rk) + "," + (r) + "," + (t+rad) + "Z";
        } else {
            return "M" + (r) + "," + (t+rad) +
                   "C" + (r) + "," + (t+rad-rk) + "," + (r-rk) + "," + (t) + "," + (r-rad) + "," + (t) +
                   "L" + (l+rad) + "," + (t) +
                   "C" + (l+rad-rk) + "," + (t) + "," + (l) + "," + (t+rad-rk) + "," + (l) + "," + (t+rad) +
                   "L" + (l) + "," + (b-rad) +
                   "C" + (l) + "," + (b-rad+rk) + "," + (l+rk) + "," + (b) + "," + (l+rad) + "," + (b) +
                   "L" + (r-rad) + "," + (b) +
                   "C" + (r-rad+rk) + "," + (b) + "," + (r) + "," + (b-rad+rk) + "," + (r) + "," + (b-rad) +
                   "L" + (r) + "," + (t+rad) + "Z";
        }
    }
}

function createEllipse(shape)
{
    var p = multiDimAnimatedToValue(shape.p);
    var s = multiDimAnimatedToValue(shape.s);
    var midx = p[0], midy = p[1], sw = s[0]/2, sh = s[1]/2;
    let rxk = EllipseK * sw;
    let ryk = EllipseK * sh;
    if (shape.d !== 3){
        return "M" + (midx) + "," + (midy-sh) +
               "C" + (midx+rxk) + "," + (midy-sh) + "," +(midx+sw) + "," + (midy-ryk) + "," + (midx+sw) + "," + (midy) +
               "C" + (midx+sw) + "," + (midy+ryk) + "," +(midx+rxk) + "," + (midy+sh) + "," + (midx) + "," + (midy+sh) +

               "C" + (midx-rxk) + "," + (midy+sh) + "," +(midx-sw) + "," + (midy+ryk) + "," + (midx-sw) + "," + (midy) +
               "C" + (midx-sw) + "," + (midy-ryk) + "," +(midx-rxk) + "," + (midy-sh) + "," + (midx) + "," + (midy-sh) + "Z";
    } else {
        return "M" + (midx) + "," + (midy-sh) +
               "C" + (midx-rxk) + "," + (midy-sh) + "," +(midx-sw) + "," + (midy-ryk) + "," + (midx-sw) + "," + (midy) +
               "C" + (midx-sw) + "," + (midy+ryk) + "," +(midx-rxk) + "," + (midy+sh) + "," + (midx) + "," + (midy+sh) +

               "C" + (midx+rxk) + "," + (midy+sh) + "," +(midx+sw) + "," + (midy+ryk) + "," + (midx+sw) + "," + (midy) +
               "C" + (midx+sw) + "," + (midy-ryk) + "," +(midx+rxk) + "," + (midy-sh) + "," + (midx) + "," + (midy-sh) + "Z";
    }
}

/* Copied/modified from https://github.com/airbnb/lottie-web JS player */
function createPolygon(shape, posx, posy, rot)
{
    var numPts = Math.floor(animatedToValue(shape.pt));
    var angle = Math.PI*2/numPts;
    var rad = animatedToValue(shape.or);
    var roundness = animatedToValue(shape.os) / 100;
    var perimSegment = 2*Math.PI*rad/(numPts*4);
    var i, currentAng = -Math.PI/ 2 + (rot/180*Math.PI);
    var dir = shape.d === 3 ? -1 : 1;
    var data = { v: [], i: [], o: [], c: 1 };
    for(i=0;i<numPts;i+=1){
        var x = rad * Math.cos(currentAng);
        var y = rad * Math.sin(currentAng);
        var ox = x === 0 && y === 0 ? 0 : y/Math.sqrt(x*x + y*y);
        var oy = x === 0 && y === 0 ? 0 : -x/Math.sqrt(x*x + y*y);
        x += posx;
        y += posy;
        data.v[i] = [x,y];
        data.i[i] = [ox*perimSegment*roundness*dir,oy*perimSegment*roundness*dir];
        data.o[i] = [-ox*perimSegment*roundness*dir,-oy*perimSegment*roundness*dir];
        currentAng += angle*dir;
    }
    return parsePathData(data);
}

/* Copied/modified from https://github.com/airbnb/lottie-web JS player */
function createStar(shape, posx, posy, rot)
{
    var numPts = Math.floor(animatedToValue(shape.pt))*2;
    var angle = Math.PI*2/numPts;

    var longFlag = true;
    var longRad = animatedToValue(shape.or);
    var shortRad = animatedToValue(shape.ir);
    var longRound = animatedToValue(shape.os) / 100;
    var shortRound = animatedToValue(shape.is) / 100;
    var longPerimSegment = 2*Math.PI*longRad/(numPts*2);
    var shortPerimSegment = 2*Math.PI*shortRad/(numPts*2);
    var i, rad,roundness,perimSegment, currentAng = -Math.PI/ 2 + (rot/180*Math.PI);
    var dir = shape.d === 3 ? -1 : 1;
    var data = { v: [], i: [], o: [], c: 1 };
    for(i=0;i<numPts;i+=1){
        rad = longFlag ? longRad : shortRad;
        roundness = longFlag ? longRound : shortRound;
        perimSegment = longFlag ? longPerimSegment : shortPerimSegment;
        var x = rad * Math.cos(currentAng);
        var y = rad * Math.sin(currentAng);
        var ox = x === 0 && y === 0 ? 0 : y/Math.sqrt(x*x + y*y);
        var oy = x === 0 && y === 0 ? 0 : -x/Math.sqrt(x*x + y*y);
        x += posx;
        y += posy;
        data.v[i] = [x,y];
        data.i[i] = [ox*perimSegment*roundness*dir,oy*perimSegment*roundness*dir];
        data.o[i] = [-ox*perimSegment*roundness*dir,-oy*perimSegment*roundness*dir];
        longFlag = !longFlag;
        currentAng += angle*dir;
    }
    return parsePathData(data);
}

function copyPathTrimToDashArray(trimObj, element)
{
    if (!trimObj) { return; }
    if (element.tagName != "rect" && element.tagName != "ellipse" && element.tagName != "path") {
        return;
    }
    let stroke = element.getProperty("stroke");
    if (stroke == "" || stroke == "none") {
        return;
    }
    // don't override dash if it exists
    let da = element.getProperty("stroke-dasharray").trim();
    if (da != "" && da != "none") {
        return;
    }
    let pathLen = new KSPathData(element.getProperty("d")).getTotalLength();
    let start = 0;
    let end = 1;
    let offset = 0;
    if (trimObj.s) {
        start = readProperty(trimObj.s, 0.01);
    }
    if (trimObj.e) {
        end = readProperty(trimObj.e, 0.01);
    }
    if (trimObj.o) {
        offset = readProperty(trimObj.o, 0.01);
    }
    let staticStart = Array.isArray(start) ? start[0].value : start;
    let staticEnd = Array.isArray(end) ? end[0].value : end;
    let staticOffset = Array.isArray(offset) ? offset[0].value : offset;
    element.timeline().removeAllKeyframes("stroke-dasharray");
    element.timeline().removeAllKeyframes("stroke-dashoffset");

    if (Array.isArray(start)) { // start animation
        for (let i = start.length-1; i >= 0; --i) {
            let kf = start[i];
            element.timeline().setKeyframe("stroke-dashoffset", kf.time,
                                           -(+kf.value+staticOffset)*pathLen, kf.easing);
        }
        // set dash array
        element.setProperty("stroke-dasharray", pathLen);


    } else if (Array.isArray(end)) { // end animation
        for (let i = end.length-1; i >= 0; --i) {
            let kf = end[i];
            element.timeline().setKeyframe("stroke-dashoffset", kf.time,
                                           (-kf.value+staticOffset-1)*pathLen, kf.easing);
        }
        // set dash array
        element.setProperty("stroke-dasharray", pathLen);

    } else if (Array.isArray(offset)) { // offset animation
        for (let i = offset.length-1; i >= 0; --i) {
            let kf = offset[i];
            element.timeline().setKeyframe("stroke-dashoffset", kf.time,
                                           -(+kf.value+staticStart)*pathLen, kf.easing);
        }
        // set dash array
        let da = Math.ceil((staticEnd - staticStart) * pathLen * 100) / 100; // round to 2 decimals
        element.setProperty("stroke-dasharray", da + " " + (pathLen-da));

    } else { // no animations
        element.setProperty("stroke-dashoffset", -(offset+staticStart)*pathLen);
        // set dash array
        if (staticStart != 0 || staticEnd != 1) {
            let da = Math.ceil((staticEnd - staticStart) * pathLen * 100) / 100; // round to 2 decimals
            element.setProperty("stroke-dasharray", da + " " + (pathLen-da));
        }
    }
}

function applyPaint(fill, stroke, trim, elements)
{
    for (let child of elements) {
        copyFill(fill, child);
        copyStroke(stroke, child);
        copyPathTrimToDashArray(trim, child);
        applyPaint(fill, stroke, trim, child.children);
    }
}

function applyPainting(array, elements)
{
    let fill = findType(array, "gf") || findType(array, "fl");
    let stroke = findType(array, "gs") || findType(array, "st");
    let trim = findType(array, "tm");
    applyPaint(fill, stroke, trim, elements);
}

function applyMask(layer, element)
{
    if (!layer.masksProperties) {
        return;
    }
    for (let mask of layer.masksProperties) {
        let maskPath = app.activeDocument.createElement("path");
        maskPath.setProperty("fill", "#ffffff");
        if (mask.pt) {
            copyPathData(mask.pt, maskPath, 1, false);
        }
        copyOpacity(mask, maskPath);
        let maskElem = app.activeDocument.createElement("mask");
        copyName(mask, maskElem);
        maskElem.append(maskPath);
        element.append(maskElem);
    }
}

function hasDashes(items)
{
    let stroke = findType(items, "gs") || findType(items, "st");
    return stroke && stroke.d;
}

function createCombinedPathElement(shapes, parentElement)
{
    let path = app.activeDocument.createElement("path");
    path.setProperty("fill", "none");
    parentElement.insertAt(0, path);
    copyName(shapes[0], path);
    let pathData = "";
    for (let shape of shapes) {
        if (shape.ty == "sh") {
            if (shape.ks) {
                pathData += parsePathData(shape.ks.k, shape.closed);
            }
        } else if (shape.ty == "rc") {
            let pos = multiDimAnimatedToValue(shape.p);
            pathData += createRect(shape, pos[0], pos[1]);
        } else if (shape.ty == "el") {
            pathData += createEllipse(shape);
        } else if (shape.ty == "sr") {
            let pos = multiDimAnimatedToValue(shape.p);
            let rot = animatedToValue(shape.r);
            if (shape.sy == 2) {
                pathData += createPolygon(shape, pos[0], pos[1], rot);
            } else {
                pathData += createStar(shape, pos[0], pos[1], rot);
            }
        }
    }
    path.setProperty("d", pathData);
}

function readShapes(shapes, parentElement, hasDashStroke)
{
    // create a combined path if it is possible
    let containsGroupsOrAnimations = false;
    for (let shape of shapes) {
        if (shape.ty == "gr" || (shape.p && shape.p.a == 1) || (shape.r && shape.r.a == 1) ||
                (shape.ks && (shape.ks.a == 1 || Array.isArray(shape.ks.k)))) {
            containsGroupsOrAnimations = true;
            break;
        }
        if (shape.ty == "el" && shape.s && shape.s.a == 1) {
            containsGroupsOrAnimations = true;
            break;
        }
    }
    if (shapes.length > 1 && !containsGroupsOrAnimations) {
        createCombinedPathElement(shapes, parentElement);
        return;
    }
    // no combined path - create separate elements
    for (let shape of shapes) {
        if (shape.ty == "sh") {
            let path = app.activeDocument.createElement("path");
            path.setProperty("fill", "none");
            parentElement.insertAt(0, path);
            copyName(shape, path);
            if (shape.ks) {
                copyPathData(shape.ks, path, shape.d, shape.closed);
            }

        } else if (shape.ty == "rc") {
            if (!hasDashStroke) {
                let rect = app.activeDocument.createElement("rect");
                rect.setProperty("fill", "none");
                parentElement.insertAt(0, rect);
                copyName(shape, rect);
                let w = 0, h = 0;
                if (shape.s) {
                    let wh = multiDimAnimatedToValue(shape.s);
                    w = wh[0];
                    h = wh[1];
                    rect.setProperty("width", w);
                    rect.setProperty("height", h);
                }
                if (shape.p) {
                    copyPropertyXY(shape.p, rect, "ks:positionX", "ks:positionY", function(val, d) {
                        if (d == "x") return val-w/2;
                        else return val-h/2;
                    });
                }
                if (shape.r) {
                    copyProperty(shape.r, rect, "rx", function(val) {
                        if (val > w/2) { return w/2; }
                        if (val > h/2) { return h/2; }
                        return val;
                    });
                }
            } else {
                let rect = app.activeDocument.createElement("path");
                rect.setProperty("fill", "none");
                parentElement.insertAt(0, rect);
                copyName(shape, rect);
                if (shape.p) {
                    copyPropertyXY(shape.p, rect, "ks:positionX", "ks:positionY");
                }
                rect.setProperty("d", createRect(shape, 0, 0));
            }

        } else if (shape.ty == "el") {
            if (!hasDashStroke) {
                let ellipse = app.activeDocument.createElement("ellipse");
                ellipse.setProperty("fill", "none");
                parentElement.insertAt(0, ellipse);
                copyName(shape, ellipse);
                if (shape.p) {
                    copyPropertyXY(shape.p, ellipse, "ks:positionX", "ks:positionY");
                }
                if (shape.s) {
                    copyPropertyXY(shape.s, ellipse, "rx", "ry", function(val) {
                        return val/2;
                    });
                }
            } else {
                let ellipse = app.activeDocument.createElement("path");
                ellipse.setProperty("fill", "none");
                parentElement.insertAt(0, ellipse);
                copyName(shape, ellipse);
                if (shape.p) {
                    copyPropertyXY(shape.p, ellipse, "ks:positionX", "ks:positionY");
                }
                ellipse.setProperty("d", createEllipse(shape));
            }

        } else if (shape.ty == "sr") {
            let star = app.activeDocument.createElement("path");
            star.setProperty("fill", "none");
            parentElement.insertAt(0, star);
            copyName(shape, star);
            if (shape.p) {
                copyPropertyXY(shape.p, star, "ks:positionX", "ks:positionY");
            }
            copyProperty(shape.r, star, "ks:rotation");
            if (shape.sy == 2) {
                star.setProperty("d", createPolygon(shape, 0, 0, 0));
            } else {
                star.setProperty("d", createStar(shape, 0, 0, 0));
            }

        } else if (shape.ty == "gr") {
            let g = app.activeDocument.createElement("g");
            parentElement.insertAt(0, g);
            copyName(shape, g);
            let tr = findType(shape.it, "tr");
            copyTransform(tr, g, false);
            copyOpacity(tr, g);

            // read children before setting colors, because colors are set to paths
            readShapes(shape.it, g, hasDashes(shape.it));

            applyPainting(shape.it, g.children);
        }
    }
}

function readLayers(parentElement, layers)
{
    let indToLayer = {};
    for (let i = 0; i < layers.length; ++i) {
        let layer = layers[i];
        if (layer.td && layer.td > 0) { // matte track is processed later
            continue;
        }
        let elem = layerToElement(layer);
        // if previous layer is a matte track, then add it as a mask
        // TODO: add support for inverted mattes
        if (elem && layer.tt && (layer.tt == 1 || layer.tt == 3) && i > 0 && layers[i-1].td) {
            addTrackMatteMask(elem, layer, layers[i-1]);
        }
        if (elem && !isUndefined(layer.ind)) {
            indToLayer[layer.ind] = layer;
        }
    }
    // TODO: remove unnecessary groups
    // layer parenting
    for (let layer of layers) {
        if (!layer.element) {
            continue;
        }
        if (layer.td && layer.td > 0) { // matte track has already been added to an element
            continue;
        }
        let elem = layer.element;
        while (!isUndefined(layer.parent) && !isUndefined(indToLayer[layer.parent])) {
            let parentLayer = indToLayer[layer.parent];
            let g = app.activeDocument.createElement("g");
            copyTransform(parentLayer.ks, g);
            g.setProperty("id", parentLayer.nm);
            g.append(elem);
            layer = parentLayer;
            elem = g;
        }
        parentElement.insertAt(0, elem);
    }
}

function layerToElement(layer)
{
    let elem;
    if (layer.ty == 0) { // precomp
        elem = app.activeDocument.createElement("g");
        layer.element = elem;
        copyName(layer, elem);
        copyTransform(layer.ks, elem);
        copyOpacity(layer.ks, elem); // TODO: this should affect only precomp, not parented children
        globalTimeOffset += layer.ip * globalFrameDur;
        if (!isUndefined(layer.refId) && globalAssets[layer.refId]) {
            readLayers(elem, globalAssets[layer.refId].layers);
        }
        globalTimeOffset -= layer.ip * globalFrameDur;
        applyMask(layer, elem);

    } else if (layer.ty == 1) { // solid
        elem = app.activeDocument.createElement("g");
        layer.element = elem;
        copyName(layer, elem);
        copyTransform(layer.ks, elem);
        let rect = app.activeDocument.createElement("rect");
        copyOpacity(layer.ks, rect);
        rect.setProperty("fill", layer.sc);
        rect.setProperty("width", layer.sw);
        rect.setProperty("height", layer.sh);
        elem.append(rect);
        applyMask(layer, elem);

    } else if (layer.ty == 2) { // image
        elem = app.activeDocument.createElement("g");
        layer.element = elem;
        copyName(layer, elem);
        copyTransform(layer.ks, elem);
        let image = app.activeDocument.createElement("image");
        copyOpacity(layer.ks, image);
        elem.append(image);
        if (!isUndefined(layer.refId) && globalAssets[layer.refId]) {
            if (globalAssets[layer.refId].e == 1) { // embedded
                try {
                    image.setProperty("href", globalAssets[layer.refId].p);
                } catch (e) {
                    // invalid image -- just leave it blank and keep going
                }
            } else { // not embedded
                let fullPath = globalAssets[layer.refId].u + globalAssets[layer.refId].p;
                image.setProperty("href", fullPath);
            }
            image.setProperty("width", globalAssets[layer.refId].w);
            image.setProperty("height", globalAssets[layer.refId].h);
        }
        applyMask(layer, elem);

    } else if (layer.ty == 3) { // null
        elem = app.activeDocument.createElement("g");
        layer.element = elem;
        copyName(layer, elem);
        copyTransform(layer.ks, elem);
        // no opacity copying, null is always parented

    } else if (layer.ty == 4 && layer["shapes"]) { // shape
        elem = app.activeDocument.createElement("g");
        layer.element = elem;
        copyName(layer, elem);
        copyTransform(layer.ks, elem);
        readShapes(layer["shapes"], elem, hasDashes(layer["shapes"]));
        applyPainting(layer["shapes"], elem.children);
        // copy opacity to children - setting it on 'g' would affect parent children
        // TODO: should create a wrapper element so that opacity is not overwritten
        for (let child of elem.children) {
            if (!child.timeline().hasKeyframes("opacity")) {
                copyOpacity(layer.ks, child);
            }
        }
        applyMask(layer, elem);

    } else if (layer.ty == 5) { // text
        elem = app.activeDocument.createElement("g");
        layer.element = elem;
        copyName(layer, elem);
        copyTransform(layer.ks, elem);
        let text = app.activeDocument.createElement("text");
        copyOpacity(layer.ks, text);
        elem.append(text);
        if (layer.t && layer.t.d && layer.t.d) {
            let txt = animatedToValue(layer.t.d);
            if (layer.t.d.k && layer.t.d.k[0] && layer.t.d.k[0].s && layer.t.d.k[0].s.t) {
                txt = layer.t.d.k[0].s;
            }
            if (txt) {
                if (txt.t) {
                    text.textContent = txt.t;
                }
                if (txt.f) {
                    text.setProperty("font-family", txt.f);
                }
                if (txt.s) {
                    text.setProperty("font-size", txt.s);
                }
                if (txt.fc) {
                    text.setProperty("fill", colorObjToCss(txt.fc));
                }
                if (txt.j) {
                    const align = [ "start", "end", "middle" ];
                    text.setProperty("text-anchor", align[txt.j] || "middle");
                }
                if (txt.tr) {
                    text.setProperty("letter-spacing", (txt.tr/1000)+"em");
                }
                if (txt.lh) {
                    text.setProperty("line-height", txt.lh+"px");
                }
                if (txt.ls) {
                    text.setProperty("ks:positionY", -txt.ls);
                }
            }
        }
        applyMask(layer, elem);
    }

    if (elem) {
        if (layer.ao == 1) {
            elem.setProperty("ks:motion-rotation", "auto");
        }
        if (layer.bm) {
            const blendingModes = [
                "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn",
                "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"
            ];
            elem.setProperty("mix-blend-mode", blendingModes[layer.bm]);
        }
        if (layer.ip > globalIp || layer.op < globalOp) {
            let ipt = frameToTime(layer.ip);
            let opt = frameToTime(layer.op);
            if (ipt < 0) { ipt = 0; }
            if (opt < 0) { opt = 0; }
            elem.timeline().setKeyframe("visibility", ipt, "visible", "steps(1)");
            elem.timeline().setKeyframe("visibility", opt, "hidden", "steps(1)");
        }
    }
    return elem;
}

function addTrackMatteMask(element, layer, matteLayer)
{
    let matteElem = layerToElement(matteLayer);
    if (!matteElem) {
        return;
    }
    // group matte and content so that content transform doesn't affect matte
    let gElem = app.activeDocument.createElement("g");
    let maskElem = app.activeDocument.createElement("mask");
    if (layer.tt == 1) {
        maskElem.setProperty("mask-type", "alpha");
    }
    maskElem.append(matteElem);
    gElem.append(element);
    gElem.append(maskElem);
    layer.element = gElem;
}

function readMarkers(rootElement, markers)
{
    let ml = [];
    for (let marker of markers) {
        let m = {
            time: (marker.tm || 0) * globalFrameDur,
            dur: (marker.dr || 0) * globalFrameDur,
            name: marker.cm
        };
        ml.push(m);
    }
    rootElement.timeline().setTimeMarkers(ml);
}

// main import function
function doImport(filenameUrl)
{
    let content = app.fs.readFileSync(filenameUrl, { encoding: "utf-8" });
    let json = JSON.parse(content);

    let root = app.activeDocument.documentElement;
    let fps = Math.round(json["fr"]);
    root.setProperty("ks:fps", fps);
    globalFrameDur = 1000 / fps;

    globalVersion = json["v"];
    let w = json["w"];
    let h = json["h"];
    let viewBox = "0 0 "+w+" "+h;
    root.setProperty("viewBox", viewBox);
    copyName(json, app.activeDocument.documentElement);

    globalIp = json["ip"] || 0;
    globalOp = json["op"] || 0;
    root.setProperty("ks:playRangeIn", globalIp * globalFrameDur);
    root.setProperty("ks:playRangeOut", globalOp * globalFrameDur);

    // read assets
    if (Array.isArray(json["assets"])) {
        for (let asset of json["assets"]) {
            globalAssets[asset.id] = asset;
        }
    }

    readLayers(root, json["layers"]);

    if (Array.isArray(json["markers"])) {
        readMarkers(root, json["markers"]);
    }
}
