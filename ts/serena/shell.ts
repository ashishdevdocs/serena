import childProcess from 'child_process';

export interface ShellCommandResult {
    stdout: string;
    returnCode: number;
    cwd: string;
    stderr?: string;
}

export function subprocessCheckOutput(args: string[], encoding = 'utf-8', strip = true, timeout?: number): string {
    const output = childProcess.execFileSync(args[0], args.slice(1), { encoding, timeout, stdio: ['ignore', 'pipe', 'pipe'] });
    const result = output.toString();
    return strip ? result.trim() : result;
}

export function executeShellCommand(command: string, cwd?: string, captureStderr = false): ShellCommandResult {
    try {
        const stdout = childProcess.execSync(command, { cwd, encoding: 'utf-8', stdio: captureStderr ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'inherit'] });
        return { stdout: stdout.toString(), returnCode: 0, cwd: cwd ?? process.cwd() };
    } catch (e: any) {
        return { stdout: e.stdout?.toString() ?? '', stderr: e.stderr?.toString(), returnCode: e.status ?? 1, cwd: cwd ?? process.cwd() };
    }
}
