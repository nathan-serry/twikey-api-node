/**
 * The reply from creating (`create()`) or signing (`sign()`) a mandate invite.
 * Both operations return the same shape.
 *
 * Attributes:
 *   mndtId - Mandate reference (Twikey's internal ID).
 *   url - URL to redirect the customer to for signing.
 *   key - Shortcode from the invite URL, usable to sign a prepared mandate
 *     directly. Only present on the `create()` response.
 *   status - Mandate status.
 */
export interface DocumentResponse {
    mndtId: string;
    url: string;
    key?: string;
    status?: string;
}

/**
 * A postal address block, as it appears on both parties of a mandate. The keys are the
 * SEPA pain-style names the API uses verbatim.
 *
 * Attributes:
 *   AdrLine - Street line.
 *   PstCd - Postal code.
 *   TwnNm - Town name.
 *   Ctry - Country code.
 */
export interface MandatePostalAddress {
    AdrLine?: string;
    PstCd?: string;
    TwnNm?: string;
    Ctry?: string;
}

/**
 * The contact details block on a mandate party.
 *
 * Attributes:
 *   EmailAdr - Email address.
 *   Othr - Customer number. Not returned for every mandate.
 */
export interface MandateContactDetails {
    EmailAdr?: string;
    Othr?: string;
}

/**
 * One party on a mandate — the creditor (`Cdtr`) or the debtor (`Dbtr`).
 *
 * Attributes:
 *   Nm - Name of the party.
 *   PstlAdr - Postal address.
 *   Id - Enterprise or VAT number. Not returned for every mandate.
 *   CtryOfRes - Country of residence.
 *   CtctDtls - Contact details.
 */
export interface MandateParty {
    Nm?: string;
    PstlAdr?: MandatePostalAddress;
    Id?: string;
    CtryOfRes?: string;
    CtctDtls?: MandateContactDetails;
}

/**
 * The occurrence (scheduling) block of a mandate.
 *
 * Attributes:
 *   SeqTp - Sequence type, e.g. 'RCUR' for a recurring mandate.
 *   Frqcy - Frequency, e.g. 'ADHO' for ad-hoc collection.
 *   Drtn - Duration of the mandate; `FrDt` is the date it became valid, i.e. the sign date.
 */
export interface MandateOccurrences {
    SeqTp?: string;
    Frqcy?: string;
    Drtn?: { FrDt?: string };
}

/**
 * One key/value pair from a mandate's `SplmtryData` array, carrying the Twikey-specific
 * fields that have no SEPA equivalent (template id, signer, language, ...). `Value` is a
 * string for most keys but a number for some, e.g. `TemplateId`.
 *
 * Attributes:
 *   Key - Name of the supplementary field, e.g. 'TemplateId' or 'SignerDate#0'.
 *   Value - Its value.
 */
export interface MandateSupplementaryData {
    Key: string;
    Value: string | number;
}

/**
 * See https://www.twikey.com/api/#fetch-mandate-details
 *
 * A full mandate, as returned inside the `{Mndt: {…}}` envelope by
 * `DocumentService.detail()` and carried on each entry of `DocumentService.feed()`.
 *
 * The API returns the mandate in SEPA pain-style naming, and this type exposes it exactly
 * as sent rather than re-parsing it — the same choice made for `DocumentContract` and the
 * feed entry.
 *
 * Only `MndtId` was present on every payload observed, so everything else is optional.
 * Note the mandate's **state is not in this object**: the API sends it in the `X-STATE`
 * response header, which `detail()` does not surface.
 *
 * Attributes:
 *   MndtId - Mandate reference.
 *   LclInstrm - Local instrument, i.e. the mandate type, e.g. 'CORE' or 'B2B'.
 *   Ocrncs - Occurrence/scheduling block.
 *   CdtrSchmeId - Creditor scheme identifier.
 *   Cdtr - The creditor party.
 *   Dbtr - The debtor party.
 *   DbtrAcct - The debtor's IBAN.
 *   DbtrAgt - The debtor's bank; `FinInstnId.BICFI` is its BIC and `FinInstnId.Nm` its name.
 *   RfrdDoc - Referred document, i.e. the contract number.
 *   SplmtryData - Twikey-specific key/value fields.
 */
export interface MandateDetail {
    MndtId: string;
    LclInstrm?: string;
    Ocrncs?: MandateOccurrences;
    CdtrSchmeId?: string;
    Cdtr?: MandateParty;
    Dbtr?: MandateParty;
    DbtrAcct?: string;
    DbtrAgt?: { FinInstnId?: { BICFI?: string; Nm?: string } };
    RfrdDoc?: string;
    SplmtryData?: MandateSupplementaryData[];
}

/**
 * One raw entry from the `/mandate` feed, exposed as-is rather than parsed
 * into separate new/updated/cancelled shapes. `IsNew`/`IsUpdated`/`IsCancelled`
 * are derived from whether `AmdmtRsn`/`CxlRsn` are present on the entry.
 *
 * Attributes:
 *   Mndt - The mandate this event concerns, in the same shape `detail()` returns.
 *   AmdmtRsn - Present when this entry is an amendment/update.
 *   CxlRsn - Present when this entry is a cancellation.
 *   OrgnlMndtId - The original mandate number this event refers to, for
 *     amendments/cancellations.
 *   CdtrSchmeId - Creditor scheme ID associated with the mandate.
 *   EvtTime - ISO8601 timestamp of the event.
 *   EvtId - Unique identifier of the feed event.
 *   IsNew - True when neither `AmdmtRsn` nor `CxlRsn` is set.
 *   IsUpdated - True when `AmdmtRsn` is set.
 *   IsCancelled - True when `CxlRsn` is set.
 */
export interface DocumentFeedMessage {
    Mndt: MandateDetail;
    AmdmtRsn?: string;
    CxlRsn?: string;
    OrgnlMndtId?: string;
    CdtrSchmeId?: string;
    EvtTime?: string;
    EvtId?: string;
    IsNew?: boolean;
    IsUpdated?: boolean;
    IsCancelled?: boolean;
}

/**
 * The reply from creating a customer access link.
 *
 * Attributes:
 *   token - Access token for the customer access link.
 *   url - URL for the customer access link.
 */
export interface CustomerAccessResponse {
    token: string;
    url: string;
}

/**
 * One raw entry from `/mandate/query`'s `Contracts` array, exposed as-is
 * (`type`, `state`, `mandateNumber`, `contractNumber`, `signDate`, `iban`,
 * `bic`) rather than re-parsed into `DocumentResponse`.
 *
 * Attributes:
 *   mandateNumber - Mandate reference (Twikey's internal ID).
 *   state - Mandate state (e.g., 'SIGNED').
 *   [key] - Additional raw fields returned by the API (e.g. `type`,
 *     `contractNumber`, `signDate`, `iban`, `bic`) — not individually typed.
 */
export interface DocumentContract {
    mandateNumber: string;
    state: string;
    [key: string]: any;
}

/**
 * The reply from querying mandates by IBAN, customer number, or email. Exposes
 * the raw `Contracts` array rather than re-parsing it into a separate list type.
 *
 * Attributes:
 *   Contracts - The list of contracts (mandates) that matched the query.
 *   _links - Pagination link to the current page, if provided by the API.
 */
export interface DocumentQueryResponse {
    Contracts: DocumentContract[];
    _links?: { self: string };
}
