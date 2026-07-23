import {describe, test} from "node:test";
import * as assert from 'assert';
import * as process from "node:process";
import {faker} from '@faker-js/faker';
import {CT, getClient, noApiConfigured} from "./support/helpers";

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

        // A customer record is created as a side effect of inviting them onto a mandate.
        await client.document.create({
            ct: CT(),
            customerNumber,
            email: faker.internet.email(),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            l: 'nl',
            country: 'BE',
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
    });
});
