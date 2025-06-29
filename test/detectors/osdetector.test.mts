import { before, beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';
import { type TestDouble, func, replaceEsm, when } from 'testdouble';
import type { ResourceDetectionConfig } from '@opentelemetry/resources';
import {
    ATTR_HOST_ARCH,
    ATTR_HOST_NAME,
    ATTR_OS_TYPE,
    HOST_ARCH_VALUE_ARM32,
    OS_TYPE_VALUE_LINUX,
} from '@opentelemetry/semantic-conventions/incubating';
import type { OSDetector } from '../../lib/detectors/osdetector.mjs';

import './setup.mjs';

await describe('OSDetector', async function () {
    let osDetector: OSDetector;
    let config: ResourceDetectionConfig;

    let archMock: TestDouble<typeof import('node:os').arch>;
    let typeMock: TestDouble<typeof import('node:os').type>;
    let osArch: NodeJS.Architecture;
    let osType: string;

    before(async function () {
        const os = await import('node:os');

        archMock = func<typeof import('node:os').arch>();
        typeMock = func<typeof import('node:os').type>();

        osArch = os.arch();
        osType = os.type();

        await replaceEsm('node:os', {
            ...os,
            arch: archMock,
            type: typeMock,
        });

        ({ osDetector } = await import('../../lib/detectors/osdetector.mjs'));
        config = {
            detectors: [osDetector],
        };
    });

    beforeEach(function () {
        when(archMock()).thenReturn(osArch);
        when(typeMock()).thenReturn(osType);
    });

    await it('should retrieve host name, architecture and OS type', function () {
        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.keys([ATTR_HOST_NAME, ATTR_HOST_ARCH, ATTR_OS_TYPE]);
    });

    await it('should prefer lookup table values for architecure', function () {
        when(archMock()).thenReturn('arm');

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(ATTR_HOST_ARCH, HOST_ARCH_VALUE_ARM32);
    });

    await it('should fall back to the original value for unknown architecure', function () {
        const expected = 's390';
        when(archMock()).thenReturn(expected as unknown as NodeJS.Architecture);

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(ATTR_HOST_ARCH, expected);
    });

    await it('should prefer lookup table values for OS type', function () {
        when(typeMock()).thenReturn('Linux');

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(ATTR_OS_TYPE, OS_TYPE_VALUE_LINUX);
    });

    await it('should fall back to the original value for unknown OS type', function () {
        when(typeMock()).thenReturn('My Super OS!');

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(ATTR_OS_TYPE, 'MYSUPEROS');
    });
});
