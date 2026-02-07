import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import apiRoutes from "../routes/index";

const isDev = true;
const allowedOrigins = [process.env.FRONTEND_URL];

const createServer = (): express.Application => {
  const app: Application = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isDev) {
          return callback(null, origin || "*");
        } else {
          if (!origin) return callback(null, origin);
          if (allowedOrigins.includes(origin)) {
            return callback(null, origin);
          } else {
            return callback(new Error("Not allowed by CORS."));
          }
        }
      },
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 200,
    }),
  );

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/", async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).send({
      success: true,
      message: "The server is running.",
    });
  });

  app.use("/api", apiRoutes);

  return app;
};

export default createServer;
