// NOTE: This module is auto-generated from interprompt.autogeneratePromptFactoryModule, do not edit manually!
import { PromptList } from '../../interprompt/multilang_prompt';
import { PromptFactoryBase } from '../../interprompt/prompt_factory';

export class PromptFactory extends PromptFactoryBase {
  create_onboarding_prompt(system: any): string {
    return this.renderPrompt('onboarding_prompt', { system });
  }

  create_think_about_collected_information(): string {
    return this.renderPrompt('think_about_collected_information', {});
  }

  create_think_about_task_adherence(): string {
    return this.renderPrompt('think_about_task_adherence', {});
  }

  create_think_about_whether_you_are_done(): string {
    return this.renderPrompt('think_about_whether_you_are_done', {});
  }

  create_summarize_changes(): string {
    return this.renderPrompt('summarize_changes', {});
  }

  create_prepare_for_new_conversation(): string {
    return this.renderPrompt('prepare_for_new_conversation', {});
  }

  create_system_prompt(context_system_prompt: any, mode_system_prompts: any): string {
    return this.renderPrompt('system_prompt', { context_system_prompt, mode_system_prompts });
  }
}
