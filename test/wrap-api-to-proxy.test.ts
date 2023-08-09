import { describe, expect, it, vi } from "vitest";

import {
  assertIsString,
  createRecursiveProtectiveProxy,
  deCapitalize,
  isPlainObject,
  isString,
} from "../src/wrap-api-to-proxy";

describe("deCapitalize", () => {
  it("should decapitalize the first character of a string", () => {
    expect(deCapitalize("Hello")).toBe("hello");
  });

  it("should return the same string if first character is already lower case", () => {
    expect(deCapitalize("hello")).toBe("hello");
  });

  it("should handle empty string", () => {
    expect(deCapitalize("")).toBe("");
  });
});

describe("isObject", () => {
  it("should return true if the value is an object", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.assign({}))).toBe(true);
  });

  it("should return false if the value is null", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("should return false if the value is not an object", () => {
    expect(isPlainObject("string")).toBe(false);
    expect(isPlainObject(123)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(() => {})).toBe(false);
  });
});

describe("isString", () => {
  it("should return true if the value is a string", () => {
    expect(isString("string")).toBe(true);
    expect(isString(String("string"))).toBe(true);
  });

  it("should return false if the value is not a string", () => {
    expect(isString({})).toBe(false);
    expect(isString(123)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(() => {})).toBe(false);
  });
});

describe("assertPropertyIsString", () => {
  it("should not throw an error if the property is a string", () => {
    expect(() => assertIsString("string")).not.toThrow();
  });

  it("should throw an error if the property is a symbol", () => {
    expect(() => assertIsString(Symbol())).toThrow(
      "Calling api with new symbol properties is not supported",
    );
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
    (proxy as any).a.b;

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

    expect(() => (proxy as any)[Symbol()]).toThrow(
      "Calling api with new symbol properties is not supported",
    );
  });
});
