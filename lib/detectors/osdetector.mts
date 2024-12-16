import { arch, hostname, type } from 'node:os';
import { type DetectorSync, type IResource, Resource, type ResourceDetectionConfig } from '@opentelemetry/resources';
import {
    ATTR_HOST_ARCH,
    ATTR_HOST_NAME,
    ATTR_OS_TYPE,
    HOST_ARCH_VALUE_AMD64,
    HOST_ARCH_VALUE_ARM32,
    HOST_ARCH_VALUE_ARM64,
    HOST_ARCH_VALUE_PPC32,
    HOST_ARCH_VALUE_PPC64,
    HOST_ARCH_VALUE_X86,
    OS_TYPE_VALUE_AIX,
    OS_TYPE_VALUE_DARWIN,
    OS_TYPE_VALUE_DRAGONFLYBSD,
    OS_TYPE_VALUE_FREEBSD,
    OS_TYPE_VALUE_HPUX,
    OS_TYPE_VALUE_LINUX,
    OS_TYPE_VALUE_NETBSD,
    OS_TYPE_VALUE_OPENBSD,
    OS_TYPE_VALUE_SOLARIS,
    OS_TYPE_VALUE_WINDOWS,
    OS_TYPE_VALUE_Z_OS,
} from '@opentelemetry/semantic-conventions/incubating';

export class OSDetector implements DetectorSync {
    public detect(_config: ResourceDetectionConfig): IResource {
        const attrs = {
            [ATTR_HOST_NAME]: hostname(),
            [ATTR_HOST_ARCH]: OSDetector.mapArchitecture(arch()),
            [ATTR_OS_TYPE]: OSDetector.mapOSType(type()),
        };

        return new Resource(attrs);
    }

    private static mapArchitecture(architecture: string): string {
        const lut: Record<string, string> = {
            arm: HOST_ARCH_VALUE_ARM32,
            arm64: HOST_ARCH_VALUE_ARM64,
            ia32: HOST_ARCH_VALUE_X86,
            ppc: HOST_ARCH_VALUE_PPC32,
            ppc64: HOST_ARCH_VALUE_PPC64,
            x32: HOST_ARCH_VALUE_X86,
            x64: HOST_ARCH_VALUE_AMD64,
        };

        return lut[architecture] ?? architecture;
    }

    private static mapOSType(os: string): string {
        const lut: Record<string, string> = {
            AIX: OS_TYPE_VALUE_AIX,
            Darwin: OS_TYPE_VALUE_DARWIN,
            DragonFly: OS_TYPE_VALUE_DRAGONFLYBSD,
            FreeBSD: OS_TYPE_VALUE_FREEBSD,
            'HP-UX': OS_TYPE_VALUE_HPUX,
            Linux: OS_TYPE_VALUE_LINUX,
            NetBSD: OS_TYPE_VALUE_NETBSD,
            OpenBSD: OS_TYPE_VALUE_OPENBSD,
            SunOS: OS_TYPE_VALUE_SOLARIS,
            Windows_NT: OS_TYPE_VALUE_WINDOWS,
            'OS/390': OS_TYPE_VALUE_Z_OS,

            'CYGWIN_NT-5.1': OS_TYPE_VALUE_WINDOWS,
            'CYGWIN_NT-6.1': OS_TYPE_VALUE_WINDOWS,
            'CYGWIN_NT-6.1-WOW64': OS_TYPE_VALUE_WINDOWS,
            'CYGWIN_NT-10.0': OS_TYPE_VALUE_WINDOWS,
        };

        return lut[os] ?? os.replace(/[^a-z0-9]/giu, '').toUpperCase();
    }
}

export const osDetector = new OSDetector();
