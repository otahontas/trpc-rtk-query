import { describe, expect, it, vi } from "vitest";

import {
  assertIsString,
  createRecursiveProtectiveProxy,
  deCapitalize,
} from "../src/wrap-api-to-proxy.js";

describe("deCapitalize", () => {
  it("should decapitalize the first character of a string", () => {
    expect(deCapitalize("Hello")).toBe("hello");
  });

  it("should return the same string if first character is already lower case", () => {
    expect(deCapitalize("hello")).toBe("hello");
  });

  it("should de capitalize only first letter from splitted words", () => {
    expect(deCapitalize("Hello World")).toBe("hello World");
  });

  it("should handle empty string", () => {
    expect(deCapitalize("")).toBe("");
  });
});

describe("createRecursiveProtectiveProxy", () => {
  it("should call callback with handledProperties when reaching leaf property", () => {
    const mockCallback = vi.fn();
    const proxy = createRecursiveProtectiveProxy({
      callback: mockCallback,
      proxyTarget: {},
      recursionLevels: 2,
    });

    // Access property that doesn't exist
    void (proxy as any).a.b;

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(["a", "b"]);
  });

  it("should return property value if property exists", () => {
    const mockCallback = vi.fn();
    const proxy = createRecursiveProtectiveProxy({
      callback: mockCallback,
      proxyTarget: { a: { b: "value" } },
      recursionLevels: 2,
    });

    const value = (proxy as any).a.b;

    expect(value).toBe("value");
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should throw an error if property is a symbol", () => {
    const mockCallback = vi.fn();
    const proxy = createRecursiveProtectiveProxy({
      callback: mockCallback,
      proxyTarget: {},
      recursionLevels: 2,
    });

    expect(() => (proxy as any)[Symbol()]).toThrow();
  });
});

describe("assertIsString", () => {
  it("should not throw an error if value is a string", () => {
    expect(() => assertIsString("hello")).not.toThrow();
  });

  it("should throw an error if value is not a string", () => {
    expect(() => assertIsString(Symbol())).toThrow();
  });
});
