import { expect } from 'chai';
import { type TestDouble, func, replaceEsm, when } from 'testdouble';
import type { ResourceDetectionConfig } from '@opentelemetry/resources';
import { ATTR_CONTAINER_ID } from '@opentelemetry/semantic-conventions/incubating';
import type { DockerDetector } from '../../lib/detectors/dockerdetector.mjs';
import { runDetector } from './helpers.mjs';

describe('DockerDetector', function () {
    let env: typeof process.env;
    let dockerDetector: DockerDetector;
    let config: ResourceDetectionConfig;
    let readFileMock: TestDouble<typeof import('node:fs/promises').readFile>;

    before(async function () {
        env = { ...process.env };

        readFileMock = func<typeof import('node:fs/promises').readFile>();

        const promises = await import('node:fs/promises');
        await replaceEsm('node:fs/promises', {
            ...promises,
            readFile: readFileMock,
        });

        ({ dockerDetector } = await import('../../lib/detectors/dockerdetector.mjs'));
        config = {
            detectors: [dockerDetector],
        };
    });

    afterEach(function () {
        process.env = { ...env };
    });

    it('should return an empty resource when /proc/self/cgroup is not readable', function () {
        when(readFileMock('/proc/self/cgroup', { encoding: 'ascii' })).thenReject(new Error());
        return expect(runDetector(dockerDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {});
    });

    it('should return an empty resource if this is not a Docker', function () {
        when(readFileMock('/proc/self/cgroup', { encoding: 'ascii' })).thenResolve('');
        return expect(runDetector(dockerDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {});
    });

    it('should extract container ID from /proc/self/cgroup', function () {
        const containerID = 'ec476b266b2148cb1adc1ca6399f9cffc1c28b24e68d6d68c50db7e981d2ae1d';
        const expectedID = containerID.slice(0, 12);

        when(readFileMock('/proc/self/cgroup', { encoding: 'ascii' })).thenResolve(
            `11:cpu,cpuacct:/docker/${containerID}\n`,
        );

        return expect(runDetector(dockerDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {
                [ATTR_CONTAINER_ID]: expectedID,
            });
    });

    it('should fall back to /proc/self/mountinfo', function () {
        const containerID = 'ec476b266b2148cb1adc1ca6399f9cffc1c28b24e68d6d68c50db7e981d2ae1d';
        const expectedID = containerID.slice(0, 12);

        when(readFileMock('/proc/self/cgroup', { encoding: 'ascii' })).thenResolve(`0::/\n`);
        when(readFileMock('/proc/self/mountinfo', { encoding: 'ascii' })).thenResolve(
            `920 908 7:3 /containers/${containerID}/resolv.conf /etc/resolv.conf rw,nodev,relatime - ext4 /dev/loop3 rw\n`,
        );

        return expect(runDetector(dockerDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {
                [ATTR_CONTAINER_ID]: expectedID,
            });
    });
});
