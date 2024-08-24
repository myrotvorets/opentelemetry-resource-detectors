import { expect } from 'chai';
import { type TestDouble, func, matchers, replaceEsm, when } from 'testdouble';
import type { ResourceDetectionConfig } from '@opentelemetry/resources';
import {
    ATTR_CONTAINER_ID,
    ATTR_HOST_ID,
    ATTR_HOST_NAME,
    ATTR_K8S_DEPLOYMENT_NAME,
    ATTR_K8S_NAMESPACE_NAME,
    ATTR_K8S_POD_NAME,
} from '@opentelemetry/semantic-conventions/incubating';
import type { K8sDetector } from '../../lib/detectors/k8sdetector.mjs';
import { runDetector } from './helpers.mjs';

type ReadFileOptionsType = Parameters<typeof import('node:fs/promises').readFile>[1];

describe('K8sDetector', function () {
    let env: typeof process.env;
    let k8sDetector: K8sDetector;
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

        ({ k8sDetector } = await import('../../lib/detectors/k8sdetector.mjs'));
        config = {
            detectors: [k8sDetector],
        };
    });

    afterEach(function () {
        process.env = { ...env };
    });

    it('should return an empty resource if this is not a K8S', function () {
        process.env['HOSTNAME'] = 'test';
        return expect(runDetector(k8sDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {});
    });

    it('should return an empty resource if this is not a K8S (no hostname)', function () {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete process.env['HOSTNAME'];
        return expect(runDetector(k8sDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {});
    });

    it('should properly extract information', function () {
        const expectedUID = '61c0b7d8-0195-4781-b469-ba9ccda365f7';
        const containerID = '524e03333ac128141df9cf0f8449c490e65c3fcf76878a60fe852c6003e7044c';
        const expectedCID = containerID.slice(0, 12);
        const expectedNS = 'default';
        const expectedPod = 'my-pod';
        const expectedDeployment = '9cb4c7c4b';
        const expectedHostname = `${expectedPod}-${expectedDeployment}-p2qbn`;

        when(readFileMock(matchers.isA(String) as string, matchers.anything() as ReadFileOptionsType)).thenDo(
            (path: string): Promise<string> => {
                const lookup: Record<string, string> = {
                    '/proc/self/cgroup': `12:rdma:/\n12:cpuset:/kubepods/pod${expectedUID}/${containerID}`,
                    '/etc/podinfo/uid': expectedUID,
                    '/etc/podinfo/namespace': expectedNS,
                };

                const value = lookup[path];
                return value ? Promise.resolve(value) : Promise.reject(new Error());
            },
        );

        process.env['HOSTNAME'] = expectedHostname;

        return expect(runDetector(k8sDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {
                [ATTR_HOST_NAME]: expectedHostname,
                [ATTR_HOST_ID]: expectedUID,
                [ATTR_K8S_POD_NAME]: expectedPod,
                [ATTR_K8S_DEPLOYMENT_NAME]: expectedDeployment,
                [ATTR_K8S_NAMESPACE_NAME]: expectedNS,
                [ATTR_CONTAINER_ID]: expectedCID,
            });
    });

    it('should discard empty values', function () {
        const expectedPod = 'my-pod';
        const expectedDeployment = '9cb4c7c4b';
        const expectedHostname = `${expectedPod}-${expectedDeployment}-p2qbn`;

        when(readFileMock(matchers.isA(String) as string, matchers.anything() as ReadFileOptionsType)).thenReject(
            new Error(),
        );

        process.env['HOSTNAME'] = expectedHostname;

        return expect(runDetector(k8sDetector, config))
            .to.eventually.be.an('object')
            .and.have.deep.property('attributes', {
                [ATTR_HOST_NAME]: expectedHostname,
                [ATTR_K8S_POD_NAME]: expectedPod,
                [ATTR_K8S_DEPLOYMENT_NAME]: expectedDeployment,
            });
    });
});
