import { WebPlugin } from '@capacitor/core';
import type { ZcsPrinterPlugin } from './definitions';

export class ZcsPrinterWeb extends WebPlugin implements ZcsPrinterPlugin {
    async init(): Promise<{ success: boolean }> {
        console.log('ZcsPrinter Web: Impression non disponible');
        return { success: false };
    }

    async printText(options: { text: string }): Promise<{ success: boolean }> {
        console.log('ZcsPrinter Web printText:', options.text);
        window.print();
        return { success: true };
    }

    async printLine(options: { count?: number }): Promise<{ success: boolean }> {
        console.log('ZcsPrinter Web printLine');
        return { success: true };
    }

    async cutPaper(): Promise<{ success: boolean }> {
        console.log('ZcsPrinter Web cutPaper');
        return { success: false };
    }

    async getStatus(): Promise<{ status: string }> {
        return { status: 'web' };
    }
}
