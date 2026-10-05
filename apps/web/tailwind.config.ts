import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgb(51 65 85 / 0.7), 0 20px 45px rgb(2 6 23 / 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
