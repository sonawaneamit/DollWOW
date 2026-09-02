import { describe, expect, it } from "vitest";
import { metadata as compareMetadata } from "@/app/compare/page";
import { metadata as supportMetadata } from "@/app/support/page";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("static utility page metadata", () => {
  it("consolidates query-string comparison and support variants", () => {
    expect(compareMetadata.alternates).toEqual({ canonical: "/compare" });
    expect(supportMetadata.alternates).toEqual({ canonical: "/support" });
  });

  it("permanently redirects www requests to apex while preserving path and query", () => {
    const request = new NextRequest("https://www.dollwow.com/products/example?view=details", {
      headers: { host: "www.dollwow.com" }
    });
    const response = proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://dollwow.com/products/example?view=details");
  });
});
