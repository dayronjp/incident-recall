import { z } from "zod";

export const incidentSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    symptoms: z.string().min(1),
    cause: z.string().min(1),
    resolution: z.string().min(1),
});

export const incidentsSchema = z.array(incidentSchema);

export type Incident = z.infer<typeof incidentSchema>;

export const searchInputSchema = z.object({
    query: z.string().trim().min(1),
    limit:
    z.number().int().min(1).max(5).default(3),
});

export const analysisOutputSchema = z.object({
    summary: z.string(),
    hypotheses: z.array(
        z.object({
            description: z.string(),
            evidence: z.string(),
            sourceIds: z.array(z.string()),
        }),
    ),
    recommendedChecks: z.array(z.string()),
    insufficientEvidence: z.boolean(),
    disclaimer: z.string(),
});

export const analysisResponseSchema = analysisOutputSchema.extend({
    sources: z.array(z.string()),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

export const analyzeInputSchema = z.object({
    description: z.string().trim().min(10).max(2000),
});
