import "@compose-market/theme/css";
import "./style.css";
import { mount } from "./home";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

mount(root);
