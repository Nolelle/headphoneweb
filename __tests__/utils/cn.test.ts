import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("properly merges class names", () => {
    const result = cn("test-class", "another-class");
    expect(result).toBe("test-class another-class");
  });

  it("handles conditional classes correctly", () => {
    const condition = true;
    const result = cn(
      "base-class",
      condition ? "condition-true" : "condition-false"
    );
    expect(result).toBe("base-class condition-true");
  });

  it("handles array of class names", () => {
    const result = cn(["class-one", "class-two"]);
    expect(result).toBe("class-one class-two");
  });

  it("handles undefined and null values", () => {
    const result = cn("base-class", undefined, null, "valid-class");
    expect(result).toBe("base-class valid-class");
  });

  it("properly merges tailwind classes", () => {
    const result = cn("p-4 bg-red-500", "p-6 text-white");
    // Assumes tailwind-merge keeps the last conflicting class
    expect(result).toBe("bg-red-500 p-6 text-white");
  });
});
