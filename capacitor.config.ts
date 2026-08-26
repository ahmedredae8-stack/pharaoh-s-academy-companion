import type { CapacitorConfig } from "@capacitor/cli";

// The app is an SSR TanStack Start site, so the Android shell loads the
// published site over HTTPS only (Google Play security policy: no cleartext,
// no wildcard navigation).
const config: CapacitorConfig = {
  appId: "pharaoh.ar",
  appName: "فرعون Ai",
  webDir: "dist/client",
  server: {
    url: "https://ignite-mentor-grow.lovable.app",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "ignite-mentor-grow.lovable.app",
      "odaueevnluutgnayagan.supabase.co",
      "accounts.google.com",
    ],
  },
  android: {
    backgroundColor: "#050b14",
    allowMixedContent: false,
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
