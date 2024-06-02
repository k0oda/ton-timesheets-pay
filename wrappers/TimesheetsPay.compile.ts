import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/timesheets_pay.tact',
    options: {
        debug: true,
    },
};
