// src/index.ts
import "dotenv/config";   // <-- load .env ASAP
console.log("JWT_SECRET present?", Boolean(process.env.JWT_SECRET));
import app from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
