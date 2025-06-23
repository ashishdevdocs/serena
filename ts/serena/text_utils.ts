import * as fs from 'fs';
import * as path from 'path';

export enum LineType {
    MATCH = 'match',
    BEFORE_MATCH = 'prefix',
    AFTER_MATCH = 'postfix'
}

export class TextLine {
    constructor(
        public lineNumber: number,
        public lineContent: string,
        public matchType: LineType
    ) {}

    getDisplayPrefix(): string {
        return this.matchType === LineType.MATCH ? '  >' : '...';
    }

    formatLine(includeLineNumbers = true): string {
        const prefix = this.getDisplayPrefix();
        if (includeLineNumbers) {
            const lineNum = String(this.lineNumber).padStart(4, ' ');
            return `${prefix}${lineNum}:${this.lineContent}`;
        }
        return `${prefix}:${this.lineContent}`;
    }
}

export class MatchedConsecutiveLines {
    linesBeforeMatched: TextLine[] = [];
    matchedLines: TextLine[] = [];
    linesAfterMatched: TextLine[] = [];

    constructor(public lines: TextLine[], public sourceFilePath?: string) {
        for (const line of lines) {
            if (line.matchType === LineType.BEFORE_MATCH) this.linesBeforeMatched.push(line);
            else if (line.matchType === LineType.MATCH) this.matchedLines.push(line);
            else this.linesAfterMatched.push(line);
        }
        if (this.matchedLines.length === 0) {
            throw new Error('At least one matched line is required');
        }
    }

    get startLine(): number {
        return this.lines[0].lineNumber;
    }

    get endLine(): number {
        return this.lines[this.lines.length - 1].lineNumber;
    }

    get numMatchedLines(): number {
        return this.matchedLines.length;
    }

    toDisplayString(includeLineNumbers = true): string {
        return this.lines.map(l => l.formatLine(includeLineNumbers)).join('\n');
    }
}

export function defaultFileReader(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
}

function globToRegex(globPat: string): string {
    let regex = '';
    for (let i = 0; i < globPat.length; i++) {
        const ch = globPat[i];
        if (ch === '*') regex += '.*';
        else if (ch === '?') regex += '.';
        else if (ch === '\\') {
            i += 1;
            if (i < globPat.length) regex += escapeRegex(globPat[i]);
            else regex += '\\';
        } else {
            regex += escapeRegex(ch);
        }
    }
    return regex;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function searchText(
    pattern: string | RegExp,
    content?: string,
    sourceFilePath?: string,
    allowMultilineMatch = false,
    contextLinesBefore = 0,
    contextLinesAfter = 0,
    isGlob = false
): MatchedConsecutiveLines[] {
    if (sourceFilePath && content === undefined) {
        content = fs.readFileSync(sourceFilePath, 'utf-8');
    }
    if (content === undefined) {
        throw new Error('Pass either content or sourceFilePath');
    }

    let compiled: RegExp;
    if (isGlob && typeof pattern === 'string') {
        compiled = new RegExp(globToRegex(pattern));
    } else if (typeof pattern === 'string') {
        compiled = new RegExp(pattern);
    } else {
        compiled = pattern;
    }

    const lines = content.split(/\r?\n/);
    const matches: MatchedConsecutiveLines[] = [];

    if (allowMultilineMatch) {
        const dotall = new RegExp(compiled.source, compiled.flags.includes('s') ? compiled.flags : compiled.flags + 's');
        for (const match of content.matchAll(dotall)) {
            const startPos = match.index ?? 0;
            const endPos = startPos + match[0].length;
            const startLineNum = content.slice(0, startPos).split(/\r?\n/).length;
            const endLineNum = content.slice(0, endPos).split(/\r?\n/).length;
            const contextStart = Math.max(1, startLineNum - contextLinesBefore);
            const contextEnd = Math.min(lines.length, endLineNum + contextLinesAfter);
            const context: TextLine[] = [];
            for (let i = contextStart - 1; i < contextEnd; i++) {
                const ln = i + 1;
                let matchType: LineType;
                if (ln < startLineNum) matchType = LineType.BEFORE_MATCH;
                else if (ln > endLineNum) matchType = LineType.AFTER_MATCH;
                else matchType = LineType.MATCH;
                context.push(new TextLine(ln, lines[i], matchType));
            }
            matches.push(new MatchedConsecutiveLines(context, sourceFilePath));
        }
    } else {
        for (let i = 0; i < lines.length; i++) {
            if (compiled.test(lines[i])) {
                const contextStart = Math.max(0, i - contextLinesBefore);
                const contextEnd = Math.min(lines.length - 1, i + contextLinesAfter);
                const context: TextLine[] = [];
                for (let j = contextStart; j <= contextEnd; j++) {
                    let matchType: LineType;
                    if (j < i) matchType = LineType.BEFORE_MATCH;
                    else if (j > i) matchType = LineType.AFTER_MATCH;
                    else matchType = LineType.MATCH;
                    context.push(new TextLine(j + 1, lines[j], matchType));
                }
                matches.push(new MatchedConsecutiveLines(context, sourceFilePath));
            }
        }
    }

    return matches;
}

export function globMatch(pattern: string, filePath: string): boolean {
    pattern = pattern.replace(/\\/g, '/');
    filePath = filePath.replace(/\\/g, '/');

    if (pattern.includes('**')) {
        const regex1 = new RegExp(fnmatchTranslate(pattern));
        if (regex1.test(filePath)) return true;
        if (pattern.includes('/**/')) {
            const zeroDir = pattern.replace('/**/', '/');
            const regex2 = new RegExp(fnmatchTranslate(zeroDir));
            if (regex2.test(filePath)) return true;
        }
        if (pattern.startsWith('**/')) {
            const zeroDir = pattern.slice(3);
            const regex3 = new RegExp(fnmatchTranslate(zeroDir));
            if (regex3.test(filePath)) return true;
        }
        return false;
    } else {
        return new RegExp(fnmatchTranslate(pattern)).test(filePath);
    }
}

function fnmatchTranslate(pat: string): string {
    // simplified fnmatch.translate from Python
    return '^' + pat.split('').map(ch => {
        if (ch === '?') return '.';
        if (ch === '*') return '.*';
        return escapeRegex(ch);
    }).join('') + '$';
}

export async function searchFiles(
    filePaths: string[],
    pattern: RegExp | string,
    fileReader: (p: string) => string = defaultFileReader,
    contextLinesBefore = 0,
    contextLinesAfter = 0,
    pathsIncludeGlob?: string,
    pathsExcludeGlob?: string
): Promise<MatchedConsecutiveLines[]> {
    const filtered = filePaths.filter(p => {
        if (pathsIncludeGlob && !globMatch(pathsIncludeGlob, p)) return false;
        if (pathsExcludeGlob && globMatch(pathsExcludeGlob, p)) return false;
        return true;
    });

    const results = await Promise.all(filtered.map(async p => {
        try {
            const content = fileReader(p);
            return searchText(pattern, content, p, true, contextLinesBefore, contextLinesAfter);
        } catch {
            return [] as MatchedConsecutiveLines[];
        }
    }));

    return results.flat();
}
