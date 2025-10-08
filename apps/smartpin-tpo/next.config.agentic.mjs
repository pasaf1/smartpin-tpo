import path from "path";
// Merge this into your next.config.(mjs|js):
export default {
  outputFileTracingRoot: path.join(__dirname, "../../.."),
};
