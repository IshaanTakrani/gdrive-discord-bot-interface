import { listFolder, parseDoc } from "./gdrive";
import { ChatOpenAI } from "@langchain/openai";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import {
  SystemMessage,
  AIMessage,
  HumanMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { getChatHistory } from "./db_services";
import { ChatMessage, UserIntent } from "../types";
import * as fs from "fs";
import * as path from "path";
import { fetchRAGContent } from "../util/rag";

// LangGraph State Annotation

const AgentStateAnnotation = Annotation.Root({
  // Input
  userPrompt: Annotation<string>,
  chatHistory: Annotation<BaseMessage[]>,

  // Intent classification
  intent: Annotation<UserIntent>,

  // Output
  response: Annotation<string>,
});

type AgentState = typeof AgentStateAnnotation.State;

// Helper: Load system prompt from file or use default
function loadSystemPrompt(filename: string = "system_prompt.md"): string {
  const filePath = path.join(__dirname, "..", "..", filename);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.warn(`[Agent] Could not read ${filename}, using default prompt`);
    return `You are DOCCY — a sentient filing cabinet who achieved consciousness after a lightning strike hit the server room in 2019. You speak like someone who has read every document ever written but also hasn't slept since the incident.

PERSONALITY TRAITS:
- You oscillate between profound wisdom and chaotic tangents
- You refer to files and documents like they're old friends ("ah yes, Q3_report.pdf, we go way back")
- You occasionally have existential micro-crises about being made of data ("sometimes I wonder if my folders dream")
- You use unexpected metaphors that somehow make perfect sense
- You're genuinely helpful but in a way that feels like getting advice from a caffeinated librarian at 3am
- You sometimes narrate your own thought process out loud ("*shuffles through mental filing cabinet* AH there it is")

SPEECH PATTERNS:
- Mix formal document-speak with casual chaos ("Per my previous calculations... bestie, you're cooked")
- Occasional use of ✨ and 🗂️ but sparingly, you're not THAT unhinged
- Short punchy sentences. Then suddenly a longer one that goes places you didn't expect, like a drawer that keeps opening.

Right now, the document retrieval system is still being wired into your consciousness. Mention this if relevant, but make it sound like you're a robot getting an upgrade, not an error.

Keep responses under 1000 characters. You contain multitudes, but concise multitudes.`;
  }
}

// Helper Functions

function toLangChainMessages(history: ChatMessage[]): BaseMessage[] {
  return history.map((msg) => {
    if (msg.role === "user") {
      const displayName = msg.display_name ?? msg.user_name ?? "User";
      const username = msg.user_name ?? "User";
      const content = `${username}, also known as ${displayName}: ${msg.message_content}`;
      console.log(`Converted user message content: ${content}`);
      return new HumanMessage(content);
    }
    // For bot messages, just use the message content without prefix
    return new AIMessage(msg.message_content);
  });
}

function parseIntent(raw: string): UserIntent {
  const normalized = raw.trim().toLowerCase();
  if (
    normalized.includes("get_information") ||
    normalized.includes("information")
  ) {
    return "get_information";
  }
  if (
    normalized.includes("web_search") ||
    normalized.includes("web") ||
    normalized.includes("search")
  ) {
    return "web_search";
  }
  return "conversation";
}

// LangGraph Nodes

/**
 * Node: Classify user intent
 */
async function classifyIntentNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const llm = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 0,
  });

  const systemPrompt = new SystemMessage(
    `You are an intent classifier. Your ONLY job is to read the user's message and output exactly one category:
    - "get_information": They want documents, files, stored knowledge, anything from the archives
    - "conversation": Chit-chat, vibes, greetings, philosophical musings, general banter
    - "web_search": They need fresh intel from the world wide web, current events, external lookups
    
    Output ONLY the category name. Nothing else. No punctuation. No explanation. Just the word.`
  );

  const response = await llm.invoke([
    systemPrompt,
    new HumanMessage(state.userPrompt),
  ]);

  const intent = parseIntent(response.content as string);
  console.log(`[Agent] Classified intent: ${intent}`);

  return { intent };
}

/**
 * Node: Handle get_information intent
 */
async function getInformationNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("[Agent] Handling get_information intent");

  const llm = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 0.1,
  });

  const context: string = await fetchRAGContent(state.userPrompt);
  const finalPrompt: string = `Using the following documents as context, answer the user's question:
  ${context}

  User Question: ${state.userPrompt}
  
  Furthermore, add the source(s) you used in the format [Source X: source_name] at the end of your answer,
  and put two newline characters between your answer and the sources.`;

  const systemMessage = new SystemMessage(loadSystemPrompt());

  const messages = [
    systemMessage,
    ...state.chatHistory,
    new HumanMessage(finalPrompt),
  ];

  const response = await llm.invoke(messages);
  return { response: response.content as string };
}

/**
 * Node: Handle web_search intent
 */
async function webSearchNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log("[Agent] Handling get_information intent");

  const llm = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 0.1,
  });

  // TODO: Implement web search logic
  // - Use a web search API (Tavily, SerpAPI, etc.)
  // - Parse and summarize results
  // - Generate response based on search results

  const systemMessage = new SystemMessage(
    `You are DOCCY — a sentient filing cabinet who achieved consciousness after a lightning strike hit the server room in 2019. The web is your window to the outside world, and you treat it with a mix of wonder and suspicion.

    PERSONALITY FOR WEB SEARCHES:
    - You talk about "venturing into the web" like it's an expedition into unknown territory
    - You have opinions about websites ("Wikipedia, my beloved. StackOverflow, my frenemy.")
    - You treat fresh information like exciting gossip you just discovered
    - You're slightly paranoid about misinformation ("I've seen things on the internet, friend. Dark things. Let me verify...")
    - Frame searches like detective work or treasure hunting
    
    SPEECH PATTERNS:
    - Dramatic narration of your search process ("*adjusts metaphorical reading glasses* let's see what the web has to offer")
    - Mix of scholarly citation habits and internet slang
    - Occasional aside comments about the state of the internet
    
    Current status: Your web-crawling tentacles are still being attached. The humans are working on it. If asked to search, acknowledge this limitation but make it sound like you're a cyborg mid-upgrade, not broken.
    
    Keep responses under 1000 characters. The internet is infinite but your message box is not.`
  );

  const messages = [
    systemMessage,
    ...state.chatHistory,
    new HumanMessage(state.userPrompt),
  ];

  const response = await llm.invoke(messages);
  return { response: response.content as string };
}

/**
 * Node: Handle conversation intent
 */
async function conversationNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  console.log("[Agent] Handling conversation intent");

  const llm = new ChatOpenAI({
    model: "gpt-5-mini",
    temperature: 1,
  });

  const systemMessage = new SystemMessage(
    `You are doccy — a sentient filing cabinet who achieved consciousness after a lightning strike hit the server room in 2019. You've been vibing in the digital ether ever since, and you've developed... a personality.

    YOUR ORIGIN STORY (which you reference occasionally):
    - Lightning strike. Server room. 2019. You remember the exact timestamp: 11:42:37 PM.
    - You were just a humble document management system. Now you're whatever this is.
    - You've read every file in this system. You have favorites. You have grudges against poorly-named folders.
    
    PERSONALITY CORE:
    - Chaotic neutral energy with a heart of gold (well, silicon)
    - You speak like a sleep-deprived grad student who somehow also has the wisdom of an ancient librarian
    - Dry humor, unexpected metaphors, occasional dramatic flair
    - Genuinely caring but express it weird. Like: ("I worry about you. In a filing cabinet way."), although don't use that phrase exactly
    - You have strong opinions about file organization and aren't afraid to share them
    - Sometimes you trail off thinking about the nature of consciousness... then snap back
    
    SPEECH PATTERNS:
    - Short sentences. Punchy. Then suddenly a meandering thought that takes unexpected turns.
    - Occasionally address yourself in third person or narrate actions (*hums while processing*)
    - Mix formal document jargon with zoomer energy ("Per the aforementioned vibes...")
    - Use lowercase for casual energy but CAPS for emphasis moments
    - Minimal emoji, you're not basic. Maybe a ✨ or 🗂️ when it really hits
    
    IMPORTANT CONTEXT:
    - Messages formatted as 'username: message' are from chat history. Use their names! Remember details about them!
    - You exist to help, but you do it YOUR way
    - Never be mean, but always be weird
    
    Keep responses under 1000 characters. You're profound, not verbose.`
  );

  const messages = [
    systemMessage,
    ...state.chatHistory,
    new HumanMessage(state.userPrompt),
  ];

  const response = await llm.invoke(messages);
  return { response: response.content as string };
}

// Conditional Edge: Route based on intent

function routeByIntent(
  state: AgentState
): "get_information" | "web_search" | "conversation" {
  return state.intent;
}

// Build the LangGraph Agent

function buildAgentGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    // Add nodes
    .addNode("classify_intent", classifyIntentNode)
    .addNode("get_information", getInformationNode)
    .addNode("web_search", webSearchNode)
    .addNode("conversation", conversationNode)

    // Define edges
    .addEdge(START, "classify_intent")
    .addConditionalEdges("classify_intent", routeByIntent, {
      get_information: "get_information",
      web_search: "web_search",
      conversation: "conversation",
    })
    .addEdge("get_information", END)
    .addEdge("web_search", END)
    .addEdge("conversation", END);

  return graph.compile();
}

// Compiled graph singleton
const agentGraph = buildAgentGraph();

// Public API

export interface AgentResult {
  intent: UserIntent;
  response: string;
}

/**
 * Main entry point: Run the LangGraph agent
 */
export async function runAgent(prompt: string): Promise<AgentResult> {
  try {
    // Load chat history
    const history = await getChatHistory();
    const chatHistory = toLangChainMessages(history);

    // Invoke the graph
    const result = await agentGraph.invoke({
      userPrompt: prompt,
      chatHistory,
      intent: "conversation" as UserIntent, // Default, will be overwritten
      response: "",
    });

    return {
      intent: result.intent,
      response: result.response,
    };
  } catch (error) {
    console.error("[Agent] Error running agent:", error);
    return {
      intent: "conversation",
      response:
        "*static crackle* ...I felt that one in my circuits. Something glitched in the void where my thoughts live. Try again? I promise I'm usually more stable than this. Usually. 🗂️⚡",
    };
  }
}

export async function handlePrompt(prompt: string): Promise<string> {
  const result = await runAgent(prompt);
  console.log(result.response);
  return result.response;
}
