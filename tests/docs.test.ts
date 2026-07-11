import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../src/config.js';

describe('GitHub Pages instructions', () => {
  it('links every localized guide and documents every command', () => {
    const commands = ['/goal', '/status', '/schedule', '/settings', '/help'];
    for (const language of LANGUAGES) {
      const page = readFileSync(`docs/${language}/index.md`, 'utf8');
      expect(page).toContain('https://t.me/my_weight_goal_bot');
      for (const command of commands) expect(page).toContain(command);
      for (const linkedLanguage of LANGUAGES) expect(page).toContain(`../${linkedLanguage}/`);
    }
  });

  it('offers all languages from the landing page', () => {
    const landing = readFileSync('docs/index.md', 'utf8');
    for (const language of LANGUAGES) expect(landing).toContain(`./${language}/`);
  });
});

