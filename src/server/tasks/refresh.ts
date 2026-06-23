import { refreshSnapshot } from "../snapshot";

const snapshot = await refreshSnapshot();
console.log(JSON.stringify({ generatedAt: snapshot.generatedAt, warnings: snapshot.warnings }, null, 2));
