import {FeedOptions} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import {CT, getClient, importedMandate, noApiConfigured, testPdfBuffer} from "./support/helpers";

describe('Document', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('create -> uploadPdf -> pdf -> sign -> detail -> feed', async () => {
        const document = await client.document.create({
            ct: CT(),
            iban: 'NL95BUNQ2025545371',
            bic: 'BUNQNL2A',
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
