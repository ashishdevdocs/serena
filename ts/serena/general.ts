import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export function loadYaml(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(content);
}

export function saveYaml(filePath: string, data: any): void {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const content = yaml.dump(data);
    fs.writeFileSync(filePath, content, 'utf-8');
}
