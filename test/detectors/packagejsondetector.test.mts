import { before, describe, it } from 'node:test';
import { expect } from 'chai';
import { type TestDouble, func, matchers, replaceEsm, when } from 'testdouble';
import type { ResourceDetectionConfig } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type { PackageJsonDetector } from '../../lib/detectors/packagejsondetector.mjs';
import { runDetector } from './helpers.mjs';

import './setup.mjs';

await describe('PackageJsonDetector', async function () {
    let packageJsonDetector: PackageJsonDetector;
    let config: ResourceDetectionConfig;
    let readFileMock: TestDouble<typeof import('node:fs/promises').readFile>;
    let statMock: TestDouble<typeof import('node:fs/promises').stat>;

    before(async function () {
        readFileMock = func<typeof import('node:fs/promises').readFile>();
        statMock = func<typeof import('node:fs/promises').stat>();

        const promises = await import('node:fs/promises');
        await replaceEsm('node:fs/promises', {
            ...promises,
            readFile: readFileMock,
            stat: statMock,
        });

        ({ packageJsonDetector } = await import('../../lib/detectors/packagejsondetector.mjs'));
        config = {
            detectors: [packageJsonDetector],
        };
    });

    await it('should return an empty resource when package.json cannot be located', async function () {
        when(statMock(matchers.isA(String) as string)).thenReject(new Error());

        await expect(runDetector(packageJsonDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {});
    });

    await it('should retrieve name and version from package.json', async function () {
        const obj = { name: 'Package Name', version: '1.2.3' };

        when(statMock(matchers.isA(String) as string)).thenResolve({ isFile: () => true });
        when(readFileMock(matchers.isA(String) as string, { encoding: 'utf-8' })).thenResolve(JSON.stringify(obj));

        await expect(runDetector(packageJsonDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {
                [ATTR_SERVICE_NAME]: obj.name,
                [ATTR_SERVICE_VERSION]: obj.version,
            });
    });
});
