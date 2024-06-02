import { Address, toNano } from '@ton/core';
import { TimesheetsPay } from '../wrappers/TimesheetsPay';
import { NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('TimesheetsPay address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const timesheetsPay = provider.open(TimesheetsPay.fromAddress(address));

    const counterBefore = await timesheetsPay.getBalance();

    await timesheetsPay.send(
        provider.sender(),
        {
            value: toNano('100.00'),
        },
        {
            $$type: 'Deposit',
        }
    );

    ui.write('Waiting for balance to increase...');

    let balanceAfter = await timesheetsPay.getBalance();
    let attempt = 1;
    while (balanceAfter === counterBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        balanceAfter = await timesheetsPay.getBalance();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Balance increased successfully!');
}
