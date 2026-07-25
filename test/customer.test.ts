import {describe, test} from "node:test";
import * as assert from 'assert';
import * as process from "node:process";
import {faker} from '@faker-js/faker';
import {getClient, noApiConfigured} from "./support/helpers";

describe('Customer', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('login returns a customer access url', async () => {
        const customerNumber = process.env.CUSTOMER_NUMBER;
        if (!customerNumber) {
            return; // skip if no customer configured
        }
        const result = await client.customer.login({customerNumber});
        assert.ok(result, 'no result returned');
        assert.ok(result.url, 'login missing url');
    });

    test('fetch -> update -> replace -> remove lifecycle', async () => {
        const customerNumber = faker.git.commitSha();

        // Create a plain customer, no mandate. An invite attaches a contract that
        // blocks removal (err_remove_stale) — and cancelling it doesn't clear that.
        await client.customer.replace(customerNumber, {
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            email: faker.internet.email(),
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            country: 'BE',
            l: 'nl',
        });

        const fetched = await client.customer.fetch(customerNumber);
        assert.ok(fetched, 'no customer returned');

        await client.customer.update(customerNumber, {lastname: 'Updated-' + faker.person.lastName()});

        await client.customer.replace(customerNumber, {
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            email: faker.internet.email(),
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            country: 'BE',
            l: 'nl',
        });

        await client.customer.remove(customerNumber);

        // Removal must actually take effect: fetching the removed customer should fail.
        await assert.rejects(
            () => client.customer.fetch(customerNumber),
            {statusCode: 400, code: 'err_not_found'},
            'removed customer should no longer be fetchable',
        );
    });
});
