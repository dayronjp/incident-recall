import { readFile } from "node:fs/promises";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { incidentsSchema,
         incidentSchema,
         type Incident,
} from "../schemas/incidents.js";  

let storePromise: Promise<MemoryVectorStore> | undefined;

async function getVectorStore(): Promise<MemoryVectorStore> {
    if (storePromise) {
        return storePromise;
    }

    storePromise = (async () => {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY not configured.");
        }

        const json = await readFile(
            new URL("../data/incidents.json", import.meta.url),
            "utf8",
        );
        const incidents = incidentsSchema.parse(JSON.parse(json));

        const documents = incidents.map(
            (incident) => new Document({
                pageContent: [
                    incident.title,
                    incident.symptoms,
                    incident.cause,
                    incident.resolution,
                ].join("\n"),
                metadata: incident,
            }),
        );

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey,
            modelName: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
        });

        return MemoryVectorStore.fromDocuments(documents, embeddings);
    })();

    return storePromise;
}

export async function searchIncidents(query:string, limit =3): Promise<Incident[]> {
    const store = await getVectorStore();
    const documents = await store.similaritySearch(query, limit);

    return documents.map((document) => incidentSchema.parse(document.metadata),
    );
}