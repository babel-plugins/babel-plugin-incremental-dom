var _hasOwn = Object.prototype.hasOwnProperty;

var _forOwn = function _forOwn(object, iterator) {
  for (var prop in object) {
    if (_hasOwn.call(object, prop)) iterator(object[prop], prop);
  }
};

var _renderArbitrary = function _renderArbitrary(child) {
  var type = typeof child;

  if (type === "number" || type === "string" || child && child instanceof String) {
    text(child);
  } else if (type === "function" && child.__jsxDOMWrapper) {
    child();
  } else if (Array.isArray(child)) {
    child.forEach(_renderArbitrary);
  } else if (String(child) === "[object Object]") {
    _forOwn(child, _renderArbitrary);
  }
};

var _jsxWrapper = function _jsxWrapper(func, args) {
  var wrapper = args ? function wrapper() {
    return func.apply(this, args);
  } : func;
  wrapper.__jsxDOMWrapper = true;
  return wrapper;
};

function render() {
  var _lis$map = lis.map(function (li) {
    return _jsxWrapper(function () {
      return elementVoid("li");
    });
  });
  elementOpen("root");
  elementOpen("ul");

  _renderArbitrary(_lis$map);

  elementClose("ul");
  return elementClose("root");
}