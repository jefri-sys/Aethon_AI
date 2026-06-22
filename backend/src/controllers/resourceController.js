const ExplorerSession = require('../models/ExplorerSession');
const User = require('../models/User');
const { askGroq } = require('../services/groqService');
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const { buildPersonalizedSystemPrompt } = require('../services/buildPersonalizedPrompt');

const searchEducationalResources = async (query) => {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' tutorial or course')}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await response.text();
    
    const regex = /<a class="result__url" href="([^"]+)">/g;
    let rawUrls = [];
    let m;
    while((m = regex.exec(html)) && rawUrls.length < 7) {
      let href = m[1];
      if (href.startsWith('//duckduckgo.com/l/?uddg=')) {
        href = decodeURIComponent(href.split('uddg=')[1].split('&')[0]);
      }
      if (!href.includes('google.com') && !href.includes('duckduckgo.com')) {
        rawUrls.push(href);
      }
    }
    
    if (rawUrls.length === 0) throw new Error("No search results found");

    const prompt = `The user searched for educational resources on: "${query}".
I performed a live web search and retrieved these 100% REAL URLs:
${rawUrls.join('\n')}

Task: Select the 3 best educational URLs from the list above and format them into a JSON array.
CRITICAL: You MUST ONLY use the exact URLs provided in the list above. Do not modify the URLs. Do not hallucinate your own URLs.

Format EXACTLY like this:
[
  {
    "title": "Clean, descriptive title based on the URL",
    "url": "https://...",
    "type": "video" | "tutorial" | "docs" | "practice",
    "description": "Short description of what this resource is."
  }
]
No markdown, no explanation, just the JSON array.`;

    const groqRes = await askGroq(prompt, "You return strict JSON arrays.");
    if (!groqRes.success) throw new Error(groqRes.message);
    
    const jsonMatch = groqRes.data.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse JSON array");
    
    const results = JSON.parse(jsonMatch[0]);
    return { query, results };
  } catch (error) {
    console.error("Search extraction failed:", error);
    return { query, results: [{ title: `Search Results for ${query}`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, type: 'web', description: 'Click to view Google search results' }] };
  }
};

const exploreResources = async (req, res) => {
  try {
    const { topic, experienceLevel, focusArea, timeframe } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const prompt = `You are an expert academic curator and career counselor. 
Topic: "${topic}" 
User Context:
- Current Experience Level: ${experienceLevel || "Beginner"}
- Focus Area / Goal: ${focusArea || "General comprehensive learning"}
- Timeframe to Complete: ${timeframe || "Not specified"}

Task: Create a highly specific, actionable, and practical JSON learning roadmap. 
Requirements:
1. DO NOT be vague. Provide real, extremely popular platform URLs (e.g., roadmap.sh, W3Schools, GeeksforGeeks, MDN Web Docs, freeCodeCamp).
2. The steps must be sequential and make logical sense.
3. Every step must have at least 2 distinct resources.
4. CRITICAL RULES FOR URLs to prevent broken 404 links:
   - NEVER provide specific YouTube watch IDs (e.g., youtube.com/watch?v=...) because AI always hallucinates these and they lead to dead pages! Instead, link to a YouTube channel or a YouTube Search URL (e.g., https://www.youtube.com/results?search_query=React+Crash+Course).
   - Use top-level domains or highly established paths for documentation (e.g., https://react.dev/learn, https://www.w3schools.com/react/).
   - Do NOT invent fake slugs or article paths.

Return ONLY a valid JSON object matching this schema:
{ 
  "topic": "...", 
  "level": "${experienceLevel || "beginner"}", 
  "roadmap": [ 
    { "step": 1, "title": "...", "description": "Detailed actionable description...", 
      "resources": [ 
        { "type": "docs/tutorial/video/practice", 
          "title": "Specific Course/Article Name", "url": "https://...", "estimatedTime": "..." } 
      ] 
    } 
  ], 
  "totalEstimatedTime": "${timeframe || "..."}" 
}
Do not include any markdown formatting outside the JSON object.`;

    const userDoc = await User.findById(req.user.id).select('aiPreferences');
    const finalPrompt = buildPersonalizedSystemPrompt({
      basePrompt: prompt,
      scope: 'resourceExplorer',
      aiPreferences: userDoc?.aiPreferences,
      formatGuard: true
    });

    const groqResponse = await askGroq(finalPrompt, "You return strict JSON.");
    
    if (!groqResponse.success) {
      return res.status(500).json({ success: false, message: groqResponse.message });
    }

    // Parse JSON
    let roadmapData;
    try {
      const contentString = groqResponse.data;
      const jsonMatch = contentString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roadmapData = JSON.parse(jsonMatch[0]);
      } else {
        roadmapData = JSON.parse(contentString);
      }
    } catch (parseError) {
      console.error("Groq JSON parsing error:", parseError);
      return res.status(500).json({ success: false, message: 'Failed to parse roadmap data' });
    }

    let allResources = [];
    if (roadmapData.roadmap) {
      roadmapData.roadmap.forEach(step => {
        if (step.resources) {
          step.resources.forEach(r => {
            allResources.push({
              title: r.title,
              url: r.url,
              type: r.type,
              estimatedTime: r.estimatedTime,
              fromInitialSearch: true
            });
          });
        }
      });
    }

    const session = new ExplorerSession({
      user: req.user.id,
      topic,
      roadmap: roadmapData,
      resources: allResources,
      messages: []
    });
    await session.save();

    res.status(200).json({ success: true, data: roadmapData, sessionId: session._id, session });
  } catch (error) {
    console.error("Explore resources error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const sessions = await ExplorerSession.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('topic createdAt');
    
    const history = sessions.map(s => ({
      _id: s._id,
      query: s.topic,
      timestamp: s.createdAt
    }));
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await ExplorerSession.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const { sessionId } = req.params;
    
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const session = await ExplorerSession.findOne({ _id: sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const systemPrompt = `You are an academic resource assistant.
Context Topic: ${session.topic}
Current Roadmap Resources:
${session.resources.map(r => `- [${r.type}] ${r.title} (${r.url})`).join('\n')}

When answering, rely on the existing resources if they answer the user's question.
Do NOT invent URLs. If the user asks for resources you don't have, use the search tool.`;

    const userDoc = await User.findById(req.user.id).select('aiPreferences');
    const finalSystemPrompt = buildPersonalizedSystemPrompt({
      basePrompt: systemPrompt,
      scope: 'resourceExplorer',
      aiPreferences: userDoc?.aiPreferences
    });

    const messages = [
      { role: "system", content: finalSystemPrompt },
      ...session.messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: "user", content: message }
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "searchEducationalResources",
          description: "Search the web for educational resources, tutorials, courses, and documentation related to a specific topic.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to find educational materials."
              }
            },
            required: ["query"]
          }
        }
      }
    ];

    let response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
      max_tokens: 1024
    });

    let responseMessage = response.choices[0].message;
    let searchPerformed = false;
    let replyText = responseMessage.content || "";

    if (responseMessage.tool_calls) {
      searchPerformed = true;
      messages.push(responseMessage);
      
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "searchEducationalResources") {
          const args = JSON.parse(toolCall.function.arguments);
          const searchResults = await searchEducationalResources(args.query);
          
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "searchEducationalResources",
            content: JSON.stringify(searchResults)
          });

          searchResults.results.forEach(r => {
            if (!session.resources.some(existing => existing.url === r.url)) {
              session.resources.push({
                title: r.title,
                url: r.url,
                type: r.type,
                estimatedTime: "Unknown",
                fromInitialSearch: false
              });
            }
          });
        }
      }

      const finalResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        max_tokens: 1024
      });

      replyText = finalResponse.choices[0].message.content || "";
    }

    session.messages.push({
      role: 'user',
      content: message,
      searchPerformed: false
    });

    const assistantMsg = {
      role: 'assistant',
      content: replyText,
      searchPerformed
    };
    session.messages.push(assistantMsg);

    await session.save();

    res.status(200).json({ 
      success: true, 
      reply: assistantMsg,
      newResources: searchPerformed ? session.resources : null
    });

  } catch (error) {
    console.error("Explorer chat error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ExplorerSession.findOneAndDelete({ _id: sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.status(200).json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  exploreResources,
  getHistory,
  getSession,
  chat,
  deleteSession
};
