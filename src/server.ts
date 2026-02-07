import { initConfig } from "../lib";
import createServer from "./app";

const startServer = async () => {
  const port = process.env.PORT || 3000;
  const app = createServer();

  try {
    await initConfig();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();
