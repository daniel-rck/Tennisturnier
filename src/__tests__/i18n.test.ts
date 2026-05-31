import { describe, expect, it } from "vitest";
import { format, translate } from "../i18n";
import { de } from "../i18n/de";
import { en } from "../i18n/en";

describe("i18n", () => {
  it("English table covers every German key", () => {
    const missing = (Object.keys(de) as Array<keyof typeof de>).filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });

  it("does not have extra keys in English", () => {
    const extra = (Object.keys(en) as Array<keyof typeof de>).filter((k) => !(k in de));
    expect(extra).toEqual([]);
  });

  it("substitutes named placeholders", () => {
    expect(format("Hello {name}!", { name: "World" })).toBe("Hello World!");
    expect(format("{a} + {b} = {sum}", { a: 1, b: 2, sum: 3 })).toBe("1 + 2 = 3");
  });

  it("keeps unknown placeholders intact", () => {
    expect(format("Hello {unknown}", { other: 1 })).toBe("Hello {unknown}");
  });

  it("translate() returns localised string", () => {
    expect(translate("de", "tab.statistics")).toBe("Statistik");
    expect(translate("en", "tab.statistics")).toBe("Statistics");
  });

  it("falls back to German when key is missing in English", () => {
    expect(translate("de", "app.title")).toBe("Tennisturnier-Planer");
    expect(translate("en", "app.title")).toBe("Tennis Tournament Planner");
  });

  it("every English value is non-empty", () => {
    const empty = (Object.keys(en) as Array<keyof typeof en>).filter((k) => en[k] === "");
    expect(empty).toEqual([]);
  });
});
