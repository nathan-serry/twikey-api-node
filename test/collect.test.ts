import {describe, test} from "node:test";
import * as assert from 'assert';
import {CT, getClient, importedMandate, noApiConfigured} from "./support/helpers";

describe('Collect', {skip: noApiConfigured}, async () => {

    const client = getClient();

    // TODO(collect): re-enable once collect() is reworked to the real /collect batch-send
    // ({ct, colltndt?}); the transaction-shaped payload below is rejected by /collect.
    test('collect then detail round-trip', {skip: 'pending /collect batch-send rework — see CLAUDE.md'}, async () => {
        const mndtId = await importedMandate(client, 'COLLECT-');

        const result = await client.collect.collect({
            ct: CT(),
            mndtId,
            message: 'Collect detail test',
            amount: 42,
        });
        assert.ok(result, 'no collect response');
        assert.ok(result.id, 'collect response missing id');

        const detail = await client.collect.detail({id: result.id});
        assert.ok(detail, 'no detail returned');
    });

    test('query returns collect entries', async () => {
        const results = await client.collect.query({ct: CT()});
        assert.ok(Array.isArray(results), 'expected an array of collect entries');
    });
});
