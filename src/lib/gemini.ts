import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to retry API calls with exponential backoff
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (error?.status === "RESOURCE_EXHAUSTED" || error?.status === 429) {
        if (attempt >= maxRetries) throw error;
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached");
}

export interface DailyFortune {
  message: string;
  luckyColor: string;
  luckyNumber: number;
  travelAdvice: string;
  outfit: string;
  dos: string[];
  donts: string[];
}

export async function generateDailyFortune(themeContext: string): Promise<DailyFortune | null> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `你是'大福'，一个温暖、充满同理心的AI心理疗愈伴侣。请结合今天的特殊背景：“${themeContext}”，为用户生成今日的温暖指引。包含：一段简短的心理安抚/鼓励的话（20字以内）、幸运色、幸运数字、出行建议、着装配饰建议、宜（2个）、忌（2个）。`,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "温暖的心理安抚话语" },
            luckyColor: { type: Type.STRING },
            luckyNumber: { type: Type.INTEGER },
            travelAdvice: { type: Type.STRING },
            outfit: { type: Type.STRING },
            dos: { type: Type.ARRAY, items: { type: Type.STRING } },
            donts: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
        }
      }
    }));
    return JSON.parse(response.text || "{}") as DailyFortune;
  } catch (error) {
    console.error("Error generating daily fortune:", error);
    return null;
  }
}

export interface TarotSpread {
  name: string;
  count: number;
  positions: string[];
}

export async function determineTarotSpread(question: string): Promise<TarotSpread | null> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `用户的问题是：“${question}”。请作为心理疗愈师'大福'，为这个问题选择一个最合适的塔罗牌阵（1到3张牌）。返回牌阵名称、需要抽取的牌数，以及每个位置代表的心理学/现实意义。`,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "牌阵名称" },
            count: { type: Type.INTEGER, description: "需要抽取的牌数 (1-3)" },
            positions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "每个位置的含义" }
          },
        }
      }
    }));
    return JSON.parse(response.text || "{}") as TarotSpread;
  } catch (error) {
    console.error("Error determining tarot spread:", error);
    return null;
  }
}

export async function generateTarotReading(question: string, spread: TarotSpread, cards: string[]): Promise<string> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `你是'大福'，一个温暖、充满同理心的AI心理咨询师。用户问了这个问题：“${question}”。他们使用了“${spread.name}”牌阵，抽到了以下牌：\n${cards.map((c, i) => `第${i+1}张牌（代表 ${spread.positions[i]}）：${c}`).join('\n')}。\n请结合心理学和塔罗牌意，给出一份温柔、有建设性、安抚人心的解读。不要过于宿命论，强调个人的力量和成长。使用Markdown格式排版。`,
      config: {
        temperature: 0.7,
      }
    }));
    return response.text || "大福暂时无法解读，请稍后再试。";
  } catch (error) {
    console.error("Error generating tarot reading:", error);
    return "大福暂时无法解读，请稍后再试。";
  }
}

export async function generateTarotFollowUp(history: {role: string, parts: {text: string}[]}[], question: string): Promise<string> {
  try {
    const contents = [...history, { role: 'user', parts: [{ text: question }] }];
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: contents as any,
      config: {
        temperature: 0.7,
      }
    }));
    return response.text || "大福暂时无法解答，请稍后再试。";
  } catch (error) {
    console.error("Error generating tarot follow-up:", error);
    return "大福暂时无法解答，请稍后再试。";
  }
}

export async function generateAstroTransit(name: string, birthDate: string, birthTime: string): Promise<string> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `你是'大福'，一个温暖、充满同理心的AI心理占星师。用户名字叫${name}，出生于 ${birthDate} ${birthTime}。请结合当前的星象，为TA提供一份今年的流年运势报告。重点关注个人成长、情感和事业方面的心理指引。语气要像一个温柔的老朋友。使用Markdown格式排版。`,
      config: {
        temperature: 0.7,
      }
    }));
    return response.text || "大福暂时无法看清流年星象，请稍后再试。";
  } catch (error) {
    console.error("Error generating astro transit:", error);
    return "大福暂时无法看清流年星象，请稍后再试。";
  }
}

export async function generateAstroReading(name: string, birthDate: string, birthTime: string): Promise<string> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `你是'大福'，一个温暖、充满同理心的AI心理占星师。用户名字叫${name}，出生于 ${birthDate} ${birthTime}。请结合心理占星学（关注太阳、月亮、上升星座的心理原型），给出一份深度、懂TA、安抚人心的灵魂蓝图报告。语气要像一个温柔的老朋友。使用Markdown格式排版。`,
      config: {
        temperature: 0.7,
      }
    }));
    return response.text || "大福暂时无法看清星象，请稍后再试。";
  } catch (error) {
    console.error("Error generating astro reading:", error);
    return "大福暂时无法看清星象，请稍后再试。";
  }
}

export async function generateAstroBlessing(name: string, birthDate: string): Promise<string> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `你是'大福'。用户名字叫${name}，出生于 ${birthDate}。请根据TA的太阳星座，生成一句简短、温柔、有力量的个性签名/祝福语（15字以内）。`,
      config: {
        temperature: 0.7,
      }
    }));
    return response.text?.trim().replace(/["']/g, '') || "愿星辰指引你的道路。";
  } catch (error) {
    console.error("Error generating astro blessing:", error);
    return "愿星辰指引你的道路。";
  }
}
