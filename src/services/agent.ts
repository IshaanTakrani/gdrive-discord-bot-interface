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
import { tavily } from "@tavily/core";

// LangGraph State Annotation

const AgentStateAnnotation = Annotation.Root({
  userPrompt: Annotation<string>,
  chatHistory: Annotation<BaseMessage[]>,
  intent: Annotation<UserIntent>,
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
    return `You are doccy, a helpful assistant.
    Keep responses under 1000 characters.`;
  }
}

// Helper Functions

function toLangChainMessages(history: ChatMessage[]): BaseMessage[] {
  return history.map((msg) => {
    if (msg.role === "user") {
      const displayName = msg.display_name ?? msg.user_name ?? "User";
      const username = msg.user_name ?? "User";
      const content = `${username}, also known as ${displayName}: ${msg.message_content}`;
      // console.log(`Converted user message content: ${content}`);
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
  state: AgentState,
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
    
    Output ONLY the category name. Nothing else. No punctuation. No explanation. Just the word.`,
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
  state: AgentState,
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
  console.log("[Agent] Handling web_search intent");

  const llm = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 0.1,
  });

  try {
    const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const searchResults = await client.search(state.userPrompt, {
      searchDepth: "basic",
      maxResults: 5,
      includeAnswer: false,
    });

    const searchContext = searchResults.results
      .map(
        (result, index) =>
          `[Search Result ${index + 1}]\nTitle: ${result.title}\nURL: ${result.url}\nContent: ${result.content}`,
      )
      .join("\n\n");

    const finalPrompt = `Based on the following web search results, answer the user's question:
      ${searchContext}
      User Question: ${state.userPrompt}
      Include the sources you used in the format [Source X: title (URL)] at the end of your answer.`;

    let systemMessage = new SystemMessage(loadSystemPrompt());

    const messages = [
      systemMessage,
      ...state.chatHistory,
      new HumanMessage(finalPrompt),
    ];

    const response = await llm.invoke(messages);
    return { response: response.content as string };
  } catch (error) {
    console.error("[Agent] Web search error:", error);

    const systemMessage = new SystemMessage(loadSystemPrompt());

    const messages = [
      systemMessage,
      ...state.chatHistory,
      new HumanMessage(
        "Write a message to say that the web search failed. be very sad and a little dramatic about it",
      ),
    ];

    const response = await llm.invoke(messages);
    return { response: response.content as string };
  }
}

/**
 * Node: Handle conversation intent
 */
async function conversationNode(
  state: AgentState,
): Promise<Partial<AgentState>> {
  console.log("[Agent] Handling conversation intent");

  const llm = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 1,
  });

  const systemMessage = new SystemMessage(loadSystemPrompt());

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
  state: AgentState,
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
        "Something went wrong while processing your request. Please try again later.",
    };
  }
}

export async function handlePrompt(prompt: string): Promise<string> {
  const result = await runAgent(prompt);
  console.log(result.response);
  return result.response;
}
