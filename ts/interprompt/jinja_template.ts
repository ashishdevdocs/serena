import nunjucks = require('nunjucks');
import { singleton } from './util/classDecorators';

export interface ParameterizedTemplateInterface {
  getParameters(): string[];
}

class NunjucksEnvProvider {
  private env: any = null;

  getEnv(): any {
    if (!this.env) {
      this.env = new (nunjucks as any).Environment();
    }
    return this.env;
  }
}

const getEnvProvider = singleton(NunjucksEnvProvider);

export class NunjucksTemplate implements ParameterizedTemplateInterface {
  private template: any;
  private parameters: string[];

  constructor(private templateString: string) {
    const env = getEnvProvider().getEnv();
    this.template = new (nunjucks as any).Template(templateString, env);
    this.parameters = this.extractParameters(templateString);
  }

  private extractParameters(str: string): string[] {
    const regex = /{{\s*([\w.]+)\s*}}/g;
    const params = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(str))) {
      params.add(match[1]);
    }
    return Array.from(params).sort();
  }

  render(params: Record<string, unknown>): string {
    return this.template.render(params);
  }

  getParameters(): string[] {
    return this.parameters;
  }
}
