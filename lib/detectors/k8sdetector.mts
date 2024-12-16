import { readFile } from 'node:fs/promises';
import {
    type DetectorSync,
    type IResource,
    Resource,
    type ResourceAttributes,
    type ResourceDetectionConfig,
} from '@opentelemetry/resources';
import {
    ATTR_CONTAINER_ID,
    ATTR_HOST_ID,
    ATTR_HOST_NAME,
    ATTR_K8S_DEPLOYMENT_NAME,
    ATTR_K8S_NAMESPACE_NAME,
    ATTR_K8S_POD_NAME,
} from '@opentelemetry/semantic-conventions/incubating';
import { getContainerIDFormCGroup } from './utils.mjs';

export class K8sDetector implements DetectorSync {
    public detect(_config: ResourceDetectionConfig): IResource {
        const matches = /^(.*)-([a-f0-9]+)-([a-z0-9]{5})$/u.exec(process.env['HOSTNAME'] ?? '');
        if (!matches) {
            return Resource.empty();
        }

        const attrs = {
            [ATTR_HOST_NAME]: process.env['HOSTNAME']!,
            [ATTR_K8S_POD_NAME]: matches[1],
            [ATTR_K8S_DEPLOYMENT_NAME]: matches[2],
        };

        return new Resource(attrs, K8sDetector.getAsyncAttributes());
    }

    private static async getAsyncAttributes(): Promise<ResourceAttributes> {
        const [uid, cid, ns] = await Promise.all([
            K8sDetector.getUID(),
            K8sDetector.getContainerID(),
            K8sDetector.getNamespaceName(),
        ]);

        const attrs = {
            [ATTR_HOST_ID]: uid,
            [ATTR_K8S_NAMESPACE_NAME]: ns,
            [ATTR_CONTAINER_ID]: cid,
        };

        return K8sDetector.cleanUpAttributes(attrs);
    }

    private static getContainerID(): Promise<string> {
        return getContainerIDFormCGroup(/\/([0-9a-f]{12})[0-9a-f]{52}$/u);
    }

    // This method is specific to our configuration
    private static getUID(): Promise<string> {
        return K8sDetector.readFile('/etc/podinfo/uid');
    }

    // This method is specific to our configuration
    private static getNamespaceName(): Promise<string> {
        return K8sDetector.readFile('/etc/podinfo/namespace');
    }

    private static async readFile(name: string): Promise<string> {
        try {
            return (await readFile(name, { encoding: 'ascii' })).trim();
        } catch {
            return '';
        }
    }

    private static cleanUpAttributes(attrs: ResourceAttributes): ResourceAttributes {
        const result: ResourceAttributes = {};
        Object.keys(attrs).forEach((key) => {
            const value = attrs[key];
            if (value) {
                result[key] = value;
            }
        });

        return result;
    }
}

export const k8sDetector = new K8sDetector();
