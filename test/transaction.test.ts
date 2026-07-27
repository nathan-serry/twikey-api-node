import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {TwikeyError} from "../src";
import {getClient, importedMandate, noApiConfigured} from "./support/helpers";

describe('Transaction', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('create -> detail -> feed', async () => {
        const mndtId = await importedMandate(client, 'TX-');

        const transaction = await client.transaction.create({
            mndtId,
            message: "Test message",
            amount: 500,
        });
        assert.ok(transaction);

        const details = await client.transaction.detail(transaction.id);
        assert.ok(details);

        const feed = await client.transaction.feed();
        for await (const tx of feed) {
            assert.ok(tx);
            assert.ok(tx.id);
            assert.ok(tx.amount);
        }
    });
});

describe('Transaction extended', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('authorise creates a reservation transaction', async () => {
        const mndtId = await importedMandate(client, 'AUTH-');
        const tx = await client.transaction.authorise({
            mndtId,
            message: 'Authorise test',
            amount: 100,
        });
        assert.ok(tx, 'no transaction returned');
        assert.ok(tx.id, 'transaction missing id');
    });

    test('query returns transactions from a given id', async () => {
        const result = await client.transaction.query({fromId: '0'});
        assert.ok(result, 'no result returned');
    });

    test('bulkCreate then bulkStatus round-trip', async () => {
        // Use a fresh recurring mandate; the shared MNDTNUMBER is a contract-type
        // mandate whose entries fail with err_invalid_state.
        const mndtId = await importedMandate(client, 'BULK-');
        const bulk = await client.transaction.bulkCreate([
            {mndtId, message: 'Bulk test', amount: 50}
        ]);
        assert.ok(bulk, 'no bulk response');
        assert.ok(bulk.batchId, 'bulk response missing batchId');

        // The batch may still be processing right after creation (bulkStatus 409s);
        // poll a few times before giving up.
        let entries;
        for (let attempt = 0; ; attempt++) {
            try {
                entries = await client.transaction.bulkStatus(bulk.batchId);
                break;
            } catch (e) {
                if (attempt >= 4 || (e as TwikeyError).statusCode !== 409) throw e;
                await new Promise(r => setTimeout(r, 500));
            }
        }
        assert.ok(Array.isArray(entries), 'expected entries array');
        assert.ok(entries.length > 0, 'empty entries');
        assert.ok(entries[0].status, 'entry missing status');
    });

    test('update changes a transaction', async () => {
        const mndtId = await importedMandate(client, 'UPD-');
        const tx = await client.transaction.create({
            mndtId,
            message: 'To be updated',
            amount: 60,
        });
        assert.ok(tx.id, 'transaction missing id');

        const updated = await client.transaction.update(String(tx.id), {executionDate: '2099-01-01'});
        assert.strictEqual(updated.statusCode, 204, 'expected 204 No Content');
    });

    test('update rejects for an unknown transaction id', async () => {
        await assert.rejects(
            () => client.transaction.update('999999999', {executionDate: '2099-01-01'}),
            {statusCode: 400, code: 'err_no_transaction'},
        );
    });

    test('create then remove a transaction', async () => {
        const mndtId = await importedMandate(client, 'DEL-');
        const tx = await client.transaction.create({
            mndtId,
            message: 'To be deleted',
            amount: 75,
        });
        assert.ok(tx.id, 'transaction missing id');
        await client.transaction.remove({id: tx.id});

        // Verify the removal took effect: DELETE /transaction removes a not-yet-sent
        // transaction outright, so /transaction/detail must no longer return that id.
        const afterRemoval = await client.transaction.detail(tx.id);
        assert.ok(
            !afterRemoval.Entries?.some(e => e.id === tx.id),
            'removed transaction should no longer be returned by /transaction/detail',
        );
    });

    // A transaction can only be refunded once it has actually been paid, which can't be
    // done via the API. Point PAID_TRANSACTION_ID at a real paid transaction in the beta
    // environment (same precondition as PAID_PAYLINK_ID for the paylink refund test).
    test('refund a paid transaction', {skip: !process.env.PAID_TRANSACTION_ID}, async () => {
        const id = String(process.env.PAID_TRANSACTION_ID);
        // Refunds aren't idempotent: the same transaction+amount is rejected as a duplicate
        // on repeat runs. Either outcome proves the call is well-formed and accepted.
        try {
            const refunded = await client.transaction.refund({
                id,
                amount: 1,
                message: 'Refund test ' + faker.git.commitSha({length: 8}),
            });
            // refund() must hand back the created credit transfer, not swallow the body:
            // its id is the only handle on the transfer for client.refund.detail()/remove().
            assert.ok(refunded, 'refund returned nothing');
            assert.ok(refunded.id, 'refund did not return a created refund id');
        } catch (e) {
            assert.match((e as Error).message, /duplicate refund/i, 'refund rejected for an unexpected reason');
        }
    });

    test('refund rejects for an unknown transaction id', async () => {
        await assert.rejects(
            () => client.transaction.refund({id: '999999999', amount: 1, message: 'Refund test'}),
            {statusCode: 400, code: 'err_no_transaction'},
        );
    });
});
