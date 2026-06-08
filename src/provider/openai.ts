import OpenAI from 'openai';
import { CodeReviewProvider, REVIEW_PROMPT } from './base.js';
import { Issue } from '../types.js';

export class OpenAIPreviewProvider implements CodeReviewProvider {
  private client: OpenAI;
  private model: string;
  private customPrompt?: string;

  constructor(apiKey: string, model: string = 'qwen3.6-35b-a3b', baseUrl?: string, customPrompt?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });
    this.model = model;
    this.customPrompt = customPrompt;
  }

  async review(file: string, content: string, language: string): Promise<Issue[]> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.customPrompt
            ? `You are a code review assistant. ${this.customPrompt} Return ONLY valid JSON. No markdown, no explanation.`
            : 'You are a code review assistant. Return ONLY valid JSON. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: REVIEW_PROMPT([{ path: file, content }]),
        },
      ],
      temperature: 0,
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message.content || '[]';
    return this.parseIssues(text);
  }

  private parseIssues(text: string): Issue[] {
    try {
      const cleaned = text.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((i: any) => ({
        line: i.line || 0,
        severity: i.severity || 'info',
        rule: i.rule || 'general',
        message: i.message || '',
        suggestion: i.suggestion || undefined,
      }));
    } catch {
      return [{
        line: 0,
        severity: 'critical',
        rule: 'ai-parse-error',
        message: `AI response could not be parsed: ${text.slice(0, 200)}`,
        suggestion: undefined,
      }];
    }
  }
}
