import {TwikeyClient} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {getClient, noApiConfigured} from "./support/helpers";

describe('General', {skip: noApiConfigured}, () => {

    test('Client ping', async () => {
        const client = getClient();
        assert.ok(client, 'Client not configured');
        client.ping();
    });
});

describe('Webhook', async () => {

    test('verifyWebHookSignature validates a known signature', () => {
        const client = new TwikeyClient({
            apiKey: "1234",
            apiUrl: "http://doesntmatter",
        });
        assert.ok(client.verifyWebHookSignature("55261CBC12BF62000DE1371412EF78C874DBC46F513B078FB9FF8643B2FD4FC2", "abc=123&name=abc"));
    });
});
