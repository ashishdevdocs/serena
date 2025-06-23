import path from 'path';
import minimatch from 'minimatch';
import { findAllNonIgnoredFiles } from './file_system';

export enum Language {
    CSHARP = 'csharp',
    PYTHON = 'python',
    RUST = 'rust',
    JAVA = 'java',
    KOTLIN = 'kotlin',
    TYPESCRIPT = 'typescript',
    GO = 'go',
    RUBY = 'ruby',
    DART = 'dart',
    CPP = 'cpp',
    PHP = 'php',
}

const LANGUAGE_PATTERNS: Record<Language, string[]> = {
    [Language.PYTHON]: ['*.py', '*.pyi'],
    [Language.JAVA]: ['*.java'],
    [Language.TYPESCRIPT]: [
        '*.cts', '*.mts', '*.ts', '*.tsx',
        '*.cjs', '*.mjs', '*.js', '*.jsx',
    ],
    [Language.CSHARP]: ['*.cs'],
    [Language.RUST]: ['*.rs'],
    [Language.GO]: ['*.go'],
    [Language.RUBY]: ['*.rb'],
    [Language.CPP]: ['*.cpp', '*.h', '*.hpp', '*.c', '*.hxx', '*.cc', '*.cxx'],
    [Language.KOTLIN]: ['*.kt', '*.kts'],
    [Language.DART]: ['*.dart'],
    [Language.PHP]: ['*.php'],
};

export function determineProgrammingLanguageComposition(repoPath: string): Record<string, number> {
    const files = findAllNonIgnoredFiles(repoPath);
    if (files.length === 0) {
        return {};
    }

    const counts: Record<string, number> = {};
    const total = files.length;

    for (const lang of Object.values(Language)) {
        const patterns = LANGUAGE_PATTERNS[lang as Language];
        let count = 0;
        for (const file of files) {
            const filename = path.basename(file);
            if (patterns.some(p => minimatch(filename, p))) {
                count += 1;
            }
        }
        if (count > 0) {
            counts[lang] = count;
        }
    }

    const result: Record<string, number> = {};
    for (const [lang, c] of Object.entries(counts)) {
        result[lang] = Math.round((c / total) * 10000) / 100;
    }
    return result;
}
