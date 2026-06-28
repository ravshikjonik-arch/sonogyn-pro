import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  descriptionToSafeHtml,
  lessonBodyHtmlForDisplay,
  sanitizeCourseHtml,
} from "../sanitize-course-html";

describe("sanitizeCourseHtml", () => {
  it("strips script tags", () => {
    const out = sanitizeCourseHtml('<p>Hi</p><script>alert(1)</script>');
    assert.equal(out, "<p>Hi</p>");
  });

  it("allows basic formatting", () => {
    const out = sanitizeCourseHtml("<p><strong>FMF</strong></p>");
    assert.match(out, /strong/);
  });

  it("strips onload handlers from links", () => {
    const out = sanitizeCourseHtml('<a href="https://x.ru" onload="alert(1)">x</a>');
    assert.doesNotMatch(out, /onload/i);
    assert.match(out, /href="https:\/\/x.ru"/);
  });
});

describe("descriptionToSafeHtml", () => {
  it("escapes plain text", () => {
    assert.equal(descriptionToSafeHtml("<script>"), "<p>&lt;script&gt;</p>");
  });
});

describe("lessonBodyHtmlForDisplay", () => {
  it("prefers sanitized body_html", () => {
    const out = lessonBodyHtmlForDisplay("<p>Body</p>", "Desc");
    assert.equal(out, "<p>Body</p>");
  });

  it("falls back to escaped description", () => {
    const out = lessonBodyHtmlForDisplay("", "<img onerror=1>");
    assert.equal(out, "<p>&lt;img onerror=1&gt;</p>");
  });
});
