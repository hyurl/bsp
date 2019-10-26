(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["bsp"] = factory();
	else
		root["bsp"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const sprintf = __webpack_require__(/*! sprintf-js */ "./node_modules/sprintf-js/src/sprintf.js").sprintf;
const concatTypedArray = __webpack_require__(/*! concat-typed-array */ "./node_modules/concat-typed-array/lib/index.js");
const { isBufferLike } = __webpack_require__(/*! is-like */ "./node_modules/is-like/index.js");

const hasBuffer = typeof Buffer === "function";
const TypedArray = hasBuffer ? Buffer : Uint8Array;

/** @type {TextEncoder} */
let encoder;
/** @type {TextDecoder} */
let decoder;

if (typeof TextEncoder === "function") {
    encoder = new TextEncoder();
}

if (typeof TextDecoder === "function") {
    decoder = new TextDecoder("utf8");
}

/**
 * @param {string} text 
 * @returns {Buffer|Uint8Array}
 */
function encodeText(text) {
    if (hasBuffer) {
        return Buffer.from(text);
    } else if (encoder) {
        return encoder.encode(text);
    } else {
        throw new Error("No implementation of text encoder was found");
    }
}

/**
 * @param {Buffer|Uint8Array} buf 
 * @returns {string}
 */
function decodeText(buf) {
    if (hasBuffer) {
        return Buffer.from(buf).toString("utf8");
    } else if (decoder) {
        return decoder.decode(buf);
    } else {
        throw new Error("No implementation of text decoder was found");
    }
}

/**
 * @param {Buffer[] | Uint8Array[]} bufs
 * @returns {Buffer|Uint8Array}
 */
function concatBuffers(bufs) {
    return concatTypedArray(TypedArray, ...bufs);
}

function encode(...data) {
    let buf = TypedArray.from([]);

    for (let payload of data) {
        let type = NaN;

        switch (typeof payload) {
            case "string":
                type = 1;
                payload = encodeText(payload);
                break;

            case "number":
                type = 2;
                payload = encodeText(payload.toString());
                break;

            case "bigint":
                type = 3;
                payload = encodeText(payload.toString());
                break;

            case "boolean":
                type = 4;
                payload = TypedArray.from([Number(payload)]);
                break;

            case "object":
                if (null === payload) {
                    type = 0;
                    payload = TypedArray.from([]);
                } else if (isBufferLike(payload)) {
                    type = 6; // raw data
                } else {
                    type = 5;
                    payload = encodeText(JSON.stringify(payload));
                }
                break;
        }

        let head = [type];
        let len = payload.byteLength;

        if (len <= 255) {
            head.push(1, len);
        } else if (len <= 65535) {
            head.push(2);

            for (let i = 0, bin = sprintf("%016b", len); i < 16;) {
                head.push(parseInt(bin.slice(i, i += 8), 2));
            }
        } else {
            head.push(3);

            for (let i = 0, bin = sprintf("%064b", len); i < 64;) {
                head.push(parseInt(bin.slice(i, i += 8), 2));
            }
        }

        buf = concatBuffers([buf, TypedArray.from(head), payload]);
    }

    return buf;
}

/**
 * @param {Buffer|Uint8Array} buf
 */
function parsePayloadInfo(buf) {
    if (buf.byteLength < 3) {
        return null; // header frame
    }

    let [type, lenType] = buf;
    let offset = [0, 3, 4, 10][lenType];
    let length = -1;
    let bin = "";

    if (type > 6 || lenType > 3) {
        return false; // malformed/unencoded data
    }

    if (buf.byteLength < offset) {
        return null;  // header frame
    }

    switch (lenType) {
        case 1:
            length = buf[2];
            break;

        case 2:
            for (let i = 2; i < 4; i++) {
                bin += sprintf("%08b", buf[i]);
            }

            length = parseInt(bin, 2);
            break;

        case 3:
            for (let i = 2; i < 10; i++) {
                bin += sprintf("%08b", buf[i]);
            }

            length = parseInt(bin, 2);
            break;
    }

    return { type, offset, length };
}

/**
 * @param {[number, number, Buffer|Uint8Array]} temp 
 */
function isHeaderTemp(temp) {
    return temp.length === 3
        && temp[0] === undefined
        && temp[1] === undefined
        && temp[2] instanceof Uint8Array;
}

/**
 * @param {Buffer|Uint8Array} buf 
 * @param {[number, number, Buffer|Uint8Array]} temp 
 */
function fillTemp(buf, temp) {
    if (isHeaderTemp(temp)) {
        buf = concatBuffers([temp[2], buf]);
    }

    let info = parsePayloadInfo(buf);

    if (info === false) {
        return; // malformed/unencoded data
    } else if (info === null) {
        temp[0] = temp[1] = void 0;
        temp[2] = buf;
    } else {
        let { type, length, offset } = info;

        if (offset !== 0) {
            temp[0] = type;
            temp[1] = length;
            temp[2] = buf.slice(offset);
        }
    }
}

/**
 * @param {Buffer|Uint8Array} buf 
 * @param {[number, number, Buffer|Uint8Array]} temp
 * @returns {IterableIterator<any>}
 */
function* decode(buf, temp) {
    // put the buffer into the temp
    if (temp.length === 0 || isHeaderTemp(temp)) {
        fillTemp(buf, temp);
    } else if (temp.length === 3) {
        temp[2] = concatBuffers([temp[2], buf]);
    }

    // scan the temp and yield any parsed data
    while (temp.length === 3 && temp[2].byteLength >= temp[1]) {
        let [type, length, buf] = temp;
        let payload = buf.slice(0, length);

        buf = buf.slice(length);

        switch (type) {
            case 0: // null
                yield null;
                break;

            case 1:
                yield decodeText(payload);
                break;

            case 2:
                yield Number(decodeText(payload));
                break;

            case 3:
                yield BigInt(decodeText(payload));
                break;

            case 4:
                yield Boolean(payload[0]);
                break;

            case 5:
                yield JSON.parse(decodeText(payload));
                break;

            case 6:
                yield payload;
                break;
        }

        if (buf.byteLength > 0) {
            fillTemp(buf, temp);
        } else {
            temp.splice(0, 3); // clean temp
        }
    }
}

function wrap(stream) {
    let _write = stream.write.bind(stream);
    let _on = stream.on.bind(stream);
    let _once = stream.once.bind(stream);
    let _prepend = stream.prependListener.bind(stream);
    let _prependOnce = stream.prependOnceListener.bind(stream);
    let addListener = (fn, event, listener) => {
        if (event === "data") {
            let temp = [];
            let _listener = (buf) => {
                for (let data of decode(buf, temp)) {
                    listener(data);
                }
            };
            return fn("data", _listener);
        } else {
            return fn(event, listener);
        }
    };

    stream.write = function write(chunk, encoding, callback) {
        return _write(encode(chunk), encoding, callback);
    };

    stream.on = stream.addListener = function on(event, listener) {
        return addListener(_on, event, listener);
    };

    stream.once = function once(event, listener) {
        return addListener(_once, event, listener);
    };

    stream.prependListener = function prependListener(event, listener) {
        return addListener(_prepend, event, listener);
    };

    stream.prependOnceListener = function prependOnceListener(event, listener) {
        return addListener(_prependOnce, event, listener);
    };

    return stream;
}

exports.encode = encode;
exports.decode = decode;
exports.wrap = wrap;

/***/ }),

/***/ "./node_modules/concat-typed-array/lib/concat.js":
/*!*******************************************************!*\
  !*** ./node_modules/concat-typed-array/lib/concat.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (ResultConstructor) {
  var totalLength = 0;

  for (var _len = arguments.length, arrays = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    arrays[_key - 1] = arguments[_key];
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = arrays[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var arr = _step.value;

      totalLength += arr.length;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var result = new ResultConstructor(totalLength);
  var offset = 0;
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = arrays[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _arr = _step2.value;

      result.set(_arr, offset);
      offset += _arr.length;
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return result;
};

/***/ }),

/***/ "./node_modules/concat-typed-array/lib/index.js":
/*!******************************************************!*\
  !*** ./node_modules/concat-typed-array/lib/index.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _concat = __webpack_require__(/*! ./concat */ "./node_modules/concat-typed-array/lib/concat.js");

var _concat2 = _interopRequireDefault(_concat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = _concat2.default;

/***/ }),

/***/ "./node_modules/is-like/index.js":
/*!***************************************!*\
  !*** ./node_modules/is-like/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

/**
 * @param {any} obj 
 * @param {Array<string|symbol>} props 
 */
function isObjectWith(obj, props) {
    let isObj = typeof obj === "object" && obj !== null;
    return isObj && props.every(p => p in obj);
}

function isArrayLike(obj) {
    return isObjectWith(obj, ["length"]) || (typeof obj === "string");
}

function isCollectionLike(obj, excludeWeakOnes = false) {
    return (isObjectWith(obj, ["size"])
        && typeof obj[Symbol.iterator] === "function")
        || (!excludeWeakOnes &&
            (obj instanceof WeakMap || obj instanceof WeakSet));
}

function isBufferLike(obj) {
    return isObjectWith(obj, ["byteLength"])
        && typeof obj.slice === "function";
}

function isErrorLike(obj) {
    return isObjectWith(obj, ["name", "message", "stack"]);
}

function isPromiseLike(obj) {
    return isObjectWith(obj, [])
        && typeof obj.then === "function";
}

exports.isArrayLike = isArrayLike;
exports.isCollectionLike = isCollectionLike;
exports.isBufferLike = isBufferLike;
exports.isErrorLike = isErrorLike;
exports.isPromiseLike = isPromiseLike;

/***/ }),

/***/ "./node_modules/sprintf-js/src/sprintf.js":
/*!************************************************!*\
  !*** ./node_modules/sprintf-js/src/sprintf.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/* global window, exports, define */

!function() {
    'use strict'

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /[bcdiefguxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[+-]/
    }

    function sprintf(key) {
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments)
    }

    function vsprintf(fmt, argv) {
        return sprintf.apply(null, [fmt].concat(argv || []))
    }

    function sprintf_format(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign
        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i]
            }
            else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i] // convenience purposes only
                if (ph.keys) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < ph.keys.length; k++) {
                        if (arg == undefined) {
                            throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k-1]))
                        }
                        arg = arg[ph.keys[k]]
                    }
                }
                else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                    arg = arg()
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
                }

                if (re.number.test(ph.type)) {
                    is_positive = arg >= 0
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2)
                        break
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10))
                        break
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10)
                        break
                    case 'j':
                        arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0)
                        break
                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential()
                        break
                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg)
                        break
                    case 'g':
                        arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg)
                        break
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8)
                        break
                    case 's':
                        arg = String(arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 't':
                        arg = String(!!arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'T':
                        arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0
                        break
                    case 'v':
                        arg = arg.valueOf()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'x':
                        arg = (parseInt(arg, 10) >>> 0).toString(16)
                        break
                    case 'X':
                        arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase()
                        break
                }
                if (re.json.test(ph.type)) {
                    output += arg
                }
                else {
                    if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                        sign = is_positive ? '+' : '-'
                        arg = arg.toString().replace(re.sign, '')
                    }
                    else {
                        sign = ''
                    }
                    pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' '
                    pad_length = ph.width - (sign + arg).length
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : ''
                    output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg)
                }
            }
        }
        return output
    }

    var sprintf_cache = Object.create(null)

    function sprintf_parse(fmt) {
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt]
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0])
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%')
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1])
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else {
                                throw new SyntaxError('[sprintf] failed to parse named argument key')
                            }
                        }
                    }
                    else {
                        throw new SyntaxError('[sprintf] failed to parse named argument key')
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
                }

                parse_tree.push(
                    {
                        placeholder: match[0],
                        param_no:    match[1],
                        keys:        match[2],
                        sign:        match[3],
                        pad_char:    match[4],
                        align:       match[5],
                        width:       match[6],
                        precision:   match[7],
                        type:        match[8]
                    }
                )
            }
            else {
                throw new SyntaxError('[sprintf] unexpected placeholder')
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return sprintf_cache[fmt] = parse_tree
    }

    /**
     * export to either browser or node.js
     */
    /* eslint-disable quote-props */
    if (true) {
        exports['sprintf'] = sprintf
        exports['vsprintf'] = vsprintf
    }
    if (typeof window !== 'undefined') {
        window['sprintf'] = sprintf
        window['vsprintf'] = vsprintf

        if (true) {
            !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
                return {
                    'sprintf': sprintf,
                    'vsprintf': vsprintf
                }
            }).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
        }
    }
    /* eslint-enable quote-props */
}(); // eslint-disable-line


/***/ })

/******/ });
});
//# sourceMappingURL=bsp.js.map