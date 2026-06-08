import "@compose-market/theme/css/tokens";
import "@compose-market/theme/css/dark";
import "@compose-market/theme/css/light";
import "@compose-market/theme/css/app";
import "@compose-market/theme/css/effects";
import "@compose-market/theme/css/utilities";
import "./style.css";
import { mount } from "./home";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

mount(root);
