import cleanText from "./clean-text";
import toFunctionCall from "./ast/to-function-call";
import injectRenderArbitrary from "./runtime/render-arbitrary";

// Filters out empty children, and transform JSX expressions
// into function calls.
export default function buildChildren(t, file, children) {
  let renderArbitraryRef;

  return children.reduce((children, child) => {
    const wasExpressionContainer = t.isJSXExpressionContainer(child);
    if (wasExpressionContainer) {
      child = child.expression;
    }

    if (t.isJSXEmptyExpression(child)) { return children; }

    if (t.isLiteral(child)) {
      let type = typeof child.value;
      let value = child.value;
      if (type === "string") {
        value = cleanText(value);
        if (!value) { return children; }
      }

      if (type === "string" || type === "number") {
        child = toFunctionCall(t, "text", [t.literal(value)]);
      }
    } else if (wasExpressionContainer && t.isExpression(child)) {
      renderArbitraryRef = renderArbitraryRef || injectRenderArbitrary(t, file);
      child = toFunctionCall(t, renderArbitraryRef, [child]);
    }

    children.push(child);
    return children;
  }, []);
}