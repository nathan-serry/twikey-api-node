import {BaseInfo} from "./Shared";

/**
 * DocumentRequest holds the full set of fields that can be used
 * to initiate a mandate invitation via the Twikey API.
 *
 * Covers the standard iban/bic invite fields plus a handful of UK/BACS-only
 * fields (`tc`, `accountnumber`, `sortcode`, `subregion`) used instead.
 *
 * Attributes:
 *   ct - Contract template ID.
 *   tc - UK/BACS only: bank sort code prefix, used together with
 *     `sortcode`/`accountnumber` instead of iban/bic.
 *   iban - IBAN of the customer.
 *   bic - BIC/SWIFT code of the bank.
 *   accountnumber - UK/BACS only: 8-digit bank account number.
 *   sortcode - UK/BACS only: sort code in XX-XX-XX format.
 *   subregion - UK/BACS only: subregion identifier, e.g. 'bacs'.
 *   mandateNumber - Custom mandate number (optional).
 *   contractNumber - External contract number.
 *   campaign - Campaign identifier for tracking.
 *   prefix - Honorific or title (e.g., Mr., Ms.).
 *   check - Whether Twikey should verify the IBAN.
 *   ed - Execution date for the mandate.
 *   reminderDays - Number of days before sending a reminder.
 *   sendInvite - Whether to send the invitation immediately.
 *   token - Optional token to pre-fill or resume an invite.
 *   requireValidation - Whether IBAN validation is required.
 *   document - Document reference or identifier.
 *   transactionAmount - One-time transaction amount.
 *   transactionMessage - Message for the transaction.
 *   transactionRef - Reference for the transaction.
 *   plan - Identifier of a predefined payment plan.
 *   subscriptionStart - Start date for the subscription.
 *   subscriptionRecurrence - Recurrence rule (e.g., "monthly").
 *   subscriptionStopAfter - Number of times the subscription should run.
 *   subscriptionAmount - Amount to be charged in each cycle.
 *   subscriptionMessage - Description or message for the subscription.
 *   subscriptionRef - Reference for the subscription.
 */
export interface DocumentRequest extends BaseInfo {
    ct?: number;
    tc?: string;
    iban?: string;
    bic?: string;
    accountnumber?: string;
    sortcode?: string;
    subregion?: string;
    mandateNumber?: string;
    contractNumber?: string;
    campaign?: string;
    prefix?: string;
    check?: boolean;
    ed?: number;
    reminderDays?: number;
    sendInvite?: boolean | string;
    token?: string;
    requireValidation?: boolean;
    document?: string;
    transactionAmount?: string;
    transactionMessage?: string;
    transactionRef?: string;
    plan?: string;
    subscriptionStart?: Date;
    subscriptionRecurrence?: string;
    subscriptionStopAfter?: number;
    subscriptionAmount?: number;
    subscriptionMessage?: string;
    subscriptionRef?: string;
}

/**
 * DocumentSignRequest holds the parameters needed to sign a mandate
 * through various signing methods supported by the Twikey API, on top of the
 * invite request parameters.
 *
 * Extends the invite request with the fields needed to actually sign the
 * mandate, on top of the fields used to invite the customer in the first place.
 *
 * Attributes:
 *   method - Method to sign (e.g., "sms", "digisign", "import", "itsme",
 *     "emachtiging", "paper"). Required.
 *   digsig - Wet signature as a PNG image encoded in base64. Required if
 *     `method` is "digisign".
 *   key - Shortcode from the invite URL. Use this instead of `mandateNumber`
 *     to sign a prepared mandate directly. Max length 36.
 *   signDate - Date and time of signature in ISO8601 format. For SMS, this
 *     uses the date of reply.
 *   place - Place of signature.
 *   bankSignature - For B2B mandates only. Requires bank validation if true
 *     (default). Set to false to disable bank validation.
 */
export interface DocumentSignRequest extends DocumentRequest {
    method: string;
    digsig?: string;
    key?: string;
    signDate?: string;
    place?: string;
    bankSignature?: boolean;
}

/**
 * DocumentUpdateRequest holds the parameters for updating a mandate via the
 * Twikey API.
 *
 * Holds only the fields that can change on an existing mandate. The mandate
 * to update is passed as the separate `mndtId` parameter to
 * `DocumentService.update()` rather than as a field on this type.
 *
 * Attributes:
 *   state - 'active' or 'passive' — activate or suspend the mandate.
 *   iban - Debtor's IBAN.
 *   bic - Debtor's BIC code.
 *   mobile - Customer's mobile number in E.164 format.
 *   email - Debtor's email address.
 *   firstname - Debtor's first name.
 *   lastname - Debtor's last name.
 *   companyName - Company name on the mandate.
 *   coc - Enterprise number (only changeable if `companyName` is also changed).
 *   l - Language code on the mandate.
 *   customerNumber - Customer number (add/update or move mandate).
 *   ct - Move the document to a different template ID (of the same type).
 */
export interface DocumentUpdateRequest {
    state?: 'active',
    iban?: string;
    bic?: string;
    mobile?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    companyName?: string;
    coc?: string;
    l?: string;
    customerNumber?: string;
    ct?: number;
}

/**
 * DocumentActionRequest holds the parameters to perform an action on a mandate
 * via the Twikey API.
 *
 * Holds only the action to perform and its optional parameter. The mandate
 * to act on is passed as the separate `mndtId` parameter to
 * `DocumentService.action()` rather than as a field on this type.
 *
 * Attributes:
 *   type - The action to execute. One of 'invite', 'reminder', 'access',
 *     'automaticCheck' or 'manualCheck'.
 *   reminder - When `type` is 'reminder', specifies which reminder (1 to 4) is
 *     sent. (optional)
 */
export interface DocumentActionRequest {
    type: 'invite' | 'reminder' | 'access' | 'automaticCheck' | 'manualCheck';
    reminder?: string;
}

/**
 * DocumentQueryRequest holds the parameters used to query mandates/contracts
 * via the Twikey API.
 *
 * At least one of `iban`, `customerNumber` or `email` must be given to
 * identify which mandates to look up.
 *
 * Attributes:
 *   iban - The IBAN of the contract. At least one of `iban`, `customerNumber`
 *     or `email` is required.
 *   customerNumber - The customer number. At least one of `iban`,
 *     `customerNumber` or `email` is required.
 *   email - Email address of the customer. At least one of `iban`,
 *     `customerNumber` or `email` is required.
 *   state - Filter mandates by state. Should be uppercase if specified.
 *   page - Page number for pagination.
 */
export interface DocumentQueryRequest {
    iban?: string;
    customerNumber?: string;
    email?: string;
    state?: 'SIGNED' | 'PREPARED' | 'CANCELLED';
    page?: number;
}
