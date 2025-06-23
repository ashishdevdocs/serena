import fs from 'fs';
import path from 'path';
import glob from 'glob';
import ignore from 'ignore';

export interface ScanResult {
    directories: string[];
    files: string[];
}

export function scanDirectory(
    dir: string,
    recursive = false,
    relativeTo?: string,
    isIgnoredDir: (p: string) => boolean = () => false,
    isIgnoredFile: (p: string) => boolean = () => false,
): ScanResult {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    const directories: string[] = [];
    for (const entry of entries) {
        const abs = path.join(dir, entry.name);
        const rel = relativeTo ? path.relative(relativeTo, abs) : abs;
        if (entry.isFile()) {
            if (!isIgnoredFile(abs)) files.push(rel);
        } else if (entry.isDirectory()) {
            if (!isIgnoredDir(abs)) {
                directories.push(rel);
                if (recursive) {
                    const sub = scanDirectory(abs, true, relativeTo, isIgnoredDir, isIgnoredFile);
                    files.push(...sub.files);
                    directories.push(...sub.directories);
                }
            }
        }
    }
    return { directories, files };
}

export class GitignoreParser {
    private ig = ignore();
    constructor(public repoRoot: string) {
        this.reload();
    }

    private loadGitignoreFiles() {
        const gitignoreFiles = glob.sync('**/.gitignore', { cwd: this.repoRoot, dot: true, absolute: true });
        gitignoreFiles.forEach((p: string) => {
            try {
                const content = fs.readFileSync(p, 'utf-8');
                const lines = content.split(/\r?\n/).filter((l: string) => l.trim() !== '');
                this.ig.add(lines);
            } catch {
                // ignore
            }
        });
    }

    reload() {
        this.ig = ignore();
        this.loadGitignoreFiles();
    }

    shouldIgnore(p: string): boolean {
        const rel = path.relative(this.repoRoot, path.resolve(p));
        return this.ig.ignores(rel);
    }
}

export function findAllNonIgnoredFiles(repoRoot: string): string[] {
    const parser = new GitignoreParser(repoRoot);
    const { files } = scanDirectory(repoRoot, true, repoRoot);
    return files.filter(f => !parser.shouldIgnore(f));
}
