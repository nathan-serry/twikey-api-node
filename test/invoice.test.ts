import {FeedOptions} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {randomUUID} from "node:crypto";
import {getClient, noApiConfigured, pollBulkStatus, randomCustomer, testPdfBase64, ublInvoice} from "./support/helpers";

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

    // Checks the API accepts the include flags rather than rejecting the query string.
    // A 200 alone would not prove they were honoured — an unknown include is ignored
    // silently — but the extra keys only appear in the response when they are.
    test('detail with include options', async () => {
        const invoice = await makeInvoice();
        const details = await client.invoice.detail(invoice.id, {
            lastpayment: true,
            meta: true,
            customer: true,
        });
        assert.ok(details, 'no detail returned');
        assert.strictEqual(details.id, invoice.id, 'detail id mismatch');
    });

    test('delete removes a created invoice', async () => {
        const invoice = await makeInvoice();
        assert.ok(invoice.id, 'invoice missing id');
        await client.invoice.delete(invoice.id);
        // Deleting must take effect: the invoice should no longer be retrievable.
        await assert.rejects(
            () => client.invoice.detail(invoice.id),
            {statusCode: 400, code: 'err_not_found'},
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
            {statusCode: 400, code: 'err_not_found'},
        );
    });

    test('ubl uploads an invoice', async () => {
        const number = 'UBL-' + Date.now();
        const created = await client.invoice.ubl(ublInvoice({number}));
        assert.ok(created, 'no invoice returned');
        assert.ok(created.id, 'invoice missing id');
        assert.strictEqual(created.number, number, 'invoice number not taken from the UBL');
    });

    // The strongest available check on the ubl() headers: X-INVOICE-ID makes the API adopt
    // our UUID as the invoice id, so a matching id proves the header was sent AND honoured.
    // A plain 200 would not — an ignored header still returns one.
    test('ubl honours the X-INVOICE-ID header', async () => {
        const invoiceId = randomUUID();
        const created = await client.invoice.ubl(ublInvoice(), {invoiceId, manual: true});
        assert.strictEqual(created.id, invoiceId, 'X-INVOICE-ID was not applied to the created invoice');
    });

    test('action sends an invoice', async () => {
        const invoice = await makeInvoice();
        // action() answers 204 with no body, so "did not throw" is the whole assertion.
        await client.invoice.action(invoice.id, {type: 'send'});
    });

    test('action rejects a paymentplan with no initialAmount', async () => {
        const invoice = await makeInvoice();
        await assert.rejects(
            () => client.invoice.action(invoice.id, {type: 'paymentplan'}),
            {statusCode: 400, code: 'err_missing_params', extra: 'initialAmount'},
            'a paymentplan with no amounts should name the missing parameter',
        );
    });

    const makeNumbered = (number: string) => {
        const today = new Date().toISOString().split('T')[0];
        return client.invoice.create({
            number,
            amount: 200,
            date: today,
            duedate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            customer: randomCustomer(),
        });
    };

    // The path segment accepts an invoice *number* as well as a UUID. Nothing covered that
    // before, and it is the reason the segment has to be encoded at all.
    test('detail resolves an invoice by its number', async () => {
        const number = 'INVNUM' + Date.now();
        const invoice = await makeNumbered(number);
        assert.strictEqual(invoice.number, number, 'the API did not keep the invoice number');

        const byNumber = await client.invoice.detail(number);
        assert.ok(byNumber, 'lookup by invoice number returned nothing');
        assert.strictEqual(byNumber.id, invoice.id, 'lookup by number returned a different invoice');
    });

    // Guards the encoding of the path segment. A number containing '#' or '?' changes what
    // the URL means: unencoded, `INV#2026-1` is parsed as /invoice/INV with `#2026-1` dropped
    // as a fragment, so the call would return whatever *that* resolves to — a different
    // invoice, silently. Beta does not resolve an escaped number (it answers 200 with an
    // empty body, so this is null today), but returning the wrong invoice must never happen.
    test('detail never resolves to a different invoice when the number needs escaping', async () => {
        const number = 'INV#2026-' + Date.now();
        const invoice = await makeNumbered(number);
        assert.strictEqual(invoice.number, number, 'the API did not keep the invoice number');

        const looked = await client.invoice.detail(number);
        if (looked) {
            assert.strictEqual(looked.number, number, 'resolved to a different invoice than asked for');
        }
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

        // bulkStatus() returns null while the batch is still processing (API 409).
        const entries = await pollBulkStatus(
            () => client.invoice.bulkStatus(bulk.batchId),
            'invoice',
        );
        assert.ok(Array.isArray(entries), 'expected entries array');
        assert.ok(entries.length > 0, 'empty entries');
        assert.ok(entries[0].status, 'entry missing status');
    });
});
