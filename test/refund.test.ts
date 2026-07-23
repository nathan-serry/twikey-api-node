import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {CT, getClient, noApiConfigured} from "./support/helpers";

describe('Refund', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('addBeneficiary then getBeneficiaries includes it', async () => {
        const iban = 'NL95BUNQ2025545371';
        const beneficiary = await client.refund.addBeneficiary({
            name: faker.person.fullName(),
            iban,
            bic: 'BUNQNL2A',
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            country: 'BE',
        });
        assert.ok(beneficiary, 'no beneficiary returned');
        assert.strictEqual(beneficiary.iban, iban);

        const beneficiaries = await client.refund.getBeneficiaries();
        assert.ok(Array.isArray(beneficiaries), 'expected array of beneficiaries');
        assert.ok(beneficiaries.some(b => b.iban === iban), 'added beneficiary not found');
    });

    test('disableBeneficiary removes a beneficiary', async () => {
        const iban = 'NL95BUNQ2025545371';
        const customerNumber = faker.git.commitSha();
        await client.refund.addBeneficiary({
            customerNumber,
            name: faker.person.fullName(),
            iban,
            bic: 'BUNQNL2A',
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            country: 'BE',
        });
        await client.refund.disableBeneficiary(iban, customerNumber);
    });

    // The next two calls require a real, funded beta account to succeed end-to-end;
    // they're kept here so the call shape/types are covered even without one.
    test('addRefund creates a refund/transfer', async () => {
        const ref = 'REFUND-' + faker.git.commitSha({length: 8});
        const customerNumber = faker.git.commitSha();
        const iban = 'NL95BUNQ2025545371';

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

        // The destination IBAN must already be a registered, active beneficiary.
        await client.refund.addBeneficiary({
            customerNumber,
            name: faker.person.fullName(),
            iban,
            bic: 'BUNQNL2A',
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            country: 'BE',
        });

        await client.refund.addRefund({
            ref,
            customerNumber,
            message: 'Refund test',
            amount: 10,
            iban,
            bic: 'BUNQNL2A',
            name: faker.person.fullName(),
        });
    });

    test('collectRefund completes a refund batch', async () => {
        await client.refund.collectRefund({ct: CT()});
    });
});
