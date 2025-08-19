import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the actual tool function
async function getWeatherDetails(city) {
  // This is a mock implementation - in a real app, you'd call a weather API
  console.log(`Getting weather for ${city}...`);
  return {
    city: city,
    temperature: "72°F",
    condition: "Sunny",
    humidity: "45%",
  };
}

const messages = [
  {
    role: "system",
    content:
      "You are a helpful assistant that can answer questions about the weather.",
  },
  {
    role: "user",
    content: "What is the weather in Denton?",
  },
];

async function main() {
  try {
    const response = await openAi.chat.completions.create({
      model: "gpt-5",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "getWeatherDetails",
            description: "Get today's weather details for a city.",
            parameters: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  description: "A city name",
                },
              },
              required: ["city"],
            },
          },
        },
      ],
    });

    const responseMessage = response.choices[0].message;
    console.log(JSON.stringify(responseMessage, null, 2));

    // Check if the AI wants to call a tool
    if (responseMessage.tool_calls) {
      // Add the assistant's message to the conversation
      messages.push(responseMessage);

      // Execute each tool call
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "getWeatherDetails") {
          const args = JSON.parse(toolCall.function.arguments);
          const weatherData = await getWeatherDetails(args.city);

          // Add the tool result to the conversation
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(weatherData),
          });
        }
      }

      // Get the final response from the AI
      const finalResponse = await openAi.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
      });

      console.log("Final response:", finalResponse.choices[0].message.content);
    } else {
      console.log("Response:", responseMessage.content);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
