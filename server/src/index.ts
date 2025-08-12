import app from "./app";
import { loadEnv } from "./lib/env";

const env = loadEnv();
const PORT = env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
