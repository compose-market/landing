import "@compose-market/theme/css";
import "@compose-market/theme/css/app";
import "@compose-market/theme/css/effects";
import "@compose-market/theme/css/market";
import "./style.css";
import { mount } from "./scene";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

mount(root);
