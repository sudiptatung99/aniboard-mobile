/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6214fe",
          light: "#9059fd",
          extraLight: "#dccbff",
          alphaLight: "#efeaf9",
          dark: "#4613ae",
        },
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
      },
      animation: {
        fadeSlideUp: "fadeSlideUp 0.3s ease forwards",
        pulse: "pulse 2s infinite",
      },
    },
  },
  plugins: [],
};
