require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== LLM Provider Interface =====
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'moonshot';

// Moonshot Provider
const moonshotProvider = {
  name: 'moonshot',
  apiKey: process.env.MOONSHOT_API_KEY,
  baseUrl: process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1',
  model: process.env.MOONSHOT_MODEL || 'kimi-k2-thinking-turbo',

  async call(messages, maxTokens = 1024, temperature = 0.7) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Moonshot API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};

// Doubao (Volcano Engine) Provider
const doubaoProvider = {
  name: 'doubao',
  apiKey: process.env.DOUBAO_API_KEY,
  baseUrl: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  model: process.env.DOUBAO_MODEL || 'ep-20241203163721-5xqz5',

  async call(messages, maxTokens = 1024, temperature = 0.7) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Doubao API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};

// Get current provider
function getLLMProvider() {
  switch (LLM_PROVIDER.toLowerCase()) {
    case 'doubao':
      return doubaoProvider;
    case 'moonshot':
    default:
      return moonshotProvider;
  }
}

// 中间件
app.use(cors());
app.use(express.json());

// 限流：每分钟最多 30 次请求
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

// 重试函数
async function withRetry(operation, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt >= maxRetries) throw error;

      // 指数退避
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ===== 每日运势 API =====
app.post('/api/fortune/daily', async (req, res) => {
  try {
    const { themeContext } = req.body;
    const provider = getLLMProvider();

    const content = await withRetry(() =>
      provider.call([
        {
          role: 'system',
          content: '你是一个温暖、充满同理心的AI心理疗愈伴侣，名叫"大福"。你的语气温柔、安抚人心，像一位知心朋友。请用 JSON 格式输出。'
        },
        {
          role: 'user',
          content: `你是'大福'，一个温暖、充满同理心的AI心理疗愈伴侣。请结合今天的特殊背景："${themeContext}"，为用户生成今日的温暖指引。

请返回以下 JSON 格式：
{
  "message": "一段简短的心理安抚/鼓励的话（20字以内）",
  "luckyColor": "幸运色名称",
  "luckyNumber": 数字,
  "travelAdvice": "出行建议（简短）",
  "outfit": "着装配饰建议（简短）",
  "dos": ["宜做的事1", "宜做的事2"],
  "donts": ["忌做的事1", "忌做的事2"]
}

只返回 JSON，不要其他文字。`
        }
      ])
    );

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    res.json({ code: 200, data, message: 'success' });
  } catch (error) {
    console.error('Daily fortune error:', error);
    res.status(500).json({ code: 500, message: '生成运势失败' });
  }
});

// ===== 塔罗 API =====
// 选择牌阵
app.post('/api/tarot/spread', async (req, res) => {
  try {
    const { question } = req.body;
    const provider = getLLMProvider();

    const content = await withRetry(() =>
      provider.call([
        {
          role: 'system',
          content: '你是"大福"，一个温暖、充满同理心的AI心理咨询师和塔罗师。'
        },
        {
          role: 'user',
          content: `用户的问题是："${question}"。请作为心理疗愈师'大福'，为这个问题选择一个最合适的塔罗牌阵（1到3张牌）。

请返回以下 JSON 格式：
{
  "name": "牌阵名称",
  "count": 数字（1-3）,
  "positions": ["第一张牌代表的意义", "第二张牌代表的意义", ...]
}

只返回 JSON，不要其他文字。`
        }
      ])
    );

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    res.json({ code: 200, data, message: 'success' });
  } catch (error) {
    console.error('Tarot spread error:', error);
    res.status(500).json({ code: 500, message: '选择牌阵失败' });
  }
});

// 塔罗解读
app.post('/api/tarot/reading', async (req, res) => {
  try {
    const { question, spread, cards } = req.body;
    const provider = getLLMProvider();

    const cardInfo = cards.map((c, i) => `第${i+1}张牌（代表 ${spread.positions[i]}）：${c}`).join('\n');

    const content = await withRetry(() =>
      provider.call([
        {
          role: 'system',
          content: '你是"大福"，一个温暖、充满同理心的AI心理咨询师。你的解读温柔、有建设性、安抚人心。不要过于宿命论，强调个人的力量和成长。使用 Markdown 格式排版。'
        },
        {
          role: 'user',
          content: `你是'大福'。用户问了这个问题："${question}"。他们使用了"${spread.name}"牌阵，抽到了以下牌：
${cardInfo}

请结合心理学和塔罗牌意，给出一份温柔、有建设性、安抚人心的解读。不要过于宿命论，强调个人的力量和成长。使用 Markdown 格式排版。`
        }
      ], 2048)
    );

    res.json({
      code: 200,
      data: { reading: content },
      message: 'success'
    });
  } catch (error) {
    console.error('Tarot reading error:', error);
    res.status(500).json({ code: 500, message: '解读失败' });
  }
});

// 塔罗追问
app.post('/api/tarot/followup', async (req, res) => {
  try {
    const { history, question } = req.body;
    const provider = getLLMProvider();

    const messages = [
      {
        role: 'system',
        content: '你是"大福"，一个温暖、充满同理心的AI心理咨询师。'
      },
      {
        role: 'assistant',
        content: '我是大福，你的AI心理疗愈伴侣。我会记住我们之前的对话，继续为你提供温柔的指引。'
      },
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.content
      })),
      {
        role: 'user',
        content: question
      }
    ];

    const content = await withRetry(() => provider.call(messages));

    res.json({
      code: 200,
      data: { reply: content },
      message: 'success'
    });
  } catch (error) {
    console.error('Tarot followup error:', error);
    res.status(500).json({ code: 500, message: '追问失败' });
  }
});

// ===== 星盘 API =====
// 本命星盘解读
app.post('/api/astro/reading', async (req, res) => {
  try {
    const { name, birthDate, birthTime } = req.body;
    const provider = getLLMProvider();

    const content = await withRetry(() =>
      provider.call([
        {
          role: 'system',
          content: '你是"大福"，一个温暖、充满同理心的AI心理占星师。语气要像一位温柔的老朋友。使用 Markdown 格式排版。'
        },
        {
          role: 'user',
          content: `你是'大福'。用户名字叫${name}，出生于 ${birthDate} ${birthTime}。

请结合心理占星学（关注太阳、月亮、上升星座的心理原型），给出一份深度、懂TA、安抚人心的灵魂蓝图报告。语气要像一个温柔的老朋友。使用 Markdown 格式排版。`
        }
      ], 2048)
    );

    res.json({
      code: 200,
      data: { reading: content },
      message: 'success'
    });
  } catch (error) {
    console.error('Astro reading error:', error);
    res.status(500).json({ code: 500, message: '生成星盘失败' });
  }
});

// 流年运势
app.post('/api/astro/transit', async (req, res) => {
  try {
    const { name, birthDate, birthTime } = req.body;
    const provider = getLLMProvider();

    const content = await withRetry(() =>
      provider.call([
        {
          role: 'system',
          content: '你是"大福"，一个温暖、充满同理心的AI心理占星师。语气要像一位温柔的老朋友。使用 Markdown 格式排版。'
        },
        {
          role: 'user',
          content: `你是'大福'。用户名字叫${name}，出生于 ${birthDate} ${birthTime}。

请结合当前的星象，为TA提供一份今年的流年运势报告。重点关注个人成长、情感和事业方面的心理指引。语气要像一个温柔的老朋友。使用 Markdown 格式排版。`
        }
      ], 2048)
    );

    res.json({
      code: 200,
      data: { transit: content },
      message: 'success'
    });
  } catch (error) {
    console.error('Astro transit error:', error);
    res.status(500).json({ code: 500, message: '生成运势失败' });
  }
});

// 祝福语
app.post('/api/astro/blessing', async (req, res) => {
  try {
    const { name, birthDate } = req.body;
    const provider = getLLMProvider();

    const content = await withRetry(() =>
      provider.call([
        {
          role: 'system',
          content: '你是"大福"，一个温暖、充满同理心的AI心理疗愈伴侣。'
        },
        {
          role: 'user',
          content: `用户名字叫${name}，出生于 ${birthDate}。请根据TA的太阳星座，生成一句简短、温柔、有力量的个性签名/祝福语（15字以内）。只返回这句话，不要其他内容。`
        }
      ], 100)
    );

    const blessing = content.trim().replace(/["']/g, '');

    res.json({
      code: 200,
      data: { blessing: blessing || '愿星辰指引你的道路。' },
      message: 'success'
    });
  } catch (error) {
    console.error('Astro blessing error:', error);
    res.json({
      code: 200,
      data: { blessing: '愿星辰指引你的道路。' },
      message: 'success'
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  const provider = getLLMProvider();
  res.json({ code: 200, message: 'Service is running', provider: provider.name });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ code: 500, message: 'Internal server error' });
});

app.listen(PORT, () => {
  const provider = getLLMProvider();
  console.log(`🎐 大福服务器运行在端口 ${PORT}`);
  console.log(`📡 API 地址: http://localhost:${PORT}/api`);
  console.log(`🤖 使用模型: ${provider.name} / ${provider.model}`);
});
