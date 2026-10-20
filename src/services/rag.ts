import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
    analysisOutputSchema,
    analysisResponseSchema,
    type AnalysisResponse,
    type Incident,
} from "../schemas/incidents.js";
import { buildAnalysisPrompt } from "./prompt.js";
import { searchIncidents } from "./vector-store.js";

export async function analyzeIncident(description:string,): Promise<AnalysisResponse> {
    const incidents = await searchIncidents(description, 3);
    const apiKey = process.env.GOOGLE_API_KEY;
    const modelName = process.env.GEMINI_CHAT_MODEL;

    if(!apiKey || !modelName) {
        throw new Error("Missing Gemini configs.");
    }

    const model = new ChatGoogleGenerativeAI({
        apiKey,
        model: modelName,
        temperature: 0,
    });

    const structuredModel = model.withStructuredOutput(
        analysisOutputSchema, { name:  "incident_analysis" }
    );

    const rawOutput = await structuredModel.invoke(
        buildAnalysisPrompt(description, incidents),
    );

    const output = analysisOutputSchema.parse(rawOutput);

    const allowedIds = new Set(incidents.map((incident) => incident.id));
    const citedIds = output.hypotheses.flatMap(
        (hypothesis) => hypothesis.sourceIds,
    );
    const hasUnknowSource = citedIds.some((id) => !allowedIds.has(id));

    if (hasUnknowSource) {
        throw new Error("Analysis returned a source that could not be retrieved.");
    }

    return analysisResponseSchema.parse({
        ...output,
        sources: incidents.map((incident: Incident) => incident.id),
    });
}
