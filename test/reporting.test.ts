import {ReportingEntry} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {getClient, noApiConfigured, TEST_BIC, TEST_IBAN} from "./support/helpers";

describe('Reporting', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('feed returns without error', async () => {
        const result = await client.reporting.feed();
        assert.ok(result !== undefined, 'feed returned undefined');
    });

    test('getFiles returns without error', async () => {
        const files = await client.reporting.getFiles();
        assert.ok(Array.isArray(files) || files !== undefined, 'unexpected files response');
    });

    test('addAccount posts a raw account statement payload', async () => {
        // Content format expected by the live endpoint isn't fully documented
        // client-side; adjust the payload to match a real bank statement export
        // when running this against a real account.
        await client.reporting.addAccount('This is a test reporting payload');
    });

    test('addItems posts structured reconciliation entries', async () => {
        const items: ReportingEntry[] = [{
            name: faker.person.fullName(),
            msg: 'Reporting test entry',
            amount: 12.34,
            date: new Date().toISOString().split('T')[0],
            iban: TEST_IBAN,
            bic: TEST_BIC,
        }];
        await client.reporting.addItems(TEST_IBAN, items);
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
