import {describe, test} from "node:test";
import * as assert from 'assert';
import {CT, getClient, importedMandate, noApiConfigured} from "./support/helpers";

describe('Collect', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('collect executes a batch', async () => {
        const mndtId = await importedMandate(client, 'COLLECT-');
        await client.transaction.create({
            mndtId,
            message: 'Collect batch test',
            amount: 42,
        });

        const batch = await client.collect.collect({ct: CT()});
        assert.ok(batch, 'no batch returned');
        assert.ok(
            'frstMsgId' in batch || 'rcurMsgId' in batch,
            'expected a batch identifier, got ' + JSON.stringify(batch),
        );

        // Only reachable when the batch actually contained something. Asserting on an
        // array here is what proves detail() unwraps the API's `Sdds` envelope.
        if (batch.rcurMsgId) {
            const batches = await client.collect.detail({pmtinfid: batch.rcurMsgId});
            assert.ok(Array.isArray(batches), 'detail should unwrap Sdds to an array');
            assert.ok(batches.length > 0, 'detail returned no batch for the pmtinfid just created');
            assert.strictEqual(batches[0].pmtinfid, batch.rcurMsgId, 'detail returned a different batch');
        }
    });

    // Negative path, no side effect: proves the verb+path reach the API.
    test('collect rejects an unknown ct', async () => {
        await assert.rejects(
            () => client.collect.collect({ct: 99999999}),
            {statusCode: 400, code: 'err_no_such_ct'},
        );
    });

    test('query returns collect entries', async () => {
        const results = await client.collect.query({ct: CT()});
        assert.ok(Array.isArray(results), 'expected an array of collect entries');
        if (results.length) {
            assert.ok(results[0].pmtinfid, 'batch missing pmtinfid');
            assert.ok(results[0].status, 'batch missing status');
        }
    });

    // Malformed XML is rejected outright, so this exercises POST /collect/import?ct=
    // and its text/xml content type without creating a batch.
    test('batchImport rejects a malformed pain008', async () => {
        await assert.rejects(
            () => client.collect.batchImport(CT(), '<not-a-pain008/>'),
            {statusCode: 400, code: 'invalid_file'},
        );
    });
});
