import {FeedOptions} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {CT, getClient, noApiConfigured} from "./support/helpers";

describe('Paylink', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('create -> feed', async () => {
        const link = await client.paylink.create({
            ct: CT(),
            customerNumber: faker.git.commitSha(),
            ref: faker.person.firstName(),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            message: faker.commerce.productName() + " - " + Date.now(),
            amount: Number(faker.commerce.price({min: 0, max: 1000}))
        });
        assert.ok(link);
        assert.ok(link.url);

        const options: FeedOptions = {};
        let hasLinks = false;
        const feed = await client.paylink.feed(options);
        for await (const l of feed) {
            if (!hasLinks) {
                hasLinks = true;
                assert.ok(options.last_position);
            }
            assert.ok(l);
            assert.ok(l.id);
            assert.ok(l.amount);
        }
    });
});

describe('Paylink extended', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('detail returns the created paylink', async () => {
        const link = await client.paylink.create({
            ct: CT(),
            ref: faker.git.commitSha({length: 8}),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            message: faker.commerce.productName() + ' ' + Date.now(),
            amount: Number(faker.commerce.price({min: 1, max: 500}))
        });
        assert.ok(link.id, 'paylink missing id');

        const detail = await client.paylink.detail(link.id);
        assert.ok(detail, 'no detail returned');
        assert.strictEqual(detail.id, link.id, 'detail id mismatch');
    });

    test('detail with includeRefunds flag', async () => {
        const link = await client.paylink.create({
            ct: CT(),
            ref: faker.git.commitSha({length: 8}),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            message: faker.commerce.productName() + ' ' + Date.now(),
            amount: Number(faker.commerce.price({min: 1, max: 500}))
        });
        const detail = await client.paylink.detail(link.id, true);
        assert.ok(detail, 'no detail returned');
    });

    test('remove deletes an unpaid paylink', async () => {
        const link = await client.paylink.create({
            ct: CT(),
            ref: faker.git.commitSha({length: 8}),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            message: faker.commerce.productName() + ' ' + Date.now(),
            amount: Number(faker.commerce.price({min: 1, max: 500}))
        });
        assert.ok(link.id, 'paylink missing id');
        await client.paylink.remove(link.id);
        // Removal must take effect: the paylink should no longer be retrievable.
        await assert.rejects(
            () => client.paylink.detail(link.id),
            {statusCode: 400, code: 'err_not_found'},
            'removed paylink should no longer be retrievable',
        );
    });

    // A link can only be refunded once it has actually been paid, which can't be done
    // via the API. Point PAID_PAYLINK_ID at a real paid link in the beta environment.
    test('refund a paid paylink', {skip: !process.env.PAID_PAYLINK_ID}, async () => {
        const id = Number(process.env.PAID_PAYLINK_ID);
        // Refunds aren't idempotent: the same link+amount is rejected as a duplicate. Vary
        // the amount so each run creates a genuinely new refund instead of being bounced.
        const amount = Number((Math.random() * 0.9 + 0.1).toFixed(2));

        const before = await client.paylink.detail(id, true);
        assert.strictEqual(before.state, 'paid', 'PAID_PAYLINK_ID must point at a paid link');

        const ack = await client.paylink.refund({id, amount, message: 'Refund test ' + faker.git.commitSha({length: 8})});
        // The API echoes the request rather than describing the transfer: `id` here is the
        // payment link's, NOT a refund id. Asserting that explicitly so nobody "fixes" the
        // return type back to something transfer-shaped.
        assert.ok(ack, 'refund returned nothing');
        assert.strictEqual(ack.id, id, 'refund ack should echo the paylink id');
        assert.strictEqual(ack.amount, amount, 'refund ack should echo the amount');

        // The refund itself is only observable through detail(include=refunds).
        const after = await client.paylink.detail(id, true);
        assert.strictEqual(
            after.refunds?.length, (before.refunds?.length ?? 0) + 1,
            'refund was acknowledged but no new refund appeared on the link',
        );
        const created = after.refunds?.at(-1);
        assert.strictEqual(created?.amount, amount, 'newest refund has the wrong amount');
        assert.ok(created?.id, 'created refund carries no id');
    });

    test('refund rejects for an unknown paylink id', async () => {
        await assert.rejects(
            () => client.paylink.refund({id: 999999999, amount: 1, message: 'Refund test'}),
            {statusCode: 400, code: 'err_not_found'},
        );
    });
});
