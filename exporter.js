
// Keyshape Exporter for Bodymovin / Lottie

// returns filenames which will be written by the export function
function getFilenames(userSelectedFileUrl)
{
    let fileArray = [ userSelectedFileUrl ];
    // add image assets
    let assets = getImageAssets();
    if (assets.length > 0) {
        for (let asset of assets) {
            if (asset.e === 1) { // skip embedded images
                continue;
            }
            if (fileArray.length == 1) {
                let dirurl = new URL("images", userSelectedFileUrl);
                fileArray.push(dirurl);
            }
            let filename = asset.u + asset.p;
            let url = new URL(filename, userSelectedFileUrl);
            fileArray.push(url);
        }
    }
    return fileArray;
}

let globalLayerIndex = 1;
let globalFps = 10;
let globalOpForLayers = 0;
let globalPlayRange = 0;

function toFrame(timems)
{
    return timems * globalFps / 1000;
}

function frameToTimeMs(frame)
{
    return frame * 1000 / globalFps;
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
    let kscolor = app.activeDocument.parseColor(val);
    if (kscolor.type === "color") {
        return [ round(kscolor.red), round(kscolor.green), round(kscolor.blue),
                 round(kscolor.alpha ?? 1) ];
    }
    return [ 0, 0, 0, 0 ];
}

function convertEasing(easing)
{
    if (easing === "linear") {
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

function toPx(lenvalue, defaultValue = 0)
{
    lenvalue = ""+lenvalue;
    let val = parseFloat(lenvalue);
    if (!isFinite(val)) {
        return defaultValue;
    }
    lenvalue = lenvalue.trim();
    if (lenvalue.endsWith("in")) {
        val = val * 96;
    } else if (lenvalue.endsWith("cm")) {
        val = val * 96 / 2.54;
    } else if (lenvalue.endsWith("mm")) {
        val = val * 96 / 25.4;
    } else if (lenvalue.endsWith("pt")) {
        val = val * 96 / 72;
    } else if (lenvalue.endsWith("pc")) {
        val = val * 96 * 12 / 72;
    }
    return val;
}

function valueOrAnimation(element, prop, defaultValue, processor)
{
    let kfs = [];
    element.timeline().simplifyEasings(prop);
    kfs = element.timeline().getKeyframes(prop);
    if (!kfs || kfs.length < 2) {
        let val = element.getProperty(prop) ?? defaultValue;
        if (processor) { val = processor(val); }
        return { a: 0, k: Array.isArray(val) ? val : round(val) };
    }
    // animation
    let obj = { a: 1, k: [] };
    let extraSpan;
    for (let i = 0; i < kfs.length; ++i) {
        let kf = kfs[i];
        let val = processor ? processor(kf.value) : kf.value;
        let span = {
            t: toRoundFrame(kf.time),
            s: Array.isArray(val) ? val : [ round(val) ] // processor may return ready-made arrays
        };
        extraSpan = undefined;
        if (i < kfs.length-1) { // last keyframe doesn't need easing
            if (kf.easing.startsWith("steps(")) {
                span.h = 1;
                if (kf.easing.indexOf("start") > 0) {
                    // insert an extra span for start step unless kf2 is close to kf
                    let kf2 = kfs[i+1];
                    if (toRoundFrame(kf2.time) > toRoundFrame(kf.time) + 0.01) {
                        let val2 = processor ? processor(kf2.value) : kf2.value;
                        extraSpan = {
                            t: toRoundFrame(kf.time) + 0.01,
                            s: Array.isArray(val2) ? val2 : [ round(val2) ],
                            h: 1
                        };
                    }
                }
            } else {
                let ease = convertEasing(kf.easing);
                span.i = { x: [ ease[2] ], y: [ ease[3] ] };
                span.o = { x: [ ease[0] ], y: [ ease[1] ] };
                // output end values for older players
                let kf2 = kfs[i+1];
                let val2 = processor ? processor(kf2.value) : kf2.value;
                span.e = Array.isArray(val2) ? val2 : [ round(val2) ];
            }
        }
        obj.k.push(span);
        if (extraSpan) obj.k.push(extraSpan);
    }
    return obj;
}

function valueOrAnimationMultiDim(element, dim, propX, propY, defaultValue, processor)
{
    if (element.timeline().isSeparated(propX) || propX === "width" || propX === "rx") {
        addMissingKeyframes(element, propX, propY);
        addMissingKeyframes(element, propY, propX);
    }
    element.timeline().simplifyEasings(propX);
    element.timeline().simplifyEasings(propY);
    let kfsx = element.timeline().getKeyframes(propX);
    let kfsy = element.timeline().getKeyframes(propY);
    if (!kfsx || kfsx.length < 2) {
        let valx = element.getProperty(propX) ?? defaultValue;
        let valy = element.getProperty(propY) ?? defaultValue;
        if (processor) { valx = processor(valx); }
        if (processor) { valy = processor(valy); }
        return { a: 0, k: dim === 3 ? [ round(valx), round(valy), defaultValue ]
                                    : [ round(valx), round(valy) ] };
    }
    // animation
    let obj = { a: 1, k: [] };
    let extraSpan;
    for (let i = 0; i < kfsx.length; ++i) {
        let kfx = kfsx[i];
        let kfy = kfsy[i];
        let valx = processor ? processor(kfx.value) : kfx.value;
        let valy = processor ? processor(kfy.value) : kfy.value;
        valx = round(valx);
        valy = round(valy);
        let span = {
            t: toRoundFrame(kfx.time),
            s: dim === 3 ? [ valx, valy, defaultValue ] : [ valx, valy ]
        };
        extraSpan = undefined;
        // TODO: support separated properties having a stepped and non-stepped easing
        if (i < kfsx.length-1) { // last keyframe doesn't need easing
            if (kfx.easing.startsWith("steps(")) {
                span.h = 1;
                if (kfx.easing.indexOf("start") > 0) {
                    // insert an extra span for start step unless kf2 is close to kf
                    let kf2x = kfsx[i+1];
                    let kf2y = kfsy[i+1];
                    if (toRoundFrame(kf2x.time) > toRoundFrame(kfx.time) + 0.01) {
                        let val2x = processor ? processor(kf2x.value) : kf2x.value;
                        let val2y = processor ? processor(kf2y.value) : kf2y.value;
                        val2x = round(val2x);
                        val2y = round(val2y);
                        extraSpan = {
                            t: toRoundFrame(kfx.time) + 0.01,
                            s: dim === 3 ? [ val2x, val2y, defaultValue ] : [ val2x, val2y ],
                            h: 1
                        };
                    }
                }
            } else {
                let easex = convertEasing(kfx.easing);
                let easey = convertEasing(kfy.easing);
                let singleEase = easex[0] === easey[0] && easex[1] === easey[1] &&
                                 easex[2] === easey[2] && easex[3] === easey[3];
                span.i = {
                    x: singleEase ? [ easex[2] ] : [ easex[2], easey[2] ],
                    y: singleEase ? [ easex[3] ] : [ easex[3], easey[3] ]
                };
                span.o = {
                    x: singleEase ? [ easex[0] ] : [ easex[0], easey[0] ],
                    y: singleEase ? [ easex[1] ] : [ easex[1], easey[1] ]
                };
                // output end values for older players
                let kf2x = kfsx[i+1];
                let kf2y = kfsy[i+1];
                let val2x = processor ? processor(kf2x.value) : kf2x.value;
                let val2y = processor ? processor(kf2y.value) : kf2y.value;
                val2x = round(val2x);
                val2y = round(val2y);
                span.e = (dim === 3 ? [ val2x, val2y, defaultValue ] : [ val2x, val2y ]);
            }
        }
        obj.k.push(span);
        if (extraSpan) obj.k.push(extraSpan);
    }
    return obj;
}

function controlPoints(commands, x, y, x2, y2, i)
{
    let ix = x2, iy = y2, ox = x, oy = y;
    if (i < commands.length-1 && commands[i+1].command === "C") {
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
    let extraSpan;
    for (let i = 0; i < kfsx.length; ++i) {
        let kfx = kfsx[i];
        let kfy = kfsy[i];
        let valx = round(kfx.value);
        let valy = round(kfy.value);
        let span = {
            t: toRoundFrame(kfx.time),
            s: [ valx, valy, 0 ]
        };
        extraSpan = undefined;
        if (i < kfsx.length-1) { // last keyframe doesn't need easing
            if (kfx.easing.startsWith("steps(")) {
                span.h = 1;
                if (kfx.easing.indexOf("start") > 0) {
                    // insert an extra span for start step unless kf2 is close to kf
                    let kf2x = kfsx[i+1];
                    let kf2y = kfsy[i+1];
                    if (toRoundFrame(kf2x.time) > toRoundFrame(kfx.time) + 0.01) {
                        let val2x = round(kf2x.value);
                        let val2y = round(kf2y.value);
                        extraSpan = {
                            t: toRoundFrame(kfx.time) + 0.01,
                            s: [ val2x, val2y, 0 ],
                            h: 1
                        };
                    }
                }
            } else {
                let kf2x = kfsx[i+1];
                let kf2y = kfsy[i+1];
                let val2x = round(kf2x.value);
                let val2y = round(kf2y.value);
                let ctrls = controlPoints(mpcmds, +valx, +valy, +val2x, +val2y, i);
                span.to = [ ctrls[2], ctrls[3], 0 ];
                span.ti = [ ctrls[0], ctrls[1], 0 ];
                let ease = convertEasing(kfx.easing);
                span.i = { x: [ ease[2] ], y: [ clampEasingY(ease[3]) ] };
                span.o = { x: [ ease[0] ], y: [ clampEasingY(ease[1]) ] };
                // output end values for older players
                span.e = [ val2x, val2y, 0 ];
            }
        }
        obj.k.push(span);
        if (extraSpan) obj.k.push(extraSpan);
    }
    return obj;
}

function hasSkewY(element)
{
    // if skewX value is found, then skewing Y isn't possible
    let skx = element.getProperty("ks:skewX") ?? 0;
    if (skx !== 0) {
        return false;
    }
    // if skewX keyframe value is found, then skewing Y isn't possible
    let kfsx = element.timeline().getKeyframes("ks:skewX");
    for (let kf of kfsx) {
        if (kf.value !== 0) {
            return false;
        }
    }
    // if skewY value is found, then perform skewing Y
    let sky = element.getProperty("ks:skewY") ?? 0;
    if (sky !== 0) {
        return true;
    }
    // if skewY keyframe value is found, then perform skewing Y
    let kfsy = element.timeline().getKeyframes("ks:skewY");
    for (let kf of kfsy) {
        if (kf.value !== 0) {
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
            "sa": { "a": 0, "k": 0 }
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
    // separate position so that motion path is supported
    element.timeline().setSeparated("ks:positionX", true);
    let transform = {
        "ty": "tr",
        "p": valueOrAnimationMultiDim(element, 2, "ks:positionX", "ks:positionY", 0, function(val) { return +val; }),
        "a": valueOrAnimationMultiDim(element, 2, "ks:anchorX", "ks:anchorY", 0, function(val) { return -val; }),
        "s": valueOrAnimationMultiDim(element, 2, "ks:scaleX", "ks:scaleY", 100, function(val) { return val*100; }),
        "r": valueOrAnimation(element, "ks:rotation", 0, function(val) { return +val; }),
        "o": valueOrAnimation(element, "opacity", 1, function(val) { return val*100; }),
        "sk": valueOrAnimation(element, skewProp, 1, skewFunc),
        "sa": {
            "a": 0,
            "k": skewa
        }
    };
    array.push(transform);
}

function pushMask(layerArray, element, assets)
{
    // reverse order so that the top-most mask or clipPath is processed
    for (let i = element.children.length-1; i >= 0; --i) {
        let child = element.children[i];
        if (child.getProperty("display") === "none") {
            continue;
        }
        // convert clipPaths to single color masks
        if (child.tagName === "clipPath") {
            child.setProperty("mask-type", "alpha");
            for (let clipChild of child.children) {
                let tag = clipChild.tagName;
                if (tag === "rect" || tag === "ellipse" || tag === "path") {
                    clipChild.timeline().removeAllKeyframes("opacity");
                    clipChild.timeline().removeAllKeyframes("fill");
                    clipChild.timeline().removeAllKeyframes("stroke");
                    clipChild.timeline().removeAllKeyframes("fill-opacity");
                    clipChild.setProperty("opacity", 1);
                    clipChild.setProperty("fill", "#ffffff");
                    clipChild.setProperty("stroke", "none");
                    clipChild.setProperty("fill-opacity", 1);
                    clipChild.setProperty("fill-rule", "nonzero");
                } else {
                    clipChild.setProperty("display", "none");
                }
            }
        }
        if (child.tagName === "mask" || child.tagName === "clipPath") {
            layerArray[0].tt = child.getProperty("mask-type") === "alpha" ? 1 : 3;
            // create track matte for mask
            appendLayer(layerArray, child, assets, element);
            layerArray[0].td = 1;
            return; // only one mask or clipPath
        }
    }
}

function createGradient(colordata, type)
{
    let gobj = {
        ty: type,
        t: colordata.type === "radial-gradient" ? 2 : 1
    };
    // TODO: objectBoundingBox
    let gt = colordata.gradientTransform;
    if (colordata.type === "linear-gradient") {
        let pt1 = new DOMPoint(colordata.x1, colordata.y1).matrixTransform(gt);
        let pt2 = new DOMPoint(colordata.x2, colordata.y2).matrixTransform(gt);
        gobj.s = {
            a: 0,
            k: [ round(pt1.x), round(pt1.y) ]
        };
        gobj.e = {
            a: 0,
            k: [ round(pt2.x), round(pt2.y) ],
        };

    } else {
        let ptc = new DOMPoint(colordata.fx, colordata.fy).matrixTransform(gt);
        gobj.s = {
            a: 0,
            k: [ round(ptc.x), round(ptc.y) ]
        };
        let pte = new DOMPoint(colordata.fx + colordata.r, colordata.fy).matrixTransform(gt);
        gobj.e = {
            a: 0,
            k: [ round(pte.x), round(pte.y) ],
        };
        // TODO: cx, cy / fx, fy
        gobj.h = { a: 0, k: 0 };
        gobj.a = { a: 0, k: 0 };
    }
    let colors = { a: 0, k: [] };
    if (colordata.stops.length === 0) {
        colordata.stops.push({ offset: 0, red: 0, green: 0, blue: 0, alpha: 0 });
    }
    // color values for gradient stops
    let hasAlpha = false;
    for (let stop of colordata.stops) {
        colors.k.push(round(stop.offset));
        colors.k.push(round(stop.red));
        colors.k.push(round(stop.green));
        colors.k.push(round(stop.blue));
        if (round(stop.alpha) < 1) {
            hasAlpha = true;
        }
    }
    // alpha values for gradient stops
    if (hasAlpha) {
        for (let stop of colordata.stops) {
            colors.k.push(round(stop.offset));
            colors.k.push(round(stop.alpha));
        }
    }
    gobj.g = {
        p: colordata.stops.length,
        k: colors
    };
    gobj.hd = false;
    return gobj;
}

const linecaps = [ "butt", "round", "square" ];
const linejoins = [ "miter", "round", "bevel" ];

function parseDashArray(str)
{
    str = str.trim();
    if (str === "none") { return [ "0" ]; }
    return str.replace(/,/g, ' ').split(/\s/);
}

function colorToCss(color)
{
    return "rgba(" + color.red*255 + "," + color.green*255 + "," + color.blue*255 + ", 1)";
}

// temporary fix to support color alpha by moving it to opacity, needed for Lottie-web and Android
function moveAlphaToOpacity(element, prop, kscolor)
{
    if (kscolor.type !== "color") {
        return;
    }
    if (!element.timeline().hasKeyframes(prop)) {
        if (kscolor.alpha === undefined) {
            return;
        }
        // move non-animated alpha value to opacity (keyframes)
        multiplyProperty(element, prop+"-opacity", kscolor.alpha);
        kscolor.alpha = 1;
        element.setProperty(prop, colorToCss(kscolor));

    } else if (!element.timeline().hasKeyframes(prop+"-opacity")) {
        // move alpha keyframes to opacity keyframes
        let kfs = element.timeline().getKeyframes(prop);
        let needsAlpha = false;
        let opacityKfs = [];
        for (let i = 0; i < kfs.length; ++i) {
            let kf = kfs[i];
            let kfkscolor = app.activeDocument.parseColor(kf.value);
            let alpha = kfkscolor.type === "color" ? kfkscolor.alpha : 1;
            if (alpha < 1 && kfkscolor.type === "color") {
                needsAlpha = true;
                element.timeline().setKeyframe(prop, kf.time, colorToCss(kfkscolor), kf.easing);
            }
            opacityKfs.push({ time: kf.time, value: alpha, easing: kf.easing });
        }
        if (needsAlpha) {
            let mult = element.getProperty(prop+"-opacity");
            for (let kf of opacityKfs) {
                element.timeline().setKeyframe(prop+"-opacity", kf.time, round(kf.value*mult),
                                               kf.easing);
            }
        }
    }
}

function pushStrokeAndFill(shapesArray, element)
{
    let s = app.activeDocument.parseColor(element.getProperty("stroke"));
    if (s.type !== "none" || element.timeline().hasKeyframes("stroke")) {
        moveAlphaToOpacity(element, "stroke", s);
        let sc = linecaps.indexOf(element.getProperty("stroke-linecap")) + 1;
        if (sc == -1) { sc = 0; }
        let sj = linejoins.indexOf(element.getProperty("stroke-linejoin")) + 1;
        if (sj == -1) { sj = 0; }
        let miter = element.getProperty("stroke-miterlimit");
        let strokeobj;
        if (s.type === "linear-gradient" || s.type === "radial-gradient") {
            strokeobj = createGradient(s, "gs");
        } else {
            strokeobj = {
                ty: "st",
                c: valueOrAnimation(element, "stroke", 0, convertColor)
            };
        }
        strokeobj.o = valueOrAnimation(element, "stroke-opacity", 1, function(val) { return val*100; });
        strokeobj.w = valueOrAnimation(element, "stroke-width", 1, function(val) { return toPx(val,1); });
        strokeobj.lc = sc;
        strokeobj.lj = sj;
        strokeobj.ml = round(miter);

        // dashes
        let dash = element.getProperty("stroke-dasharray").trim();
        if (dash !== "" && dash !== "none") {
            let d = [];
            for (let i = 0; i < 2; ++i) {
                let gap = d.length & 1;
                d.push({
                    n: gap ? "g" : "d",
                    nm: gap ? "gap" : "dash",
                    v: valueOrAnimation(element, "stroke-dasharray", "0", function(val) {
                        let dashes = parseDashArray(val);
                        return i < dashes.length ? toPx(dashes[i]) : toPx(dashes[0]);
                    })
                });
            }
            d.push({
                n: "o",
                nm: "offset",
                v: valueOrAnimation(element, "stroke-dashoffset", 0, function(val) { return toPx(val); })
            });
            strokeobj.d = d;
        }
        shapesArray.push(strokeobj);
    }
    let f = app.activeDocument.parseColor(element.getProperty("fill"));
    if (f.type !== "none" || element.timeline().hasKeyframes("fill")) {
        moveAlphaToOpacity(element, "fill", f);
        let fillrule = element.getProperty("fill-rule") === "evenodd" ? 2 : 1;
        let fillobj;
        if (f.type === "linear-gradient" || f.type === "radial-gradient") {
            fillobj = createGradient(f, "gf");
        } else {
            fillobj = {
                ty: "fl",
                c: valueOrAnimation(element, "fill", 0, convertColor),
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
        if (cmd.command === "M") {
            result.i.push([ 0, 0 ]);
            result.v.push([ round(cmd.x), round(cmd.y) ]);
            result.o.push([ 0, 0 ]);

        } else if (cmd.command === "L") {
            result.i.push([ 0, 0 ]);
            result.v.push([ round(cmd.x), round(cmd.y) ]);
            result.o.push([ 0, 0 ]);

        } else if (cmd.command === "C") {
            let previx = result.v.length-1;
            result.o[previx][0] = round(cmd.x1 - result.v[previx][0]);
            result.o[previx][1] = round(cmd.y1 - result.v[previx][1]);
            result.i.push([ round(cmd.x2 - cmd.x), round(cmd.y2 - cmd.y) ]);
            result.v.push([ round(cmd.x), round(cmd.y) ]);
            result.o.push([ 0, 0 ]);

        } else if (cmd.command === "Z") {
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
        if (cmd.command === "M") {
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
            pathshape.ks = { a: 0, k: {}, hd: false };
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
    pathshape.ks = { a: 1, k: [], hd: false };

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
        pathshape.ks = { a: 1, k: sh, hd: false };
        shapesArray.push(pathshape);
    }
}

function hasTime(kfs, time)
{
    // don't check last keyframe, so that easing can get copied to it
    for (let i = 0; i < kfs.length; ++i) {
        let kf = kfs[i];
        if (kf.time === time) {
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
    let destKfs = element.timeline().getKeyframes(destProp) ?? [];
    for (let i = kfs.length-1; i >= 0; --i) {
        let kf = kfs[i];
        let time = kf.time;
        if (hasTime(destKfs, time)) {
            continue;
        }
        // add extra keyframes
        element.timeline().addKeyframe(destProp, time);
    }
}

function addShape(shapesArray, element, topLevel)
{
    if (element.getProperty("display") === "none") {
        return;
    }

    let shape = {};
    if (element.tagName === "svg") {
        shape.ty = "gr";
        shape.it = [];
        for (let child of element.children) {
            addShape(shape.it, child, false);
        }
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName === "g" || element.tagName === "a") {
        shape.ty = "gr";
        shape.it = [];
        for (let child of element.children) {
            addShape(shape.it, child, false);
        }
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName === "rect") {
        shape.ty = "gr";
        shape.it = [];

        let rectshape = {};
        rectshape.d = 1;
        rectshape.ty = "rc";
        rectshape.s = valueOrAnimationMultiDim(element, 2, "width", "height", 0,
                                               function(val) { return toPx(val); });
        // rect size is relative to center, so move position
        rectshape.p = valueOrAnimationMultiDim(element, 2, "width", "height", 0,
                                               function(val) { return toPx(val)/2; });
        rectshape.r = valueOrAnimation(element, "rx", 0, function(val) { return toPx(val); });

        shape.it.push(rectshape);
        pushStrokeAndFill(shape.it, element);
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName === "ellipse") {
        shape.ty = "gr";
        shape.it = [];

        let ellipseshape = {};
        ellipseshape.d = 1;
        ellipseshape.ty = "el";
        let x = 0;
        let y = 0;
        ellipseshape.s = valueOrAnimationMultiDim(element, 2, "rx", "ry", 0,
                                                  function(val) { return toPx(val)*2; });
        ellipseshape.p = { a:0, k: [ round(x), round(y) ] };

        shape.it.push(ellipseshape);
        pushStrokeAndFill(shape.it, element);
        pushTransformAndOpacity(shape.it, element, topLevel);

    } else if (element.tagName === "path") {
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
    shape.nm = (!topLevel ? id : null) ?? "Object";
    if (id !== null && id !== "" && !topLevel) {
        shape.ln = id.replace(/ /g, '-');
    }
    shape.hd = false;
    shapesArray.unshift(shape);
}

const blendingModes = [
    "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn",
    "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"
];

function multiplyProperty(element, prop, mult)
{
    if (element.timeline().hasKeyframes(prop)) {
        let kfs = element.timeline().getKeyframes(prop);
        for (let kf of kfs) {
            element.timeline().setKeyframe(prop, kf.time, mult * kf.value, kf.easing);
        }
    } else {
        element.setProperty(prop, mult * element.getProperty(prop));
    }
}

// maskParentForTransform is set if this layer is a track matte layer
function appendLayer(layersArray, element, assets, maskParentForTransform)
{
    let isVisible = element.getProperty("visibility") === "visible" ||
        element.timeline().hasKeyframes("visibility");
    if (element.getProperty("display") === "none" || !isVisible) {
        return;
    }
    // preprocess image
    let imageAsset;
    if (element.tagName === "image") {
        let href = element.getProperty("href");
        if (href === "") {
            return;
        }
        imageAsset = assets.find(function(item) { return item.orighref === href; });
        if (!imageAsset) {
            return;
        }
        // Lottie doesn't support width and height, so adjust scale and anchor to get them supported
        let iw = toPx(element.getProperty("width"));
        let iws = iw / imageAsset.w;
        let ih = toPx(element.getProperty("height"));
        let ihs = ih / imageAsset.h;
        multiplyProperty(element, "ks:scaleX", iws);
        multiplyProperty(element, "ks:scaleY", ihs);
        multiplyProperty(element, "ks:anchorX", 1/iws);
        multiplyProperty(element, "ks:anchorY", 1/ihs);
    }

    let transform = {};
    let te = maskParentForTransform ?? element;
    if (te.timeline().isSeparated("ks:positionX")) {
        transform.p = { s: true };
        transform.p.x = valueOrAnimation(te, "ks:positionX", 0, function(val) { return +val; });
        transform.p.y = valueOrAnimation(te, "ks:positionY", 0, function(val) { return +val; });
    } else {
        transform.p = valueOrMotionPath(te);
    }
    transform.a = valueOrAnimationMultiDim(te, 3, "ks:anchorX", "ks:anchorY", 0, function(val) { return -val; });
    transform.s = valueOrAnimationMultiDim(te, 3, "ks:scaleX", "ks:scaleY", 100, function(val) { return val*100; });
    transform.r = valueOrAnimation(te, "ks:rotation", 0, function(val) { return +val; });
    transform.o = valueOrAnimation(element, "opacity", 1, function(val) { return val*100; });

    let blend = blendingModes.indexOf(element.getProperty("mix-blend-mode"));
    if (blend < 0) { blend = 0; }

    let ip = 0;
    let op = globalOpForLayers > 0 ? globalOpForLayers : 1;
    let visibilityKeyframes = element.timeline().getKeyframes("visibility");
    if (visibilityKeyframes.length > 1 && visibilityKeyframes[0].value === "visible" &&
            visibilityKeyframes[1].value === "hidden") {
        ip = toRoundFrame(visibilityKeyframes[0].time);
        op = toRoundFrame(visibilityKeyframes[1].time);
    }

    let id = element.getProperty("id");
    let obj = {
        ind: globalLayerIndex,
        nm: id ?? "Layer "+globalLayerIndex,
        ks: transform,
        ao: te.getProperty("ks:motion-rotation") === "auto" &&
            !te.timeline().isSeparated("ks:positionX") ? 1 : 0,
        ip: ip,
        op: op,
        st: 0, // start time
        bm: blend,
        sr: 1 // layer time stretch
    }

    if (element.tagName === "g" || element.tagName === "a" || element.tagName === "svg" ||
            maskParentForTransform) {
        // add children
        let shapes = [];
        for (let child of element.children) {
            addShape(shapes, child, false);
        }
        obj.ty = 4; // shape layer
        obj.shapes = shapes;

    } else if (element.tagName === "image") {
        obj.ty = 2; // image layer
        obj.refId = imageAsset.id;

    } else {
        // top level rect, ellipse, text, path, g
        let shapes = [];
        addShape(shapes, element, true);
        obj.ty = 4; // shape layer
        obj.shapes = shapes;
    }

    if (id !== null && id !== "") {
        obj.ln = id.replace(/ /g, '-');
    }
    // if no shapes, then skip this element (it could be title, desc or metadata)
    if (!obj.ty) {
        return;
    }
    layersArray.unshift(obj);
    if (!maskParentForTransform) {
        pushMask(layersArray, element, assets);
    }
    globalLayerIndex++;
}

function convertToPaths(doc, element)
{
    // convert the element tree recursively to paths
    for (let child of element.children) {
        convertToPaths(doc, child);
    }
    if (element.tagName === "rect") {
        // convert rect element to path if it has dashes to get correct start node
        if (!element.timeline().hasKeyframes("width") && !element.timeline().hasKeyframes("height")
                && element.getProperty("stroke-dasharray") !== "none") {
            doc.selectedElements = [ element ];
            doc.cmd.convertToPath();
        }

    } else if (element.tagName === "ellipse") {
        // convert ellipse element to path if it has dashes to get correct start node
        if (element.getProperty("stroke-dasharray") !== "none") {
            doc.selectedElements = [ element ];
            doc.cmd.convertToPath();
        }

    } else if (element.tagName === "text") {
        // text is always converted
        doc.selectedElements = [ element ];
        doc.cmd.convertToPath();
    }
}

function detachFromSymbols(doc, element, hrefStack)
{
    // detach the element tree recursively
    for (let child of element.children) {
        detachFromSymbols(doc, child, hrefStack);
    }
    // select element to be detached
    // (only detaches elements which can be detached)
    doc.selectedElements = [ element ];
    doc.cmd.detachFromSymbol();
    // recursively detach the result of <use> elements, also check hrefStack for cyclic references
    if (element.tagName === "use" && doc.selectedElements.length > 0 &&
            hrefStack.indexOf(element.getProperty("href")) === -1) {
        hrefStack.push(element.getProperty("href"));
        detachFromSymbols(doc, doc.selectedElements[0], hrefStack);
        hrefStack.pop();
    }
}

function convertIterationsToKeyframes(doc, element, opTimeMs)
{
    // in reality, opTimeMs is never infinity, but check to be certain
    if (element.getProperty("display") === "none" || opTimeMs === Infinity) {
        return;
    }
    // convert the element tree recursively
    for (let child of element.children) {
        convertIterationsToKeyframes(doc, child, opTimeMs);
    }
    // convert element iterations
    let propNames = element.timeline().getKeyframeNames();
    for (let prop of propNames) {
        let params = element.timeline().getKeyframeParams(prop);
        if (!params || params.repeatEnd === null) {
            continue;
        }
        element.timeline().setKeyframeParams(prop, { repeatEnd: null });
        let repeatEnd = params.repeatEnd !== Infinity ? params.repeatEnd : opTimeMs;
        let keyframes = element.timeline().getKeyframes(prop);
        if (keyframes.length < 2) {
            continue;
        }
        let pairedProp = (prop === "ks:positionX" || prop === "ks:scaleX" || prop === "ks:anchorX") &&
              !element.timeline().isSeparated(prop) ? prop.substr(0, prop.length-1)+"Y" : undefined;
        let keyframesY = pairedProp ? element.timeline().getKeyframes(pairedProp) : [];
        let kfStartTime = keyframes[0].time;
        let kfEndTime = keyframes[keyframes.length-1].time;
        let kfEndValue = keyframes[keyframes.length-1].value;
        let kfEndValueY = pairedProp ? keyframesY[keyframesY.length-1].value : undefined;
        let kfDur = kfEndTime - kfStartTime;
        let keepLooping = true;
        while (keepLooping) {
            let i = 0;
            for (let kf of keyframes) {
                let newTime = kfEndTime + (kf.time - kfStartTime);

                let valueMatch = kf.value === kfEndValue;
                if (pairedProp) {
                    let kfY = keyframesY[i];
                    valueMatch = valueMatch && (kfY.value === kfEndValueY);
                }
                if (newTime === kfEndTime && !valueMatch) {
                    newTime += 1;
                    // change easing of the last keyframe to be stepped for immediate change
                    let kfs = element.timeline().getKeyframes(prop);
                    let lastKf = kfs[kfs.length-1];
                    element.timeline().setKeyframe(prop, lastKf.time, lastKf.value,
                                                   "steps(1)");
                    if (pairedProp) {
                        let kfsY = element.timeline().getKeyframes(pairedProp);
                        let lastKfY = kfsY[kfsY.length-1];
                        element.timeline().setKeyframe(pairedProp, lastKfY.time, lastKfY.value,
                                                       "steps(1)");
                    }
                }
                element.timeline().setKeyframe(prop, newTime, kf.value, kf.easing);
                if (pairedProp) {
                    let kfY = keyframesY[i];
                    element.timeline().setKeyframe(pairedProp, newTime, kfY.value, kfY.easing);
                }
                if (newTime > repeatEnd) {
                    keepLooping = false;
                    break;
                }
                ++i;
            }
            kfEndTime += kfDur;
        }
        // add keyframe to repeat end time (which may be between keyframes)
        // and remove keyframes after it
        element.timeline().addKeyframe(prop, repeatEnd);
        let newkeyframes = element.timeline().getKeyframes(prop);
        for (let kf of newkeyframes) {
            if (kf.time > repeatEnd) {
                element.timeline().removeKeyframe(prop, kf.time);
            }
        }
    }
}

function calculateEndTime(element)
{
    if (element.getProperty("display") === "none") {
        return;
    }
    let names = element.timeline().getKeyframeNames();
    for (let name of names) {
        let kfs = element.timeline().getKeyframes(name);
        let end = kfs[kfs.length-1].time;
        if (globalOpForLayers < toFrame(end)) {
            globalOpForLayers = toFrame(end);
        }
    }
    for (let child of element.children) {
        calculateEndTime(child);
    }
}

function getImageAssets()
{
    let assetArray = [];
    for (let child of app.activeDocument.documentElement.children) {
        if (child.tagName === "image" && child.getProperty("display") !== "none") {
            let href = child.getProperty("href");
            if (!assetArray.find(function(item) { return item.orighref === href })) {
                let imgdata = app.activeDocument.getMediaData(href);
                let imginfo = app.activeDocument.getMediaInfo(href);
                if (imgdata && imginfo) {
                    let filename = href;
                    let isEmbeddedImage = false;
                    if (filename.startsWith("data:embedded")) {
                        isEmbeddedImage = true;
                        filename += imginfo.mimetype === "image/png" ? ".png" : ".jpg";
                    }
                    filename = filename.replace(/file:|data:/, "");
                    let lastDashPos = filename.lastIndexOf("/");
                    if (lastDashPos >= 0) {
                        filename = filename.substring(lastDashPos+1);
                    }
                    let imgid = filename.replace(/\.png|\.jpg|\.jpeg/, "");
                    if (isEmbeddedImage) {
                        assetArray.push({
                            id: imgid,
                            w: imginfo.width,
                            h: imginfo.height,
                            u: "",
                            p: "data:"+imginfo.mimetype+";base64,"+base64encode(imgdata),
                            orighref: href,
                            e: 1
                        });
                    } else {
                        assetArray.push({
                            id: imgid,
                            w: imginfo.width,
                            h: imginfo.height,
                            u: "images/",
                            p: filename,
                            orighref: href
                        });
                    }
                } else {
                    // clear invalid image hrefs
                    child.setProperty("href", "");
                }
            }
        }
    }
    return assetArray;
}

function compToHex2(num)
{
    num = Math.round(num*255);
    return (num < 16 ? "0" : "") + num.toString(16);
}

function createJsonAndCopyAssets(userSelectedFileUrl)
{
    let root = app.activeDocument.documentElement;

    globalFps = +(root.getProperty("ks:fps") ?? 10);

    // detach symbols from use elements
    detachFromSymbols(app.activeDocument, root, []);

    // convert text, rects and ellipses to paths
    convertToPaths(app.activeDocument, root);

    // time for the last keyframe is the op for the layers
    calculateEndTime(root);
    globalOpForLayers = Math.round(globalOpForLayers*10)/10; // round to 1 decimal

    let playRange = app.activeDocument.getPlayRange();
    let ip = toFrame(playRange.in);
    let op = toFrame(playRange.definiteOut);

    if (op > globalOpForLayers) { // use op in layers
        globalOpForLayers = op;
    }
    globalPlayRange = op - ip; // save for preview

    convertIterationsToKeyframes(app.activeDocument, root, frameToTimeMs(globalOpForLayers));

    let viewWidth = toPx(root.getProperty("width") ?? "640");
    let viewHeight = toPx(root.getProperty("height") ?? "480");
    let viewBox = root.getProperty("viewBox") ?? ("0 0 "+viewWidth+" "+viewHeight);
    let viewValues = viewBox.split(" ");
    let width = round(viewValues[2]);
    let height = round(viewValues[3]);

    let assets = getImageAssets();

    let layers = [];

    // add background as a solid layer
    let bg = app.activeDocument.parseColor(root.getProperty("background"));
    if (bg.alpha > 0) {
        let hexbg = "#" + compToHex2(bg.red) + compToHex2(bg.green) + compToHex2(bg.blue);
        let solid = { "ind": globalLayerIndex, "ty": 1,
            "ks":{"o":{"k":bg.alpha*100},"r":{"k":0},"p":{"k":[0,0,0]},"a":{"k":[0,0,0]},"s":{"k":[100,100,100]}},
            "sw":width, "sh":height, "sc":hexbg,
            "ip":ip, "op":globalOpForLayers>0 ? globalOpForLayers : 1, "st":0, sr: 1 };
        layers.push(solid);
        globalLayerIndex++;
    }

    for (let child of root.children) {
        appendLayer(layers, child, assets);
    }

    // write out assets
    if (assets.length > 0) {
        let hasCreatedDir = false;
        for (let asset of assets) {
            if (asset.e === 1) { // skip embedded images
                continue;
            }
            if (!hasCreatedDir) {
                hasCreatedDir = true;
                let dirurl = new URL("images", userSelectedFileUrl);
                app.fs.mkdirSync(dirurl);
            }
            let href = asset.orighref;
            asset.orighref = undefined;
            let imgdata = app.activeDocument.getMediaData(href);
            let filename = asset.u + asset.p;
            let url = new URL(filename, userSelectedFileUrl);
            app.fs.writeFileSync(url, imgdata);
        }
    }

    // markers
    let markers = [];
    for (let m of root.timeline().getTimeMarkers()) {
        markers.push({ "tm": toRoundFrame(m.time), "cm": m.name, "dr": toRoundFrame(m.dur) });
    }

    let manifestUrl = app.extension.getURL()+"manifest.json";
    let manifestData = app.fs.readFileSync(new URL(manifestUrl), { encoding: 'utf-8' });
    let manifestJson = JSON.parse(manifestData);

    let json = {
        v: "5.10.0",
        meta: { g: "Keyshape Lottie plugin v" + manifestJson.version },
        fr: globalFps,
        ip: ip,
        op: op,
        w: Math.ceil(width), // round up because iOS viewer can't handle decimals
        h: Math.ceil(height),
        ddd: 0,
        assets: assets,
        layers: layers,
        markers: markers
    };

    return json;
}

// main function for exporting
function exportAnimation(userSelectedFileUrl)
{
    let json = createJsonAndCopyAssets(userSelectedFileUrl);
    // write to a file
    app.fs.writeFileSync(userSelectedFileUrl, JSON.stringify(json));
}

function previewAnimation(folderUrl)
{
    // copy lottie library
    app.fs.copyFileSync(app.extension.getURL("lottie.js"), new URL("lottie.js", folderUrl));

    // create Lottie json
    let json = createJsonAndCopyAssets(folderUrl);

    // autoplay if there are frames
    let aplay = globalPlayRange == 0 ? "false" : "true";

    // create html template
    let html =
`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lottie-web Preview</title>
  <script src="lottie.js"></script>
  <style>svg { position: absolute; }</style>
</head>
<body style="background-color: #fff; margin: 0px;">

<div id="bmdiv"></div>
<div id="errormsg" style="text-align:center;font-family:sans-serif;"></div>

<script>
let animationData = ` + JSON.stringify(json) + `;
try {
    bodymovin.loadAnimation({
      container: document.getElementById('bmdiv'),
      renderer: 'svg',
      loop: true,
      autoplay: `+aplay+`,
      animationData: animationData
    });
} catch (e) {
    var st = e.stack.replace(/file:.*lottie/g, " ").replace(/\\n/g, "<br>");
    document.getElementById("bmdiv").style.display = "none";
    document.getElementById("errormsg").innerHTML =
        "<h1>Oops! Lottie preview failed!</h1><p>"+
            "<a href='https://github.com/Pixofield/keyshape-lottie-format/issues'>Please, report it on GitHub.</a><br><br>"+
            "Player v"+bodymovin.version+" stack trace:</p>"+e+"<br><br>"+st;
    throw e;
}
</script>
</body>
</html>
`;

    // write to one html file
    let outfile = new URL("lottie.html", folderUrl);
    app.fs.writeFileSync(outfile, html);

    return outfile;
}

// public domain base64 encoder from https://simplycalc.com/base64-source.php
function base64encode(data)
{
    var b64x = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"   // base64 dictionary
    var b64pad = '='
    var len = data.length;

    var dst = ""
    var i

    for (i = 0; i <= len - 3; i += 3)
    {
        dst += b64x.charAt(data[i] >>> 2)
        dst += b64x.charAt(((data[i] & 3) << 4) | (data[i+1] >>> 4))
        dst += b64x.charAt(((data[i+1] & 15) << 2) | (data[i+2] >>> 6))
        dst += b64x.charAt(data[i+2] & 63)
    }

    if (len % 3 === 2)
    {
        dst += b64x.charAt(data[i] >>> 2)
        dst += b64x.charAt(((data[i] & 3) << 4) | (data[i+1] >>> 4))
        dst += b64x.charAt(((data[i+1] & 15) << 2))
        dst += b64pad
    }
    else if (len % 3 === 1)
    {
        dst += b64x.charAt(data[i] >>> 2)
        dst += b64x.charAt(((data[i] & 3) << 4))
        dst += b64pad
        dst += b64pad
    }

    return dst;
}
