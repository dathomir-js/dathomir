
import { renderToString } from "@dathomir/core/runtime";
import App from "./app";

export function render() {
  return renderToString(App());
}

export default render;
