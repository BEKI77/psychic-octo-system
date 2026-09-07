import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  // bodyParser disabled: Better Auth's handler must read the raw request
  // stream itself. If Nest's global body parser ran first it would already
  // have consumed the stream, leaving Better Auth an empty body. We mount
  // the raw auth handler first below, then apply express.json()/urlencoded()
  // for every other (Nest-routed) route.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(helmet());

  const webOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: webOrigins, credentials: true });

  app.use("/api/auth/{*splat}", toNodeHandler(auth));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Note: /api/auth/* is mounted directly on the underlying HTTP server above
  // (app.use), not as a Nest-routed controller, so it's unaffected by this
  // prefix either way — Nest controllers below get /api/v1/... paths.
  app.setGlobalPrefix("api");

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Better Auth mounted at http://localhost:${port}/api/auth`);
}

await bootstrap();
