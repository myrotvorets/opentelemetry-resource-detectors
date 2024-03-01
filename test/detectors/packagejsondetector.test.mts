import { expect } from 'chai';
import { type TestDouble, func, matchers, replaceEsm, when } from 'testdouble';
import type { ResourceDetectionConfig } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type { PackageJsonDetector } from '../../lib/detectors/packagejsondetector.mjs';
import { runDetector } from './helpers.mjs';

describe('PackageJsonDetector', function () {
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

    it('should return an empty resource when package.json cannot be located', function () {
        when(statMock(matchers.isA(String) as string)).thenReject(new Error());

        return expect(runDetector(packageJsonDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {});
    });

    it('should retrieve name and version from package.json', function () {
        const obj = { name: 'Package Name', version: '1.2.3' };

        when(statMock(matchers.isA(String) as string)).thenResolve({ isFile: () => true });
        when(readFileMock(matchers.isA(String) as string, { encoding: 'utf-8' })).thenResolve(JSON.stringify(obj));

        return expect(runDetector(packageJsonDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {
                [SEMRESATTRS_SERVICE_NAME]: obj.name,
                [SEMRESATTRS_SERVICE_VERSION]: obj.version,
            });
    });
});
