import {FeedOptions} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {getClient, noApiConfigured, randomCustomer, testPdfBase64} from "./support/helpers";

describe('Invoice', {skip: noApiConfigured}, async () => {

    const client = getClient();

    test('create -> detail -> pdf -> feed -> payment', async () => {
        const today = new Date().toISOString().split('T')[0];
        const invoice = await client.invoice.create({
            number: "INV-" + today,
            amount: 500,
            date: today,
            duedate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            pdf: testPdfBase64,
            customer: randomCustomer(),
        });
        assert.ok(invoice);

        const details = await client.invoice.detail(invoice.id);
        assert.ok(details);

        const invoicePdf = await client.invoice.pdf(invoice.id);
        assert.ok(invoicePdf);
        assert.ok(invoicePdf.content);
        assert.ok(invoicePdf.content.length > 0);
        assert.strictEqual(invoicePdf.filename, `${invoice.id}.pdf`);

        const options: FeedOptions = {};
        let hasInvoices = false;
        const feed = await client.invoice.feed(options);
        for await (const inv of feed) {
            if (!hasInvoices) {
                hasInvoices = true;
                assert.ok(options.last_position);
            }
            assert.ok(inv);
            assert.ok(inv.id);
            assert.ok(inv.state);
        }

        let hasPayments = false;
        const payments = await client.invoice.payment(options);
        for await (const payment of payments) {
            if (!hasPayments) {
                hasPayments = true;
                assert.ok(options.last_position);
            }
            assert.ok(payment);
            assert.ok(payment.origin.id);
            assert.ok(payment.origin.number);
        }
    });
});

describe('Invoice extended', {skip: noApiConfigured}, async () => {

    const client = getClient();

    const makeInvoice = () => {
        const today = new Date().toISOString().split('T')[0];
        return client.invoice.create({
            number: 'INV-EXT-' + Date.now(),
            amount: 200,
            date: today,
            duedate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            customer: randomCustomer(),
        });
    };

    test('qr returns a qr response', async () => {
        const invoice = await makeInvoice();
        const qr = await client.invoice.qr(invoice.id);
        assert.ok(qr, 'no qr response');
    });

    test('delete removes a created invoice', async () => {
        const invoice = await makeInvoice();
        assert.ok(invoice.id, 'invoice missing id');
        await client.invoice.delete(invoice.id);
        // Deleting must take effect: the invoice should no longer be retrievable.
        await assert.rejects(
            () => client.invoice.detail(invoice.id),
            /error=err_/i,
            'deleted invoice should no longer be retrievable',
        );
    });

    test('update changes an invoice', async () => {
        const invoice = await makeInvoice();
        assert.ok(invoice.id, 'invoice missing id');
        const updated = await client.invoice.update(invoice.id, {message: 'Updated ' + Date.now()});
        assert.ok(updated, 'no updated invoice returned');
        assert.strictEqual(updated.id, invoice.id, 'update returned a different invoice');
    });

    test('update rejects for an unknown invoice id', async () => {
        await assert.rejects(
            () => client.invoice.update('00000000-0000-0000-0000-000000000000', {message: 'x'}),
            /error=err_/i,
        );
    });

    test('bulkCreate then bulkStatus round-trip', async () => {
        const today = new Date().toISOString().split('T')[0];
        const due = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];
        const bulk = await client.invoice.bulkCreate([{
            number: 'BULK-' + Date.now(),
            amount: 300,
            date: today,
            duedate: due,
            customer: randomCustomer(),
        }]);
        assert.ok(bulk, 'no bulk response');
        assert.ok(bulk.batchId, 'bulk missing batchId');

        const entries = await client.invoice.bulkStatus(bulk.batchId);
        assert.ok(Array.isArray(entries), 'expected entries array');
        assert.ok(entries.length > 0, 'empty entries');
        assert.ok(entries[0].status, 'entry missing status');
    });
});
