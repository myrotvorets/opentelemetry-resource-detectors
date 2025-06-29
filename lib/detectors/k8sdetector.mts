import { readFile } from 'node:fs/promises';
import type { DetectedResource, ResourceDetectionConfig, ResourceDetector } from '@opentelemetry/resources';
import {
    ATTR_CONTAINER_ID,
    ATTR_HOST_ID,
    ATTR_HOST_NAME,
    ATTR_K8S_DEPLOYMENT_NAME,
    ATTR_K8S_NAMESPACE_NAME,
    ATTR_K8S_POD_NAME,
} from '@opentelemetry/semantic-conventions/incubating';
import { getContainerIDFormCGroup } from './utils.mjs';

export class K8sDetector implements ResourceDetector {
    public detect(_config?: ResourceDetectionConfig): DetectedResource {
        const matches = /^(.*)-([a-f0-9]+)-([a-z0-9]{5})$/u.exec(process.env['HOSTNAME'] ?? '');
        if (!matches) {
            return {};
        }

        return {
            attributes: {
                [ATTR_HOST_NAME]: process.env['HOSTNAME']!,
                [ATTR_K8S_POD_NAME]: matches[1],
                [ATTR_K8S_DEPLOYMENT_NAME]: matches[2],
                [ATTR_HOST_ID]: K8sDetector.getUID(),
                [ATTR_K8S_NAMESPACE_NAME]: K8sDetector.getNamespaceName(),
                [ATTR_CONTAINER_ID]: K8sDetector.getContainerID(),
            },
        };
    }

    private static getContainerID(): Promise<string | undefined> {
        return getContainerIDFormCGroup(/\/([0-9a-f]{12})[0-9a-f]{52}$/u);
    }

    // This method is specific to our configuration
    private static getUID(): Promise<string | undefined> {
        return K8sDetector.readFile('/etc/podinfo/uid');
    }

    // This method is specific to our configuration
    private static getNamespaceName(): Promise<string | undefined> {
        return K8sDetector.readFile('/etc/podinfo/namespace');
    }

    private static async readFile(name: string): Promise<string | undefined> {
        try {
            return (await readFile(name, { encoding: 'ascii' })).trim();
        } catch {
            return undefined;
        }
    }
}

export const k8sDetector = new K8sDetector();
