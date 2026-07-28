import {describe, test} from "node:test";
import * as assert from 'assert';
import {getReportingClient, noReportingConfigured, TEST_BIC, TEST_IBAN} from "./support/helpers";

describe('Reporting', {skip: noReportingConfigured}, async () => {

    const client = getReportingClient();

    // /reporting takes plain text: `twikey:<iban>` with the column header on the SAME line,
    // then one data row per entry. The amount in a raw row is in cents.
    const rawPayload = (iban: string) => [
        `twikey:${iban} name;msg;amount;date;iban;bic`,
        `Reporting Test;Import check;1234;2026-07-28;${iban};${TEST_BIC}`,
    ].join('\n');

    test('addAccount imports a raw payload', async () => {
        await client.reporting.addAccount(rawPayload(TEST_IBAN));
    });

    test('addAccount rejects a payload with no twikey: header', async () => {
        // Proves the endpoint really validates the format, so the positive tests above and
        // below cannot pass vacuously.
        await assert.rejects(
            () => client.reporting.addAccount('name;msg;amount;date;iban;bic\nA;B;100;2026-07-28;X;Y'),
            {statusCode: 400, code: 'invalid_file'},
        );
    });

    test('addItems imports structured entries', async () => {
        await client.reporting.addItems(TEST_IBAN, [
            {name: 'Payer One', msg: 'Item one', amount: 12.34, date: '2026-07-28', iban: TEST_IBAN, bic: TEST_BIC},
            {name: 'Payer Two', msg: 'Item two', amount: 5, date: '2026-07-28', iban: TEST_IBAN, bic: TEST_BIC},
        ]);
    });

    test('feed returns an array of statements', async () => {
        const result = await client.reporting.feed();
        assert.ok(Array.isArray(result), 'feed did not return an array');
    });

    test('getFiles returns an array of files', async () => {
        const files = await client.reporting.getFiles();
        assert.ok(Array.isArray(files), 'expected an array of files');
    });

    test('generateReconciliation then download a file by name', async () => {
        await client.reporting.generateReconciliation({format: 'csv'});

        const files = await client.reporting.getFiles();
        assert.ok(Array.isArray(files), 'expected files array');
        assert.ok(files.length > 0, 'no reconciliation files to download');

        const content = await client.reporting.downloadFile(files[0].name);
        assert.ok(Buffer.isBuffer(content), 'expected a Buffer');
        assert.ok(content.length > 0, 'downloaded file is empty');
    });
});
