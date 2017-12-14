
# Lottie plugin for Keyshape

This [Keyshape](https://www.keyshapeapp.com) plugin adds support for importing and exporting
the [Lottie](https://airbnb.design/lottie/) file format.

After installing the plugin, it is possible to open Lottie animation files in Keyshape
for editing. It is also possible to export Lottie animation files.

## Installing

1. Go to [Releases](https://github.com/Pixofield/keyshape-lottie-format/releases)
   and download _Lottie-format.keyshapeplugin_
2. Double-click the downloaded _Lottie-format.keyshapeplugin_ to install it in Keyshape

The plugin can be updated with the same procedure: download the latest release and install it.

## Importing Lottie animations

After installation, just use the **File > Open** menu command in Keyshape to open Lottie
files. Lottie files have a _.json_ file suffix.

Basic Lottie features are imported successfully, but there are few limitations:

 * path trimming is not supported
 * separated position animations are not supported
 * gradient animations are not supported
 * size animations are not supported
 * repeater is not supported
 * masks are not supported
 * expressions are not supported
 * effects are not supported
 * camera is not supported
 * frame rates are rounded to integer numbers
 * only one fill and stroke per object
 * play range times are not supported

## Exporting Lottie animations

After installation, the _Lottie_ export option can be found in the export dialog.
Lottie animations are exported to a single JSON file.

Exporting has few limitations:

 * blending, curved motion paths and orient along path are supported only at the top level objects
 * stroke dashing supports only one dash and gap
 * gradients don't support the alpha component
 * stroke and fill animations don't support "none" or gradient values
 * rounded rectangles support only X radius, Y radius is ignored
 * skew X and Y are not supported at the top level objects
 * only skew X or skew Y can be set or animated, not both
 * repeating individual properties is not supported
 * path trimming is not supported
 * bitmap images are not supported
 * filters are not supported
 * blending isolation is not supported
 * text is converted to paths
 * symbols create duplicate code, which can create large files

Exported Lottie animations can tested with the [LottieFiles previewer](https://www.lottiefiles.com/preview).

## Lottie Resources

 * [Introduction to Lottie](https://airbnb.design/lottie/)
 * [Lottie-web](https://github.com/airbnb/lottie-web)
 * [Lottie-iOS](https://github.com/airbnb/lottie-ios) - iOS and macOS
 * [Lottie-Android](https://github.com/airbnb/lottie-android)
 * [Lottie React Native](https://github.com/airbnb/lottie-react-native)
 * [LottieFiles](https://www.lottiefiles.com) - a collection of Lottie animations
 * [LottieFiles Previewer](https://www.lottiefiles.com/preview)
 * [Third-party Lottie players](http://airbnb.io/lottie/other-platforms.html) for Xamarin, Titanium, Vue, React, Angular, etc.

## License

MIT License, see the LICENSE file for details.
