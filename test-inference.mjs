
import { HfInference } from "@huggingface/inference";

try {
    console.log("Attempting to instantiate HfInference...");
    const hf = new HfInference("test_key");
    console.log("Success! HfInference instantiated.");
} catch (error) {
    console.error("Error:", error);
}
