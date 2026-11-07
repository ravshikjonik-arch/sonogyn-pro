import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AuthMessage } from "../AuthScreenShell";

describe("AuthMessage", () => {
  it("renders nothing without text, so no empty error box appears", () => {
    assert.equal(renderToStaticMarkup(createElement(AuthMessage, { message: "" })), "");
    assert.equal(renderToStaticMarkup(createElement(AuthMessage, { message: "   " })), "");
  });

  it("renders the error text", () => {
    const html = renderToStaticMarkup(createElement(AuthMessage, { message: "Неверные учётные данные." }));
    assert.match(html, /data-testid="auth-error-message"/);
    assert.match(html, /Неверные учётные данные\./);
  });

  it("renders a success message with its own test id", () => {
    const html = renderToStaticMarkup(createElement(AuthMessage, { message: "Код отправлен.", tone: "success" }));
    assert.match(html, /data-testid="auth-success-message"/);
  });
});
