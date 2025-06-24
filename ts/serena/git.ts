import { subprocessCheckOutput } from './shell';

export interface GitStatus {
    commit: string;
    hasUnstagedChanges: boolean;
    hasStagedUncommittedChanges: boolean;
    hasUntrackedFiles: boolean;
}

export function getGitStatus(): GitStatus | null {
    try {
        const commit = subprocessCheckOutput(['git', 'rev-parse', 'HEAD']);
        const unstaged = subprocessCheckOutput(['git', 'diff', '--name-only']).trim() !== '';
        const staged = subprocessCheckOutput(['git', 'diff', '--staged', '--name-only']).trim() !== '';
        const untracked = subprocessCheckOutput(['git', 'ls-files', '--others', '--exclude-standard']).trim() !== '';
        return {
            commit,
            hasUnstagedChanges: unstaged,
            hasStagedUncommittedChanges: staged,
            hasUntrackedFiles: untracked,
        };
    } catch {
        return null;
    }
}
