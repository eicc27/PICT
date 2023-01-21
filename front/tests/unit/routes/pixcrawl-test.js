import { module, test } from 'qunit';
import { setupTest } from 'front/tests/helpers';

module('Unit | Route | pixcrawl', function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
        let route = this.owner.lookup('route:pixcrawl');
        assert.ok(route);
    });
});
