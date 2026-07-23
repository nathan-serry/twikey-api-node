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
