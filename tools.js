import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import { exec } from "child_process";

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the actual tool function
async function executeCommand(cmd = "") {
  return new Promise((res, rej) => {
    exec(cmd, (error, data) => {
      if (error) {
        return res(`Error running command ${error}`);
      } else {
        res(data);
      }
    });
  });
}

const messages = [
  {
    role: "system",
    content: "You are a helpful assistant similar to ChatGPT, Claude etc",
  },
  {
    role: "user",
    content:
      "Based on my git repo, can you add untracked files to the staging area and commit them with a message 'This commit is made by AI Agent'",
  },
];


async function main() {
  try {
    while (true) {
      const response = await openAi.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "executeCommand",
              description: "Execute a command on the system.",
              parameters: {
                type: "object",
                properties: {
                  command: {
                    type: "string",
                    description: "A command to execute on the system",
                  },
                },
                required: ["command"],
              },
            },
          },
        ],
      });

      const responseMessage = response.choices[0].message;
      console.log(
        "responseMessage 😇😇😇",
        JSON.stringify(responseMessage, null, 2)
      );

      // Add the assistant's response to the conversation
      messages.push(responseMessage);

      if (responseMessage.tool_calls) {
        // Handle multiple tool calls
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === "executeCommand") {
            const args = JSON.parse(toolCall.function.arguments);

            const result = await executeCommand(args.command);
            console.log("result 🔥🔥🔥", result);

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          }
        }
      } else {
        // Assistant gave final text/code answer
        if (responseMessage.content) {
          console.log("Assistant Response:\n", responseMessage.content);
        }
        break;
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
