# babel-plugin-transform-incremental-dom [![Build Status](https://travis-ci.org/jridgewell/babel-plugin-transform-incremental-dom.svg?branch=master)](https://travis-ci.org/jridgewell/babel-plugin-transform-incremental-dom)

Turn JSX into [Incremental DOM](http://google.github.io/incremental-dom/).

## Example

## Foobar

**In**

```javascript
export default function render(data) {
    var header = data.conditional ? <div /> : null;
    var collection = data.items.map((item) => {
        return <li key={item.id} class={item.className}>{item.name}</li>;
    });

    return <div id="container">
        {header}
        <ul>{collection}</ul>
        <p {...data.props}>Some features</p>
    </div>;
}
```

**Out** (default, unoptimized options)

```javascript
const _li$statics = ["key", ""];
const _li$wrapper = function (_item$id, _item$className, _item$name) {
    _li$statics[1] = _item$id;
    elementOpen("li", _item$id, _li$statics, "class", _item$className);
      _renderArbitrary(_item$name);
    return elementClose("li");
};

const _header$wrapper = function () {
    return elementVoid("div");
};

const _div$statics = ["id", "container"];
function render(data) {
    var header = data.conditional ? _jsxWrapper(_header$wrapper) : null;
    var collection = data.items.map(item => {
        return _jsxWrapper(_li$wrapper, [item.id, item.className, item.name]);
    });

    elementOpen("div", "ab4a1d60-7353-4d98-b1f5-2682f1bc2b3c", _div$statics);

      _renderArbitrary(header);

      elementOpen("ul");
        _renderArbitrary(collection);
      elementClose("ul");

      elementOpenStart("p");
      _spreadAttribute(data.props);
      elementOpenEnd("p");
        text("Some features");
      elementClose("p");

    return elementClose("div");
}


// Helpers
// -------

var _jsxWrapper = function _jsxWrapper(func, args) {
    return {
        __jsxDOMWrapper: true,
        func: func,
        args: args
    };
};

var _flipAttr = function _flipAttr(value, name) {
    attr(name, value);
};

var _spreadAttribute = function _spreadAttribute(spread) {
    _forOwn(spread, _flipAttr);
};

var _hasOwn = Object.prototype.hasOwnProperty;

var _forOwn = function _forOwn(object, iterator) {
    for (var prop in object) if (_hasOwn.call(object, prop)) iterator(object[prop], prop);
};

var _renderArbitrary = function _renderArbitrary(child) {
    var type = typeof child;

    if (type === "number" || type === "string" || type === "object" && child instanceof String) {
        text(child);
    } else if (Array.isArray(child)) {
        child.forEach(_renderArbitrary);
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
            _forOwn(child, _renderArbitrary);
        }
    }
};

```

## Installation

```sh
$ npm install babel-plugin-transform-incremental-dom
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "presets": ["es2015"],
  "plugins": ["transform-incremental-dom"]
}
```

Any of the [configuration options](#options) may also be passed.

### Via CLI

```sh
$ babel --plugins transform-incremental-dom script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  "presets": ["es2015"],
  "plugins": ["transform-incremental-dom"],
});
```

Any of the [configuration options](#options) may also be passed.

### Options

#### Require Statics Key

Incremental DOM [recommends](http://google.github.io/incremental-dom/#rendering-dom/statics-array)
only using static attribute arrays when a `key` is specified. For that
reason this plugin will automatically generate a UUID key if there is
not one and there are static attributes.

Alternatively, you may disable the automatic generation. In this case,
static attributes will be deoptimized into the dynamic attributes list.

```javascript
// Disabled (default)
var _statics = ["key", "key", "href", "http://key/specified"];
var _statics2 = ["href", "http://example.com"];
var _statics3 = ["href", "http://other.com"];

function render() {
  elementVoid("a", "key", _statics);
  if (condition)
    elementVoid("a", "8ad02822-f391-48fb-a277-8065f7f92a99", _statics2);
  } else {
    elementVoid("a", "adbe4414-e6ad-41c0-aae2-1ca578653119", _statics3);
  }
}
```

```javascript
// Enabled
var _statics = ["key", "key", "href", "http://key/specified"];

function render(condition) {
  elementVoid("a", "key", _statics);
  if (condition)
    elementVoid("a", null, null, "href", "http://example.com");
  } else {
    elementVoid("a", null, null, "href", "http://other.com");
  }
}
```

To do this, simply add the `requireStaticsKey` option to the Incremental DOM
plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "requireStaticsKey": true
    }
  ]]
}
```

#### UUID Prefix

Together with automatic UUID generation, you can specify a UUID "prefix"
that will allow for shorter automatic keys. You must ensure that this
prefix will not conflict with any other value you use as a key.

When using the UUID prefix, a simple counter is used instead of creating
a true UUID.

```javascript
// Disabled (default)
var _statics = ["href", "http://example.com"];

function render() {
  elementVoid("a", "8ad02822-f391-48fb-a277-8065f7f92a99", _statics);
}
```

```javascript
// Enabled ("uuid-")
var _statics = ["href", "http://example.com"];

function render() {
  elementVoid("a", "uuid-1", _statics);
}
```

To do this, simply add the `uuidPrefix` option to the Incremental DOM
plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "uuidPrefix": "uuid-"
    }
  ]]
}
```

#### Namspaced Attributes

Incremental DOM supports a few Attribute Namespaces, but those are
foreign to JSX. You can enabled them with the `namespaceAttributes`
option. Note that this does not enable Namespaced Elements.

```javascript
// Enabled
function render() {
    return elementVoid("a", null, ["xml:static", true], "xlink:href", "https");
}
```

To do this, simply add the `namespaceAttributes` option to the
Incremental DOM plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "namespaceAttributes": true
    }
  ]]
}
```

#### Inline JSX Expressions

You may enable the experimental `inlineExpressions` option to attempt to
inline any variables declared outside the root JSX element. This can
save you from allocating needless closure wrappers around elements that
are only referenced inside the root element.


```javascript
// Disabled (default)
function render() {
  var header = _jsxWrapper(function () {
    return elementVoid("header");
  });
  elementOpen("body");

  _renderArbitrary(header);

  return elementClose("body");
}
```

```javascript
// Enabled
function render() {
  elementOpen("body");
  elementVoid("header");
  return elementClose("body");
}
```

To do this, simply add the `inlineExpressions` option to the Incremental DOM
plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "inlineExpressions": true
    }
  ]]
}
```

#### Fast Root

You may enable the experimental `fastRoot` option so that JSX tags
inside the root element are never wrapped inside a closure. For code
with array maps, this should significantly decrease memory usage and
increase speed.


```javascript
// Disabled (default)
function render() {
  elementOpen("ul");

  _renderArbitrary(items.map(function (item) {
    return _jsxWrapper(function (_item$name) {
      elementOpen("li");

      _renderArbitrary(_item$name);

      return elementClose("li");
    }, [item.name]);
  }));

  return elementClose("ul");
}
```

```javascript
// Enabled
function render() {
  elementOpen("ul");

  items.map(function (item) {
    elementOpen("li");

    _renderArbitrary(item.name);

    return elementClose("li");
  });

  return elementClose("ul");
}
```

To do this, simply add the `fastRoot` option to the Incremental DOM
plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "fastRoot": true
    }
  ]]
}
```


Alternatively, you may enable and disable this with inline comments:

```jsx
function render() {
    /**
     * Enable for this tree
     * @incremental-dom enable-fastRoot
     */
    return <div>{
      items.map(function(item) {
        return <li>{item.name}</li>;
      })
    }</div>;
}

/**
 * Enable for everything under this function
 * @incremental-dom enable-fastRoot
 */
function render() {
    /**
     * Disable fastroot for this tree
     * @incremental-dom disable-fastRoot
     */
    return <div>{
      items.map(function(item) {
        return <li>{item.name}</li>;
      })
    }</div>;
}
```

#### Components

You may enable the experimental `components` option so that JSX tags
that start with an upper case letter are passed as a reference to
incremental DOM calls, instead of as a string. This can be useful when
your code implements components through these kind of calls, though
that's not done by incremental DOM automatically. Note that this will
break unless you have code to handle it.


```javascript
// Disabled (default)
function render() {
  elementVoid("MyComponent");
}
```

```javascript
// Enabled
function render() {
  elementVoid(MyComponent);
}
```

To do this, simply add the `components` option to the Incremental DOM
plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "components": true
    }
  ]]
}
```

#### Auto Importing Incremental DOM

By deafult, `babel-plugin-transform-incremental-dom` expects any necessary
Incremental DOM methods to already imported and in-scope:

```javascript
// Disabled (default)

// Manually managed imports
import { elementOpen, elementClose, text } from "incremental-dom";

function render() {
  elementOpen("div");
  text("Hello World.");
  elementClose("div");
}
```

This is a hassle if you suddenly use a spread attribute and don't
remember to import `elementOpenStart`, `elementOpenEnd`, and `attr`
methods. And, `attr` and `text` are very generic names, leading to
issues where you might redefine the variable in the rendering function,
breaking it.

This can be fixed entirely by auto-importing everything necessary from
Incremental DOM module:

```javascript
// Enabled with `incremental-dom`

// Auto generated import
var _incrementalDOM = require("incremental-dom");

function render() {
  (0, _incrementalDOM.elementOpen)("div");
  (0, _incrementalDOM.text)("Hello World.");
  (0, _incrementalDOM.elementClose)("div");
}
```

To do this, simply add the `moduleSource` option to the Incremental DOM
plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "moduleSource": "incremental-dom"
    }
  ]]
}
```

Additionally, the module source can be an absolute or relative path to
the module. If a relative path is used, it will be resolve relative to
the `process.cwd()` of the babel process.

#### Skip Children

Some templates do not control all the child elements of certain nodes,
like components. Incremental DOM supports such nodes using a "skip"
child. To support this, we identify a special skip attribute, which will
not contain any child nodes and will never clear the later-added
children of the element.

```javascript
function render() {
    // This node will neither create nor clear children.
    return <div __skip>
    </div>;
}
```


To customize the attribute that signals a skip, simply add the
`skipAttribute` option to the Incremental DOM plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "skipAttribute": "skip"
    }
  ]]
}
```


#### Runtime

By deafult, `babel-plugin-transform-incremental-dom` injects several helpers into
each file as needed. When transforming multiple files with JSX, you can
avoid this helper duplication by specifying a runtime library to use
instead.

The runtime's required functions are:

- `jsxWrapper`

  To prevent iDOM's incremental nature from screwing up our beautiful
  JSX syntax, certain elements rendering functions must be wrapped
  evaluated at a later time. The element will be passed into
  `jsxWrapper`, along with an array of any (if any) arguments needed to
  render the contained JSX element.

  Note it is not `jsxWrapper`'s responsibility to create the JSX
  rendering function, merely to mark the passed in function as a lazy
  evaluation. Here, we return a special `__jsxDOMWrapper` struct with
  the needed information.

  ```javascript
  runtime.jsxWrapper = function(elementFn, args) {
    return {
      __jsxDOMWrapper: true,
      func: elementFn,
      args: args
    };
  }
  ```

- `renderArbitrary`

  To render child elements correctly, we'll need to be able to identify
  them. `renderArbitrary` receives a `child`, and must call the
  appropriate action. For string and numbers, that's to call
  `IncrementalDOM#text`. For lazy evaluation JSX functions, that's to
  invoke the closure. For arrays, that's to render every element. And
  for objects, that's to render every property.

  Note that we identify lazy JSX functions by the `__jsxDOMWrapper`
  struct we created inside the `jsxWrapper` runtime function.

  ```javascript
  runtime.renderArbitrary = function _renderArbitrary(child) {
    var type = typeof child;
    if (type === "number" || (type === string || type === 'object' && child instanceof String)) {
      iDOM.text(child);
    } else if (Array.isArray(child)) {
      child.forEach(_renderArbitrary);
    } else if (type === "object") {
      if (child.__jsxDOMWrapper) {
        var func = child.func, args = child.args;
        if (args) {
          func.apply(this, args);
        } else {
          func();
        }
      } else if (String(child) === "[object Object]") {
        _forOwn(child, _renderArbitrary);
      }
    }
  }
  ```

- `spreadAttribute`

  To set every attribute inside a SpreadAttribute, we'll need to iterate
  over every property and determine if it's an _own_ property. If so,
  call `IncrementalDOM#attr` to set it.

  ```javascript
  runtime.spreadAttribute = function _spreadAttribute(spread) {
    for (var prop in spread) {
      if (Object.prototype.hasOwn.call(spread, prop)) {
        iDOM.attr(prop, spread[prop]);
      }
    }
  }
  ```

To do this, simply add the `runtimeModuleSource` option to the
Incremental DOM plugin:

```json
{
  "plugins": [[
    "transform-incremental-dom", {
      "runtimeModuleSource": "iDOMHelpers"
    }
  ]]
}
```

Additionally, the runtime module source can be an absolute or relative
path to the module. If a relative path is used, it will be resolve
relative to the `process.cwd()` of the babel process.

