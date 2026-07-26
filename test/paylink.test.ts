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
        // Refunds aren't idempotent: the same link+amount is rejected as a duplicate on
        // repeat runs. Either outcome proves the call is well-formed and accepted.
        try {
            const refunded = await client.paylink.refund({
                id,
                amount: 1,
                message: 'Refund test ' + faker.git.commitSha({length: 8}),
            });
            // refund() must hand back the created credit transfer, not swallow the body:
            // its id is the only handle on the transfer for detail()/remove().
            assert.ok(refunded, 'refund returned nothing');
            assert.ok(refunded.id, 'refund did not return a created refund id');
        } catch (e) {
            assert.match((e as Error).message, /duplicate refund/i, 'refund rejected for an unexpected reason');
        }
    });

    test('refund rejects for an unknown paylink id', async () => {
        await assert.rejects(
            () => client.paylink.refund({id: 999999999, amount: 1, message: 'Refund test'}),
            (e: unknown) => {
                const err = e as { statusCode?: number; code?: string };
                assert.strictEqual(err.statusCode, 400, 'unexpected status code');
                assert.ok(err.code, 'error carries no api error code');
                return true;
            },
        );
    });
});
