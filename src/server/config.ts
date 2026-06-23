import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

export const config = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 8787),
  databaseUrl: process.env.DATABASE_URL ?? path.join(projectRoot, "data/mstr-update.db"),
  refreshIntervalMinutes: Number(process.env.REFRESH_INTERVAL_MINUTES ?? 30),
  massiveApiKey: process.env.MASSIVE_API_KEY ?? "",
  polygonApiKey: process.env.POLYGON_API_KEY ?? "",
  projectRoot,
  clientDist: path.join(projectRoot, "dist/client")
};
