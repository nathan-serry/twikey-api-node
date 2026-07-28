import {BaseInfo} from "./Shared";

/**
 * See https://www.twikey.com/api/#create-paymentlink
 *
 * PaylinkRequest holds the fields used to create a payment link for a
 * customer or name.
 *
 * Attributes:
 *   ct - Contract template (for customer registration).
 *   sendInvite - How to send the invite (e.g. 'email', 'sms').
 *   message - Message the customer will see on the bank statement.
 *   remittance - Message shown at payment time; defaults to `message` if empty.
 *   ref - Reference for the payment link.
 *   redirectUrl - URL to redirect to after payment.
 *   place - Place of payment.
 *   method - A specific payment method to skip the selection screen.
 *   invoice - A specific invoice number to pay.
 *   amount - Amount to be paid.
 *   isTemplate - Whether to use a customized payment page.
 */
export interface PaylinkRequest extends BaseInfo {
    ct: number;
    sendInvite?: boolean | string;

    message: string;
    remittance?: string;
    ref: string;
    redirectUrl?: string;
    place?: string;
    method?: string;
    invoice?: string;
    amount: number;
    isTemplate?: boolean;
}

/**
 * See https://www.twikey.com/api/#status-paymentlink
 *
 * PaylinkDetailOptions selects the extra information to include in a
 * `PaylinkService.detail()` / `detailByRef()` response. Each enabled flag adds
 * one `include=` query parameter.
 *
 * These are the only two includes this endpoint recognises.
 *
 * Attributes:
 *   refunds - Include the refunds recorded against the link, as a `refunds` array.
 *   meta - Include meta information about the link (whether it is still active, the
 *     method it was paid with, ...) as a nested `meta` object.
 */
export interface PaylinkDetailOptions {
    refunds?: boolean;
    meta?: boolean;
}

/**
 * See https://www.twikey.com/api/#refund-paymentlink
 *
 * PaylinkRefundRequest holds the fields to refund the full or partial amount
 * of a payment link.
 *
 * Attributes:
 *   id - Payment link ID.
 *   amount - Refund amount; the full amount if not passed.
 *   message - Refund message.
 */
export interface PaylinkRefundRequest {
    id: number;
    amount: number;
    message?: string;
}
