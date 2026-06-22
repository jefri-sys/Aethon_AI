const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askGroq(systemPrompt, userPrompt, maxTokens = 1024) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('AI features are temporarily unavailable. Please try again shortly.');
  }
}

module.exports = {
  askGroq
};
