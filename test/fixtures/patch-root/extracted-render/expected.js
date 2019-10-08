function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _incrementalDom = require("incremental-dom");

var _hasOwn = Object.prototype.hasOwnProperty;

var _renderArbitrary = function _renderArbitrary(child) {
  var type = _typeof(child);

  if (type === "number" || type === "string" || type === "object" && child instanceof String) {
    (0, _incrementalDom.text)(child);
  } else if (Array.isArray(child)) {
    for (var i = 0; i < child.length; i++) {
      _renderArbitrary(child[i]);
    }
  } else if (type === "object") {
    if (child.__jsxDOMWrapper) {
      var func = child.func,
          args = child.args;

      if (args) {
        func.apply(this, args);
      } else {
        func();
      }
    } else if (String(child) === "[object Object]") {
      for (var prop in child) {
        if (_hasOwn.call(child, i)) _renderArbitrary(child[i]);
      }
    }
  }
};

var _jsxWrapper = function _jsxWrapper(func, args) {
  return {
    __jsxDOMWrapper: true,
    func: func,
    args: args
  };
};

var _li$wrapper = function _li$wrapper() {
  (0, _incrementalDom.elementOpen)("li");
  (0, _incrementalDom.text)("x.text");
  return (0, _incrementalDom.elementClose)("li");
};

function render(items) {
  (0, _incrementalDom.elementOpen)("div");

  _renderArbitrary(items.map(function (x) {
    return _jsxWrapper(_li$wrapper);
  }));

  return (0, _incrementalDom.elementClose)("div");
}

(0, _incrementalDom.patch)(container, render, items);