import path from 'path';
import fs from 'fs';
import NodeCache from 'node-cache';
import { Server } from '../server';

const fileExportCache = new NodeCache();

export async function getFileExports<T>(
    directoryPath: string,
    opts?: {
        enforcePrefix?: string;
        ignoreChildrenDirectories?: boolean;
        ignoreIfNotFound?: boolean;
    },
): Promise<T[]> {
    const cached = fileExportCache.get<T[]>(directoryPath);
    if (cached) return cached;

    const targetDirectory = path.join(
        __dirname,
        `../../${process.versions?.tsnode ? 'src' : 'build'}`,
        directoryPath.startsWith('/') ? directoryPath.slice(1) : directoryPath,
    );

    if (!fs.existsSync(targetDirectory)) {
        if (!opts?.ignoreIfNotFound) Server.instance.warn(`Directory "${targetDirectory}" does not exist.`);
        return [];
    }

    const results: T[] = [];

    async function processDirectory(dirPath: string): Promise<void> {
        for (const file of fs.readdirSync(dirPath)) {
            if (file.startsWith('_')) continue;
            if (opts?.enforcePrefix && !file.startsWith(opts.enforcePrefix)) continue;

            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                if (opts?.ignoreChildrenDirectories) {
                    Server.instance.log(`Skipping subdirectory: "${filePath}"`);
                    continue;
                } else {
                    // Recursively process subdirectory
                    await processDirectory(filePath);
                    continue;
                }
            }

            // Skip non-JS/TS files
            if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;

            try {
                const mod = await import(filePath);
                const exported = mod?.default?.default;

                if (typeof exported === 'function') {
                    const result = await exported();
                    if (result) results.push(result);
                } else {
                    Server.instance.warn(`No callable default export in "${filePath}"`);
                }
            } catch (err: any) {
                Server.instance.warn(`Failed to import "${filePath}": ${err.message}`);
            }
        }
    }

    await processDirectory(targetDirectory);

    if (results.length === 0) {
        if (!opts?.ignoreIfNotFound) Server.instance.warn(`No valid exports found in directory "${directoryPath}"`);
    }

    fileExportCache.set(directoryPath, results);
    return results;
}