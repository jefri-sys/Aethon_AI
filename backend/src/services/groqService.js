const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const askGroq = async (prompt, systemPrompt = "", history = []) => {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  // Include conversation history if provided
  if (history && history.length > 0) {
    messages.push(...history);
  }

  messages.push({ role: "user", content: prompt });

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });
    return { success: true, data: response.choices[0].message.content };
  } catch (error) {
    if (error.status === 429) {
      return { 
        success: false, 
        limitHit: true,
        message: "AI features are temporarily unavailable. Our daily AI limit has been reached. Please try again tomorrow." 
      };
    }
    return { 
      success: false, 
      limitHit: false,
      message: "AI is temporarily unavailable. Please try again shortly." 
    };
  }
};

module.exports = { askGroq };
