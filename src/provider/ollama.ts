import { CodeReviewProvider, REVIEW_PROMPT } from './base.js';
import { Issue } from '../types.js';

export class OllamaProvider implements CodeReviewProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string = 'codellama') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async review(file: string, content: string, language: string): Promise<Issue[]> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: REVIEW_PROMPT([{ path: file, content }]),
          stream: false,
          options: {
            temperature: 0,
            num_predict: 4096,
          },
        }),
      });
    } catch (err) {
      throw new Error(`Ollama request failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { response?: string };
    return this.parseIssues(data.response || '[]');
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
