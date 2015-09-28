import inject from "../inject";

// Loops over all own properties, calling
// the specified iterator function with
// value and prop name.
// Depends on the _hasOwn helper.
function jsxWrapperAST(t, file, ref) {
  const func = t.identifier("func");
  const jsxProp = t.memberExpression(
    func,
    t.identifier("__jsxDOMWrapper")
  );

  /**
   * function _jsxWrapper(func) {
   *   func.__jsxDOMWrapper = true;
   *   return func;
   * }
   */
  return t.functionDeclaration(
    ref,
    [func],
    t.blockStatement([
      t.expressionStatement(t.AssignmentExpression("=", jsxProp, t.literal(true))),
      t.returnStatement(func)
    ])
  );
}

export default function injectJSXWrapper(t, file) {
  return inject(t, file, "jsxWrapper", jsxWrapperAST);
}
