'use strict';

const axios = require('axios');
const debug = require('debug')('staticmap');
const defaults = require('./defaults');
const Image = require('./image');

function lonToX(lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function latToY(lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
}

function lonToImageX(tileSize, centerX, zoom, lon) {
  return Math.floor((this.width / 2) - tileSize * (centerX - lonToX(lon, zoom)));
}

function latToImageY(tileSize, centerY, zoom, lat) {
  return Math.floor((this.height / 2) - tileSize * (centerY - latToY(lat, zoom)));
}

function fetchTile(map, url, remainingAttempts, callback) {
  axios.get(url, {responseType: 'arraybuffer', proxy: map.opts.proxy})
    .then((res) => {
      callback(null, res.data);
    }) 
    .catch((res) => {
      if (res instanceof Error) {
        debug(res);
        if (--remainingAttempts > 0) {
          fetchTile(map, url, remainingAttempts, callback);
        } else {
          callback(res);
        }
      } else {
        debug(res.status);
        callback(new Error(res.status));
      }
    });
}

function getTile(map, url) {
  return new Promise((resolve, reject) => {
    fetchTile(map, url, 30, (err, tile) => {
      if (err) {
        debug(err);
        return reject(err);
      }
      resolve(tile);
    });
  });
}

function getMap(image, lat, lon, zoom, callback) {
  const cX = lonToX(lon, zoom);
  const cY = latToY(lat, zoom);

  image.lonToX = lonToImageX.bind(image, this.tileSize, cX, zoom);
  image.latToY = latToImageY.bind(image, this.tileSize, cY, zoom);

  const startX = Math.max(0, Math.floor(cX - (image.width / this.tileSize) / 2));
  const startY = Math.max(0, Math.floor(cY - (image.height / this.tileSize) / 2));

  const maxIndex = Math.pow(2, zoom) - 1;
  const endX = Math.min(maxIndex, Math.ceil(cX + (image.width / this.tileSize) / 2));
  const endY = Math.min(maxIndex, Math.ceil(cY + (image.height / this.tileSize) / 2));

  const offsetX = -Math.floor((cX - Math.floor(cX)) * this.tileSize) +
    Math.floor(image.width / 2) + Math.floor(startX - Math.floor(cX)) * this.tileSize;
  const offsetY = -Math.floor((cY - Math.floor(cY)) * this.tileSize) +
    Math.floor(image.height / 2) + Math.floor(startY - Math.floor(cY)) * this.tileSize;

  let remains = (endX - startX) * (endY - startY);
  let received = 0;

  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      const url = this.tileUrl.replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
      getTile(this, url)
        .then((tile) => {
          const destX = (x - startX) * this.tileSize + offsetX;
          const destY = (y - startY) * this.tileSize + offsetY;

          image.drawImage(tile, destX, destY, (err) => {
            if (err) {
              debug(err);
            } else {
              received++;
            }

            if (!--remains) {
              if (received) {
                callback(null);
              } else {
                callback(err);
              }
            }
          });
        })
        .catch((err) => {
          debug(err);
          if (!--remains) {
            if (received) {
              callback(null);
            } else {
              callback(err);
            }
          }
        });
    }
  }
}

class Map {
  constructor(opts) {
    this.opts = opts || {};
  }
  
  get proxy() {
    return this.opts.proxy || {};
  }

  get tileUrl() {
    return this.opts.tileUrl || defaults.tileUrl;
  }

  get tileSize() {
    return this.opts.tileSize || defaults.tileSize;
  }

  getMap(image, lat, lon, zoom, callback) {
    return new Promise((resolve, reject) => {
      getMap.call(this, image, lat, lon, zoom, (err) => {
        if (err) {
          if (callback) {
            callback(err);
          }
          return reject(err);
        }
        if (callback) {
          callback(null, image);
        }
        resolve(image);
      });
    });
  }

  getBox(image, latNW, lonNW, latSE, lonSE, callback) {
    const minLat = Math.min(latNW, latSE);
    const maxLat = Math.max(latNW, latSE);
    const minLon = Math.min(lonNW, lonSE);
    const maxLon = Math.max(lonNW, lonSE);
    const lat = minLat + (maxLat - minLat) / 2;
    const lon = minLon + (maxLon - minLon) / 2;

    let hZoom = 18;
    let vZoom = 18;

    for (; hZoom > 0; hZoom--) {
      if (this.tileSize * Math.abs(lonToX(maxLon, hZoom) -
          lonToX(minLon, hZoom)) < image.width) {
        break;
      }
    }

    for (; vZoom > 0; vZoom--) {
      if (this.tileSize * Math.abs(latToY(maxLat, vZoom) -
          latToY(minLat, vZoom)) < image.height) {
        break;
      }
    }

    const zoom = Math.min(hZoom, vZoom);

    return this.getMap(image, lat, lon, zoom, callback);
  }
}

exports.defaults = defaults;

exports.create = (opts) => {
  return new Map(opts);
};

const map = new Map();
exports.getMap = map.getMap.bind(map);
exports.getBox = map.getBox.bind(map);

exports.png = (opts) => {
  return new Image(opts);
};
