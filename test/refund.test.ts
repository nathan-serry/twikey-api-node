import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {CT, getClient, noApiConfigured, TEST_BIC, TEST_IBAN} from "./support/helpers";

describe('Refund', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('addBeneficiary then getBeneficiaries includes it', async () => {
        const iban = TEST_IBAN;
        const beneficiary = await client.refund.addBeneficiary({
            name: faker.person.fullName(),
            iban,
            bic: TEST_BIC,
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
        const iban = TEST_IBAN;
        const customerNumber = faker.git.commitSha();
        await client.refund.addBeneficiary({
            customerNumber,
            name: faker.person.fullName(),
            iban,
            bic: TEST_BIC,
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
        const iban = TEST_IBAN;

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
            bic: TEST_BIC,
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
            bic: TEST_BIC,
            name: faker.person.fullName(),
        });
    });

    // Executes the pending refund batch as a SEPA credit transfer, which needs a
    // configured originating/payout account on the creditor (err_invalid_iban otherwise).
    // Gated on REFUND_IBAN until that account is set up Twikey-side.
    test('collectRefund completes a refund batch', {skip: !process.env.REFUND_IBAN}, async () => {
        await client.refund.collectRefund({ct: CT(), iban: process.env.REFUND_IBAN});
    });
});
