/**
 * One entry from `ReportingService.getFiles()`, downloadable via
 * `ReportingService.downloadFile(name)`.
 *
 * Attributes:
 *   id - Identifier of the file.
 *   name - Filename, used to download the file via `downloadFile()`.
 *   created - When the file was generated.
 *   state - State of the file.
 */
export interface ReconciliationFile {
    id: string;
    name: string;
    created?: string;
    state?: string;
}
