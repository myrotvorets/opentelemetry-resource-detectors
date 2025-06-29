import { Resource, type ResourceDetectionConfig, type ResourceDetector } from '@opentelemetry/resources';
import { resourceFromDetectedResource } from '@opentelemetry/resources/build/src/ResourceImpl.js';

export async function runDetector(detector: ResourceDetector, config: ResourceDetectionConfig): Promise<Resource> {
    const resource = resourceFromDetectedResource(detector.detect(config));
    if (resource.waitForAsyncAttributes) {
        await resource.waitForAsyncAttributes();
    }

    return resource;
}
