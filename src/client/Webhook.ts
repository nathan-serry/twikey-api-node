import {createHmac, timingSafeEqual} from "node:crypto";

/**
 * Verification of the `X-Signature` header Twikey sends with every webhook call.
 *
 * The check is static, so an endpoint can validate a call without constructing a
 * `TwikeyClient`, and can validate one signed with an api key other than the one a client
 * happens to hold.
 *
 * This is the SINGLE implementation of the signature check for the whole SDK.
 * `TwikeyClient.verifyWebHookSignature` is a thin delegate to it and stays supported; the
 * comparison used to live inline there. Verified against the same known-good signature that
 * method was always tested with, plus rejection of a wrong signature, a wrong api key, a
 * tampered payload, a truncated signature and an empty one — see `test/client.test.ts`.
 *
 * ```ts
 * app.get('/webhook', (req, res) => {
 *   const payload = decodeURIComponent(req.url.split('?')[1] ?? '');
 *   if (!Webhook.verifySignature(payload, req.header('X-Signature') ?? '', apiKey)) {
 *     return res.status(403).send('Forbidden');
 *   }
 *   res.send('Successfully');
 * });
 * ```
 */
export class Webhook {

  /**
   * Verify the signature Twikey sent alongside a webhook payload.
   *
   * The signature is the HMAC-SHA256 of the payload keyed by the api key, hex encoded. The
   * comparison ignores case and runs in constant time.
   *
   * @param payload - The raw, url-decoded query string Twikey called the webhook with.
   * @param signature - The value of the request's `X-Signature` header.
   * @param apiKey - The api key of the creditor the webhook was registered for.
   * @returns True when the signature matches the payload. False otherwise, including for an
   *   empty or wrong-length signature — this never throws.
   */
  static verifySignature(payload: string, signature: string, apiKey: string): boolean {
    // No header at all means there is nothing to verify, so the call cannot be trusted.
    if (!signature) return false;

    // ---------------------------------------------------------------------------------------
    // This is the security check, moved here verbatim from TwikeyClient.verifyWebHookSignature
    // (which now delegates to it) so there is exactly one copy. Nothing about the comparison
    // was weakened in that move.
    //
    // Twikey builds the X-Signature header by HMAC-SHA256'ing the payload with the api key,
    // a secret only Twikey and this creditor hold. Recomputing it here and demanding a match
    // proves two things at once: the request really came from Twikey, and the payload was not
    // altered in transit — flipping a single byte yields a completely unrelated digest. Remove
    // this and any caller who guesses the webhook URL could post forged "invoice paid" events.
    // ---------------------------------------------------------------------------------------
    const expected = Buffer.from(createHmac("sha256", apiKey).update(payload).digest("hex"));

    // Twikey sends the digest upper-cased while `digest("hex")` produces lower case, so the
    // incoming value is normalised. Without this a perfectly genuine signature would never match.
    const provided = Buffer.from(signature.toLowerCase());

    // A guard, not an optimisation. timingSafeEqual *throws* RangeError on buffers of unequal
    // length, so before this existed a truncated or malformed signature — precisely what a
    // prober sends — escaped as an exception and a webhook endpoint answered 500 instead of
    // rejecting the request. The boolean return type always promised otherwise.
    if (provided.length !== expected.length) return false;

    // timingSafeEqual and deliberately never `===`: a string comparison returns the moment two
    // characters differ, so how long it takes leaks how many leading characters were correct,
    // and a valid signature can be recovered a character at a time. This always takes the same
    // time regardless of where the mismatch is. Do not "simplify" it.
    return timingSafeEqual(provided, expected);
  }
}
