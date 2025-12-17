import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

const ONE_DAY = 86400;
const ONE_WEEK = 604800;

Clarinet.test({
    name: "Can create an escrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const buyer = accounts.get('wallet_1')!;
        const seller = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('escrow-manager', 'create-escrow', [
                types.principal(seller.address),
                types.uint(100000000), // 100 STX
                types.ascii("Test escrow for goods"),
                types.uint(ONE_WEEK)
            ], buyer.address)
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1);
        
        // Check print event was emitted
        const events = block.receipts[0].events;
        assertExists(events.find(e => e.type === 'contract_event'));
    }
});

Clarinet.test({
    name: "Can fund an escrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const buyer = accounts.get('wallet_1')!;
        const seller = accounts.get('wallet_2')!;
        
        // Create escrow
        chain.mineBlock([
            Tx.contractCall('escrow-manager', 'create-escrow', [
                types.principal(seller.address),
                types.uint(100000000),
                types.ascii("Test escrow"),
                types.uint(ONE_WEEK)
            ], buyer.address)
        ]);
        
        // Fund escrow
        let block = chain.mineBlock([
            Tx.contractCall('escrow-manager', 'fund-escrow', [
                types.uint(1)
            ], buyer.address)
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Only buyer can fund escrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const buyer = accounts.get('wallet_1')!;
        const seller = accounts.get('wallet_2')!;
        const attacker = accounts.get('wallet_3')!;
        
        // Create escrow
        chain.mineBlock([
            Tx.contractCall('escrow-manager', 'create-escrow', [
                types.principal(seller.address),
                types.uint(100000000),
                types.ascii("Test escrow"),
                types.uint(ONE_WEEK)
            ], buyer.address)
        ]);
        
        // Attacker tries to fund
        let block = chain.mineBlock([
            Tx.contractCall('escrow-manager', 'fund-escrow', [
                types.uint(1)
            ], attacker.address)
        ]);
        
        block.receipts[0].result.expectErr().expectUint(20001); // ERR_NOT_AUTHORIZED
    }
});

Clarinet.test({
    name: "Can release escrow with fee deduction",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const buyer = accounts.get('wallet_1')!;
        const seller = accounts.get('wallet_2')!;
        
        // Create and fund escrow
        chain.mineBlock([
            Tx.contractCall('escrow-manager', 'create-escrow', [
                types.principal(seller.address),
                types.uint(100000000), // 100 STX
                types.ascii("Test escrow"),
                types.uint(ONE_WEEK)
            ], buyer.address),
            Tx.contractCall('escrow-manager', 'fund-escrow', [
                types.uint(1)
            ], buyer.address)
        ]);
        
        // Release escrow
        let block = chain.mineBlock([
            Tx.contractCall('escrow-manager', 'release-escrow', [
                types.uint(1)
            ], buyer.address)
        ]);
        
        // 99 STX after 1% fee
        block.receipts[0].result.expectOk().expectUint(99000000);
    }
});

Clarinet.test({
    name: "Protocol fee is calculated correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const user = accounts.get('wallet_1')!;
        
        // 1% of 100 STX = 1 STX
        let fee = chain.callReadOnlyFn(
            'escrow-manager',
            'calculate-fee',
            [types.uint(100000000)],
            user.address
        );
        
        assertEquals(fee.result, 'u1000000'); // 1 STX
    }
});

Clarinet.test({
    name: "Dispute fee is calculated correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const user = accounts.get('wallet_1')!;
        
        // 2% of 100 STX = 2 STX
        let fee = chain.callReadOnlyFn(
            'escrow-manager',
            'calculate-dispute-fee',
            [types.uint(100000000)],
            user.address
        );
        
        assertEquals(fee.result, 'u2000000'); // 2 STX
    }
});

Clarinet.test({
    name: "Can open dispute",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const buyer = accounts.get('wallet_1')!;
        const seller = accounts.get('wallet_2')!;
        
        // Create and fund escrow
        chain.mineBlock([
            Tx.contractCall('escrow-manager', 'create-escrow', [
                types.principal(seller.address),
                types.uint(100000000),
                types.ascii("Test escrow"),
                types.uint(ONE_WEEK)
            ], buyer.address),
            Tx.contractCall('escrow-manager', 'fund-escrow', [
                types.uint(1)
            ], buyer.address)
        ]);
        
        // Open dispute
        let block = chain.mineBlock([
            Tx.contractCall('escrow-manager', 'open-dispute', [
                types.uint(1),
                types.ascii("Goods not as described")
            ], buyer.address)
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Get protocol stats",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const user = accounts.get('wallet_1')!;
        
        let stats = chain.callReadOnlyFn(
            'escrow-manager',
            'get-protocol-stats',
            [],
            user.address
        );
        
        const data = stats.result.expectTuple();
        assertEquals(data['total-escrows'], types.uint(0));
        assertEquals(data['total-fees'], types.uint(0));
    }
});

Clarinet.test({
    name: "Can add arbiter",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const arbiter = accounts.get('wallet_3')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('escrow-manager', 'add-arbiter', [
                types.principal(arbiter.address)
            ], deployer.address)
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
        
        // Check arbiter is registered
        let isArbiter = chain.callReadOnlyFn(
            'escrow-manager',
            'is-arbiter',
            [types.principal(arbiter.address)],
            deployer.address
        );
        
        isArbiter.result.expectBool(true);
    }
});

Clarinet.test({
    name: "User stats are tracked",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const buyer = accounts.get('wallet_1')!;
        const seller = accounts.get('wallet_2')!;
        
        // Create escrow
        chain.mineBlock([
            Tx.contractCall('escrow-manager', 'create-escrow', [
                types.principal(seller.address),
                types.uint(100000000),
                types.ascii("Test escrow"),
                types.uint(ONE_WEEK)
            ], buyer.address)
        ]);
        
        // Check user stats
        let stats = chain.callReadOnlyFn(
            'escrow-manager',
            'get-user-stats',
            [types.principal(buyer.address)],
            buyer.address
        );
        
        const data = stats.result.expectSome().expectTuple();
        assertEquals(data['escrows-created'], types.uint(1));
    }
});
