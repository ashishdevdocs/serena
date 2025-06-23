declare const __dirname: string;
declare module 'fs' {
    const anyFs: any;
    export = anyFs;
}

declare module 'path' {
    const anyPath: any;
    export = anyPath;
}
