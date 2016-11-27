import isRootJSX from "./helpers/is-root-jsx";
import isReturned from "./helpers/is-returned";
import { jsxAncestorChild } from "./helpers/ancestory";
import { setupInjector, injectHelpers } from "./helpers/inject";
import { setupHoists, hoist, addHoistedDeclarator } from "./helpers/hoist";
import { collectJSXCalls, wrapJSXCalls } from "./helpers/wrap-jsx-calls";

import expressionExtractor from "./helpers/extract-expressions";
import expressionInliner from "./helpers/inline-expressions";

import injectJSXWrapper from "./helpers/runtime/jsx-wrapper";

import toFunctionCall from "./helpers/ast/to-function-call";
import flattenExpressions from "./helpers/ast/flatten-expressions";
import statementsWithReturnLast from "./helpers/ast/statements-with-return-last";

import elementOpenCall from "./helpers/element-open-call";
import elementCloseCall from "./helpers/element-close-call";
import buildChildren from "./helpers/build-children";

import JSX from "babel-plugin-syntax-jsx";

export default function ({ types: t, traverse: _traverse }) {
  function traverse(path, visitor, state) {
    _traverse.explode(visitor);

    const { node } = path;
    if (!node) {
      return;
    }

    const { type } = node;
    const { enter = [], exit = [] } = visitor[type] || {};

    enter.forEach((fn) => fn.call(state, path, state));
    if (!path.shouldSkip) {
      path.traverse(visitor, state);
      exit.forEach((fn) => fn.call(state, path, state));
    }
    path.shouldSkip = false;
  }

  const elementVisitor = {
    JSXNamespacedName(path) {
      if (!this.opts.namespaceAttributes || path.parentPath.isJSXOpeningElement()) {
        throw path.buildCodeFrameError("JSX Namespaces aren't supported.");
      }
    },

    JSXElement: {
      enter(path) {
        const { secondaryTree, root, closureVarsStack } = this;
        const needsWrapper = secondaryTree || (root !== path && !jsxAncestorChild(path, this));

        // If this element needs to be wrapped in a closure, we need to transform
        // it's children without wrapping them.
        if (needsWrapper) {
          // If this element needs a closure wrapper, we need a new array of
          // closure parameters.
          closureVarsStack.push([]);

          const state = Object.assign({}, this, { secondaryTree: false, root: path });
          path.traverse(expressionExtractor, state);
          path.traverse(elementVisitor, state);
        }
      },

      exit(path) {
        const { root, secondaryTree, replacedElements, closureVarsStack } = this;
        const childAncestorPath = jsxAncestorChild(path, this);
        const needsWrapper = secondaryTree || (root !== path && !childAncestorPath);

        const { parentPath } = path;
        const explicitReturn = parentPath.isReturnStatement();
        const implicitReturn = parentPath.isArrowFunctionExpression();

        const openingElement = elementOpenCall(path.get("openingElement"), this);
        const closingElement = elementCloseCall(path.get("openingElement"), this);
        const children = buildChildren(path.get("children"), this);

        let elements = [ openingElement, ...children ];
        if (closingElement) { elements.push(closingElement); }

        // Expressions Containers must contain an expression and not statements.
        // This will be flattened out into statements later.
        if (!needsWrapper && parentPath.isJSX()) {
          const sequence = t.sequenceExpression(elements);
          // Mark this sequence as a JSX Element so we can avoid an unnecessary
          // renderArbitrary call.
          replacedElements.add(sequence);
          path.replaceWith(sequence);
          return;
        }

        if (explicitReturn || implicitReturn || needsWrapper) {
          // Transform (recursively) any sequence expressions into a series of
          // statements.
          elements = flattenExpressions(elements);

          // Ensure the last statement returns the DOM element.
          elements = statementsWithReturnLast(elements);
        }

        if (needsWrapper) {
          // Create a wrapper around our element, and mark it as a one so later
          // child expressions can identify and "render" it.
          const closureVars = closureVarsStack.pop();
          const params = closureVars.map((e) => e.id);
          let wrapper = addHoistedDeclarator(
            path.scope,
            "wrapper",
            t.functionExpression(null, params, t.blockStatement(elements)),
            this
          );

          const args = [ wrapper ];
          if (closureVars.length) {
            const paramArgs = closureVars.map((e) => e.init);
            args.push(t.arrayExpression(paramArgs));
          }

          const wrapperCall = toFunctionCall(injectJSXWrapper(this), args);
          replacedElements.add(wrapperCall);
          path.replaceWith(wrapperCall);
          return;
        }

        if (childAncestorPath) {
          replacedElements.add(childAncestorPath.node);
        }

        // This is the main JSX element. Replace the return statement
        // with all the nested calls, returning the main JSX element.
        if (explicitReturn) {
          parentPath.replaceWithMultiple(elements);
        } else {
          path.replaceWithMultiple(elements);
        }
      }
    }
  };

  const rootElementVisitor = {
    JSXElement(path) {
      const previousRoot = this.root;
      const sameLevel = !previousRoot || previousRoot.getFunctionParent() === path.getFunctionParent();

      if (sameLevel && isRootJSX(path)) {
        this.root = path;
        const state = Object.assign({}, this, {
          secondaryTree: !isReturned(path),
        });

        traverse(path, elementVisitor, state);
        return;
      }

      this.elements++;
      path.skip();
    }
  };

  // This visitor first finds the root element, and ignores all the others.
  return {
    inherits: JSX,

    visitor: {
      Program: {
        enter(path) {
          if (this.opts.inlineExpressions) {
            path.traverse(expressionInliner);
          }
          setupInjector(this);
          setupHoists(this);
        },

        exit(path) {
          path.traverse(elementVisitor, {
            secondaryTree: true,
            root: null,
            replacedElements: new WeakSet(),
            closureVarsStack: [],
            file: this.file,
            opts: this.opts,
          });

          wrapJSXCalls(this);
          hoist(path, this);
          injectHelpers(this);
        }
      },

      Function: {
        exit(path) {
          const state = {
            elements: 0,
            secondaryTree: false,
            root: null,
            replacedElements: new WeakSet(),
            closureVarsStack: [],
            file: this.file,
            opts: this.opts,
          };

          path.traverse(rootElementVisitor, state);

          if (state.root) {
            collectJSXCalls(path, this);

            if (state.elements > 0) {
              state.secondaryTree = true;
              path.traverse(elementVisitor, state);
            }
          }
        }
      }
    }
  };
}
