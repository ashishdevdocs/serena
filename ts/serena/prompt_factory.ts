import { PROMPT_TEMPLATES_DIR } from './constants';
import { PromptFactory } from './generated/generated_prompt_factory';

export class SerenaPromptFactory extends PromptFactory {
  constructor() {
    super(PROMPT_TEMPLATES_DIR);
  }
}
