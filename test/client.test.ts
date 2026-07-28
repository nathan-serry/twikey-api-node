import {TwikeyClient, TwikeyError} from "../src";
import {describe, test} from "node:test";
import * as assert from 'assert';
import {apiUrl, getClient, newClient, noApiConfigured} from "./support/helpers";

describe('General', {skip: noApiConfigured}, () => {

    test('Client ping', async () => {
        const client = getClient();
        assert.ok(client, 'Client not configured');
        client.ping();
    });
});

describe('Errors', {skip: noApiConfigured}, () => {

    test('TwikeyError carries the api code, message, extra and context', async () => {
        await assert.rejects(() => getClient().paylink.detail(999999999), (e: Error) => {
            assert.ok(e instanceof TwikeyError, `expected TwikeyError, got ${e.constructor.name}`);
            assert.strictEqual(e.statusCode, 400);
            assert.strictEqual(e.code, 'err_not_found');
            assert.ok(e.apiMessage, "the api's message field must not be discarded");
            assert.strictEqual(e.extra, '999999999', 'extra should name the offending id');
            assert.match(e.ctx, /payment\/link/, 'ctx should name the route that failed');
            return true;
        });
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

// Deliberately last in this file: proving the session is dead means making a request the
// server rejects, and a rejected request adds rate-limit pressure for whatever runs next.
describe('Logout', {skip: noApiConfigured}, () => {

    test('logout ends the session server-side', async () => {
        // Its own client: logging out invalidates the token, and every other suite in this
        // file shares the memoised one.
        const client = newClient();
        const token = await client.ping();
        assert.ok(token, 'no session token returned');
        assert.ok(client.merchantId, 'merchantId should be set from the login response headers');

        const stillValid = await fetch(`${apiUrl()}/invoice`, {headers: {Authorization: token}});
        assert.strictEqual(stillValid.status, 200, 'token should work before logout');

        await client.logout();

        // Sending the Authorization header is the whole point: the server can only end the
        // session it was told about, so Python's header-less logout is a local-only reset.
        // Beta rejects the dead token with 401 "Not logged in" when the retry is spaced out
        // and 429 when it follows immediately, so assert only that it is no longer accepted.
        const afterLogout = await fetch(`${apiUrl()}/invoice`, {headers: {Authorization: token}});
        assert.ok(afterLogout.status >= 400,
            `logout must invalidate the session token, but it still answered ${afterLogout.status}`);

        assert.ok(await client.ping(), 'the client should authenticate again after a logout');
    });
});
