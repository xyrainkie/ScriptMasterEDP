import { GoogleGenAI, Type } from "@google/genai";
import { Asset } from "../types";

// Replaced extraction with a "Polish/Refine" function for the new workflow
export const polishScriptDescriptions = async (assets: Asset[]): Promise<Asset[]> => {
  
  // Filter for assets that have some description to polish
  const activeAssets = assets.filter(a => a.description && a.description.length > 2);
  
  if (activeAssets.length === 0) return assets;

  // Initialize Gemini Client inside the function to use the latest API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const itemsToPolish = activeAssets.map(a => ({
      id: a.id,
      name: a.name,
      currentDescription: a.description
  }));

  const systemInstruction = `
    你是一个专业的英语课程脚本编辑助手。
    你的任务是润色开发师输入的“组件内容描述”。
    保持原意，但使其更清晰、专业，并适合美术或配音人员阅读。
    如果是英文内容，检查拼写和语法。
    如果是动作描述，使其更生动。
    
    输入是 JSON 数组，包含 ID, 名称, 和当前描述。
    输出是 JSON 数组，包含 ID 和 润色后的描述 (refinedDescription)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `请润色以下列表: ${JSON.stringify(itemsToPolish)}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              refinedDescription: { type: Type.STRING }
            },
            required: ["id", "refinedDescription"],
          },
        },
      },
    });

    const parsedResults = JSON.parse(response.text || "[]");
    
    // Merge results back
    const updatedAssets = assets.map(asset => {
        const result = parsedResults.find((r: any) => r.id === asset.id);
        if (result) {
            return { ...asset, description: result.refinedDescription };
        }
        return asset;
    });

    return updatedAssets;

  } catch (error) {
    console.error("Gemini Polish Error:", error);
    return assets;
  }
};