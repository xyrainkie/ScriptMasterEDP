import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { GoogleGenAI, Type } from '@google/genai';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { ApiResponse, Asset } from '@/types';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Polish script descriptions using Gemini AI
router.post('/polish-descriptions',
  authenticate,
  [
    body('assets')
      .isArray()
      .withMessage('Assets must be an array'),
    body('assets.*.id')
      .notEmpty()
      .withMessage('Asset ID is required'),
    body('assets.*.name')
      .notEmpty()
      .withMessage('Asset name is required'),
    body('assets.*.description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { assets }: { assets: Asset[] } = req.body;

    try {
      // Filter for assets that have some description to polish
      const activeAssets = assets.filter(a => a.description && a.description.length > 2);

      if (activeAssets.length === 0) {
        const response: ApiResponse = {
          success: true,
          data: assets,
          message: 'No descriptions to polish',
        };
        return res.status(200).json(response);
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const itemsToPolish = activeAssets.map(a => ({
        id: a.id,
        name: a.name,
        currentDescription: a.description
      }));

      const systemInstruction = `
        你是一个专业的英语课程脚本编辑助手。
        你的任务是润色开发师输入的"组件内容描述"。
        保持原意，但使其更清晰、专业，并适合美术或配音人员阅读。
        如果是英文内容，检查拼写和语法。
        如果是动作描述，使其更生动。

        输入是 JSON 数组，包含 ID, 名称, 和当前描述。
        输出是 JSON 数组，包含 ID 和 润色后的描述 (refinedDescription)。
      `;

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

      const apiResponse: ApiResponse = {
        success: true,
        data: updatedAssets,
        message: 'Descriptions polished successfully',
      };

      res.status(200).json(apiResponse);

    } catch (error: any) {
      console.error("Gemini Polish Error:", error);

      // Return original assets if AI service fails
      const response: ApiResponse = {
        success: false,
        data: assets,
        error: 'AI service unavailable. Original descriptions returned.',
      };

      res.status(500).json(response);
    }
  })
);

// Generate content suggestions for segments
router.post('/generate-content',
  authenticate,
  [
    body('segment_title')
      .notEmpty()
      .withMessage('Segment title is required'),
    body('template_type')
      .optional()
      .isIn(['Interactive Scene', 'Video Lesson', 'Flashcards'])
      .withMessage('Invalid template type'),
    body('target_audience')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Target audience must not exceed 100 characters'),
    body('additional_notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Additional notes must not exceed 500 characters'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { segment_title, template_type, target_audience, additional_notes } = req.body;

    try {
      // Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemInstruction = `
        你是一个专业的英语课程内容创作助手。
        根据给定的页面标题和模板类型，生成适合的页面内容描述。
        内容应该清晰、生动，适合英语教学使用。
        输出格式为JSON，包含content字段。
      `;

      const prompt = `
        请为以下页面生成内容描述：
        页面标题：${segment_title}
        模板类型：${template_type || '通用页面'}
        目标受众：${target_audience || '儿童英语学习者'}
        额外说明：${additional_notes || '无'}

        请生成一个结构化的页面内容描述，包括：
        1. 页面整体设计思路
        2. 交互元素说明
        3. 视觉效果描述
        4. 教学目标说明
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING }
            },
            required: ["content"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");

      const apiResponse: ApiResponse = {
        success: true,
        data: result,
        message: 'Content generated successfully',
      };

      res.status(200).json(apiResponse);

    } catch (error: any) {
      console.error("Content Generation Error:", error);

      const response: ApiResponse = {
        success: false,
        error: error.message || 'Failed to generate content',
      };

      res.status(500).json(response);
    }
  })
);

export default router;