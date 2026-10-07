// Code Generation Module - Main Entry Point
//
// The user-facing generator emits LispBM (main.lisp + ui/) for the P4 Dashboard LVGL bridge.
// The former C generator is kept only for the LVGL WASM / compile preview (see generateCCode).

export * from './lisp';
export { generateCCode } from './generator';
export * from './utils/nameUtils';
