'use strict';
 
const fs = require('fs');
const PNG = require('node-png').PNG;

class Image {
  constructor(opts) {
    this.png = new PNG(opts);
    this.width = this.png.width;
    this.height = this.png.height;
  }

  drawImage(data, x, y, callback) {
    const tile = new PNG;

    tile.parse(data, (err) => {
      if (err) {
        return callback(err);
      }

      const extraWidth = x + tile.width - this.width;
      const extraHeight = y + tile.height - this.height;

      tile.bitblt(this.png,
        x < 0 ? -x : 0,
        y < 0 ? -y : 0,
        tile.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0),
        tile.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0),
        x < 0 ? 0 : x,
        y < 0 ? 0 : y);

      callback(null);
    });
  }

  color(r,g,b,a)
  {
    return [r ? r : 0, g ? g : 0, b ? b : 0, a ? a : 255];
  }

  drawLine(x0, y0 ,x1, y1, color) {

    var dx = Math.abs(x1-x0);
    var dy = Math.abs(y1-y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx-dy;

    while(true){

      this.drawPixel(x0,y0,color);

      if ((x0==x1) && (y0==y1)) break;
      var e2 = 2*err;
      if (e2 >-dy){ err -= dy; x0  += sx; }
      if (e2 < dx){ err += dx; y0  += sy; }
    }
  }

  readPixel(png, x, y) {
    if(x < 0 || y <0 || x > png.width || y > png.height)
      return null;
  
    var idx = (png.width * y + x) << 2;
    var background = [png.data[idx], png.data[idx+1], png.data[idx+2], png.data[idx+3]];
    return background;
  }

  blend(background, color) {
    var srcAlpha = color[3] / 255.0;
  
    return [
      Math.round(color[0] * srcAlpha + background[0] * (1 - srcAlpha)),
      Math.round(color[1] * srcAlpha + background[1] * (1 - srcAlpha)),
      Math.round(color[2] * srcAlpha + background[2] * (1 - srcAlpha)),
      background[3]
    ];
  }

  drawPixel(x, y, color) {

    if(x < 0 || y <0 || x > this.width || y > this.height)
      return;

    var background = this.readPixel(this.png,x,y);

    // Blending with color
    var blended = this.blend(background, color);

    // Updating data
    var idx = (this.width * y + x) << 2;
    this.png.data[idx] = blended[0];
    this.png.data[idx+1] = blended[1];
    this.png.data[idx+2] = blended[2];
    this.png.data[idx+3] = blended[3];

  }

  

  pack() {
    return this.png.pack();
  }

  save(fileName) {
    return this.png.pack().pipe(fs.createWriteStream(fileName));
  }
};

module.exports = Image;
