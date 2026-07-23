import {describe, test} from "node:test";
import * as assert from 'assert';
import * as process from "node:process";
import {faker} from '@faker-js/faker';
import {getClient, noApiConfigured} from "./support/helpers";

describe('Subscription', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('full lifecycle: create -> detail -> update -> partialUpdate -> cancel', {skip: !process.env.SUBSCRIPTION_CT}, async () => {
        const mndtId = process.env.MNDTNUMBER;
        assert.ok(mndtId, 'MNDTNUMBER not defined');

        const ref = 'SUB-REF-' + faker.git.commitSha({length: 6});
        const subscription = await client.subscription.create({
            ct: Number(process.env.SUBSCRIPTION_CT!),
            mndtId,
            ref,
            amount: 99,
            message: 'Monthly test subscription',
            recurrencePeriod: 'monthly',
        });
        assert.ok(subscription, 'no subscription returned');
        assert.ok(subscription.mandateNumber || subscription.ref, 'subscription missing identifier');

        const mandateNumber = subscription.mandateNumber ?? mndtId;

        const detail = await client.subscription.detail(mandateNumber, ref);
        assert.ok(detail, 'no detail returned');

        await client.subscription.update(mandateNumber, ref, {amount: 149});

        await client.subscription.partialUpdate(mandateNumber, ref, {message: 'Updated message'});

        await client.subscription.cancel(mandateNumber, ref);
    });

    test('query returns subscriptions', async () => {
        const results = await client.subscription.query({});
        assert.ok(Array.isArray(results) || results, 'no query results');
    });
});
