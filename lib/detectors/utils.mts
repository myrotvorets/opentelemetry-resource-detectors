import { readFile } from 'node:fs/promises';

async function readAndParse(file: string, re: RegExp): Promise<string | undefined> {
    try {
        const raw = await readFile(file, { encoding: 'ascii' });
        const lines = raw.trim().split('\n');
        for (const line of lines) {
            const matches = re.exec(line);
            if (matches) {
                return matches[1]!;
            }
        }
    } catch {
        // Do nothing
    }

    return undefined;
}

export const getContainerIDFormCGroup = (re: RegExp): Promise<string | undefined> =>
    readAndParse('/proc/self/cgroup', re);
export const getContainerIDFormCGroup2 = (re: RegExp): Promise<string | undefined> =>
    readAndParse('/proc/self/mountinfo', re);
