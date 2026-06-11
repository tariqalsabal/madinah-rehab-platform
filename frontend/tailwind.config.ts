import type { Config } from "tailwindcss";

// الهوية البصرية: أخضر/ذهبي (متناسقة مع مشاريع الجمعية)
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        // الهوية مستمدّة من شعار الجمعية: منارة المسجد النبوي وسنابل القمح
        brand: {
          DEFAULT: "#1f8a4c", // أخضر الزمرّد (لون المنارة والسنابل)
          dark: "#136138",
          light: "#e7f4ec",
        },
        leaf: {
          DEFAULT: "#5cb335", // أخضر القمح الفاتح (لمسات/تدرّجات)
        },
        gold: {
          DEFAULT: "#d7a724", // ذهبي القمح
          dark: "#b6891a",
          light: "#f6eecf",
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.25rem" },
      fontFamily: { sans: ["var(--font-cairo)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
