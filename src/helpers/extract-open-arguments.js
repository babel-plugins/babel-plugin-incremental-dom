import isLiteralOrSpecial from "./is-literal-or-special";
import { generateHoistName, addHoistedDeclarator } from "./hoist";
import uuid from "./uuid";
import toString from "./ast/to-string";
import last from "./last";
import * as t from "@babel/types";

// Extracts attributes into the appropriate
// attribute array. Static attributes and the key
// are placed into static attributes, and expressions
// are placed into the variadic attributes.
export default function extractOpenArguments(path, plugin) {
  const attributes = path.get("attributes");
  const { elementVarsStack, closureVarsStack } = plugin;
  const { requireStaticsKey } = plugin.opts;
  const elementVars = last(elementVarsStack);
  const closureVars = last(closureVarsStack) || [];

  let attrs = [];
  let key = null;
  let keyIndex = -1;

  attributes.forEach((attribute) => {
    if (attribute.isJSXSpreadAttribute()) {
      attrs.push({
        name: null,
        value: attribute.get("argument").node,
        isSpread: true,
        isStatic: false,
      });
      return;
    }

    const namePath = attribute.get("name");
    let name;
    if (namePath.isJSXIdentifier()) {
      name = t.stringLiteral(namePath.node.name);
    } else {
      name = t.stringLiteral(`${namePath.node.namespace.name}:${namePath.node.name.name}`);
    }
    let value = attribute.get("value");
    let  { node } = value;

    // Attributes without a value are interpreted as `true`.
    if (!node) {
      value.replaceWith(t.jSXExpressionContainer(t.booleanLiteral(true)));
    }

    // Get the value inside the expression.
    if (value.isJSXExpressionContainer()) {
      value = value.get("expression");
      node = value.node;
    }

    let literal = isLiteralOrSpecial(value);

    if (literal) {
      node = toString(value);
    }

    // The key attribute must be passed to the `elementOpen` call.
    if (name.value === "key") {
      const { scope } = value;

      // If it's not a literal key, we must assign it in the statics array.
      if (!literal) {

        // Make sure the rearranging the key for iDOM's call does not affect
        // the value of a previous attribute.
        attrs.forEach((attr) => {
          const { name, value, isStatic } = attr;
          if (isStatic) {
            return;
          }
          // Closure vars don't need to considered, they're already evaluated properly.
          if (t.isIdentifier(value) && closureVars.find(({ id }) => id === value)) {
            return;
          }

          const id = scope.generateDeclaredUidIdentifier(name ? name.value : "spread");
          elementVars.push(t.assignmentExpression("=", id, value));
          attr.value = id;
        });

        if (!value.isIdentifier()) {
          const id = generateHoistName(path, "key");
          scope.push({ id });
          elementVars.push(t.assignmentExpression("=", id, node));
          node = id;
        }

        keyIndex = attrs.reduce((sum, { isStatic }) => {
          return sum + (isStatic ? 2 : 0);
        }, 1);
        literal = true;
      }

      key = node;
    }

    attrs.push({
      name,
      value: node,
      isSpread: false,
      isStatic: literal,
    });
  });

  let statics = null;
  const hasStatic = !!attrs.find(({ isStatic }) => isStatic);
  if (hasStatic && !key && !requireStaticsKey) {
    // Generate a UUID to be used as the key.
    key = t.stringLiteral(uuid(plugin));
  }
  if (hasStatic && key) {
    const staticAttrs = [];
    statics = generateHoistName(path, "statics");

    attrs = attrs.filter((attr) => {
      if (attr.isStatic) {
        staticAttrs.push(attr.name, attr.value);
        return false;
      }
      return true;
    });

    addHoistedDeclarator(path.scope, statics, t.arrayExpression(staticAttrs), plugin);
    if (keyIndex > -1) {
      const keyAssignment = last(elementVars);
      const staticsAssignment = t.assignmentExpression(
        "=",
        t.memberExpression(statics, t.numericLiteral(keyIndex), true),
        keyAssignment ? keyAssignment.right : key
      );
      staticAttrs[keyIndex] = t.stringLiteral("");

      if (keyAssignment) {
        keyAssignment.right = staticsAssignment;
      } else {
        elementVars.push(staticsAssignment);
      }
    }
  }

  if (attrs.length === 0) { attrs = null; }

  return { key, statics, attrs };
}
