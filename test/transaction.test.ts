import {describe, test} from "node:test";
import * as assert from 'assert';
import * as process from "node:process";
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
                if (attempt >= 4 || !/status=409/.test((e as Error).message)) throw e;
                await new Promise(r => setTimeout(r, 500));
            }
        }
        assert.ok(Array.isArray(entries), 'expected entries array');
        assert.ok(entries.length > 0, 'empty entries');
        assert.ok(entries[0].status, 'entry missing status');
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
});
