import Fastify from "fastify";
import { healthRoutes } from "./routes/health.js";
import { incidentRoutes } from "./routes/incidents.js";

export function buildApp() {
    const app = Fastify({ logger: true });

    app.register(healthRoutes);
    app.register(incidentRoutes);

    return app;
}
