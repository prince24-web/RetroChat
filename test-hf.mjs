
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/huggingface";

try {
    console.log("Attempting to instantiate HuggingFaceInferenceEmbeddings...");
    const embeddings = new HuggingFaceInferenceEmbeddings({
        apiKey: "test_key",
        model: "sentence-transformers/all-mpnet-base-v2",
    });
    console.log("Success!");
} catch (error) {
    console.error("Error:", error);
}
