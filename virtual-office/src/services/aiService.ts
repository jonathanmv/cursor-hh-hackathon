import type { IntentType, Conversation } from '../store/orchestrationStore';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callOpenAI(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock responses');
    return mockResponse(messages);
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Failed to call OpenAI:', error);
    return mockResponse(messages);
  }
}

function mockResponse(messages: ChatMessage[]): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';

  if (systemMessage.includes('analyze the intent')) {
    const msg = lastUserMessage.toLowerCase();

    // Check for greetings
    const greetings = ['hi', 'hello', 'hey', 'hola', 'ciao', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'yo'];
    if (greetings.some(g => msg === g || msg.startsWith(g + ' ') || msg.startsWith(g + '!'))) {
      return JSON.stringify({ intent: 'greeting', confidence: 0.95 });
    }

    // Check for help requests
    if (msg.includes('help') || msg.includes('what can you do') || msg.includes('how does this work')) {
      return JSON.stringify({ intent: 'help', confidence: 0.9 });
    }

    if (msg.includes('newsletter')) {
      return JSON.stringify({ intent: 'newsletter', confidence: 0.95 });
    }
    if (msg.includes('research')) {
      return JSON.stringify({ intent: 'research', confidence: 0.9 });
    }
    return JSON.stringify({ intent: 'unknown', confidence: 0.3 });
  }

  if (systemMessage.includes('extract information')) {
    return JSON.stringify({
      topic: lastUserMessage.includes('AI') ? 'AI and Technology' : 'General Topic',
      audience: 'general',
      tone: 'professional',
    });
  }

  if (systemMessage.includes('check if we have enough')) {
    return JSON.stringify({
      complete: true,
      missingFields: [],
      clarifyingQuestions: [],
    });
  }

  if (systemMessage.includes('Generate a newsletter')) {
    return JSON.stringify({
      subject: 'Your Weekly Newsletter Update',
      body: `# Weekly Newsletter\n\nDear readers,\n\nWelcome to this week's edition of our newsletter!\n\n## Highlights\n\n- Important update number one\n- Key insight from the week\n- Upcoming events to watch\n\n## Deep Dive\n\nThis week we're exploring exciting developments in your area of interest. Stay tuned for more insights!\n\n## What's Next\n\nWe have exciting content planned for next week.\n\nBest regards,\nYour Newsletter Team`,
    });
  }

  return 'I understand. How can I help you further?';
}

export interface IntentAnalysis {
  intent: IntentType;
  confidence: number;
}

export async function analyzeIntent(message: string): Promise<IntentAnalysis> {
  const response = await callOpenAI([
    {
      role: 'system',
      content: `You are an intent analyzer. Given a user message, analyze the intent and return a JSON object with:
- intent: one of "greeting", "help", "newsletter", "research", or "unknown"
- confidence: a number between 0 and 1

"greeting" = casual hellos, hi, hey, etc.
"help" = asking what you can do, how this works
"newsletter" = wants to create a newsletter or email content
"research" = wants research or information gathering
"unknown" = unclear what they want

Only respond with valid JSON, no other text.`,
    },
    {
      role: 'user',
      content: message,
    },
  ], 0.3);

  try {
    return JSON.parse(response);
  } catch {
    return { intent: 'unknown', confidence: 0.5 };
  }
}

export function getWelcomeMessage(): string {
  return `Hey! 👋 I'm your AI assistant. Here's what I can help you with:

📧 **Create a Newsletter** - Just say "Create a newsletter about [topic]" and I'll write one for you

🔍 **Research** - Ask me to research any topic (coming soon)

What would you like to do?`;
}

export function getHelpMessage(): string {
  return `Here's how I can help:

📧 **Newsletter Creation**
Just tell me what you want a newsletter about, and I'll:
1. Ask a few questions to understand your needs
2. Generate a professional newsletter
3. Send you a preview link to review and approve

**Try saying:**
• "Create a newsletter about AI trends"
• "I need a newsletter for my fitness audience"
• "Write a newsletter about productivity tips"

What would you like me to create?`;
}

export interface ExtractedInfo {
  topic?: string;
  audience?: string;
  tone?: string;
  additionalContext?: string;
  [key: string]: string | undefined;
}

export async function extractInfo(message: string, existingContext: Record<string, string>): Promise<ExtractedInfo> {
  const response = await callOpenAI([
    {
      role: 'system',
      content: `You are an information extractor. Given a user message and existing context, extract relevant information for creating a newsletter.

Current context: ${JSON.stringify(existingContext)}

Extract and return a JSON object with any of these fields if mentioned:
- topic: the main topic or subject
- audience: target audience
- tone: desired tone (professional, casual, etc.)
- additionalContext: any other relevant details

Only respond with valid JSON, no other text.`,
    },
    {
      role: 'user',
      content: message,
    },
  ], 0.3);

  try {
    return JSON.parse(response);
  } catch {
    return {};
  }
}

export interface CompletenessCheck {
  complete: boolean;
  missingFields: string[];
  clarifyingQuestions: string[];
}

export async function checkCompleteness(conversation: Conversation): Promise<CompletenessCheck> {
  const collectedInfo = JSON.stringify(conversation.collectedFields);
  const messageHistory = conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n');

  const response = await callOpenAI([
    {
      role: 'system',
      content: `You are evaluating if we have enough information to create a newsletter.

We need at minimum:
- A topic or subject matter
- Some context about what to include

Collected information: ${collectedInfo}

Conversation history:
${messageHistory}

Return a JSON object with:
- complete: boolean - true if we have enough info to proceed
- missingFields: array of strings listing what's still needed
- clarifyingQuestions: array of 1-2 questions to ask if not complete

Only respond with valid JSON, no other text.`,
    },
    {
      role: 'user',
      content: 'Check if we have enough information to create the newsletter.',
    },
  ], 0.3);

  try {
    return JSON.parse(response);
  } catch {
    return {
      complete: Object.keys(conversation.collectedFields).length >= 1,
      missingFields: [],
      clarifyingQuestions: ['Could you provide more details about what you\'d like in the newsletter?'],
    };
  }
}

export interface GeneratedNewsletter {
  subject: string;
  body: string;
}

export async function generateNewsletter(
  topic: string,
  context: Record<string, string>
): Promise<GeneratedNewsletter> {
  const response = await callOpenAI([
    {
      role: 'system',
      content: `You are Max, a professional copywriter. Generate a newsletter based on the provided topic and context.

Return a JSON object with:
- subject: A compelling email subject line (max 60 characters)
- body: The full newsletter content in Markdown format. Include:
  - A greeting
  - Main content sections with headers
  - Bullet points where appropriate
  - A call to action
  - A professional sign-off

Make the content engaging, informative, and well-structured.

Only respond with valid JSON, no other text.`,
    },
    {
      role: 'user',
      content: `Topic: ${topic}\n\nContext: ${JSON.stringify(context)}`,
    },
  ], 0.8);

  try {
    return JSON.parse(response);
  } catch {
    return {
      subject: `Newsletter: ${topic}`,
      body: `# ${topic}\n\nThank you for your interest in our newsletter!\n\nWe're working on bringing you the best content.\n\nBest regards,\nThe Team`,
    };
  }
}

export async function generateClarifyingQuestion(conversation: Conversation): Promise<string> {
  const messageHistory = conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n');

  const response = await callOpenAI([
    {
      role: 'system',
      content: `You are Alex, the orchestrator. Based on the conversation, generate a friendly clarifying question to gather more information about what the user wants in their newsletter.

Be conversational and specific. Ask about topics, audience, tone, or specific content they'd like included.

Conversation so far:
${messageHistory}

Respond with just the question, no JSON.`,
    },
    {
      role: 'user',
      content: 'Generate a clarifying question.',
    },
  ], 0.7);

  return response || 'What topics would you like the newsletter to cover? And who is your target audience?';
}
