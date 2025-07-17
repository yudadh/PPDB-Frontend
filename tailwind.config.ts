/** @type {import('tailwindcss').Config} */
import type { Config } from "tailwindcss";
// @ts-ignore 
import primeui from "tailwindcss-primeui";
export default <Partial<Config>>{
   darkMode: ["selector", '[class*="app-dark"]'],
   content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
   // corePlugins: {
   //    preflight: false,
   // },
   plugins: [primeui],
   theme: {
      screens: {
         sm: "576px",
         md: "768px",
         lg: "992px",
         xl: "1200px",
         "2xl": "1920px",
      },
   },
};
