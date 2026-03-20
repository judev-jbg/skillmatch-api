import "dotenv/config";
import app from "./app.js";

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio. Revisa tu archivo .env');
}

const PORT = process.env.PORT ?? 3100;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
