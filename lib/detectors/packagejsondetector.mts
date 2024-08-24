import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
    type DetectorSync,
    type IResource,
    Resource,
    type ResourceAttributes,
    type ResourceDetectionConfig,
} from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export class PackageJsonDetector implements DetectorSync {
    // eslint-disable-next-line class-methods-use-this
    public detect(_config: ResourceDetectionConfig): IResource {
        return new Resource({}, PackageJsonDetector.getAsyncAttributes());
    }

    private static async getAsyncAttributes(): Promise<ResourceAttributes> {
        try {
            const file = await PackageJsonDetector.findPackageJson();
            const raw = await readFile(file, { encoding: 'utf-8' });
            const json = JSON.parse(raw) as Record<string, unknown>;
            return {
                [ATTR_SERVICE_NAME]: `${json['name']}`,
                [ATTR_SERVICE_VERSION]: `${json['version']}`,
            };
        } catch {
            return {};
        }
    }

    private static async findPackageJson(): Promise<string> {
        const locations = PackageJsonDetector.getLocations();
        for (const location of locations) {
            // eslint-disable-next-line no-await-in-loop
            if (await PackageJsonDetector.fileExists(location)) {
                return location;
            }
        }

        throw new Error();
    }

    private static getLocations(): string[] {
        const locations: string[] = [];
        // istanbul ignore next
        if (process.argv[1]) {
            const dir = dirname(process.argv[1]);
            locations.push(join(dir, 'package.json'), join(dir, '..', 'package.json'));
        }

        const cwd = process.cwd();
        locations.push(join(cwd, 'package.json'));

        return locations.map((item) => resolve(item));
    }

    private static async fileExists(path: string): Promise<boolean> {
        try {
            const stats = await stat(path);
            return stats.isFile();
        } catch {
            return false;
        }
    }
}

export const packageJsonDetector = new PackageJsonDetector();
