function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _hasOwn = Object.prototype.hasOwnProperty;

var _renderArbitrary = function _renderArbitrary(child) {
  var type = _typeof(child);

  if (type === "number" || type === "string" || type === "object" && child instanceof String) {
    text(child);
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

var _input$statics = ["type", "text", "id", "testInput"],
    _div$wrapper = function _div$wrapper() {
  elementOpen("div");
  elementVoid("input", "__uuid__0__", _input$statics);
  return elementClose("div");
},
    _div$statics = ["id", "app"],
    _input$statics2 = ["type", "text", "id", "testInput"],
    _div$statics2 = ["id", "app"],
    _div$statics3 = ["id", "app"],
    _div$statics4 = ["id", "app"];

function renderMain() {
  var renderInput = function renderInput() {
    return _jsxWrapper(_div$wrapper);
  };

  elementOpen("div", "__uuid__1__", _div$statics);

  _renderArbitrary(renderInput());

  return elementClose("div");
}

var renderInput = function renderInput() {
  elementOpen("div");
  elementVoid("input", "__uuid__2__", _input$statics2);
  return elementClose("div");
};

function renderMain2() {
  elementOpen("div", "__uuid__3__", _div$statics2);

  _renderArbitrary(renderInput());

  return elementClose("div");
} // - - - - - - -


function renderMain3(flag) {
  if (flag) {
    elementOpen("div", "__uuid__4__", _div$statics3);
    return elementClose("div");
  }

  elementOpen("div", "__uuid__5__", _div$statics4);

  _renderArbitrary(renderInput());

  return elementClose("div");
}