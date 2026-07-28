import * as process from "node:process";
import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
import {faker} from "@faker-js/faker";
import {TwikeyClient} from "../../src";

export const noApiConfigured = !process.env.TWIKEY_API_KEY;

let cachedClient: TwikeyClient;
export const getClient = (): TwikeyClient => {
    if (!cachedClient) {
        let url = "https://api.beta.twikey.com/creditor";
        if (process.env.TWIKEY_API_URL) {
            url = process.env.TWIKEY_API_URL;
        }
        cachedClient = new TwikeyClient({
            apiKey: process.env.TWIKEY_API_KEY || '',
            apiUrl: url,
            userAgent: "twikey-api-node-test"
        });
    }
    return cachedClient;
};

// Reporting/reconciliation lives on a creditor with that feature enabled, reached via
// its own API key (the default key can't see it). Skip the suite until REPORTING_API_KEY
// is provided.
export const noReportingConfigured = !process.env.REPORTING_API_KEY;

export const getReportingClient = (): TwikeyClient => new TwikeyClient({
    apiKey: process.env.REPORTING_API_KEY || process.env.TWIKEY_API_KEY || '',
    apiUrl: process.env.TWIKEY_API_URL || "https://api.beta.twikey.com/creditor",
    userAgent: "twikey-api-node-test",
});

export const CT = (): number => {
    const ct = process.env.CT;
    assert.ok(ct, "CT not defined");
    return Number(ct);
};

export const TEST_IBAN = 'NL95BUNQ2025545371';
export const TEST_BIC = 'BUNQNL2A';

export const testPdfPath = path.join(__dirname, '..', 'fixtures', 'empty.pdf');
export const testPdfBuffer = fs.readFileSync(testPdfPath);
export const testPdfBase64 = testPdfBuffer.toString('base64');

const ublTemplate = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'invoice.ubl.xml'), 'utf8');

// Builds a UBL invoice from the fixture template. The invoice number must be unique
// per run: uploading a number that already exists returns the existing invoice instead
// of creating one, which would silently invalidate any assertion on the result.
export const ublInvoice = (overrides: { number?: string; amount?: string } = {}): string => {
    const today = new Date();
    const due = new Date(new Date().setMonth(today.getMonth() + 1));
    const values: Record<string, string> = {
        NUMBER: overrides.number ?? 'UBL-' + faker.git.commitSha({length: 10}),
        ISSUE_DATE: today.toISOString().split('T')[0],
        DUE_DATE: due.toISOString().split('T')[0],
        CUSTOMER_NUMBER: 'UBLCUST-' + faker.git.commitSha({length: 8}),
        EMAIL: faker.internet.email(),
        AMOUNT: overrides.amount ?? '42.00',
    };
    return ublTemplate.replace(/{{(\w+)}}/g, (_, key) => values[key]);
};

// Signs an imported (already-signed) mandate so tests have a valid mndtId to work with.
export const importedMandate = async (client: TwikeyClient, suffix = ''): Promise<string> => {
    const mandateNumber = 'IMPORT-' + suffix + faker.git.commitSha({length: 8});
    const signed = await client.document.sign({
        ct: CT(),
        method: "import",
        mandateNumber,
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
    // The API upper-cases the id, and some endpoints (subscription, transaction/bulk)
    // match it case-sensitively — return the id the API assigned, not our lowercase one.
    return signed.mndtId ?? mandateNumber;
};

// A bulk batch is processed asynchronously: bulkStatus() answers null (API 409) until it
// finishes. Poll until entries appear rather than asserting on the first call.
export const pollBulkStatus = async <T>(
    fetchStatus: () => Promise<T[] | null>,
    label: string,
    attempts = 10,
    delayMs = 500,
): Promise<T[]> => {
    for (let attempt = 0; attempt < attempts; attempt++) {
        const entries = await fetchStatus();
        if (entries) return entries;
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    assert.fail(`${label} batch still processing after ${attempts} attempts`);
};

export const randomCustomer = () => ({
    l: 'nl',
    email: faker.internet.email(),
    firstname: faker.person.firstName(),
    lastname: faker.person.lastName(),
    address: faker.location.street(),
    city: faker.location.city(),
    zip: faker.location.zipCode(),
    country: faker.location.countryCode(),
});
