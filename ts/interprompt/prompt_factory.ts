import fs from 'fs';
import path from 'path';
import { DEFAULT_LANG_CODE, LanguageFallbackMode, MultiLangPromptCollection, PromptList } from './multilang_prompt';

export class PromptFactoryBase {
  langCode: string;
  protected promptCollection: MultiLangPromptCollection;

  constructor(promptsDir: string, langCode: string = DEFAULT_LANG_CODE, fallbackMode: LanguageFallbackMode = LanguageFallbackMode.EXCEPTION) {
    this.langCode = langCode;
    this.promptCollection = new MultiLangPromptCollection(promptsDir, fallbackMode);
  }

  protected renderPrompt(promptName: string, params: Record<string, unknown>): string {
    delete (params as any)['this'];
    return this.promptCollection.renderPromptTemplate(promptName, params, this.langCode);
  }

  protected getPromptList(promptName: string): PromptList {
    return this.promptCollection.getPromptList(promptName, this.langCode);
  }
}

export function autogeneratePromptFactoryModule(promptsDir: string, targetModulePath: string): void {
  const collection = new MultiLangPromptCollection(promptsDir);
  let code = '';
  code += `// NOTE: This module is auto-generated from interprompt.autogeneratePromptFactoryModule, do not edit manually!\n`;
  code += `import { PromptList } from './multilang_prompt';\n`;
  code += `import { PromptFactoryBase } from './prompt_factory';\n`;

  code += `export class PromptFactory extends PromptFactoryBase {\n`;
  for (const name of collection.getPromptTemplateNames()) {
    const params = collection.getPromptTemplateParameters(name);
    const paramStr = params.length ? params.map(p => `${p}: any`).join(', ') + ', ' : '';
    const paramObj = params.length ? `{ ${params.join(', ')} }` : '{}';
    code += `  create_${name}(${paramStr}): string {\n`;
    code += `    return this.renderPrompt('${name}', ${paramObj});\n`;
    code += `  }\n`;
  }
  for (const name of collection.getPromptListNames()) {
    code += `  get_list_${name}(): PromptList {\n`;
    code += `    return this.getPromptList('${name}');\n`;
    code += `  }\n`;
  }
  code += `}\n`;
  fs.mkdirSync(path.dirname(targetModulePath), { recursive: true });
  fs.writeFileSync(targetModulePath, code, 'utf8');
}
