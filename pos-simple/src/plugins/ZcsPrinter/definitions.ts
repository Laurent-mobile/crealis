export interface ZcsPrinterPlugin {
    init(): Promise<{ success: boolean }>;
    printText(options: { text: string }): Promise<{ success: boolean }>;
    printLine(options: { count?: number }): Promise<{ success: boolean }>;
    cutPaper(): Promise<{ success: boolean }>;
    getStatus(): Promise<{ status: string }>;
}
