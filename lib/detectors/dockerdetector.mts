import {
    type DetectorSync,
    type IResource,
    Resource,
    type ResourceAttributes,
    type ResourceDetectionConfig,
} from '@opentelemetry/resources';
import { ATTR_CONTAINER_ID } from '@opentelemetry/semantic-conventions/incubating';
import { getContainerIDFormCGroup, getContainerIDFormCGroup2 } from './utils.mjs';

export class DockerDetector implements DetectorSync {
    public detect(_config: ResourceDetectionConfig): IResource {
        return new Resource({}, DockerDetector.getAsyncAttributes());
    }

    private static async getAsyncAttributes(): Promise<ResourceAttributes> {
        const cid = await DockerDetector.getContainerID();
        if (cid) {
            return {
                [ATTR_CONTAINER_ID]: cid,
            };
        }

        return {};
    }

    private static async getContainerID(): Promise<string> {
        return (
            (await getContainerIDFormCGroup(/\/docker\/([0-9a-f]{12})[0-9a-f]{52}$/u)) ||
            getContainerIDFormCGroup2(/\/containers\/([0-9a-f]{12})[0-9a-f]{52}\//u)
        );
    }
}

export const dockerDetector = new DockerDetector();
