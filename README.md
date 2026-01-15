# GDrive Discord Bot Interface

This project is a Discord bot that integrates with Google Drive and utilizes AI capabilities through LangChain and OpenAI. It is designed to act as an intelligent interface for managing or interacting with Google Drive content via Discord commands.

## Features

- **Discord Integration**: Built using `discord.js` to interact with users directly within Discord servers.
- **Google Drive Access**: Utilizes `googleapis` to interface with Google Drive, likely for searching, retrieving, or managing files.
- **AI-Powered Agents**: Implements `langchain` and `@langchain/openai` to provide intelligent responses, potentially for querying document content or automating workflows.
- **State Management**: Uses `@langchain/langgraph` for managing complex conversation states or agent workflows.
- **Database Support**: Includes `mongodb` and `@langchain/mongodb`, suggesting persistent storage for conversation history, user preferences, or vector embeddings.
- **Data Validation**: Uses `zod` for strong schema validation.

## Prerequisites

- Node.js (Version 20+)
- npm or yarn
- A Discord Bot Token
- Google Cloud Platform Service Account (for Google Drive API)
- OpenAI API Key
- MongoDB Instance

## Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root directory. You will likely need the following environment variables based on the dependencies:

- `DISCORD_TOKEN`: Your Discord bot token.
- `OPENAI_API_KEY`: Your OpenAI API key.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google Cloud Service Account JSON key or specific credentials (CLIENT_ID, CLIENT_SECRET, etc.).
- `MONGODB_URI`: Connection string for your MongoDB instance.
- `CLIENT_ID`: Discord Application Client ID (for deploying slash commands).

## Development

To start the bot in development mode with hot reloading:

```bash
npm run dev
```
