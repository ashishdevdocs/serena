import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { NunjucksTemplate, ParameterizedTemplateInterface } from './jinja_template';

export const DEFAULT_LANG_CODE = 'default';

export enum LanguageFallbackMode {
  ANY = 'any',
  EXCEPTION = 'exception',
  USE_DEFAULT_LANG = 'use_default_lang',
}

class PromptTemplate implements ParameterizedTemplateInterface {
  private template: NunjucksTemplate;
  constructor(public name: string, templateString: string) {
    this.template = new NunjucksTemplate(templateString.trim());
  }
  render(params: Record<string, unknown>): string {
    return this.template.render(params);
  }
  getParameters(): string[] {
    return this.template.getParameters();
  }
}

export class PromptList {
  items: string[];
  constructor(items: string[]) {
    this.items = items.map(x => x.trim());
  }
  toString(): string {
    const bullet = ' * ';
    const indent = ' '.repeat(bullet.length);
    const lines = this.items.map(x => x.replace(/\n/g, '\n' + indent));
    return lines.join('\n' + bullet);
  }
}

class MultiLangContainer<T> {
  private lang2item: Map<string, T> = new Map();
  constructor(public name: string) {}
  addItem(item: T, lang: string = DEFAULT_LANG_CODE, overwrite = false) {
    if (!overwrite && this.lang2item.has(lang)) {
      throw new Error(`Item for language '${lang}' already registered for '${this.name}'`);
    }
    this.lang2item.set(lang, item);
  }
  getItem(lang: string = DEFAULT_LANG_CODE, fallback: LanguageFallbackMode = LanguageFallbackMode.EXCEPTION): T {
    const item = this.lang2item.get(lang);
    if (item) return item;
    if (fallback === LanguageFallbackMode.ANY) {
      const first = this.lang2item.values().next().value;
      if (first) return first;
      throw new Error(`No items registered for '${this.name}'`);
    }
    if (fallback === LanguageFallbackMode.USE_DEFAULT_LANG) {
      const def = this.lang2item.get(DEFAULT_LANG_CODE);
      if (def) return def;
      throw new Error(`Item not found for ${lang} or default in '${this.name}'`);
    }
    throw new Error(`Item for language '${lang}' not found for name '${this.name}'`);
  }
  getLanguages(): string[] {
    return Array.from(this.lang2item.keys());
  }
  values(): IterableIterator<T> {
    return this.lang2item.values();
  }
}

class MultiLangPromptTemplate {
  private container: MultiLangContainer<PromptTemplate>;
  constructor(public name: string) {
    this.container = new MultiLangContainer(name);
  }
  addPromptTemplate(tmpl: PromptTemplate, lang = DEFAULT_LANG_CODE, overwrite = false) {
    const params = tmpl.getParameters();
    if (this.container.getLanguages().length > 0) {
      const existing = this.getParameters();
      if (existing.join(',') !== params.join(',')) {
        throw new Error(`Parameter mismatch for prompt '${this.name}'`);
      }
    }
    this.container.addItem(tmpl, lang, overwrite);
  }
  getPromptTemplate(lang = DEFAULT_LANG_CODE, fallback: LanguageFallbackMode = LanguageFallbackMode.EXCEPTION): PromptTemplate {
    return this.container.getItem(lang, fallback);
  }
  getParameters(): string[] {
    const first = this.container.values().next().value as PromptTemplate | undefined;
    if (!first) throw new Error(`No prompt templates registered for '${this.name}'`);
    return first.getParameters();
  }
  render(params: Record<string, unknown>, lang = DEFAULT_LANG_CODE, fallback: LanguageFallbackMode = LanguageFallbackMode.EXCEPTION): string {
    return this.getPromptTemplate(lang, fallback).render(params);
  }
}

class MultiLangPromptList extends MultiLangContainer<PromptList> {}

export class MultiLangPromptCollection {
  private templates: Map<string, MultiLangPromptTemplate> = new Map();
  private lists: Map<string, MultiLangPromptList> = new Map();
  fallbackMode: LanguageFallbackMode;
  constructor(promptsDir: string, fallback: LanguageFallbackMode = LanguageFallbackMode.EXCEPTION) {
    this.fallbackMode = fallback;
    this.loadFromDisc(promptsDir);
  }
  private addPromptTemplate(name: string, tmplStr: string, lang: string = DEFAULT_LANG_CODE) {
    const tmpl = new PromptTemplate(name, tmplStr);
    let mlpt = this.templates.get(name);
    if (!mlpt) {
      mlpt = new MultiLangPromptTemplate(name);
      this.templates.set(name, mlpt);
    }
    mlpt.addPromptTemplate(tmpl, lang);
  }
  private addPromptList(name: string, list: string[], lang: string = DEFAULT_LANG_CODE) {
    let mll = this.lists.get(name);
    if (!mll) {
      mll = new MultiLangPromptList(name);
      this.lists.set(name, mll);
    }
    mll.addItem(new PromptList(list), lang);
  }
  private loadFromDisc(dir: string) {
    for (const fn of fs.readdirSync(dir)) {
      if (!fn.endsWith('.yml') && !fn.endsWith('.yaml')) continue;
      const data = yaml.load(fs.readFileSync(path.join(dir, fn), 'utf8')) as any;
      const prompts = data['prompts'];
      const lang = prompts['lang'] ?? DEFAULT_LANG_CODE;
      for (const [name, value] of Object.entries<any>(prompts)) {
        if (name === 'lang') continue;
        if (Array.isArray(value)) {
          this.addPromptList(name, value, lang);
        } else if (typeof value === 'string') {
          this.addPromptTemplate(name, value, lang);
        } else {
          throw new Error(`Invalid prompt type for ${name} in ${fn}`);
        }
      }
    }
  }
  getPromptTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }
  getPromptListNames(): string[] {
    return Array.from(this.lists.keys());
  }
  getPromptTemplate(promptName: string, lang = DEFAULT_LANG_CODE): PromptTemplate {
    const mlpt = this.templates.get(promptName);
    if (!mlpt) throw new Error(`Prompt template '${promptName}' not found`);
    return mlpt.getPromptTemplate(lang, this.fallbackMode);
  }
  renderPromptTemplate(promptName: string, params: Record<string, unknown>, lang = DEFAULT_LANG_CODE): string {
    return this.getPromptTemplate(promptName, lang).render(params);
  }
  getPromptList(promptName: string, lang = DEFAULT_LANG_CODE): PromptList {
    const mll = this.lists.get(promptName);
    if (!mll) throw new Error(`Prompt list '${promptName}' not found`);
    return mll.getItem(lang, this.fallbackMode);
  }
  getPromptTemplateParameters(promptName: string): string[] {
    const mlpt = this.templates.get(promptName);
    if (!mlpt) throw new Error(`Prompt template '${promptName}' not found`);
    return mlpt.getParameters();
  }
}
