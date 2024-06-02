import "@stdlib/deploy";

struct WorkerInfo {
    debt: Int as uint32;
    admin: Bool;
}

message AddWorker {
    address: Address;
    debt: Int as uint32;
}

message RemoveWorker {
    address: Address;
}

message SetAdmin {
    address: Address;
}

message AddDebt {
    address: Address;
    debt: Int as uint32;
}

message PayDebt {
    address: Address;
    tonAmount: Int as coins;
    usdAmount: Int as uint32;
}

message Deposit {

}

contract TimesheetsPay with Deployable {
    const MinTonForStorage: Int = ton("0.01");
    seqno: Int as uint64;                                                           // Number of smart contract instance
    workers: map<Address, WorkerInfo>;

    init(seqno: Int) {
        self.seqno = seqno;
        self.workers.set(sender(), WorkerInfo{debt: 0, admin: true});               // Set deployer as admin by default
    }

    fun onlyAdmin() {
        require(self.workers.get(sender()) != null, "Sender must be a worker");
        let senderWorker: WorkerInfo = self.workers.get(sender())!!;
        require(senderWorker.admin, "Sender must be admin");
    }

    receive(msg: AddWorker) {
        self.onlyAdmin();

        require(self.workers.get(msg.address) == null, "Worker already exists");
        self.workers.set(msg.address, WorkerInfo{debt: msg.debt, admin: false});

        self.reply("AddWorker refund".asComment());
    }

    receive(msg: RemoveWorker) {
        self.onlyAdmin();

        require(self.workers.get(msg.address) != null, "Worker does not exist");
        self.workers.set(msg.address, null);

        self.reply("RemoveWorker refund".asComment());
    }

    receive(msg: SetAdmin) {
        self.onlyAdmin();

        require(self.workers.get(msg.address) != null, "Worker does not exist");
        let targetWorker: WorkerInfo = self.workers.get(msg.address)!!;
        targetWorker.admin = true;
        self.workers.set(msg.address, targetWorker);
    
        self.reply("SetAdmin refund".asComment());
    }

    receive(msg: AddDebt) {
        self.onlyAdmin();

        require(self.workers.get(msg.address) != null, "Worker does not exist");
        let targetWorker: WorkerInfo = self.workers.get(msg.address)!!;
        targetWorker.debt = targetWorker.debt + msg.debt;
        self.workers.set(msg.address, targetWorker);

        self.reply("AddDebt refund".asComment());
    }

    receive(msg: PayDebt) {
        self.onlyAdmin();

        require(self.workers.get(msg.address) != null, "Worker does not exist");
        let targetWorker: WorkerInfo = self.workers.get(msg.address)!!;

        let amount: Int = min(msg.tonAmount, myBalance() - context().value - self.MinTonForStorage);   // Save minimum of TON to keep contract alive
        require(amount > 0, "Insufficient balance");

        send(SendParameters{
            to: msg.address,
            bounce: true,
            value: amount,
            mode: SendRemainingValue + SendIgnoreErrors
        });

        targetWorker.debt = targetWorker.debt - msg.usdAmount;
        self.workers.set(msg.address, targetWorker);
    }

    receive(msg: Deposit) {
        self.onlyAdmin();

        dump(context().value);
    }

    get fun allWorkers(): map<Address, WorkerInfo> {
        return self.workers;
    }

    get fun balance(): String {
        return myBalance().toCoinsString();
    }

    get fun seqno(): String {
        return self.seqno.toString();
    }
}
