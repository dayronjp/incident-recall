import type { FastifyInstance } from "fastify";
import { searchInputSchema } from "../schemas/incidents.js";
import { searchIncidents } from "../services/vector-store.js";
import { analyzeInputSchema } from "../schemas/incidents.js";
import { analyzeIncident } from "../services/rag.js";

export async function incidentRoutes(app: FastifyInstance) {
    app.post("/incidents/search", async (request, reply) => {
        const parsed = searchInputSchema.safeParse(request.body);

        if (!parsed.success) {
            return reply.code(400).send({
                error: "Invalid entry",
                details: parsed.error.flatten(),
            });
        }

        const { query, limit} = parsed.data;
        const results = await searchIncidents(query, limit);

        return { query, results };
    });

    app.post("/incidents/analyze", async(request, reply) => {
        const parsed = analyzeInputSchema.safeParse(request.body);

        if (!parsed.success) {
            return reply.code(400).send({
                error: "Invalid entry",
                details: parsed.error.flatten(),
            });
        }

        try {
            return await analyzeIncident(parsed.data.description);
        } catch {
            request.log.error("Failed to generate an analysis using AI services.");
            
            return reply.code(503).send({
                error: "AI service is unavailable or returned an invalid response.",
            });
        }
    });
}
