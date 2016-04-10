'use strict';

const fs = require('fs');
const PNG = require('node-png').PNG;
const debug = require('debug')('staticmap');

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

      if (tile.width !== this.tileSize || tile.height !== this.tileSize) {
        debug(`incorrect tile size: ${tile.width}x${tile.height}`);
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

  pack() {
    return this.png.pack();
  }

  save(fileName) {
    return this.png.pack().pipe(fs.createWriteStream(fileName));
  }

  lonToX(lon) {
    return Math.floor((this.width / 2) -
      this.tileSize * (this.centerX - this._lonToX(lon, this.zoom)));
  }

  latToY(lat) {
    return Math.floor((this.height / 2) -
      this.tileSize * (this.centerY - this._latToY(lat, this.zoom)));
  }
};

module.exports = Image;
