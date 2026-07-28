import {TwikeyClient, TwikeyError, Webhook} from "../src";
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

// Needs no credentials: the signature is an HMAC over the api key, computed locally.
describe('Webhook', async () => {

    const API_KEY = "1234";
    const PAYLOAD = "abc=123&name=abc";
    // The hex HMAC-SHA256 of PAYLOAD under API_KEY, so 64 characters.
    const VALID = "55261CBC12BF62000DE1371412EF78C874DBC46F513B078FB9FF8643B2FD4FC2";

    const client = () => new TwikeyClient({apiKey: API_KEY, apiUrl: "http://doesntmatter"});

    test('verifyWebHookSignature validates a known signature', () => {
        assert.ok(client().verifyWebHookSignature(VALID, PAYLOAD));
    });

    // Regression test. This used to throw RangeError out of timingSafeEqual, which refuses to
    // compare buffers of different lengths — so a caller handing over a truncated signature got
    // an exception instead of the boolean the signature promises, and a webhook endpoint would
    // answer 500 rather than rejecting the request.
    test('verifyWebHookSignature returns false for a too-short signature', () => {
        assert.strictEqual(client().verifyWebHookSignature("55261CBC", PAYLOAD), false);
    });

    test('verifyWebHookSignature returns false for a wrong signature of the right length', () => {
        const wrong = VALID.slice(0, -1) + (VALID.endsWith('3') ? '4' : '3');
        assert.strictEqual(wrong.length, VALID.length, 'the fixture must keep the signature length');
        assert.strictEqual(client().verifyWebHookSignature(wrong, PAYLOAD), false);
    });

    // The static helper is the portable form: it needs no client, so a webhook endpoint can
    // check a call signed with any api key. Note its argument order is (payload, signature,
    // apiKey), unlike the instance method's (signature, payload).
    test('Webhook.verifySignature accepts the known signature without a client', () => {
        assert.ok(Webhook.verifySignature(PAYLOAD, VALID, API_KEY));
    });

    test('Webhook.verifySignature rejects a wrong signature, an empty one and a wrong key', () => {
        const wrong = VALID.slice(0, -1) + (VALID.endsWith('3') ? '4' : '3');
        assert.strictEqual(Webhook.verifySignature(PAYLOAD, wrong, API_KEY), false, 'wrong signature');
        assert.strictEqual(Webhook.verifySignature(PAYLOAD, "55261CBC", API_KEY), false, 'short signature');
        assert.strictEqual(Webhook.verifySignature(PAYLOAD, "", API_KEY), false, 'empty signature');
        assert.strictEqual(Webhook.verifySignature(PAYLOAD, VALID, "wrong-key"), false, 'wrong api key');
        assert.strictEqual(Webhook.verifySignature("tampered=1", VALID, API_KEY), false, 'tampered payload');
    });

    // There must be exactly one implementation: the instance method just supplies its own key.
    test('the instance method and the static helper agree', () => {
        for (const signature of [VALID, VALID.toLowerCase(), "55261CBC", ""]) {
            assert.strictEqual(
                client().verifyWebHookSignature(signature, PAYLOAD),
                Webhook.verifySignature(PAYLOAD, signature, API_KEY),
                `disagreement on signature "${signature}"`,
            );
        }
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
        // session it was told about, so a logout that omits it resets local state only.
        // Beta rejects the dead token with 401 "Not logged in" when the retry is spaced out
        // and 429 when it follows immediately, so assert only that it is no longer accepted.
        const afterLogout = await fetch(`${apiUrl()}/invoice`, {headers: {Authorization: token}});
        assert.ok(afterLogout.status >= 400,
            `logout must invalidate the session token, but it still answered ${afterLogout.status}`);

        assert.ok(await client.ping(), 'the client should authenticate again after a logout');
    });
});
