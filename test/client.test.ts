import {FeedOptions, TwikeyClient} from "../src";
import * as process from "node:process";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {faker} from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';

const testPdfPath = path.join(__dirname, 'fixtures', 'empty.pdf');
const testPdfBuffer = fs.readFileSync(testPdfPath);
const testPdfBase64 = testPdfBuffer.toString('base64');

const noApiConfigured = !process.env.TWIKEY_API_KEY;
// console.log(process.env)

let customerNumber: string = faker.git.commitSha();
let cachedClient: TwikeyClient;
const getClient = () => {
    if (!cachedClient) {
        let url = "https://api.beta.twikey.com/creditor";
        if (process.env.TWIKEY_API_URL) {
            url = process.env.TWIKEY_API_URL;
        }

        const apiKey: string = process.env.TWIKEY_API_KEY || '';
        cachedClient = new TwikeyClient({
            apiKey: apiKey,
            apiUrl: url,
            userAgent: "twikey-api-node-test"
        });
    }
    return cachedClient;
}

describe('General', {skip: noApiConfigured}, () => {

    test('Client ping', async () => {
        let client = getClient();
        assert.ok(client, 'Client not configured');
        client.ping();
    });
})

describe('Document', {skip: noApiConfigured}, async () => {

    let client = getClient();
    assert.ok(client, 'Client not configured');

    const MNDTNUMBER = process.env.MNDTNUMBER;
    assert.ok(MNDTNUMBER, "MNDTNUMBER not defined");
    const CT = process.env.CT;
    assert.ok(CT, "CT not defined");

    const document = await client.document.create({
        ct: Number(CT),
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

    let importedMandate = 'IMPORT-' + faker.git.commitSha({length: 8});
    const signedDocument = await client.document.sign({
        ct: Number(CT),
        method: "import",
        mandateNumber: importedMandate,
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
    assert.ok(signedDocument);

    const details = await client.document.detail(importedMandate);
    assert.ok(details);

    let options: FeedOptions = {};
    let hasDocuments = false;
    const feed = client.document.feed(options);
    for await (const document of feed) {
        if (!hasDocuments) {
            hasDocuments = true;
            assert.ok(options.last_position);
        }
        if (document.IsNew) {
            assert.ok(document);
            assert.ok(document.Mndt);
        }
        if (document.IsUpdated) {
            assert.ok(document);
        }
        if (document.IsCancelled) {
            assert.ok(document);
        }
    }
})

describe('Invoice', {skip: noApiConfigured}, async () => {

    let client = getClient();
    assert.ok(client);

    let today = new Date().toISOString().split('T')[0];
    const invoice = await client.invoice.create({
        number: "INV-" + today,
        amount: 500,
        date: today,
        duedate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        pdf: testPdfBase64,
        customer: {
            l: 'nl',
            email: faker.internet.email(),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
            address: faker.location.street(),
            city: faker.location.city(),
            zip: faker.location.zipCode(),
            country: faker.location.countryCode(),
            companyName: faker.company.name(),
            coc: faker.company.catchPhraseAdjective(),
            vatno: faker.company.catchPhraseAdjective()
        }
    });
    assert.ok(invoice);

    const details = await client.invoice.detail(invoice.id);
    assert.ok(details);

    const invoicePdf = await client.invoice.pdf(invoice.id);
    assert.ok(invoicePdf);
    assert.ok(invoicePdf.content);
    assert.ok(invoicePdf.content.length > 0);
    assert.strictEqual(invoicePdf.filename, `${invoice.id}.pdf`);

    let options: FeedOptions = {};
    let hasInvoices = false;
    const feed = await client.invoice.feed(options);
    for await (const invoice of feed) {
        if (!hasInvoices) {
            hasInvoices = true;
            assert.ok(options.last_position);
        }
        assert.ok(invoice);
        assert.ok(invoice.id);
        assert.ok(invoice.state);
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
})

describe('Transaction', {skip: noApiConfigured}, async () => {
    let client = getClient();
    assert.ok(client);

    const CT = process.env.CT;
    assert.ok(CT, "CT not defined");

    let importedMandate = 'IMPORT-TX-' + faker.git.commitSha({length: 8});
    const signedDocument = await client.document.sign({
        ct: Number(CT),
        method: "import",
        mandateNumber: importedMandate,
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
    assert.ok(signedDocument);

    const transaction = await client.transaction.create({
        mndtId: importedMandate,
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
})

describe('Paylink', {skip: noApiConfigured}, async () => {
    let client = getClient();
    assert.ok(client);

    const CT = process.env.CT;
    if (!CT) {
        throw new Error('Missing CT');
    }

    const link = await client.paylink.create({
        ct: Number(CT),
        customerNumber: customerNumber,
        ref: faker.person.firstName(),
        firstname: faker.person.firstName(),
        lastname: faker.person.lastName(),
        message: faker.commerce.productName() + " - " + Date.now(),
        amount: Number(faker.commerce.price({min: 0, max: 1000}))
    });
    assert.ok(link);
    assert.ok(link.url);

    let options: FeedOptions = {};
    let hasLinks = false;
    const feed = await client.paylink.feed(options);
    for await (const link of feed) {
        if (!hasLinks) {
            hasLinks = true;
            assert.ok(options.last_position);
        }
        assert.ok(link);
        assert.ok(link.id);
        assert.ok(link.amount);
    }
})

describe('Webhook', async () => {
    let client = new TwikeyClient({
        apiKey: "1234",
        apiUrl: "http://doesntmatter",
    });
    assert.ok(client.verifyWebHookSignature("55261CBC12BF62000DE1371412EF78C874DBC46F513B078FB9FF8643B2FD4FC2", "abc=123&name=abc"))
})