import 'dotenv/config';
import { streamText, type ModelMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createMockModel } from './mock-model';
import { createInterface } from 'node:readline';

// 本地部署的 OpenAI 兼容模型服务（与 Pi 当前使用同一个 DeepSeek-V4.1-Flash）
const apiKey = process.env.LLM_API_KEY;
const baseURL = process.env.LLM_BASE_URL ?? 'https://mas-infer.desaysv.com/v1';
const modelId = process.env.LLM_MODEL ?? 'DeepSeek-V4.1-Flash';

const llm = createOpenAI({ baseURL, apiKey });

const model = apiKey ? llm.chat(modelId) : createMockModel();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

function ask() {
  rl.question('\nYou: ', async (input) => {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'exit') {
      console.log('Bye!');
      rl.close();
      return;
    }

    messages.push({ role: 'user', content: trimmed });

    const result = streamText({
      model,
      messages,
    });

    process.stdout.write('Assistant: ');
    let fullResponse = '';
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }
    console.log(); // 换行

    messages.push({ role: 'assistant', content: fullResponse });

    ask();
  });
}

console.log('Super Agent v0.1 (type "exit" to quit)\n');
ask();
