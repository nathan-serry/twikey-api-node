import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {CT, getClient, importedMandate, noApiConfigured} from "./support/helpers";

describe('Subscription', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('full lifecycle: create -> detail -> update -> partialUpdate -> cancel', async () => {
        // Needs a fresh recurring mandate; the shared MNDTNUMBER is a contract-type
        // mandate the API rejects for subscriptions.
        const mndtId = await importedMandate(client, 'SUB-');

        // The API strips dashes from the ref, so keep it dash-free or lookups miss.
        const ref = 'SUBREF' + faker.git.commitSha({length: 6});
        const subscription = await client.subscription.create({
            ct: CT(),
            mndtId,
            ref,
            amount: 99,
            message: 'Monthly test subscription',
            recurrence: '1m',
            start: '2026-08-01',
        });
        assert.ok(subscription, 'no subscription returned');

        // Assert the field values, not just truthiness. SubscriptionResponse used to declare
        // names the API never sends (mandateNumber/startDate/stopDate/recurrencePeriod/
        // transactionMessage), so every one of them read as undefined forever — and an
        // `assert.ok(detail)` cannot notice that. These assertions pin the real names.
        assert.strictEqual(subscription.mndtId, mndtId, 'subscription is on the wrong mandate');
        assert.strictEqual(subscription.amount, 99, 'the amount we sent must come back');
        assert.strictEqual(subscription.recurrence, '1m', 'the recurrence we sent must come back');
        assert.strictEqual(subscription.start, '2026-08-01', 'the start date we sent must come back');
        assert.strictEqual(subscription.message, 'Monthly test subscription');
        assert.strictEqual(subscription.state, 'active', 'a new subscription should be active');
        assert.ok(subscription.id, 'subscription has no id');

        const mandateNumber = subscription.mndtId;
        // The API upper-cases the ref, so use the value it returned for follow-up calls.
        const canonicalRef = subscription.ref ?? ref;

        const detail = await client.subscription.detail(mandateNumber, canonicalRef);
        assert.ok(detail, 'no detail returned');
        assert.strictEqual(detail.id, subscription.id, 'detail returned a different subscription');
        assert.strictEqual(detail.ref, canonicalRef);
        assert.strictEqual(detail.mndtId, mandateNumber);
        assert.strictEqual(detail.amount, 99);
        assert.strictEqual(detail.recurrence, '1m');

        // Update is a full replacement — re-send all required fields.
        await client.subscription.update(mandateNumber, canonicalRef, {amount: 149, message: 'Updated message', recurrence: '1m', start: '2026-08-01'});
        const afterUpdate = await client.subscription.detail(mandateNumber, canonicalRef);
        assert.strictEqual(afterUpdate.amount, 149, 'update did not change the amount');
        assert.strictEqual(afterUpdate.message, 'Updated message', 'update did not change the message');

        await client.subscription.partialUpdate(mandateNumber, canonicalRef, {message: 'Patched message'});
        const afterPatch = await client.subscription.detail(mandateNumber, canonicalRef);
        assert.strictEqual(afterPatch.message, 'Patched message', 'partialUpdate did not change the message');
        assert.strictEqual(afterPatch.amount, 149, 'partialUpdate must not disturb the amount');

        await client.subscription.cancel(mandateNumber, canonicalRef);
    });

    test('query returns subscriptions with the fields the response type declares', async () => {
        const subscriptions = await client.subscription.query({});
        assert.ok(Array.isArray(subscriptions), 'expected an array of subscriptions');
        assert.ok(subscriptions.length > 0, 'expected at least one subscription to inspect');

        // query() shares SubscriptionResponse with create/detail, so the same names must hold
        // here. Checking every entry rather than the first guards against a shape that only
        // some states produce.
        for (const s of subscriptions) {
            assert.strictEqual(typeof s.id, 'number', 'id must be a number');
            assert.strictEqual(typeof s.mndtId, 'string', 'mndtId must be a string');
            assert.strictEqual(typeof s.state, 'string', 'state must be a string');
            assert.strictEqual(typeof s.amount, 'number', 'amount must be a number');
            assert.strictEqual(typeof s.recurrence, 'string', 'recurrence must be a string');
            assert.strictEqual(typeof s.start, 'string', 'start must be a string');
            assert.strictEqual(typeof s.runs, 'number', 'runs must be a number');
            assert.strictEqual(typeof s.stopAfter, 'number', 'stopAfter must be a number');
            // Always sent, but nullable.
            assert.ok(s.last === null || typeof s.last === 'string', 'last must be a string or null');
            assert.ok(s.ref === null || typeof s.ref === 'string', 'ref must be a string or null');
        }
    });
});
