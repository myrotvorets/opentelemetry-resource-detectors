import type { DetectedResource, ResourceDetectionConfig, ResourceDetector } from '@opentelemetry/resources';
import { ATTR_CONTAINER_ID } from '@opentelemetry/semantic-conventions/incubating';
import { getContainerIDFormCGroup, getContainerIDFormCGroup2 } from './utils.mjs';

export class DockerDetector implements ResourceDetector {
    public detect(_config?: ResourceDetectionConfig): DetectedResource {
        return {
            attributes: {
                [ATTR_CONTAINER_ID]: DockerDetector.getContainerID(),
            },
        };
    }

    private static async getContainerID(): Promise<string | undefined> {
        return (
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            (await getContainerIDFormCGroup(/\/docker\/([0-9a-f]{12})[0-9a-f]{52}$/u)) ||
            getContainerIDFormCGroup2(/\/containers\/([0-9a-f]{12})[0-9a-f]{52}\//u)
        );
    }
}

export const dockerDetector = new DockerDetector();
