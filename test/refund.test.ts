import {FeedOptions} from "../src";
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

    // Full refund lifecycle. Creating a real refund needs a refund-capable/funded beta
    // account (same precondition as collectRefund), so gate on REFUND_IBAN and skip cleanly
    // otherwise. addRefund now returns the created refund, giving a real id to detail + remove.
    test('lifecycle: addRefund -> detail -> remove', {skip: !process.env.REFUND_IBAN}, async () => {
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

        // The destination IBAN must already be a registered, active beneficiary.
        await client.refund.addBeneficiary({
            customerNumber,
            name: faker.person.fullName(),
            iban: TEST_IBAN,
            bic: TEST_BIC,
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            country: 'BE',
        });

        const refund = await client.refund.addRefund({
            ref: 'REFUND-' + faker.git.commitSha({length: 8}),
            customerNumber,
            message: 'Refund test',
            amount: 10,
            iban: TEST_IBAN,
            bic: TEST_BIC,
            name: faker.person.fullName(),
        });
        assert.ok(refund?.id, 'addRefund did not return a created refund id');

        const fetched = await client.refund.detail(refund.id);
        assert.strictEqual(Number(fetched.id), Number(refund.id), 'detail returned a different refund');

        await client.refund.remove(refund.id);
        await assert.rejects(
            () => client.refund.detail(refund.id),
            /error=err_/i,
            'removed refund should no longer be retrievable',
        );
    });

    // collectRefund executes pending refunds as a SEPA credit-transfer batch; batchDetail then
    // looks that batch up by its id (+pmtinfid). Gated on REFUND_IBAN; the lookup only runs if
    // collectRefund actually produced a batch (nothing pending -> empty array -> nothing to detail).
    test('collectRefund executes a batch, batchDetail looks it up', {skip: !process.env.REFUND_IBAN}, async () => {
        const batches = await client.refund.collectRefund({ct: CT(), iban: process.env.REFUND_IBAN});
        assert.ok(Array.isArray(batches), 'expected an array of credit-transfer batches');
        if (batches.length === 0) return; // nothing pending to collect/detail
        const batch = await client.refund.batchDetail({id: batches[0].id, pmtinfid: batches[0].pmtinfid});
        assert.ok(batch, 'no batch status returned');
        assert.strictEqual(Number(batch.id), Number(batches[0].id), 'batchDetail returned a different batch');
    });

    // Reading the credit-transfer (refund) feed needs no funded account: it drains the
    // pending events and asserts the shape of any that come back.
    test('feed yields refund entries', async () => {
        const options: FeedOptions = {};
        let hasRefunds = false;
        const feed = client.refund.feed(options);
        for await (const refund of feed) {
            if (!hasRefunds) {
                hasRefunds = true;
                assert.ok(options.last_position);
            }
            assert.ok(refund);
            assert.ok(refund.id);
        }
    });

    // Always-on negative paths: a real API rejection (err_* code) for an unknown id proves the
    // endpoint/verb are right, without needing a funded account. Tighten the regex to the exact
    // code (likely err_not_found) once confirmed against a live run.
    test('detail rejects for an unknown refund id', async () => {
        await assert.rejects(() => client.refund.detail(999999999), /error=err_/i);
    });

    test('remove rejects for an unknown refund id', async () => {
        await assert.rejects(() => client.refund.remove(999999999), /error=err_/i);
    });
});
