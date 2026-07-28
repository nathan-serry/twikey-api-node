import {FeedOptions} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {CT, getClient, importedMandate, noApiConfigured, TEST_BIC, TEST_IBAN, testPdfBuffer} from "./support/helpers";

describe('Document', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('create -> uploadPdf -> pdf -> sign -> detail -> feed', async () => {
        const document = await client.document.create({
            ct: CT(),
            iban: TEST_IBAN,
            bic: TEST_BIC,
            email: faker.internet.email(),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            l: 'nl',
            country: 'BE',
        });
        assert.ok(document);
        assert.ok(document.mndtId);
        assert.ok(document.url);

        await client.document.uploadPdf(document.mndtId, testPdfBuffer);

        const mandatePdf = await client.document.pdf(document.mndtId);
        assert.ok(mandatePdf);
        assert.ok(mandatePdf.content);
        assert.ok(mandatePdf.content.length > 0);
        assert.strictEqual(mandatePdf.filename, `${document.mndtId}.pdf`);

        const importedMandateNumber = await importedMandate(client);
        const details = await client.document.detail(importedMandateNumber);
        assert.ok(details);
        // detail() returns the mandate unwrapped from its {Mndt:{…}} envelope, so assert on
        // nested fields: it used to be typed as {mndtId, url} and callers had to cast.
        assert.strictEqual(details.MndtId, importedMandateNumber, 'wrong mandate returned');
        assert.strictEqual(details.LclInstrm, 'CORE', 'imported test mandates are CORE');
        assert.strictEqual(details.DbtrAcct, TEST_IBAN, 'debtor iban not reported');
        assert.strictEqual(details.DbtrAgt?.FinInstnId?.BICFI, TEST_BIC, 'debtor bic not reported');
        assert.strictEqual(details.Ocrncs?.SeqTp, 'RCUR', 'an imported mandate is recurring');
        assert.ok(details.Dbtr?.Nm, 'debtor name missing');
        assert.ok(details.Dbtr?.PstlAdr?.TwnNm, 'debtor city missing');
        assert.ok(details.CdtrSchmeId, 'creditor scheme id missing');
        // SplmtryData carries the Twikey-specific fields, including the ct as TemplateId.
        const templateId = details.SplmtryData?.find(d => d.Key === 'TemplateId')?.Value;
        assert.strictEqual(Number(templateId), CT(), 'TemplateId should be the contract template');

        const options: FeedOptions = {};
        let hasDocuments = false;
        const feed = client.document.feed(options);
        for await (const doc of feed) {
            if (!hasDocuments) {
                hasDocuments = true;
                assert.ok(options.last_position);
            }
            if (doc.IsNew) {
                assert.ok(doc);
                assert.ok(doc.Mndt);
                // The feed carries the mandate as an object in the same shape detail() returns
                // — it was typed as `string`, so this pins it.
                assert.strictEqual(typeof doc.Mndt, 'object', 'feed Mndt should be an object');
                assert.ok(doc.Mndt.MndtId, 'feed mandate has no MndtId');
            }
            if (doc.IsUpdated) {
                assert.ok(doc);
            }
            if (doc.IsCancelled) {
                assert.ok(doc);
            }
        }
    });
});

describe('Document action', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('action sends a reminder on a prepared invite', async () => {
        const document = await client.document.create({
            ct: CT(),
            email: faker.internet.email(),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            l: 'nl',
            country: 'BE',
        });
        assert.ok(document.mndtId, 'invite missing mndtId');
        // A 204 (no throw) means the reminder was accepted. This beta creditor has email
        // sending disabled, so tolerate err_email_disabled — the call is well-formed and
        // reached the API; any other error is a real failure.
        try {
            await client.document.action(document.mndtId, {type: 'reminder', reminder: '1'});
        } catch (e) {
            assert.match((e as Error).message, /err_email_disabled/, 'action rejected for an unexpected reason');
        }
    });

    // Negative path: an action on a non-existent mandate must be rejected by the API
    // (a structured err_* error), proving the endpoint/verb are right — not silently accepted.
    test('action rejects for a non-existent mandate', async () => {
        await assert.rejects(
            () => client.document.action('NON-EXISTENT-' + faker.git.commitSha({length: 8}), {type: 'reminder', reminder: '1'}),
            {statusCode: 400, code: 'err_not_found'},
        );
    });
});
