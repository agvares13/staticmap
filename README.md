About
========
Allows to get static map images.

Installation
===============
```
$ npm install staticmap
```

Example
==========
```js
const staticmap = require("staticmap");

staticmap.getMap(staticmap.png({ width: 500, height: 500 }), 45.4724, -73.4520, 12)
  .then((image) => {
    image.save('out1.png');
  })
  .catch((err) => {
    console.log(err);
  });

staticmap.getBox(staticmap.png({ width: 500, height: 500 }), 48.436034, 10.684891, 48.295985, 11.042633)
  .then((image) => {
    image.save('out2.png');
  })
  .catch((err) => {
    console.log(err);
  });
```

Documentation
================

### staticmap.defaults
Object containing default values of `tileUrl` and `tileSize`.

```js
{
  tileUrl: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileSize: 256
}
```


### staticmap.create(opts)
Creates new instance of Map class using `opts` that is an object containing `tileUrl` and `tileSize` and `proxy` properties.


### staticmap.png(opts)
Creates instance of `Image` class that is wrapper for `require('node-png').PNG` class. You can provide a custom wrapper for an arbitrary image manipulation library.

Custom `Image` class must contain the following members:

#### Property: width
Width of image in pixels.

#### Property: height
Height of image in pixels.

#### Method: drawImage(data, x, y, callback)
Helper for image manipulation, draws image represented by raw `data` to current image (at `x`, `y`).


## Class: Map
Instance of Map class that is used to fetch tiles and to draw them in image.


### Method: getMap(image, lat, lon, zoom, [callback])
Fetches tiles and draws map with center at `lat`, `lon` coordinates. The zoom value of `zoom` is used to get appropriate tiles.

Optional `callback` gets two arguments `(err, image)`.


### Method: getBox(image, latNW, lonNW, latSE, lonSE, [callback])


### Property: tileUrl


### Property: tileSize


## Class: Image
Default class representing resulting images. `Image` is wrapper for `require('node-png').PNG` class.


### Method: drawImage(data, x, y, callback)

### Method: drawLine(x1, y1, x2, y2, color)

### Method: pack()
Starts converting data to PNG file Stream.


### Method: lonToX(lon)
Function is being added to object automatically. Allows to translate a `longitude` to `x` coordinate on this image.


### Method: latToY(lat)
Function is being added to object automatically. Allows to translate a `latitude` to `y` coordinate on this image.


### Property: width


### Property: height


### Property: png
Instance of `require('node-png').PNG` class.

License
=========

The MIT License
