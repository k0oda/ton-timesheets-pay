import { toNano } from '@ton/core';
import { TimesheetsPay } from '../wrappers/TimesheetsPay';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const timesheetsPay = provider.open(await TimesheetsPay.fromInit(BigInt(Math.floor(Math.random() * 10000))));

    await timesheetsPay.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(timesheetsPay.address);

    console.log('ID', await timesheetsPay.getId());
}
