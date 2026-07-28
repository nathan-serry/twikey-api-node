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
        assert.ok(subscription.mandateNumber || subscription.ref, 'subscription missing identifier');

        const mandateNumber = subscription.mandateNumber ?? mndtId;
        // The API upper-cases the ref, so use the value it returned for follow-up calls.
        const canonicalRef = subscription.ref ?? ref;

        const detail = await client.subscription.detail(mandateNumber, canonicalRef);
        assert.ok(detail, 'no detail returned');

        // Update is a full replacement — re-send all required fields.
        await client.subscription.update(mandateNumber, canonicalRef, {amount: 149, message: 'Updated message', recurrence: '1m', start: '2026-08-01'});

        await client.subscription.partialUpdate(mandateNumber, canonicalRef, {message: 'Updated message'});

        await client.subscription.cancel(mandateNumber, canonicalRef);
    });

    test('query returns subscriptions', async () => {
        const subscriptions = await client.subscription.query({});
        assert.ok(Array.isArray(subscriptions), 'expected an array of subscriptions');
    });
});
