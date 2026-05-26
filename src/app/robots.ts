import type { MetadataRoute } from "next";

// Generated robots.txt. By default the seeded deploy welcomes all crawlers
// since it is a public marketing surface. Customers can replace this with
// stricter rules (Disallow /api, /admin, etc.) once they wire up
// authenticated or non-indexable surfaces.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
  };
}
