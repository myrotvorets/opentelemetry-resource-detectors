import { arch, hostname, type } from 'node:os';
import { type DetectorSync, type IResource, Resource, type ResourceDetectionConfig } from '@opentelemetry/resources';
import {
    HOSTARCHVALUES_AMD64,
    HOSTARCHVALUES_ARM32,
    HOSTARCHVALUES_ARM64,
    HOSTARCHVALUES_PPC32,
    HOSTARCHVALUES_PPC64,
    HOSTARCHVALUES_X86,
    OSTYPEVALUES_AIX,
    OSTYPEVALUES_DARWIN,
    OSTYPEVALUES_DRAGONFLYBSD,
    OSTYPEVALUES_FREEBSD,
    OSTYPEVALUES_HPUX,
    OSTYPEVALUES_LINUX,
    OSTYPEVALUES_NETBSD,
    OSTYPEVALUES_OPENBSD,
    OSTYPEVALUES_SOLARIS,
    OSTYPEVALUES_WINDOWS,
    OSTYPEVALUES_Z_OS,
    SEMRESATTRS_HOST_ARCH,
    SEMRESATTRS_HOST_NAME,
    SEMRESATTRS_OS_TYPE,
} from '@opentelemetry/semantic-conventions';

export class OSDetector implements DetectorSync {
    // eslint-disable-next-line class-methods-use-this
    public detect(_config: ResourceDetectionConfig): IResource {
        const attrs = {
            [SEMRESATTRS_HOST_NAME]: hostname(),
            [SEMRESATTRS_HOST_ARCH]: OSDetector.mapArchitecture(arch()),
            [SEMRESATTRS_OS_TYPE]: OSDetector.mapOSType(type()),
        };

        return new Resource(attrs);
    }

    private static mapArchitecture(architecture: string): string {
        const lut: Record<string, string> = {
            arm: HOSTARCHVALUES_ARM32,
            arm64: HOSTARCHVALUES_ARM64,
            ia32: HOSTARCHVALUES_X86,
            ppc: HOSTARCHVALUES_PPC32,
            ppc64: HOSTARCHVALUES_PPC64,
            x32: HOSTARCHVALUES_X86,
            x64: HOSTARCHVALUES_AMD64,
        };

        return lut[architecture] ?? architecture;
    }

    private static mapOSType(os: string): string {
        const lut: Record<string, string> = {
            AIX: OSTYPEVALUES_AIX,
            Darwin: OSTYPEVALUES_DARWIN,
            DragonFly: OSTYPEVALUES_DRAGONFLYBSD,
            FreeBSD: OSTYPEVALUES_FREEBSD,
            'HP-UX': OSTYPEVALUES_HPUX,
            Linux: OSTYPEVALUES_LINUX,
            NetBSD: OSTYPEVALUES_NETBSD,
            OpenBSD: OSTYPEVALUES_OPENBSD,
            SunOS: OSTYPEVALUES_SOLARIS,
            Windows_NT: OSTYPEVALUES_WINDOWS,
            'OS/390': OSTYPEVALUES_Z_OS,

            'CYGWIN_NT-5.1': OSTYPEVALUES_WINDOWS,
            'CYGWIN_NT-6.1': OSTYPEVALUES_WINDOWS,
            'CYGWIN_NT-6.1-WOW64': OSTYPEVALUES_WINDOWS,
            'CYGWIN_NT-10.0': OSTYPEVALUES_WINDOWS,
        };

        return lut[os] ?? os.replace(/[^a-z0-9]/giu, '').toUpperCase();
    }
}

export const osDetector = new OSDetector();
