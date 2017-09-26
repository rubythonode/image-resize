(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ResizeImage = factory());
}(this, (function () { 'use strict';

/**
 * Canvas
 *
 * @param {Number} width
 * @param {Number} height
 * @param {String} bgColor
 */
function Canvas() {
  var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 320;
  var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 240;
  var bgColor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '#ffffff';


  this.el = document.createElement('canvas');
  this.ctx = this.el.getContext('2d');

  this.el.width = width;
  this.el.height = height;

  this.ctx.fillStyle = bgColor;
  this.ctx.fillRect(0, 0, width, height);
}

/**
 * load image
 *
 * @param {String} src
 * @return {Promise}
 */
function loadImage(src) {
	return new Promise(function (resolve, reject) {
		if (src) {
			var image = new Image();

			image.onload = function (e) {
				resolve(image);
			};
			image.onerror = function (e) {
				reject(e);
			};

			image.setAttribute('crossOrigin', 'anonymous');
			image.src = src;
		} else {
			reject(new Error('no src'));
		}
	});
}

var base = {

	quality: .75,
	format: 'jpg', // png,jpg
	outputType: 'base64', // base64, canvas, blob
	width: 320,
	height: null,
	reSample: 2,
	bgColor: '#ffffff',
	saveExif: false

};

// default options
var defaultOptions = {
	canvas: null,
	reSample: 2,
	width: 320,
	height: 240,
	cx: 0,
	cy: 0,
	cw: 0,
	ch: 0,
	dx: 0,
	dy: 0,
	dw: 0,
	dh: 0,
	bgColor: '#ffffff'
};

/**
 * Resize canvas
 *
 * @param {Object} options
 * @param {Number} count
 * @param {HTMLCanvasElement} parentCanvas
 * @return {Promise}
 */
function resize(options, count, parentCanvas) {
	return new Promise(function (resolve) {
		function func(count, parentCanvas) {
			var pow = Math.pow(2, count);
			var canvasForResize = new Canvas(options.width * pow, options.height * pow, options.bgColor);

			canvasForResize.ctx.drawImage(parentCanvas, 0, 0, parentCanvas.width * 0.5, parentCanvas.height * 0.5);

			if (count > 0) {
				func(count - 1, canvasForResize.el);
			} else {
				resolve(canvasForResize.el);
			}
		}

		func(count - 1, parentCanvas);
	});
}

/**
 * Resize image
 *
 * @param {Object} options
 * @return {Promise}
 */
function resizeImage(options) {
	// assign options
	options = Object.assign({}, defaultOptions, options);

	// set resampling count
	options.reSample = Math.min(4, options.reSample);
	options.reSample = Math.max(0, options.reSample);
	var reSamplingCount = Math.pow(2, options.reSample);

	return new Promise(function (resolve, reject) {
		try {
			var canvas = new Canvas(options.width * reSamplingCount, options.height * reSamplingCount, options.bgColor);

			canvas.ctx.drawImage(options.canvas, options.cx, options.cy, options.cw, options.ch, options.dx * reSamplingCount, options.dy * reSamplingCount, options.dw * reSamplingCount, options.dh * reSamplingCount);

			if (options.reSample > 0) {
				resize(options, options.reSample, canvas.el).then(resolve);
			} else {
				resolve(canvas.el);
			}
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * type - base64
 *
 * @param {HTMLCanvasElement} canvas
 * @param {String} format
 * @param {Number} quality
 * @return {Promise}
 */
function base64(canvas) {
	var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'image/jpeg';
	var quality = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : .75;

	// set format
	format = getFormat(format);

	return new Promise(function (resolve, reject) {
		try {
			var uri = canvas.toDataURL(format, quality);
			resolve(uri);
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * type - blob
 *
 * @param {HTMLCanvasElement} canvas
 * @param {String} format
 * @param {Number} quality
 * @return {Promise}
 */
function blob(canvas) {
	var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'image/jpeg';
	var quality = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : .75;

	// set format
	format = getFormat(format);

	return new Promise(function (resolve, reject) {
		try {
			var uri = canvas.toDataURL(format, quality);
			var _blob = dataURItoBlob(uri);
			resolve(_blob);
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * Get format
 *
 * @param {String} str
 * @return {String}
 */
function getFormat(str) {
	var format = null;

	switch (str) {
		case 'jpg':
		case 'jpeg':
			format = 'image/jpeg';
			break;
		case 'png':
			format = 'image/png';
			break;
		default:
			format = str;
			break;
	}

	return format;
}

/**
 * Data uri to Blob
 * source : https://gist.github.com/davoclavo/4424731
 *
 * @param {String} dataURI
 * @return {Blob}
 */
function dataURItoBlob(dataURI) {
	// convert base64 to raw binary data held in a string
	var byteString = atob(dataURI.split(',')[1]);

	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	// write the bytes of the string to an ArrayBuffer
	var arrayBuffer = new ArrayBuffer(byteString.length);
	var _ia = new Uint8Array(arrayBuffer);
	for (var i = 0; i < byteString.length; i++) {
		_ia[i] = byteString.charCodeAt(i);
	}

	var dataView = new DataView(arrayBuffer);
	var blob = new Blob([dataView], { type: mimeString });

	return blob;
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

/**
 * Resize image
 *
 * @param {Object} getOptions
 */
function ResizeImage(getOptions) {

	this.options = checkOptions(base, getOptions);

	/**
  * FUNCTION AREA
  */

	/**
  * Check options
  *
  * @param {Object} original
  * @param {Object} target
  */
	function checkOptions() {
		var original = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
		var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		var result = {};

		Object.keys(original).forEach(function (key) {
			result[key] = target[key] || original[key];
		});

		result.width = Number(result.width);
		result.height = Number(result.height);
		result.quality = Number(result.quality);
		result.reSample = Number(result.reSample);

		return result;
	}

	/**
  * Image source to canvas
  * 이미지 주소로 캔버스로 변환
  *
  * @param {String} src
  * @param {Object} options
  * @return {Promise}
  */
	function srcToCanvas(src, options) {
		var canvas = null;
		return new Promise(function (resolve, reject) {
			loadImage(src).then(
			// resolve
			function (img) {
				// TODO : exif 데이터 가져오기
				canvas = new Canvas(img.width, img.height, options.bgColor);
				canvas.ctx.drawImage(img, 0, 0);
				resolve(canvas.el);
			},
			// reject
			function (error) {
				reject(error);
			});
		});
	}

	/**
  * Upload to image
  * 첨부로 가져온 이미지를 캔버스로 변환
  *
  * @param {HTMLElement} el
  * @param {Object} options
  * @return {Promise}
  */
	function formToCanvas(el, options) {
		var canvas = null;
		return new Promise(function (resolve, reject) {
			function error(e) {
				reject(e);
			}

			var reader = new FileReader();
			reader.onload = function (e) {
				var img = new Image();
				img.onload = function () {
					// TODO : exif 데이터 가져오기
					canvas = new Canvas(img.width, img.height, options.bgColor);
					canvas.ctx.drawImage(img, 0, 0);
					resolve(canvas.el);
				};
				img.onerror = error;
				img.src = e.target.result;
			};
			reader.onerror = error;
			reader.readAsDataURL(el.files[0]);
		});
	}

	/**
  * METHOD AREA
  */

	/**
  * Play convert
  * 이미지 변환 실행
  * 이미지 주소로 캔버스로 변환 -> 캔버스를 리사이즈 -> 이미지로 컨버트
  *
  * @param {String|HTMLElement} src
  * @return {Promise}
  */
	this.play = function (src) {
		var _this = this;

		return new Promise(function (resolve, reject) {
			_this.get(src).then(function (canvas) {
				return _this.resize(canvas);
			}).then(function (canvas) {
				return _this.output(canvas);
			}).then(function (result) {
				return resolve(result);
			}).catch(function (error) {
				return reject(error);
			});
		});
	};

	/**
  * Get source
  *
  * @param {String|HTMLElement} src
  * @param {Object} options
  * @return {Promise}
  */
	this.get = function (src, options) {
		options = options ? checkOptions(this.options, options) : this.options;

		return new Promise(function (resolve, reject) {
			if (typeof src === 'string') {
				// image url
				resolve(srcToCanvas(src, options));
			} else if ((typeof src === 'undefined' ? 'undefined' : _typeof(src)) === 'object') {
				// input[type=file] form
				resolve(formToCanvas(src, options));
			} else {
				reject(new Error('Not found source'));
			}
		});
	};

	/**
  * Resize canvas
  *
  * @param {HTMLCanvasElement} canvas
  * @param {Object} options
  * @return {Promise}
  */
	this.resize = function (canvas, options) {
		options = options ? checkOptions(this.options, options) : this.options;

		return new Promise(function (resolve, reject) {
			// get size
			var size = getSize(canvas.width, canvas.height, options.width, options.height);

			// resize image
			resizeImage({
				canvas: canvas,
				reSample: options.reSample,
				width: size.width,
				height: size.height,
				cx: 0,
				cy: 0,
				cw: canvas.width,
				ch: canvas.height,
				dx: 0,
				dy: 0,
				dw: size.width,
				dh: size.height,
				bgColor: options.bgColor
			}).then(resolve).catch(reject);
		});
	};

	/**
  * Output data
  *
  * @param {HTMLCanvasElement} canvas
  * @param {Object} options
  * @return {Promise}
  */
	this.output = function (canvas, options) {
		options = !!options ? checkOptions(this.options, options) : this.options;

		return new Promise(function (resolve, reject) {
			switch (options.outputType) {
				case 'base64':
					base64(canvas, options.format, options.quality).then(resolve).catch(reject);
					break;
				case 'blob':
					blob(canvas, options.format, options.quality).then(resolve).catch(reject);
					break;
				case 'canvas':
				default:
					resolve(canvas);
					break;
			}
		});
	};

	/**
  * Update options
  *
  * @param {Object} value
  * @return {ResizeImage}
  */
	this.updateOptions = function (value) {
		this.options = checkOptions(this.options, value);
		return this;
	};
}

/**
 * Get image size
 *
 * @param {Number} width original width
 * @param {Number} height original height
 * @param {Number} targetWidth target width
 * @param {Number} targetHeight target height
 * @return {Object}
 */
function getSize(width, height, targetWidth, targetHeight) {
	var w = width;
	var h = height;

	if (targetWidth && targetHeight) {
		if (targetWidth > targetHeight) {
			targetHeight = null;
		} else {
			targetWidth = null;
		}
	}

	if (targetWidth) {
		w = targetWidth;
		h = height * (targetWidth / width);
	} else if (targetHeight) {
		w = width * (targetHeight / height);
		h = targetHeight;
	}

	return {
		width: parseInt(w),
		height: parseInt(h)
	};
}

return ResizeImage;

})));
//# sourceMappingURL=ResizeImage.js.map
