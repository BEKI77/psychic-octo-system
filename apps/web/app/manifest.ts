import type { MetadataRoute } from "next";

/**
 * §37 PWA Strategy — installable to the home screen, fullscreen/standalone
 * on warehouse devices. See public/sw.js for what "installable" does and
 * (deliberately) does not do.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cylinder Inventory Management System",
    short_name: "Cylinder Inventory",
    description: "Cylinder inventory, sales, returns and credit management",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
