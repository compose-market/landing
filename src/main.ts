import "./style.css";
import { mount } from "./scene";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

mount(root);
