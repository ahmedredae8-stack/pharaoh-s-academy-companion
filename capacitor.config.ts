import type { CapacitorConfig } from "@capacitor/cli";

// The app is an SSR TanStack Start site, so the Android shell loads the
// published site directly (hybrid mode). Update `server.url` to your
// production domain before generating a release build.
const config: CapacitorConfig = {
  appId: "pharaoh.ar",
  appName: "فرعون Ai",
  webDir: "dist/client",
  server: {
    url: "https://pharaoh-buddy-ai.vercel.app",
    cleartext: true,
    androidScheme: "https",
    allowNavigation: [
      "*.vercel.app",
      "*"
    ]
  },
  android: {
    backgroundColor: "#050b14",
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#050b14",
      launchAutoHide: true,
      showSpinner: false,
    },
  },
};

export default config;
