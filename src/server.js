import "dotenv/config";
import app from "./app.js";
import { logApp } from "./utils/logger.js";

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  void logApp(`Server listening on port ${PORT}`);
});
