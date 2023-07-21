/* eslint-disable unicorn/no-null */
import { describe, expect, it, vi } from "vitest";

import {
  assertPropertyIsString,
  createRecursiveProtectiveProxy,
  deCapitalize,
  isObject,
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
    expect(isObject({})).toBe(true);
    expect(isObject(Object.assign({}))).toBe(true);
  });

  it("should return false if the value is null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("should return false if the value is not an object", () => {
    expect(isObject("string")).toBe(false);
    expect(isObject(123)).toBe(false);
    expect(isObject(true)).toBe(false);
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(isObject(undefined)).toBe(false);
    expect(isObject([])).toBe(false);
    expect(isObject(() => {})).toBe(false);
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
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(isObject(undefined)).toBe(false);
    expect(isObject([])).toBe(false);
    expect(isObject(() => {})).toBe(false);
  });
});

describe("assertPropertyIsString", () => {
  it("should not throw an error if the property is a string", () => {
    expect(() => assertPropertyIsString("string")).not.toThrow();
  });

  it("should throw an error if the property is a symbol", () => {
    expect(() => assertPropertyIsString(Symbol())).toThrow(
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
