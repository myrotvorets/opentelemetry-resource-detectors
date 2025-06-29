import { afterEach } from 'node:test';
import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { reset } from 'testdouble';

use(chaiAsPromised);

afterEach(function () {
    reset();
});
