
// Keyshape Importer for Bodymovin / Lottie

const RotateStr = !app.activeDocument ? "ks:rotate" :
    app.activeDocument.documentElement.getProperty("ks:rotate") != null ? "ks:rotate" : "ks:rotation";

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
    if (!data.v || !data.i || !data.o) {
        return "";
    }
    let pathValue = "";
    let pt, i = 0;
    for (i = 0; i < data.v.length - 1; i++) {
        if (i === 0) {
            pt = [ data.v[0][0], data.v[0][1] ];
            pathValue += 'M' + pt[0] + ' ' + pt[1];
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
        for (let i = 0; i < obj.k.length-1; ++i) {
            let k = obj.k[i];
            let nextk = obj.k[i+1];
            // TODO: sometimes times are negative??
            let startTime = k.t * globalFrameDur + globalTimeOffset;
            if (startTime >= 0) {
                let pathData = parsePathData(k.s[0], legacyClose);
                element.timeline().setKeyframe("d", startTime, pathData);
            }
            let endTime = nextk.t * globalFrameDur + globalTimeOffset;
            if (endTime >= 0 && k.e) {
                let pathData = parsePathData(k.e[0], legacyClose);
                element.timeline().setKeyframe("d", endTime, pathData);
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

function arraysEqual(a1, a2)
{
    if (!a2) { return true; }
    if (a1.length != a2.length) { return false; }
    for (let i = 0; i < a1.length; ++i) {
        if (a1[i] != a2[i]) {
            return false;
        }
    }
    return true;
}

function convertEasing(objk, prevk)
{
    if (objk.h) {
        if (prevk && prevk.e && arraysEqual(objk.s, prevk.e)) {
            return "steps(1)";
        }
        return "steps(1, start)";
    }
    let i = objk.i || { x: 0.833, y: 0.833 };
    let o = objk.o || { x: 0.167, y: 0.167 };
    if (i.x == i.y && o.x == o.y) {
        return "linear";
    }
    return "cubic-bezier("+o.x+","+o.y+","+i.x+","+i.y+")";
}

function setKf(kfs, time, value, ease)
{
    if (!ease || !kfs.get(time) || ease.indexOf("start") < 0) {
        kfs.set(time, { v: value, e: ease });
    } else { // steps start must not override keyframe value
        kfs.set(time, { v: kfs.get(time).v, e: ease });
    }
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
    } else {
        let kfs = new Map();
        for (let i = 0; i < obj.k.length; ++i) {
            let k = obj.k[i];
            if (i == obj.k.length-1 && k.h != 1) { // process last kf only if it is hold kf
                break;
            }
            let prevk = i > 0 ? obj.k[i-1] : false;
            let nextk = obj.k[i+1];
            // TODO: sometimes times are negative??
            let startTime = k.t * globalFrameDur + globalTimeOffset;
            if (startTime >= 0) {
                setKf(kfs, startTime, k.s[0]*multiplier, convertEasing(k, prevk));
            }
            let endTime = nextk ? nextk.t * globalFrameDur + globalTimeOffset : -1;
            if (endTime >= 0 && k.e) {
                setKf(kfs, endTime, k.e[0]*multiplier);
            }
        }
        return Array.from(kfs, function([key, value]) { return { "time": key, "value": value.v, "easing": value.e } });
//        return Array.from(kfs, ([key, value]) => { "time": key, "value": value.v, "easing": value.e });
    }
}

function copyProperty(obj, element, targetProperty, multiplier)
{
    if (obj.a != 1 && !Array.isArray(obj.k)) {
        element.setProperty(targetProperty, obj.k*multiplier);
    } else {
        let kfs = new Map();
        for (let i = 0; i < obj.k.length; ++i) {
            let k = obj.k[i];
            if (i == obj.k.length-1 && k.h != 1) { // process last kf only if it is hold kf
                break;
            }
            let prevk = i > 0 ? obj.k[i-1] : false;
            let nextk = obj.k[i+1];
            // TODO: sometimes times are negative??
            let startTime = k.t * globalFrameDur + globalTimeOffset;
            if (startTime >= 0) {
                setKf(kfs, startTime, k.s[0]*multiplier, convertEasing(k, prevk));
            }
            let endTime = nextk ? nextk.t * globalFrameDur + globalTimeOffset : -1;
            if (endTime >= 0 && k.e) {
                setKf(kfs, endTime, k.e[0]*multiplier);
            }
        }
        copyKfs(kfs, element, targetProperty);
    }
}

function copyPropertyXY(obj, element, targetProperty, multiplier, additionX, additionY)
{
    if (obj.a != 1 && isUndefined(obj.k[0].t)) {
        element.setProperty(targetProperty+"X", obj.k[0]*multiplier + additionX);
        element.setProperty(targetProperty+"Y", obj.k[1]*multiplier + additionY);
    } else {
        let kfsx = new Map();
        let kfsy = new Map();
        for (let i = 0; i < obj.k.length; ++i) {
            let k = obj.k[i];
            if (i == obj.k.length-1 && k.h != 1) { // process last kf only if it is hold kf
                break;
            }
            let prevk = i > 0 ? obj.k[i-1] : false;
            let nextk = obj.k[i+1];
            // TODO: sometimes times are negative??
            let startTime = k.t * globalFrameDur + globalTimeOffset;
            if (startTime >= 0) {
                setKf(kfsx, startTime, k.s[0]*multiplier + additionX, convertEasing(k, prevk));
                setKf(kfsy, startTime, k.s[1]*multiplier + additionY, convertEasing(k, prevk));
            }
            let endTime = nextk ? nextk.t * globalFrameDur + globalTimeOffset : -1;
            if (endTime >= 0 && k.e) {
                setKf(kfsx, endTime, k.e[0]*multiplier + additionX);
                setKf(kfsy, endTime, k.e[1]*multiplier + additionY);
            }
        }
        copyKfs(kfsx, element, targetProperty+"X");
        copyKfs(kfsy, element, targetProperty+"Y");
    }
}

function copyMotionPath(obj, element)
{
    if (obj.s === true) {
        element.setProperty("ks:positionX", animatedToValue(obj.x));
        element.setProperty("ks:positionY", animatedToValue(obj.y));
        return;
    }
    if (obj.a != 1 && isUndefined(obj.k[0].t)) {
        element.setProperty("ks:positionX", obj.k[0]);
        element.setProperty("ks:positionY", obj.k[1]);
    } else {
        let data = { v: new Map(), i: new Map(), o: new Map() };
        let kfsx = new Map();
        let kfsy = new Map();
        for (let i = 0; i < obj.k.length; ++i) {
            let k = obj.k[i];
            if (i == obj.k.length-1 && k.h != 1) { // process last kf only if it is hold kf
                break;
            }
            let prevk = i > 0 ? obj.k[i-1] : false;
            let nextk = obj.k[i+1];
            // TODO: sometimes times are negative??
            let startTime = k.t * globalFrameDur + globalTimeOffset;
            if (startTime >= 0) {
                setKf(kfsx, startTime, k.s[0], convertEasing(k, prevk));
                setKf(kfsy, startTime, k.s[1], convertEasing(k, prevk));
                data.v.set(startTime, [ k.s[0], k.s[1] ]);
            }
            let endTime = nextk ? nextk.t * globalFrameDur + globalTimeOffset : -1;
            if (endTime >= 0 && k.e) {
                setKf(kfsx, endTime, k.e[0]);
                setKf(kfsy, endTime, k.e[1]);
                data.v.set(endTime, [ k.e[0], k.e[1] ]);
                let to = k.to ? k.to : [ 0, 0 ];
                let ti = k.ti ? k.ti : [ 0, 0 ];
                data.i.set(endTime, [ k.s[0]+to[0], k.s[1]+to[1] ]);
                data.o.set(endTime, [ k.e[0]+ti[0], k.e[1]+ti[1] ]);
            }
        }
        copyKfs(kfsx, element, "ks:positionX");
        copyKfs(kfsy, element, "ks:positionY");
        var mp = "";
        // this assumes that times were in increasing order
        for (let time of data.v.keys()) {
            if (mp.length == 0) {
                mp += "M"+data.v.get(time)[0]+","+data.v.get(time)[1]+" ";
                continue;
            }
            if (data.i.get(time)) {
                mp += "C"+data.i.get(time)[0]+","+data.i.get(time)[1]+" "+
                          data.o.get(time)[0]+","+data.o.get(time)[1]+" "+
                          data.v.get(time)[0]+","+data.v.get(time)[1]+" ";
            } else {
                mp += "L"+data.v.get(time)[0]+","+data.v.get(time)[1]+" ";
            }
        }
        if (mp.length > 0) {
            element.timeline().setMotionPath(mp);
        }
    }
}

function copyTransform(obj, element)
{
    if (!obj) { return; }
    if (obj.p) {
        copyMotionPath(obj.p, element);
    }
    if (obj.s) {
        copyPropertyXY(obj.s, element, "ks:scale", 0.01, 0, 0);
    }
    if (obj.r) {
        copyProperty(obj.r, element, RotateStr, 1);
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
        copyProperty(obj.sk, element, prop, mult);
    }
    if (obj.a) {
        copyPropertyXY(obj.a, element, "ks:anchor", -1, 0, 0);
    }
}

function copyOpacity(obj, element)
{
    if (!obj) { return; }
    if (obj.o) {
        copyProperty(obj.o, element, "opacity", 0.01);
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

function colorToHex(colorobj)
{
    let r = colorobj[0];
    let g = colorobj[1];
    let b = colorobj[2];
    let a = colorobj[3];
    return hexColor(r, g, b);
}

function copyColor(obj, element, prop)
{
    // color
    if (obj.c) {
        if (obj.c.a != 1) {
            element.setProperty(prop, colorToHex(obj.c.k));
        } else {
            for (let i = 0; i < obj.c.k.length-1; ++i) {
                let k = obj.c.k[i];
                let nextk = obj.c.k[i+1];
                // TODO: sometimes times are negative??
                let startTime = k.t * globalFrameDur + globalTimeOffset;
                if (startTime >= 0) {
                    element.timeline().setKeyframe(prop, startTime, colorToHex(k.s));
                }
                let endTime = nextk.t * globalFrameDur + globalTimeOffset;
                if (endTime >= 0 && k.e) {
                    element.timeline().setKeyframe(prop, endTime, colorToHex(k.e));
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
        grad = "-ks-radial-gradient(userSpaceOnUse "+rad+" "+start[0]+" "+start[1]+" "+start[0]+" "+start[1];
    } else {
        grad = "-ks-linear-gradient(userSpaceOnUse "+start[0]+" "+start[1]+" "+end[0]+" "+end[1];
    }
    grad +=" pad matrix(1 0 0 1 0 0), ";
    let cs = [];
    let stops = obj.g.k.k;
    for (let i = 0; i < obj.g.p; ++i) {
        let offset = stops[i * 4] * 100;
        let r = stops[i * 4 + 1];
        let g = stops[i * 4 + 2];
        let b = stops[i * 4 + 3];
        cs.push(hexColor(r, g, b)+" "+offset+"%");
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
        copyProperty(obj.o, element, "fill-opacity", 0.01);
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
            for (let i = 0; i < obj.v.k.length-1; ++i) {
                let prevk = i > 0 ? obj.v.k[i-1] : false;
                let k = obj.v.k[i];
                let nextk = obj.v.k[i+1];
                // TODO: sometimes times are negative??
                let startTime = k.t * globalFrameDur + globalTimeOffset;
                if (startTime >= 0) {
                    setKf(dkfs, startTime, k.s[0], convertEasing(k, prevk));
                }
                let endTime = nextk.t * globalFrameDur + globalTimeOffset;
                if (endTime >= 0 && k.e) {
                    setKf(dkfs, endTime, k.e[0]);
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
            copyProperty(obj.v, element, "stroke-dashoffset", 1);
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
        copyProperty(obj.o, element, "stroke-opacity", 0.01);
    }
    if (obj.w) {
        copyProperty(obj.w, element, "stroke-width", 1);
    }
    if (obj.ml) {
        element.setProperty("stroke-miterlimit", obj.ml);
    }
    if (obj.lc) {
        element.setProperty("stroke-linecap", linecaps[obj.lc-1] || "round");
    }
    if (obj.lj) {
        element.setProperty("stroke-linejoin", linejoins[obj.lj-1] || "round");
    }
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

function createRect(shape)
{
    var p = multiDimAnimatedToValue(shape.p);
    var s = multiDimAnimatedToValue(shape.s);
    let rad = animatedToValue(shape.r);
    var midx = p[0], midy = p[1], sw = s[0]/2, sh = s[1]/2;
    if (rad == 0) {
        if (shape.d !== 3) {
            return "M" + (sw) + "," + (-sh) +
                   "L" + (sw) + "," + (sh) +
                   "L" + (-sw) + "," + (sh) +
                   "L" + (-sw) + "," + (-sh) +
                   "L" + (sw) + "," + (-sh) + "Z";
        } else {
            return "M" + (sw) + "," + (-sh) +
                   "L" + (-sw) + "," + (-sh) +
                   "L" + (-sw) + "," + (sh) +
                   "L" + (sw) + "," + (sh) +
                   "L" + (sw) + "," + (-sh) + "Z";
        }
    } else {
        if (rad > sw) { rad = sw; }
        if (rad > sh) { rad = sh; }
        let rk = EllipseK * rad;
        let t = -sh, r = sw, b = sh, l = -sw;
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
function createPolygon(shape)
{
    var numPts = Math.floor(animatedToValue(shape.pt));
    var angle = Math.PI*2/numPts;
    var rad = animatedToValue(shape.or);
    var roundness = animatedToValue(shape.os) / 100;
    var perimSegment = 2*Math.PI*rad/(numPts*4);
    var i, currentAng = -Math.PI/ 2;
    var dir = shape.d === 3 ? -1 : 1;
    var data = { v: [], i: [], o: [], c: 1 };
    for(i=0;i<numPts;i+=1){
        var x = rad * Math.cos(currentAng);
        var y = rad * Math.sin(currentAng);
        var ox = x === 0 && y === 0 ? 0 : y/Math.sqrt(x*x + y*y);
        var oy = x === 0 && y === 0 ? 0 : -x/Math.sqrt(x*x + y*y);
        data.v[i] = [x,y];
        data.i[i] = [ox*perimSegment*roundness*dir,oy*perimSegment*roundness*dir];
        data.o[i] = [-ox*perimSegment*roundness*dir,-oy*perimSegment*roundness*dir];
        currentAng += angle*dir;
    }
    return parsePathData(data);
}

/* Copied/modified from https://github.com/airbnb/lottie-web JS player */
function createStar(shape)
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
    var i, rad,roundness,perimSegment, currentAng = -Math.PI/ 2;
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
        data.v[i] = [x,y];
        data.i[i] = [ox*perimSegment*roundness*dir,oy*perimSegment*roundness*dir];
        data.o[i] = [-ox*perimSegment*roundness*dir,-oy*perimSegment*roundness*dir];
        longFlag = !longFlag;
        currentAng += angle*dir;
    }
    return parsePathData(data);
}

function removeAllKeyframes(element, property)
{
    if (!element.timeline().hasKeyframes(property)) {
        return;
    }
    let kfs = element.timeline().getKeyframes(property);
    for (let kf of kfs) {
        element.timeline().removeKeyframe(property, kf.time);
    }
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
    removeAllKeyframes(element, "stroke-dasharray");
    removeAllKeyframes(element, "stroke-dashoffset");

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

function readShapes(shapes, parentElement, hasDashStroke)
{
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
                    copyPropertyXY(shape.p, rect, "ks:position", 1, -w/2, -h/2);
                }
                if (shape.r) {
                    let rad = animatedToValue(shape.r);
                    if (rad > w/2) { rad = w/2; }
                    if (rad > h/2) { rad = h/2; }
                    rect.setProperty("rx", rad);
                }
            } else {
                let rect = app.activeDocument.createElement("path");
                rect.setProperty("fill", "none");
                parentElement.insertAt(0, rect);
                copyName(shape, rect);
                if (shape.p) {
                    copyPropertyXY(shape.p, rect, "ks:position", 1, 0, 0);
                }
                rect.setProperty("d", createRect(shape));
            }

        } else if (shape.ty == "el") {
            if (!hasDashStroke) {
                let ellipse = app.activeDocument.createElement("ellipse");
                ellipse.setProperty("fill", "none");
                parentElement.insertAt(0, ellipse);
                copyName(shape, ellipse);
                if (shape.p) {
                    copyPropertyXY(shape.p, ellipse, "ks:position", 1, 0, 0);
                }
                if (shape.s) {
                    let s = multiDimAnimatedToValue(shape.s);
                    ellipse.setProperty("rx", s[0]/2);
                    ellipse.setProperty("ry", s[1]/2);
                }
            } else {
                let rect = app.activeDocument.createElement("path");
                rect.setProperty("fill", "none");
                parentElement.insertAt(0, rect);
                copyName(shape, rect);
                if (shape.p) {
                    copyPropertyXY(shape.p, rect, "ks:position", 1, 0, 0);
                }
                rect.setProperty("d", createEllipse(shape));
            }

        } else if (shape.ty == "sr") {
            let star = app.activeDocument.createElement("path");
            star.setProperty("fill", "none");
            parentElement.insertAt(0, star);
            copyName(shape, star);
            if (shape.p) {
                copyPropertyXY(shape.p, star, "ks:position", 1, 0, 0);
            }
            copyProperty(shape.r, star, RotateStr, 1);
            if (shape.sy == 2) {
                star.setProperty("d", createPolygon(shape));
            } else {
                star.setProperty("d", createStar(shape));
            }

        } else if (shape.ty == "gr") {
            let g = app.activeDocument.createElement("g");
            parentElement.insertAt(0, g);
            copyName(shape, g);
            let tr = findType(shape.it, "tr");
            copyTransform(tr, g);
            copyOpacity(tr, g);

            // read children before setting colors, because colors are set to paths
            readShapes(shape.it, g, hasDashes(shape.it));

            applyPainting(shape.it, g.children);
        }
    }
}

function readLayers(parentElement, layers)
{
    let layerElementInd = {};
    let index = 0;
    for (let layer of layers) {
        let elem;
        if (layer.td && layer.td > 0) {
            continue; // mask
        }
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
                let fullPath = globalAssets[layer.refId].u + globalAssets[layer.refId].p;
                image.setProperty("href", fullPath);
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
                        text.setProperty("fill", colorToHex(txt.fc));
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
            if (!isUndefined(layer.ind)) {
                index = layer.ind;
            }
            elem.index = index;
            elem.contentIndex = 1;
            ++index;
            if (layer.ip > globalIp || layer.op < globalOp && !elem.timeline().hasKeyframes("opacity")) {
                let it = layer.ip * globalFrameDur + globalTimeOffset;
                let ot = layer.op * globalFrameDur + globalTimeOffset;
                if (it < 0) { it = 0; }
                if (ot < 0) { ot = 0; }
                elem.timeline().setKeyframe("opacity", ot, "0");
                elem.timeline().setKeyframe("opacity", it, "1", "steps(1)");
                if (it > 0) {
                    elem.timeline().setKeyframe("opacity", 0, "0", "steps(1)");
                }
            }
        }

        if (elem && !isUndefined(layer.ind)) {
            layerElementInd[layer.ind] = elem;
        }
    }
    // TODO: sometimes order isn't correct?
    // parent layer elements
    for (let layer of layers) {
        if (!layer.element) {
            continue;
        }
        if (!isUndefined(layer.parent) && !isUndefined(layerElementInd[layer.parent])) {
            let pe = layerElementInd[layer.parent];
            if (pe.index < layer.element.index) { // try to keep layer drawing order
                pe.insertAt(0, layer.element);
                pe.contentIndex++;
            } else {
                pe.insertAt(pe.contentIndex+1, layer.element);
            }
        } else {
            parentElement.insertAt(0, layer.element);
            if (isUndefined(parentElement.contentIndex)) { parentElement.contentIndex = 0; }
            parentElement.contentIndex++;
        }
    }
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
    for (let asset of json["assets"]) {
        globalAssets[asset.id] = asset;
    }

    readLayers(root, json["layers"]);
}
