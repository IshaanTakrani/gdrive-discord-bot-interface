import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  MessageType,
} from "discord.js";

import { createMessage } from "./db_services";

import { handlePrompt } from "./agent";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { ChatMessage } from "../types";

export async function run_bot() {
  let client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    // let newMessage: ChatMessage = {
    //   role: "bot",
    //   user_id: null,
    //   user_name: "doccy",
    //   display_name: "doccy",
    //   message_content: message.content,
    //   created_at: new Date(),
    // };

    // await createMessage(newMessage);

    console.log(
      `[${message.guild?.name} | #${message.channel.id}] ${message.author.tag}: ${message.content}`,
    );

    if (message.reference && message.reference.messageId) {
      try {
        const repliedMessage = await message.channel.messages.fetch(
          message.reference.messageId,
        );

        if (repliedMessage.author.id === client.user?.id) {
          reply(message);
          return;
        }
      } catch (error) {
        console.error("Could not fetch replied message:", error);
      }
    }

    if (message.content.toLowerCase().includes("doccy")) {
      reply(message);
      addToChatHistory(message);
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
}

async function reply(message: Message) {
  // Send a "thinking" message first
  const thinkingMessage = await message.reply("thinking...");

  let res: string =
    (await handlePrompt(`${message.author.displayName} ${message.content}`)) ??
    "an error has occurred :(";

  // Edit the thinking message with the actual response
  await thinkingMessage.edit(`${res}`);
  await addToChatHistory(thinkingMessage);
}

async function addToChatHistory(message: Message) {
  console.log("adding to chat history");
  console.log(message.author.id);
  console.log(message.author.username);
  let newMessage: ChatMessage = {
    role: "user",
    user_id: message.author.id,
    user_name: message.author.username,
    display_name: message.author.displayName ?? message.author.username,
    message_content: message.content,
    created_at: new Date(),
  };
  await createMessage(newMessage);
}
