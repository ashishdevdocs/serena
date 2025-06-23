import path from "path";

const repoRootPath = path.resolve(__dirname, '../..');
const serenaPkgPath = __dirname;

export const REPO_ROOT = repoRootPath;
export const PROMPT_TEMPLATES_DIR = path.join(serenaPkgPath, 'resources', 'config', 'prompt_templates');
export const CONTEXT_YAMLS_DIR = path.join(serenaPkgPath, 'resources', 'config', 'contexts');
export const MODE_YAMLS_DIR = path.join(serenaPkgPath, 'resources', 'config', 'modes');
export const SERENA_DASHBOARD_DIR = path.join(serenaPkgPath, 'resources', 'dashboard');
export const SERENA_ICON_DIR = path.join(serenaPkgPath, 'resources', 'icons');

export const SERENA_MANAGED_DIR_NAME = '.serena';

export const DEFAULT_ENCODING = 'utf-8';
export const DEFAULT_CONTEXT = 'desktop-app';
export const DEFAULT_MODES = ['interactive', 'editing'];

export const PROJECT_TEMPLATE_FILE = path.join(serenaPkgPath, 'resources', 'project.template.yml');
export const SELENA_CONFIG_TEMPLATE_FILE = path.join(serenaPkgPath, 'resources', 'serena_config.template.yml');

export const USE_PROCESS_ISOLATION = false;
