import { describe, expect, it } from "vitest";
import { classifyRootShape } from "@/lib/morphology/rootShape";

describe("classifyRootShape", () => {
  it("classifies a sound (strong) root", () => {
    expect(classifyRootShape("كتب")).toBe("sound");
    expect(classifyRootShape("علم")).toBe("sound");
  });

  it("classifies a hollow root (weak middle radical)", () => {
    expect(classifyRootShape("قول")).toBe("hollow");
    expect(classifyRootShape("بيع")).toBe("hollow");
  });

  it("classifies a defective root (weak final radical)", () => {
    expect(classifyRootShape("دعو")).toBe("defective");
    expect(classifyRootShape("رمي")).toBe("defective");
  });

  it("classifies an assimilated root (weak initial radical)", () => {
    expect(classifyRootShape("وعد")).toBe("assimilated");
    expect(classifyRootShape("يسر")).toBe("assimilated");
  });

  it("classifies a geminate root (doubled radical), checked before weak-letter position", () => {
    expect(classifyRootShape("ربب")).toBe("geminate");
    expect(classifyRootShape("مدد")).toBe("geminate");
  });

  it("classifies a hamzated root regardless of hamza position", () => {
    expect(classifyRootShape("أخذ")).toBe("hamzated"); // initial
    expect(classifyRootShape("سأل")).toBe("hamzated"); // medial
    expect(classifyRootShape("قرأ")).toBe("hamzated"); // final
  });

  it("classifies any four-letter root as quadriliteral, without further subdivision", () => {
    expect(classifyRootShape("زلزل")).toBe("quadriliteral");
    expect(classifyRootShape("عنكب")).toBe("quadriliteral");
  });
});
