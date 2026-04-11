import { render } from "solid-js/web";
import { App } from "./components/App";

const container = document.getElementById("app");
if (!container) {
  throw new Error("Cannot find container");
}

render(App, container);
