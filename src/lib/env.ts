/**
 * Environment configuration and lightweight runtime validation.
 * Ensures critical environment variables are defined without breaking local dev fallbacks.
 */

export interface EnvConfig {
  databaseUrl: string;
  sessionSecret: string;
  googleMapsApiKey?: string;
  isProduction: boolean;
}

export function validateEnv(): EnvConfig {
  const isProduction = process.env.NODE_ENV === "production";
  
  const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  const sessionSecret = process.env.SESSION_SECRET || "demo-secret-key";
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (isProduction) {
    if (!process.env.SESSION_SECRET) {
      console.warn("⚠️ WARNING: SESSION_SECRET is not set in production. Using fallback secret.");
    }
    if (!googleMapsApiKey) {
      console.warn("⚠️ WARNING: GOOGLE_MAPS_API_KEY is not set. Google Routes API calls will fall back to simulated matrix solver.");
    }
  }

  return {
    databaseUrl,
    sessionSecret,
    googleMapsApiKey,
    isProduction,
  };
}

export const env = validateEnv();
