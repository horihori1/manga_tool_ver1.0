import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates manga/comic panels based on multiple character images and a pose reference.
 * Generates 10 variations in parallel with 16:9 aspect ratio.
 */
export const generateMangaPanel = async (
  characterImageBase64s: string[],
  poseImageBase64: string,
  additionalPrompt: string = ""
): Promise<string[]> => {
  try {
    // Clean pose base64
    const cleanPose = poseImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    // Prepare character parts
    const characterParts = characterImageBase64s.map((img, index) => ({
      inlineData: {
        mimeType: 'image/png',
        data: img.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ""),
      }
    }));

    const promptText = `
      You are a professional manga artist assistant.
      
      INPUTS:
      1. Character Sheets (First ${characterImageBase64s.length} images): These define the character's identity (hair, face, costume, accessories). Combine these details to understand the character perfectly.
      2. Pose & Composition Reference (Last image): This defines the exact body pose, camera angle, and perspective.

      TASK:
      Create a high-quality manga/anime style illustration of the character defined in the Character Sheets, acting out the scene in the Pose Reference.

      RULES:
      - RESOLUTION: Generate in 1920x1080 (16:9) landscape format.
      - STRICT CHARACTER CONSISTENCY: The face, hair, and outfit must look exactly like the provided Character Sheets.
      - EXACT POSE: The character's limb positioning and viewing angle must match the Pose Reference exactly.
      - STYLE: Use a clean, professional manga art style (monochrome or color based on input style). 
      ${additionalPrompt ? `Additional Instructions: ${additionalPrompt}` : ''}
    `;

    // Helper function to make a single call
    const generateSingleImage = async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { text: promptText },
              ...characterParts,
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: cleanPose,
                },
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9', // Targets 1920x1080 landscape
            }
          }
        });

        if (response.candidates && response.candidates.length > 0) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
        return null;
      } catch (e) {
        console.warn("Single generation failed, retrying or skipping", e);
        return null;
      }
    };

    // Generate 10 variations in parallel
    // Note: 10 parallel requests might hit rate limits depending on the tier, 
    // but Flash is generally fast. 
    const numberOfVariations = 10;
    const promises = Array(numberOfVariations).fill(null).map(() => generateSingleImage());
    
    const results = await Promise.all(promises);

    // Filter out any failed generations (nulls)
    const validImages = results.filter((img): img is string => img !== null);

    if (validImages.length === 0) {
      throw new Error("Failed to generate any images.");
    }

    return validImages;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};