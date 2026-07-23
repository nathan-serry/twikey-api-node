import {describe, test} from "node:test";
import * as assert from 'assert';
import {getReportingClient, noReportingConfigured} from "./support/helpers";

describe('Reporting', {skip: noReportingConfigured}, async () => {

    const client = getReportingClient();

    test('feed returns without error', async () => {
        const result = await client.reporting.feed();
        assert.ok(result !== undefined, 'feed returned undefined');
    });

    test('getFiles returns without error', async () => {
        const files = await client.reporting.getFiles();
        assert.ok(Array.isArray(files), 'expected an array of files');
    });

    test('generateReconciliation then optionally downloadFile', async () => {
        await client.reporting.generateReconciliation({format: 'csv'});

        const files = await client.reporting.getFiles();
        assert.ok(Array.isArray(files), 'expected files array');

        if (files.length > 0) {
            const content = await client.reporting.downloadFile(files[0].name);
            assert.ok(Buffer.isBuffer(content), 'expected a Buffer');
            assert.ok(content.length > 0, 'downloaded file is empty');
        }
    });
});
