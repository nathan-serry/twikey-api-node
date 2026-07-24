/**
 * The reply from creating (`create()`) or signing (`sign()`) a mandate invite.
 * Mirrors Python's `InviteResponse` and `SignResponse`
 * (`twikey/model/document_response.py`) — Node uses one shared shape where
 * Python has two separate classes.
 *
 * Attributes:
 *   mndtId - Mandate reference (Twikey's internal ID). Mirrors Python's
 *     `InviteResponse.mandate_number`/`SignResponse.mandate_number`.
 *   url - URL to redirect the customer to for signing. Mirrors Python's
 *     `InviteResponse.url`/`SignResponse.url`.
 *   key - Shortcode from the invite URL, usable to sign a prepared mandate
 *     directly. Mirrors Python's `InviteResponse.key`; only present on the
 *     `create()` response.
 *   status - Mandate status.
 */
export interface DocumentResponse {
    mndtId: string;
    url: string;
    key?: string;
    status?: string;
}

/**
 * One raw entry from the `/mandate` feed. Python has no dedicated class for
 * this — `document.py`'s `feed()` method reads the same dict keys inline and
 * dispatches to `DocumentFeed.new_document()`/`updated_document()`/
 * `cancelled_document()` instead of yielding a structured object. Node exposes
 * the raw entry directly and derives `IsNew`/`IsUpdated`/`IsCancelled` using the
 * same `AmdmtRsn`/`CxlRsn` presence checks Python's `feed()` uses.
 *
 * Attributes:
 *   Mndt - The raw mandate (Mndt) payload for this event.
 *   AmdmtRsn - Present when this entry is an amendment/update; mirrors
 *     Python's `msg["AmdmtRsn"]`.
 *   CxlRsn - Present when this entry is a cancellation; mirrors Python's
 *     `msg["CxlRsn"]`.
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
    Mndt: string;
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
 * The reply from creating a customer access link. Mirrors Python's
 * `CustomerAccessResponse` (`twikey/model/document_response.py`) field for field.
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
 * One raw entry from `/mandate/query`'s `Contracts` array. Python parses the
 * same fields (`type`, `state`, `mandateNumber`, `contractNumber`, `signDate`,
 * `iban`, `bic`) into `Document` objects inside `QueryMandateResponse.__init__`
 * — Node exposes the raw contract entry instead of re-parsing it into
 * `DocumentResponse`.
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
 * The reply from querying mandates by IBAN, customer number, or email. Mirrors
 * Python's `QueryMandateResponse` (`twikey/model/document_response.py`), which
 * parses `Contracts` into a `mandates: list[Document]` — Node exposes the raw
 * `Contracts` array instead of re-parsing it.
 *
 * Attributes:
 *   Contracts - The list of contracts (mandates) that matched the query.
 *   _links - Pagination link to the current page, if provided by the API.
 */
export interface DocumentQueryResponse {
    Contracts: DocumentContract[];
    _links?: { self: string };
}
