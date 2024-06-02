import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TimesheetsPay } from '../wrappers/TimesheetsPay';
import '@ton/test-utils';

describe('TimesheetsPay', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let timesheetsPay: SandboxContract<TimesheetsPay>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        timesheetsPay = blockchain.openContract(await TimesheetsPay.fromInit(0n));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and timesheetsPay are ready to use
    });

    it('should add worker', async () => {
        const addTimes = 3;
        for (let i = 0; i < addTimes; i++) {
            console.log(`adding ${i + 1}/${addTimes}`);

            const newWorker = await blockchain.treasury('worker' + i);

            const workersBefore = await timesheetsPay.getAllWorkers();

            console.log('workers before adding', workersBefore);

            const addResult = await timesheetsPay.send(
                deployer.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'AddWorker',
                    debt: 100n,
                    address: newWorker.address,
                }
            );

            expect(addResult.transactions).toHaveTransaction({
                from: deployer.address,
                to: timesheetsPay.address,
                success: true,
            });

            const workersAfter = await timesheetsPay.getAllWorkers();

            console.log('workers after adding', workersAfter);
        }
    });

    it('should add and then remove worker', async () => {
        const newWorker = await blockchain.treasury('workerToBeRemoved');

        const workersBefore = await timesheetsPay.getAllWorkers();

        console.log('workers before adding', workersBefore);

        const addResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'AddWorker',
                debt: 100n,
                address: newWorker.address,
            }
        );

        expect(addResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const workersAfterAdding = await timesheetsPay.getAllWorkers();

        console.log('workers after adding', workersAfterAdding);

        const removeResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'RemoveWorker',
                address: newWorker.address,
            }
        );

        expect(removeResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const workersAfterRemoving = await timesheetsPay.getAllWorkers();

        console.log('workers after removing', workersAfterRemoving);
    });

    it('should add and then set the worker as admin', async () => {
        const newWorker = await blockchain.treasury('workerToBeAdmin');

        const workersBefore = await timesheetsPay.getAllWorkers();

        console.log('workers before adding', workersBefore);

        const addResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'AddWorker',
                debt: 100n,
                address: newWorker.address,
            }
        );

        expect(addResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const workersAfterAdding = await timesheetsPay.getAllWorkers();

        console.log('workers after adding and before setting admin', workersAfterAdding);

        const setAdminResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetAdmin',
                address: newWorker.address,
            }
        );

        expect(setAdminResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const workersAfterAdmin = await timesheetsPay.getAllWorkers();

        console.log('workers after setting admin', workersAfterAdmin);
    });

    it('should add debt to worker', async () => {
        const newWorker = await blockchain.treasury('workerToAddDebt');

        const workersBefore = await timesheetsPay.getAllWorkers();

        console.log('workers before adding', workersBefore);

        const addResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'AddWorker',
                debt: 100n,
                address: newWorker.address,
            }
        );

        expect(addResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const workersAfterAdding = await timesheetsPay.getAllWorkers();

        console.log('workers after adding and before adding debt', workersAfterAdding);

        const addDebtResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'AddDebt',
                address: newWorker.address,
                debt: 1000n,
            }
        );

        expect(addDebtResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const workersAfterDebt = await timesheetsPay.getAllWorkers();

        console.log('workers after adding debt', workersAfterDebt);
    });

    it('should deposit and pay debt for work', async () => {
        const newWorker = await blockchain.treasury('workerToPayDebt');

        const workersBefore = await timesheetsPay.getAllWorkers();

        console.log('workers before adding', workersBefore);

        const addResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'AddWorker',
                debt: 1000n,
                address: newWorker.address,
            }
        );

        expect(addResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const workersAfterAdding = await timesheetsPay.getAllWorkers();
        const contractBalanceBeforeDeposit = await timesheetsPay.getBalance();

        console.log('workers after adding and before paying debt', workersAfterAdding);
        console.log('balance of contract before deposit', contractBalanceBeforeDeposit);

        const depositResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('105'),
            },
            {
                $$type: 'Deposit',
            }
        );

        expect(depositResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: timesheetsPay.address,
            success: true,
        });

        const contractBalanceAfterDeposit = await timesheetsPay.getBalance();

        console.log('balance of contract after deposit', contractBalanceAfterDeposit);

        const payDebtResult = await timesheetsPay.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'PayDebt',
                address: newWorker.address,
                usdAmount: 50n,
                tonAmount: 100n,
            }
        );

        expect(payDebtResult.transactions).toHaveTransaction({
            from: timesheetsPay.address,
            to: newWorker.address,
            success: true,
        });

        const workersAfterDebt = await timesheetsPay.getAllWorkers();

        console.log('workers after paying debt', workersAfterDebt);
    });
});
