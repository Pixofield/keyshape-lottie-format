
# Lottie plugin for Keyshape

This [Keyshape](https://www.keyshapeapp.com) plugin adds support for importing and exporting
the [Lottie](https://airbnb.io/lottie/) file format.

After installing the plugin, it is possible to export Lottie animation files.
It is also possible to open Lottie animation files in Keyshape for editing.

## Installing

1. Go to [Releases](https://github.com/Pixofield/keyshape-lottie-format/releases)
   and download _lottie-format.keyshapeplugin_
2. Double-click the downloaded _lottie-format.keyshapeplugin_ to install it in Keyshape

The plugin can be updated with the same procedure: download the latest release and install it.

## Exporting Lottie animations

After installation, the _Lottie_ export option can be found in the export dialog.
Lottie animations are exported to a single JSON file.

Exporting has few limitations:

 * text is converted to paths (without emojis)
 * only top level bitmap images are supported (without width and height animations)
 * only top level visibility animations are supported
 * blending and orient along path are supported only at the top level objects
 * stroke dashing supports only one dash and gap
 * stroke and fill animations don't support "none" or gradient values
 * rounded rectangles support only X radius, Y radius is ignored
 * skew X and Y are not supported at the top level objects
 * only skew X or skew Y can be set or animated, not both
 * filters are not supported
 * blending isolation is not supported
 * symbols create duplicate code, which can create large files
 * masks can only be under top level objects
 * images are not supported under masks
 * only one mask or clipping path is allowed per element

## Previewing Lottie animations

Keyshape can preview Lottie animations on web browsers with the
[Lottie-web player](https://github.com/airbnb/lottie-web). Select
the Lottie-web option under the preview options and then press
the Preview button to view the animation.

## Importing Lottie animations

After installation, just use the **File > Open** menu command in Keyshape to open Lottie
files. Lottie files have a _.json_ file suffix.

Basic Lottie features are imported successfully, but there are few limitations:

 * path trimming is mapped to stroke dash array animation
 * path trimming supports only simple start to end animations
 * gradient animations are not supported
 * size animations are not supported
 * repeater is not supported
 * expressions are not supported
 * effects are not supported
 * camera is not supported
 * frame rates are rounded to integer numbers
 * only one fill and stroke per object
 * no support for inverted masks
 * only "add" mask mode is supported, no "intersect" etc. mask modes

## Lottie Resources

 * [Introduction to Lottie](https://airbnb.io/lottie/)
 * [Lottie-web](https://github.com/airbnb/lottie-web)
 * [Lottie-iOS](https://github.com/airbnb/lottie-ios) - iOS and macOS
 * [Lottie-Android](https://github.com/airbnb/lottie-android)
 * [Lottie React Native](https://github.com/airbnb/lottie-react-native)
 * [LottieFiles](https://www.lottiefiles.com) - a collection of Lottie animations
 * [Third-party Lottie players](https://airbnb.io/lottie/#/other-platforms) for Xamarin, Vue, React, Angular, etc.

## License

MIT License, see the LICENSE file for details.

This software includes Lottie-web JavaScript library, see LICENSE-lottie.md for details or
see the source code: https://github.com/airbnb/lottie-web
