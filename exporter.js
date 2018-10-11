
// Keyshape Exporter for Bodymovin / Lottie

const RotateStr = !app.activeDocument ? "ks:rotate" :
    app.activeDocument.documentElement.getProperty("ks:rotate") != null ? "ks:rotate" : "ks:rotation";

// returns filenames which will be written by the export function
function getFilenames(userSelectedFileUrl)
{
    return [ userSelectedFileUrl ];
}

let globalLayerIndex = 1;
let globalFps = 10;
let globalEndFrame = 0;
let globalPlayRange = 0;

function toFrame(timems)
{
    return timems * globalFps / 1000;
}

function toRoundFrame(timems)
{
    return Math.round(toFrame(timems)*10)/10; // one decimal
}

function round(val)
{
    return Math.round((+val)*1000)/1000; // three decimals
}

function convertColor(val)
{
    let kscolor = app.util.parseColor(val);
    if (kscolor.type == "color") {
        return [ round(kscolor.red), round(kscolor.green), round(kscolor.blue),
                 round(kscolor.alpha || 1) ];
    }
    return [ 0, 0, 0, 0 ];
}

function convertEasing(easing)
{
    if (easing == "linear") {
        return [ 0.167, 0.167, 0.833, 0.833 ];
    }
    if (easing.startsWith("cubic-bezier(")) {
        easing = easing.substring(13, easing.length-1);
        let vals = easing.split(",");
        return [ round(vals[0]), round(vals[1]), round(vals[2]), round(vals[3]) ];
    }
    // steps: not done here, so return linear
    return [ 0.167, 0.167, 0.833, 0.833 ];
}

function valueOrAnimation(element, prop, defaultValue, processor)
{
    let kfs = [];
    element.timeline().simplifyEasings(prop);
    kfs = element.timeline().getKeyframes(prop);
    if (!kfs || kfs.length < 2) {
        let val = element.getProperty(prop) || defaultValue;
        if (processor) { val = processor(val); }
        return { a: 0, k: Array.isArray(val) ? val : round(val) };
    }
    // animation
    let obj = { a: 1, k: [] };
    let lastS;
    for (let i = 0; i < kfs.length-1 ; ++i) {
        let kf = kfs[i];
        let kf2 = kfs[i+1];
        let val = processor ? processor(kf.value) : kf.value;
        let val2 = processor ? processor(kf2.value) : kf2.value;
        let h;
        if (kf.easing.startsWith("steps(")) {
            h = 1;
            if (kf.easing.indexOf("start") > 0) { val = val2; }
        }
        let span = {
            t: toRoundFrame(kf.time),
            s: Array.isArray(val) ? val : [ round(val) ] // processor may return ready-made arrays
        };
        if (h) {
            span.h = h;
            lastS = Array.isArray(val2) ? val2 : [ round(val2) ];
        } else {
            let ease = convertEasing(kf.easing);
            span.i = { x: [ ease[2] ], y: [ ease[3] ] };
            span.o = { x: [ ease[0] ], y: [ ease[1] ] };
            span.e = Array.isArray(val2) ? val2 : [ round(val2) ];
            lastS = undefined;
        }
        obj.k.push(span);
    }
    let lastKeydata = { t: toRoundFrame(kfs[kfs.length-1].time) };
    if (lastS) {
        lastKeydata.s = lastS;
        lastKeydata.h = 1;
    }
    obj.k.push(lastKeydata);
    return obj;
}

function valueOrAnimationMultiDim(element, dim, propX, propY, defaultValue, processor)
{
    element.timeline().simplifyEasings(propX);
    element.timeline().simplifyEasings(propY);
    let kfsx = element.timeline().getKeyframes(propX);
    let kfsy = element.timeline().getKeyframes(propY);
    if (!kfsx || kfsx.length < 2) {
        let valx = element.getProperty(propX) || defaultValue;
        let valy = element.getProperty(propY) || defaultValue;
        if (processor) { valx = processor(valx); }
        if (processor) { valy = processor(valy); }
        return { a: 0, k: dim == 3 ? [ round(valx), round(valy), defaultValue ]
                                   : [ round(valx), round(valy) ] };
    }
    // animation
    let obj = { a: 1, k: [] };
    let lastS;
    for (let i = 0; i < kfsx.length-1 ; ++i) {
        let kfx = kfsx[i];
        let kfy = kfsy[i];
        let kf2x = kfsx[i+1];
        let kf2y = kfsy[i+1];
        let valx = processor ? processor(kfx.value) : kfx.value;
        let valy = processor ? processor(kfy.value) : kfy.value;
        let val2x = processor ? processor(kf2x.value) : kf2x.value;
        let val2y = processor ? processor(kf2y.value) : kf2y.value;
        let ease = convertEasing(kfx.easing);
        let h;
        if (kfx.easing.startsWith("steps(")) {
            h = 1;
            if (kfx.easing.indexOf("start") > 0) { valx = val2x; valy = val2y; }
        }
        valx = round(valx);
        valy = round(valy);
        val2x = round(val2x);
        val2y = round(val2y);
        let span = {
            i: { x: [ ease[2] ], y: [ ease[3] ] },
            o: { x: [ ease[0] ], y: [ ease[1] ] },
            t: toRoundFrame(kfx.time),
            s: dim == 3 ? [ valx, valy, defaultValue ] : [ valx, valy ]
        };
        if (h) {
            span.h = h;
            lastS = dim == 3 ? [ val2x, val2y, defaultValue ] : [ val2x, val2y ]
        } else {
            span.e = dim == 3 ? [ val2x, val2y, defaultValue ] : [ val2x, val2y ]
            lastS = undefined;
        }
        obj.k.push(span);
    }
    let lastKeydata = { t: toRoundFrame(kfsx[kfsx.length-1].time) };
    if (lastS) {
        lastKeydata.s = lastS;
        lastKeydata.h = 1;
    }
    obj.k.push(lastKeydata);
    return obj;
}

function controlPoints(commands, x, y, x2, y2, i)
{
    let ix = x2, iy = y2, ox = x, oy = y;
    if (i < commands.length-1 && commands[i+1].command == "C") {
        ox = commands[i+1].x1;
        oy = commands[i+1].y1;
        ix = commands[i+1].x2;
        iy = commands[i+1].y2;
    }
    return [ round(ix-x2), round(iy-y2), round(ox-x), round(oy-y) ];
}

function clampEasingY(val)
{
    if (val < 0) { return 0; }
    if (val > 1) { return 1; }
    return val;
}

function valueOrMotionPath(element)
{
    element.timeline().simplifyEasings("ks:positionX");
    element.timeline().simplifyEasings("ks:positionY");
    let kfsx = element.timeline().getKeyframes("ks:positionX");
    let kfsy = element.timeline().getKeyframes("ks:positionY");
    if (!kfsx || kfsx.length < 2) {
        let valx = element.getProperty("ks:positionX");
        let valy = element.getProperty("ks:positionY");
        return { a: 0, k: [ round(valx), round(valy) ] };
    }
    // animation
    let mpcmds = new KSPathData(element.timeline().getMotionPath()).commands;
    let obj = { a: 1, k: [] };
    let lastS;
    for (let i = 0; i < kfsx.length-1 ; ++i) {
        let kfx = kfsx[i];
        let kfy = kfsy[i];
        let kf2x = kfsx[i+1];
        let kf2y = kfsy[i+1];
        let valx = kfx.value;
        let valy = kfy.value;
        let val2x = kf2x.value;
        let val2y = kf2y.value;
        let ease = convertEasing(kfx.easing);
        let ctrls = controlPoints(mpcmds, +valx, +valy, +val2x, +val2y, i);
        let h;
        if (kfx.easing.startsWith("steps(")) {
            h = 1;
            if (kfx.easing.indexOf("start") > 0) { valx = val2x; valy = val2y; }
            ctrls = [ 0, 0, 0, 0 ];
        }
        valx = round(valx);
        valy = round(valy);
        val2x = round(val2x);
        val2y = round(val2y);
        let span = {
            i: { x: [ ease[2] ], y: [ clampEasingY(ease[3]) ] },
            o: { x: [ ease[0] ], y: [ clampEasingY(ease[1]) ] },
            t: toRoundFrame(kfx.time),
            s: [ valx, valy, 0 ]
        };
        if (h) {
            span.h = h;
            lastS = [ val2x, val2y, 0 ];
        } else {
            span.to = [ ctrls[2], ctrls[3], 0 ];
            span.ti = [ ctrls[0], ctrls[1], 0 ];
            span.e = [ val2x, val2y, 0 ];
            lastS = undefined;
        }
        obj.k.push(span);
    }
    let lastKeydata = { t: toRoundFrame(kfsx[kfsx.length-1].time) };
    if (lastS) {
        lastKeydata.s = lastS;
        lastKeydata.h = 1;
    }
    obj.k.push(lastKeydata);
    return obj;
}

function hasSkewY(element)
{
    // if skewX value is found, then skewing Y isn't possible
    let skx = element.getProperty("ks:skewX") || 0;
    if (skx != 0) {
        return false;
    }
    // if skewX keyframe value is found, then skewing Y isn't possible
    let kfsx = element.timeline().getKeyframes("ks:skewX");
    for (let kf of kfsx) {
        if (kf.value != 0) {
            return false;
        }
    }
    // if skewY value is found, then perform skewing Y
    let sky = element.getProperty("ks:skewY") || 0;
    if (sky != 0) {
        return true;
    }
    // if skewY keyframe value is found, then perform skewing Y
    let kfsy = element.timeline().getKeyframes("ks:skewY");
    for (let kf of kfsy) {
        if (kf.value != 0) {
            return true;
        }
    }
    // default is to skew X
    return false;
}

function pushTransformAndOpacity(array, element, topLevel)
{
    if (topLevel) {
        let transform = {
            "ty": "tr",
            "p": { "a": 0, "k": [ 0, 0 ] },
            "a":  { "a": 0, "k": [ 0, 0 ] },
            "s":  { "a": 0, "k": [ 100, 100 ] },
            "r":  { "a": 0, "k": 0 },
            "o": { "a": 0, "k": 100 },
            "sk": { "a": 0, "k": 0 },
            "sa": { "a": 0, "k": 0 },
            "nm": "Transform"
        };
        array.push(transform);
        return;
    }

    let skewProp = "ks:skewX";
    let skewa = 0;
    let skewFunc = function(val) { return -val; };
    if (hasSkewY(element)) { // if only skewY is given
        skewa = 90;
        skewProp = "ks:skewY";
        skewFunc = function(val) { return +val; };
    }
    let transform = {
        "ty": "tr",
        "p": valueOrAnimationMultiDim(element, 2, "ks:positionX", "ks:positionY", 0, function(val) { return +val; }),
        "a": valueOrAnimationMultiDim(element, 2, "ks:anchorX", "ks:anchorY", 0, function(val) { return -val; }),
        "s": valueOrAnimationMultiDim(element, 2, "ks:scaleX", "ks:scaleY", 100, function(val) { return val*100; }),
        "r": valueOrAnimation(element, RotateStr, 0, function(val) { return +val; }),
        "o": valueOrAnimation(element, "opacity", 1, function(val) { return val*100; }),
        "sk": valueOrAnimation(element, skewProp, 1, skewFunc),
        "sa": {
            "a": 0,
            "k": skewa,
            "ix": 5
        },
        "nm": "Transform"
    };
    array.push(transform);
}

function maskPathElements(element)
{
    let paths = [];
    for (let child of element.children) {
        if (child.getProperty("display") == "none") {
            continue;
        }
        if (child.tagName == "mask" || child.tagName == "clipPath") {
            for (let maskChild of child.children) {
                if (maskChild.getProperty("display") == "none") {
                    continue;
                }
                if (maskChild.tagName != "path") {
                    continue;
                }
                if (child.tagName == "clipPath") {
                    // set opacity to clip path children so they can be used as masks
                    // TODO: remove opacity keyframes
                    maskChild.setProperty("opacity", 1);
                }
                paths.push(maskChild);
            }
        }
    }
    return paths;
}

function transformElementPath(element, matrix)
{
    if (element.timeline().hasKeyframes("d")) {
        element.timeline().simplifyEasings("d");
        let kfs = element.timeline().getKeyframes("d");
        for (let kf of kfs) {
            let oldd = kf.value;
            let pd = new KSPathData(oldd);
            let p2 = pd.transform(matrix);
            element.timeline().setKeyframe("d", kf.time, p2, kf.easing);
        }

    } else {
        let oldd = element.getProperty("d");
        let pd = new KSPathData(oldd);
        let p2 = pd.transform(matrix);
        element.setProperty("d", p2);
    }
}

function pushMasks(layer, element)
{
    let pathElements = maskPathElements(element);
    let maskArray = [];
    for (let pathElem of pathElements) {
        transformElementPath(pathElem, pathElem.timeline().getTransform(0));
        let pathdata = pathElem.getProperty("d");
        let contours = splitToContours(pathdata);
        if (contours.length == 0) {
            continue;
        }
        let mask = {
            "inv": false,
            "mode": "a",
            "pt": { "a": 0, "k": convertContour(contours[0]) },
            "o": valueOrAnimation(pathElem, "opacity", 1, function(val) { return val*100; }),
            "x": { "a": 0, "k": 0 },
            "nm": "Mask"
        };
        maskArray.push(mask);
    }
    if (maskArray.length == 0) {
        return;
    }
    layer.hasMask = true;
    layer.masksProperties = maskArray;
}

function createGradient(colordata, type)
{
    let gobj = {
        ty: type,
        t: colordata.type == "radial-gradient" ? 2 : 1
    };
    // TODO: objectBoundingBox
    if (colordata.type == "linear-gradient") {
        gobj.s = {
            a: 0,
            k: [ round(colordata.x1), round(colordata.y1) ]
        };
        gobj.e = {
            a: 0,
            k: [ round(colordata.x2), round(colordata.y2) ],
        };

    } else {
        gobj.s = {
            a: 0,
            k: [ round(colordata.cx), round(colordata.cy) ]
        };
        gobj.e = {
            a: 0,
            k: [ round(colordata.cx + colordata.r), round(colordata.cy) ],
        };
        // TODO fx, fy
        gobj.h = { a: 0, k: 0 };
        gobj.a = { a: 0, k: 0 };
    }
    let colors = { a: 0, k: [] };
    for (let stop of colordata.stops) {
        colors.k.push(round(stop.offset));
        colors.k.push(round(stop.red));
        colors.k.push(round(stop.green));
        colors.k.push(round(stop.blue));
        // TODO: alpha not set here!!
    }
    gobj.g = {
        p: colordata.stops.length,
        k: colors
    };
    gobj.nm = "Gradient Fill 1";
    gobj.mn = type == "gs" ? "ADBE Vector Graphic - G-Stroke" : "ADBE Vector Graphic - G-Fill";
    gobj.hd = false;
    return gobj;
}

const linecaps = [ "butt", "round", "square" ];
const linejoins = [ "miter", "round", "bevel" ];

function parseDashArray(str)
{
    if (str == "none") { return [ "0" ]; }
    return str.replace(/,/g, ' ').split(/\s/);
}

function pushStrokeAndFill(shapesArray, element)
{
    let s = app.util.parseColor(element.getProperty("stroke"));
    if (s.type != "none" || element.timeline().hasKeyframes("stroke")) {
        let sc = linecaps.indexOf(element.getProperty("stroke-linecap")) + 1;
        if (sc == -1) { sc = 0; }
        let sj = linejoins.indexOf(element.getProperty("stroke-linejoin")) + 1;
        if (sj == -1) { sj = 0; }
        let miter = element.getProperty("stroke-miterlimit");
        let strokeobj;
        if (s.type == "linear-gradient" || s.type == "radial-gradient") {
            strokeobj = createGradient(s, "gs");
        } else {
            strokeobj = {
                ty: "st",
                c: valueOrAnimation(element, "stroke", 0, convertColor),
                nm: "Stroke 1",
                mn: "ADBE Vector Graphic - Stroke"
            };
        }
        strokeobj.o = valueOrAnimation(element, "stroke-opacity", 1, function(val) { return val*100; });
        strokeobj.w = valueOrAnimation(element, "stroke-width", 1, function(val) { return +val; });
        strokeobj.lc = sc;
        strokeobj.lj = sj;
        strokeobj.ml = round(miter);

        // dashes
        let dash = element.getProperty("stroke-dasharray").trim();
        if (dash != "" && dash != "none") {
            let d = [];
            for (let i = 0; i < 2; ++i) {
                let gap = d.length & 1;
                d.push({
                    n: gap ? "g" : "d",
                    nm: gap ? "gap" : "dash",
                    v: valueOrAnimation(element, "stroke-dasharray", "0", function(val) {
                        let dashes = parseDashArray(val);
                        return i < dashes.length ? +dashes[i] : +dashes[0];
                    })
                });
            }
            d.push({
                n: "o",
                nm: "offset",
                v: valueOrAnimation(element, "stroke-dashoffset", 0, function(val) { return +val; })
            });
            strokeobj.d = d;
        }
        shapesArray.push(strokeobj);
    }
    let f = app.util.parseColor(element.getProperty("fill"));
    if (f.type != "none" || element.timeline().hasKeyframes("fill")) {
        let fillrule = element.getProperty("fill-rule") == "evenodd" ? 2 : 1;
        let fillobj;
        if (f.type == "linear-gradient" || f.type == "radial-gradient") {
            fillobj = createGradient(f, "gf");
        } else {
            fillobj = {
                ty: "fl",
                c: valueOrAnimation(element, "fill", 0, convertColor),
                nm: "Fill 1",
                mn: "ADBE Vector Graphic - Fill",
                hd: false
            };
        }
        fillobj.o = valueOrAnimation(element, "fill-opacity", 1, function(val) { return val*100; });
        fillobj.r = fillrule;
        shapesArray.push(fillobj);
    }
}

function convertContour(commands)
{
    let result = { i: [], o: [], v: [], c: false };
    for (let cmd of commands) {
        if (cmd.command == "M") {
            result.i.push([ 0, 0 ]);
            result.v.push([ round(cmd.x), round(cmd.y) ]);
            result.o.push([ 0, 0 ]);

        } else if (cmd.command == "L") {
            result.i.push([ 0, 0 ]);
            result.v.push([ round(cmd.x), round(cmd.y) ]);
            result.o.push([ 0, 0 ]);

        } else if (cmd.command == "C") {
            let previx = result.v.length-1;
            result.o[previx][0] = round(cmd.x1 - result.v[previx][0]);
            result.o[previx][1] = round(cmd.y1 - result.v[previx][1]);
            result.i.push([ round(cmd.x2 - cmd.x), round(cmd.y2 - cmd.y) ]);
            result.v.push([ round(cmd.x), round(cmd.y) ]);
            result.o.push([ 0, 0 ]);

        } else if (cmd.command == "Z") {
            result.c = true;
        }
    }
    return result;
}

function splitToContours(svgpath)
{
    let pathdata = new KSPathData(svgpath);
    let contours = [];
    let contour = [];
    for (let cmd of pathdata.commands) {
        if (cmd.command == "M") {
            if (contour.length > 0) {
                contours.push(contour);
            }
            contour = [];
        }
        contour.push(cmd);
    }
    if (contour.length > 0) {
        contours.push(contour);
    }
    return contours;
}

function pushPathShapes(shapesArray, element)
{
    element.timeline().simplifyEasings("d");
    let kfs = element.timeline().getKeyframes("d");
    if (!kfs || kfs.length < 2) {
        // no animation
        let contours = splitToContours(element.getProperty("d"));
        for (let contour of contours) {
            let pathshape = { ty: "sh" };
            pathshape.d = 1;
            pathshape.ks = { a: 0, k: {}, nm: "Name", mn: "ADBE Vector Shape - Group", hd: false };
            pathshape.ks.k = convertContour(contour);
            shapesArray.push(pathshape);
        }
        return;
    }
    // animation

    // needed to get extra contours to contract to first contour
    kfs = app.activeDocument.makePathDataKeyframesInterpolatable(kfs);

    let pathshape = { ty: "sh" };
    pathshape.d = 1;
    pathshape.ks = { a: 1, k: [], nm: "Name", mn: "ADBE Vector Shape - Group", hd: false };

    // collect shapes, each contour becomes one shape
    let shapes = [];
    let lasttime = [];
    for (let i = 0; i < kfs.length-1 ; ++i) {
        let kf = kfs[i];
        let kf2 = kfs[i+1];
        let ease = convertEasing(kf.easing);

        let contours = splitToContours(kf.value);
        let contours2 = splitToContours(kf2.value);

        for (let ci = 0; ci < contours.length; ++ci) {
            let val = convertContour(contours[ci]);
            let val2 = ci < contours2.length ? convertContour(contours2[ci]) : val;

            let span = {
                i: { x: [ ease[2] ], y: [ ease[3] ] },
                o: { x: [ ease[0] ], y: [ ease[1] ] },
                t: toRoundFrame(kf.time),
                s: [ val ],
                e: [ val2 ]
            };
            if (!shapes[ci]) {
                shapes[ci] = [];
            }
            shapes[ci].push(span);
            lasttime[ci] = kf2.time;
        }
    }
    // output shapes
    for (let ci = 0; ci < shapes.length; ++ci) {
        let sh = shapes[ci];
        sh.push({ t: toRoundFrame(lasttime[ci]) });
        let pathshape = { ty: "sh" };
        pathshape.d = 1;
        pathshape.ks = { a: 1, k: sh, nm: "Name", mn: "ADBE Vector Shape - Group", hd: false };
        shapesArray.push(pathshape);
    }
}

function hasTime(kfs, time)
{
    // don't check last keyframe, so that easing can get copied to it
    for (let i = 0; i < kfs.length-1; ++i) {
        let kf = kfs[i];
        if (kf.time == time) {
            return true;
        }
    }
    return false;
}

// checks that destProp has the same keyframes as prop
function addMissingKeyframes(element, prop, destProp)
{
    if (!element.timeline().hasKeyframes(prop)) {
        return;
    }
    element.timeline().simplifyEasings(prop); // temporary fix to make width/height animations work
    let kfs = element.timeline().getKeyframes(prop);
    let destKfs = element.timeline().getKeyframes(destProp) || [];
    for (let i = kfs.length-1; i >= 0; --i) {
        let kf = kfs[i];
        let time = kf.time;
        if (hasTime(destKfs, time)) {
            continue;
        }
        // copy time and easing
        element.timeline().setKeyframe(destProp, time,
                                   element.timeline().getAnimatedValue(destProp, time), kf.easing);
    }
}

function addShape(shapesArray, element, topLevel)
{
    if (element.getProperty("display") == "none") {
        return;
    }

    let shape = {};
    if (element.tagName == "svg") {
        shape.ty = "gr";
        shape.it = [];
        for (let child of element.children) {
            addShape(shape.it, child, false);
        }
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName == "g" || element.tagName == "a") {
        shape.ty = "gr";
        shape.it = [];
        for (let child of element.children) {
            addShape(shape.it, child, false);
        }
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName == "rect") {
        shape.ty = "gr";
        shape.it = [];

        let rectshape = {};
        rectshape.d = 1;
        rectshape.ty = "rc";
        let width = element.getProperty("width") || 0;
        let height = element.getProperty("height") || 0;
        addMissingKeyframes(element, "width", "height");
        addMissingKeyframes(element, "height", "width");
        rectshape.s = valueOrAnimationMultiDim(element, 2, "width", "height", 0, function(val) { return +val; });
        // rect size is relative to center, so move position
        rectshape.p = valueOrAnimationMultiDim(element, 2, "width", "height", 0, function(val) { return val/2; });
        let r = element.getProperty("rx") || 0;
        rectshape.r = { a:0, k: round(r) };

        shape.it.push(rectshape);
        pushStrokeAndFill(shape.it, element);
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName == "ellipse") {
        shape.ty = "gr";
        shape.it = [];

        let ellipseshape = {};
        ellipseshape.d = 1;
        ellipseshape.ty = "el";
        let x = 0;
        let y = 0;
        let width = element.getProperty("rx")*2 || 0;
        let height = element.getProperty("ry")*2 || 0;
        ellipseshape.s = { a:0, k: [ round(width), round(height) ] };
        ellipseshape.p = { a:0, k: [ round(x), round(y) ] };

        shape.it.push(ellipseshape);
        pushStrokeAndFill(shape.it, element);
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName == "path") {
        shape.ty = "gr";
        shape.it = [];

        pushPathShapes(shape.it, element);
        pushStrokeAndFill(shape.it, element);
        pushTransformAndOpacity(shape.it, element, topLevel);
    }

    if (!shape.ty) { // unknown svg elements are ignored
        return;
    }
    let id = element.getProperty("id");
    shape.nm = (!topLevel ? id : false) || "Object";
    if (id !== null && id !== "" && !topLevel) {
        shape.ln = id.replace(/ /g, '-');
    }
    shape.mn = "ADBE Vector Group";
    shape.hd = false;
    shapesArray.unshift(shape);
}

const blendingModes = [
    "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn",
    "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"
];

function appendLayer(layersArray, element)
{
    if (element.getProperty("display") == "none") {
        return;
    }

    let shapes = [];
    if (element.tagName == "g" || element.tagName == "a" || element.tagName == "svg") {
        // add children
        for (let child of element.children) {
            addShape(shapes, child, false);
        }
    } else {
        // top level rect, ellipse, text..
        addShape(shapes, element, true);
    }

    let transform = {
        "p": valueOrMotionPath(element),
        "a": valueOrAnimationMultiDim(element, 3, "ks:anchorX", "ks:anchorY", 0, function(val) { return -val; }),
        "s": valueOrAnimationMultiDim(element, 3, "ks:scaleX", "ks:scaleY", 100, function(val) { return val*100; }),
        "r": valueOrAnimation(element, RotateStr, 0, function(val) { return +val; }),
        "o": valueOrAnimation(element, "opacity", 1, function(val) { return val*100; })
    };

    let blend = blendingModes.indexOf(element.getProperty("mix-blend-mode"));
    if (blend < 0) { blend = 0; }

    let id = element.getProperty("id");
    let obj = {
        ddd: 0,
        ind: globalLayerIndex,
        ty: 4,
        nm: id || "Layer "+globalLayerIndex,
        ks: transform,
        ao: element.getProperty("ks:motion-rotation") == "auto" ? 1 : 0,
        shapes: shapes,
        ip: 0,
        op: globalEndFrame > 0 ? globalEndFrame : 1,
        st: 0, // start time
        bm: blend,
        sr: 1 // layer time stretch
    }
    if (id !== null && id !== "") {
        obj.ln = id.replace(/ /g, '-');
    }
    pushMasks(obj, element);
    layersArray.unshift(obj);
    globalLayerIndex++;
}

function convertToPaths(doc, element, underMask)
{
    // convert the element tree recursively to paths
    for (let child of element.children) {
        if (child.tagName == "mask" || child.tagName == "clipPath") {
            underMask = true;
        }
        convertToPaths(doc, child, underMask);
    }
    // all rect and ellipses under masks are converted
    if (underMask && (element.tagName == "rect" || element.tagName == "ellipse")) {
        doc.selectedElements = [ element ];
        doc.cmd.convertToPath();
        return;
    }
    if (element.tagName == "rect") {
        // convert rect element to path if it has dashes to get correct start node
        if (!element.timeline().hasKeyframes("width") && !element.timeline().hasKeyframes("height")
                && element.getProperty("stroke-dasharray") != "none") {
            doc.selectedElements = [ element ];
            doc.cmd.convertToPath();
        }

    } else if (element.tagName == "ellipse") {
        // convert ellipse element to path if it has dashes to get correct start node
        if (element.getProperty("stroke-dasharray") != "none") {
            doc.selectedElements = [ element ];
            doc.cmd.convertToPath();
        }

    } else if (element.tagName == "text") {
        // text is always converted
        doc.selectedElements = [ element ];
        doc.cmd.convertToPath();
    }
}

function detachFromSymbols(doc, element)
{
    // detach the element tree recursively
    for (let child of element.children) {
        detachFromSymbols(doc, child);
    }
    // select element to be detached
    // (only detaches elements which can be detached)
    doc.selectedElements = [ element ];
    doc.cmd.detachFromSymbol();
}

function calculateEndTime(element)
{
    if (element.getProperty("display") == "none") {
        return;
    }
    let names = element.timeline().getKeyframeNames();
    for (let name of names) {
        let kfs = element.timeline().getKeyframes(name);
        let end = kfs[kfs.length-1].time;
        if (globalEndFrame < toFrame(end)) {
            globalEndFrame = toFrame(end);
        }
    }
    for (let child of element.children) {
        calculateEndTime(child);
    }
}

function createJSON()
{
    let root = app.activeDocument.documentElement;

    globalFps = +(root.getProperty("ks:fps") || 10);

    // detach symbols from use elements
    detachFromSymbols(app.activeDocument, root);

    // convert rects, ellipses and text to paths
    convertToPaths(app.activeDocument, root, false);

    calculateEndTime(root);
    globalEndFrame = Math.round(globalEndFrame*10)/10; // round to 1 decimal

    let ip = toFrame(root.getProperty("ks:playRangeIn") || 0);
    let op = root.getProperty("ks:playRangeOut");
    if (op == null || op == "last-keyframe" || op == "infinity") {
        op = globalEndFrame;
    } else {
        op = toFrame(op);
    }

    if (op > globalEndFrame) { // use op in layers
        globalEndFrame = op;
    }
    globalPlayRange = op - ip; // save for preview

    let viewBox = root.getProperty("viewBox") || "0 0 100 100";
    let viewValues = viewBox.split(" ");
    let width = viewValues[2];
    let height = viewValues[3];

    let layers = [];
    for (let child of root.children) {
        appendLayer(layers, child);
    }

    let json = {
        v: "5.0.0",
        fr: globalFps,
        ip: ip,
        op: op,
        w: round(width),
        h: round(height),
        ddd: 0,
        assets: [],
        layers:  layers
    };
    return json;
}

// main function for exporting
function exportAnimation(userSelectedFileUrl)
{
    let json = createJSON();
    // write to a file
    app.fs.writeFileSync(userSelectedFileUrl, JSON.stringify(json));
}

function previewAnimation(folderUrl)
{
    // copy lottie library
    app.fs.copyFileSync(app.extension.getURL("lottie.js"), new URL("lottie.js", folderUrl));

    // create Lottie json
    let json = createJSON();

    // autoplay if there are frames
    let aplay = globalPlayRange == 0 ? "false" : "true";

    // create html template
    let html =
`<!DOCTYPE html>
<html>
<head>
  <title>Lottie-web Preview</title>
  <script src="lottie.js"></script>
  <style>svg { position: absolute; }</style>
</head>
<body style="background-color: #fff; margin: 0px;">

<div id="bm"></div>

<script>
let animationData = ` + JSON.stringify(json) + `
bodymovin.loadAnimation({
  container: document.getElementById('bm'),
  renderer: 'svg',
  loop: true,
  autoplay: `+aplay+`,
  animationData: animationData
})
</script>
</body>
</html>
`;

    // write to one html file
    let outfile = new URL("lottie.html", folderUrl);
    app.fs.writeFileSync(outfile, html);

    return outfile;
}
