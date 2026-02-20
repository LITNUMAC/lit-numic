import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {
      colors: {
        "brand-blue": "#2952CC",
        "brand-yellow": "#FFF200",
      },
    },
  },

  plugins: [],
} as Config;
