'use server';

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function analyzePost(postContent: string) {
  const { text } = await generateText({
    model: google('gemini-3-flash-preview'),
    prompt: `Analyze the following social media post and extract the underlying framework or structure used. 
    If the content is short (like a tweet), infer the rhetorical structure or logical pattern that makes it effective.
    Keep it concise (2-3 sentences).
    
    Post Content:
    "${postContent}"`,
  });

  return text;
}

export async function generateIdeas(framework: string, topic: string, platform: string = 'LinkedIn', sourceContent?: string) {
  const isX = platform === 'X';

  const platformPrompt = isX
    ? `PLATFORM RULE: The output MUST be for X (Twitter). 
       - Keep ideas short, punchy, and tweet-like (under 280 chars or a short thread intro).
       - Focus on hooks and brevity.`
    : `PLATFORM RULE: The output is for LinkedIn.
       - Use whitespace, loops, and professional tone.
       - Length: 150-250 words.`;

  const stylePrompt = sourceContent
    ? `STYLING & VIBE CHECK (CRITICAL):
       You must attempt to mimic the tone, pacing, and "vibe" of the original inspiration post below, while adapting it to the new topic.
       - If the original uses short, choppy sentences, copy that.
       - If it uses deep emotional storytelling, copy that.
       - If it uses aggressive challenging questions, use them.
       
       ORIGINAL INSPIRATION POST:
       "${sourceContent.substring(0, 500)}..."` // Truncate to avoid blowing up context window if massive
    : "";

  const { text } = await generateText({
    model: google('gemini-3-flash-preview'),
    prompt: `Using the following framework: "${framework}", generate 3 distinct, high-quality ${platform} posts about the topic: "${topic}".
    
    ${platformPrompt}

    ${stylePrompt}

    CRITICAL INSTRUCTION: Return strictly a valid JSON object with this structure:
    {
      "ideas": [
        {
          "title": "Short catchy title for the angle",
          "content": "The full post content..."
        }
      ]
    }

    STRUCTURAL RULES (HIGHEST PRIORITY):
    - You MUST follow the structure/steps defined in the "framework" provided above. 
    - Do not invent a new structure if the framework prescribes one.

    FORMATTING & TONE GUIDELINES:
    - Use bullet points, arrows (e.g. ➟, ↳, ✅), and lists to break up text visually.
    - No big blocks of text.
    
    Do not include markdown code blocks (like \`\`\`json). Just the raw JSON string.`,
  });

  return text;
}

export async function rewritePost(content: string, instruction: 'concise' | 'detailed' | 'punchier') {
  const promptMap = {
    concise: "Make it concise, remove fluff, and get straight to the point. Keep the core message but cut the word count by ~30%.",
    detailed: "Expand on the key points. Add examples, context, or actionable advice to make it more comprehensive and valuable.",
    punchier: "Make it punchier. meaningful hooks, stronger verbs, short sentences. Optimize for high emotional impact and engagement."
  };

  const { text } = await generateText({
    model: google('gemini-3-flash-preview'),
    prompt: `Rewrite the following social media post content based on this instruction: "${promptMap[instruction]}".
        
        Original Content:
        "${content}"
        
        Return ONLY the rewritten content. Do not include quotes or conversational filler.`,
  });

  return text;
}
