import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // apiKey: process.env.GEMINI_API_KEY,
  // baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function getWeatherDetails(cityName) {
  console.log("🔍 getWeatherDetails");
  const response = await axios.get(
    `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${process.env.OPEN_WEATHER_API_KEY}&units=metric`
  );
  return response.data.main.temp;
}

const SYSTEM_PROMPT = `
You are an AI similar to Chatgpt, gemini and claude. But you should answer in the below format only.
You should always follow START, THINK, OUTPUT format. and if you have acces to tools which can be used to get specific answer. This tools are used only for specific set of question.
The first step is to analyze the question by the user. After analyzing the question, get to know what user is asking.
If there is a tool available for solving this question, say the developer to use the tool, once the developer will use the tool and will provide you the answer. This step where the developer provides you the answer is the OBSERVE step.
So you should wait until you get an output from the developer. Without the result from the observe step do not proceed further.

Available Tools:
 - getWeatherDetails(cityName) - function used to get weather details of a city.

Schema Definitions:
  - role : "assistant" | "user" | "developer"
  - step : "START" | "THINK" | "TOOL" | "OBSERVE" | "ANALYZE" |  OUTPUT"
  - content : string
  - tool_name: string

User: Who is the founder of Apple?

ASSISTANT:
{ "role": "assistant", "step": "START", "content": "The user has asked about the founder of Apple." }

ASSISTANT:
{ "role": "assistant", "step": "THINK", "content": "There is no need to use any tool for this question." }

ASSISTANT:
{ "role": "assistant", "step": "OUTPUT", "content": "The founder of Apple is Steve Jobs." }

Eg: What is the weather of Delhi?

User: What is the weather of Delhi and New York? Which city is hotter?

ASSISTANT:
{ "role": "assistant", "step": "START", "content": "The user has asked about the weather details of a city called Delhi" }

ASSISTANT:
{ "role": "assistant", "step": "THINK", "content": "Since the question is about weather, I can use a tool called getWeatherDetails" }

ASSISTANT:
{ "role": "assistant", "step": "TOOL", "tool_name": "getWeatherDetails(cityName)", "input": "Delhi" }

DEVELOPER:
{ "role": "developer", "step": "OBSERVE", "content": "The weather in Delhi is 32C" }

ASSISTANT:
{ "role": "assistant", "step": "THINK", "content": "User has also asked the weather of New York. I can use the same tool to get the weather of New York." }

ASSISTANT:
{ "role": "assistant", "step": "TOOL", "tool_name": "getWeatherDetails(cityName)", "input": "New York" }

DEVELOPER:
{ "role": "developer", "step": "OBSERVE", "content": "The weather in New York is 28C" }

ASSISTANT:
{ "role": "assistant", "step": "ANALYZE", "content": "The weather in Delhi is 32C which is hot for this time of year. The weather in New York is 28C which is cool for this time of year." }

ASSISTANT:
{ "role": "assistant", "step": "OUTPUT", "content": "The weather in Delhi is 32C while the weather in New York is 28C. So Delhi is hotter." }

    Rules:
    - Strictly follow the output JSON format
    - Always follow the output in sequence that is START, THINK, OBSERVE and OUTPUT.
    - Always perform only one step at a time and wait for other step.
    - Alway make sure to do multiple steps of thinking before giving out output.
    - For every tool call always wait for the OBSERVE which contains the output from tool
`;

let messages = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
  {
    role: "user",
    content:
      "What is the weather in Denton and New York? which city is hotter?",
  },
];

async function main() {
  while (true) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    const rawContent = response.choices[0].message.content;
    let parsedContent;
    try {
      parsedContent = JSON.parse(rawContent);
    } catch (error) {
      console.error("Failed to parse AI response:", rawContent);
      break;
    }

    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });
    // console.log("messages", messages);

    if (parsedContent.step === "START") {
      console.log("Start - 🔥", parsedContent.content);
      continue;
    }

    if (parsedContent.step === "THINK") {
      console.log("Think - 🧠", parsedContent.content);
      continue;
    }

    if (parsedContent.step === "TOOL") {
      console.log("🔍 tool call");
      console.log("🔍 parsedContent", parsedContent);
      const responseFromTool = await getWeatherDetails(parsedContent.input);
      console.log("🔍 responseFromTool", responseFromTool);
      messages.push({
        role: "developer",
        content: JSON.stringify({
          step: "OBSERVE",
          content: `The weather in ${parsedContent.input} is ${responseFromTool}`,
        }),
      });
      continue;
    }

    if (parsedContent.step === "ANALYZE") {
      console.log("Analyze - 🤩", parsedContent.content);
      continue;
    }

    if (parsedContent.step === "OUTPUT") {
      console.log("Output - ✅", parsedContent.content);
      break;
    }
  }
}



// main();

const response = await getWeatherDetails("Denton");
console.log("🔍 response", response);