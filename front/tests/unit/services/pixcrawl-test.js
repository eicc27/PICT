import { module, test } from 'qunit';
import { setupTest } from 'front/tests/helpers';

module('Unit | Service | pixcrawl', function (hooks) {
    setupTest(hooks);

    // TODO: Replace this with your real tests.
    test('it exists', function (assert) {
        let service = this.owner.lookup('service:pixcrawl');
        assert.ok(service);
    });
});
