import { expect } from 'chai';
import { type TestDouble, func, replaceEsm, when } from 'testdouble';
import type { ResourceDetectionConfig } from '@opentelemetry/resources';
import {
    HOSTARCHVALUES_ARM32,
    OSTYPEVALUES_LINUX,
    SEMRESATTRS_HOST_ARCH,
    SEMRESATTRS_HOST_NAME,
    SEMRESATTRS_OS_TYPE,
} from '@opentelemetry/semantic-conventions';
import type { OSDetector } from '../../lib/detectors/osdetector.mjs';

describe('OSDetector', function () {
    let osDetector: OSDetector;
    let config: ResourceDetectionConfig;

    let archMock: TestDouble<typeof import('node:os').arch>;
    let typeMock: TestDouble<typeof import('node:os').type>;
    let osArch: string;
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

    it('should retrieve host name, architecture and OS type', function () {
        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.keys([SEMRESATTRS_HOST_NAME, SEMRESATTRS_HOST_ARCH, SEMRESATTRS_OS_TYPE]);
    });

    it('should prefer lookup table values for architecure', function () {
        when(archMock()).thenReturn('arm');

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(SEMRESATTRS_HOST_ARCH, HOSTARCHVALUES_ARM32);
    });

    it('should fall back to the original value for unknown architecure', function () {
        const expected = 's390';
        when(archMock()).thenReturn(expected);

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(SEMRESATTRS_HOST_ARCH, expected);
    });

    it('should prefer lookup table values for OS type', function () {
        when(typeMock()).thenReturn('Linux');

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(SEMRESATTRS_OS_TYPE, OSTYPEVALUES_LINUX);
    });

    it('should fall back to the original value for unknown OS type', function () {
        when(typeMock()).thenReturn('My Super OS!');

        const resource = osDetector.detect(config);
        expect(resource)
            .to.be.an('object')
            .and.have.property('attributes')
            .that.is.an('object')
            .and.has.property(SEMRESATTRS_OS_TYPE, 'MYSUPEROS');
    });
});
