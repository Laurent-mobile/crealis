import { registerPlugin } from '@capacitor/core';
import { ZcsPrinterWeb } from './web';
import type { ZcsPrinterPlugin } from './definitions';

const ZcsPrinter = registerPlugin<ZcsPrinterPlugin>('ZcsPrinter', {
    web: () => new ZcsPrinterWeb(),
});

export * from './definitions';
export { ZcsPrinter };
