declare const __dirname: string;
declare const process: any;

declare module 'fs' {
    const anyFs: any;
    export = anyFs;
}

declare module 'path' {
    const anyPath: any;
    export = anyPath;
}

declare module 'child_process' {
    const anyChild: any;
    export = anyChild;
}

declare module 'js-yaml' {
    const anyYaml: any;
    export = anyYaml;
}

declare module 'ignore' {
    const anyIgnore: any;
    export = anyIgnore;
}

declare module 'glob' {
    const anyGlob: any;
    export = anyGlob;
}

declare module 'minimatch' {
    const anyMinimatch: any;
    export = anyMinimatch;
}

declare module 'nunjucks' {
    var nunjucks: any;
    export = nunjucks;
}
