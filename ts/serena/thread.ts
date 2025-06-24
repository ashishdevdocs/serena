export class TimeoutException extends Error {
    constructor(message: string, public timeout: number) {
        super(message);
    }
}

export enum Status {
    SUCCESS = 'success',
    TIMEOUT = 'timeout',
    EXCEPTION = 'error'
}

export class ExecutionResult<T> {
    resultValue?: T;
    status?: Status;
    exception?: any;
}

export function executeWithTimeout<T>(func: () => T | Promise<T>, timeout: number, functionName: string): Promise<ExecutionResult<T>> {
    const result = new ExecutionResult<T>();
    return new Promise(resolve => {
        const timer = setTimeout(() => {
            result.status = Status.TIMEOUT;
            result.exception = new TimeoutException(`Execution of '${functionName}' timed out after ${timeout} seconds.`, timeout);
            resolve(result);
        }, timeout * 1000);
        Promise.resolve().then(func).then(val => {
            clearTimeout(timer);
            result.status = Status.SUCCESS;
            result.resultValue = val;
            resolve(result);
        }).catch(err => {
            clearTimeout(timer);
            result.status = Status.EXCEPTION;
            result.exception = err;
            resolve(result);
        });
    });
}
