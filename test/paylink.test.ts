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

    test('refund a paylink', async () => {
        const link = await client.paylink.create({
            ct: CT(),
            ref: faker.git.commitSha({length: 8}),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            message: faker.commerce.productName() + ' ' + Date.now(),
            amount: Number(faker.commerce.price({min: 10, max: 500}))
        });
        assert.ok(link.id, 'paylink missing id');

        // Requires the link to actually be paid in the beta environment before a
        // refund is accepted by the API; kept here so the call shape is covered.
        await client.paylink.refund({id: link.id, amount: 1, message: 'Refund test'});
    });
});
