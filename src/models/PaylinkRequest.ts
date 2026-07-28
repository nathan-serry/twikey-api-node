import {BaseInfo} from "./Shared";

/**
 * See https://www.twikey.com/api/#create-paymentlink
 *
 * PaylinkRequest holds the fields used to create a payment link for a
 * customer or name.
 *
 * Mirrors Python's `PaymentLinkRequest` (`twikey/model/paylink_request.py`);
 * `message` corresponds to Python's `title` (the message shown to the
 * customer on the bank statement).
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
 * See https://www.twikey.com/api/#refund-paymentlink
 *
 * PaylinkRefundRequest holds the fields to refund the full or partial amount
 * of a payment link.
 *
 * Mirrors Python's `PaymentLinkRefundRequest` (`twikey/model/paylink_request.py`).
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
