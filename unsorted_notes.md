The Bravura font could not be found once at a time where I expected it to be present. It is pulled in the install script. Keep an eye on this.

Happened again. This time after adding a dependency. During that npm also complained that file-saver was not in the dependency list even though it was.

<hr />

Add tooltips to buttons.

<hr />

Turning the camera by 180° makes the coordinate system confusing as the x axis is mirrored.

<hr />

Two audio sources make jarring sounds in Firefox. Use something like Howler.js https://www.npmjs.com/package/howle

<hr />

Exposing methods of child components is not well supported by TypeScript. See
* https://github.com/typescript-cheatsheets/react/issues/106
* https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks/#useimperativehandle