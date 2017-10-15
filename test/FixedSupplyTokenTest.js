const FixedSupplyTokenAbstraction = artifacts.require('FixedSupplyToken');
//const SampleRecipientSuccess = artifacts.require('SampleRecipientSuccess');
//const SampleRecipientThrow = artifacts.require('SampleRecipientThrow');
const BigNumber = require('bignumber.js');

contract('FixedSupplyToken', function (accounts) {
    let tokenContract;
    let creatorAccount = accounts[0];
    let secondAccount = accounts[1];
    let initialAmount = new BigNumber(10).times(new BigNumber(10).pow(6 + 18));

    describe('Creation', function () {
        beforeEach(function (done) {
            FixedSupplyTokenAbstraction.new().then(function (instance) {
                tokenContract = instance;
                done();
            });
        });

        it('should gove all the initial balance to the creator', function (done) {
            tokenContract.balanceOf.call(creatorAccount)
                .then(function (balance) {
                    assert(balance.equals(initialAmount));
                    return tokenContract.decimals.call()
                })
                .then(function (decimals) {
                    assert.strictEqual(decimals.toNumber(), 18);
                    return tokenContract.symbol.call()
                })
                .then(function (symbol) {
                    assert.strictEqual(symbol, 'EX1');
                    done();
                })
                .catch(done);
        });

    });

    describe('Normal Transfers', function () {
        beforeEach(function (done) {
            FixedSupplyTokenAbstraction.new().then(function (instance) {
                tokenContract = instance;
                done();
            });
        });

        it('ether transfer should be reversed.', function (done) {
            web3.eth.sendTransaction({
                from: creatorAccount,
                to: tokenContract.address,
                value: web3.toWei('10', 'Ether')
            }, function (err, res) {
                assert(err, 'Transaction should be rejected');
                tokenContract.balanceOf.call(creatorAccount).then(function (balanceAfter) {
                    assert(balanceAfter.equals(initialAmount));
                    done();
                });
            })
        });

        it('should transfer all tokens', function (done) {
            tokenContract.transfer(secondAccount, initialAmount, {from: creatorAccount})
                .then(function (success) {
                    assert.ok(success);
                    return tokenContract.balanceOf.call(secondAccount);
                })
                .then(function (balance) {
                    assert(balance.equals(initialAmount));
                    done();
                });
        });

        it('should fail when trying to transfer initialAmount + 1', function (done) {
            tokenContract.transfer(secondAccount, initialAmount.add(1), {from: creatorAccount})
                .then(function () {
                    done('Transfer expected to fail');
                })
                .catch(function (e) {
                    done();
                });
        });

        it('transfers: should transfer 1 token', function (done) {
            tokenContract.transfer(secondAccount, 1, {from: creatorAccount})
                .then(function (res) {
                    assert.ok(res);

                    // check event log
                    const transferLog = res.logs[0];
                    assert.strictEqual(transferLog.args.from, creatorAccount);
                    assert.strictEqual(transferLog.args.to, secondAccount);
                    assert.strictEqual(transferLog.args.value.toString(), '1');
                    done();
                });
        });
    });

    describe('Approvals', function () {
        beforeEach(function (done) {
            FixedSupplyTokenAbstraction.new().then(function (instance) {
                tokenContract = instance;
                done();
            });
        });

        it('when msg.sender approves 100 to accounts[1] then account[1] should be able to withdraw 20 from msg.sender', function (done) {
            let sender = creatorAccount;
            tokenContract.approve(secondAccount, 100, {from: sender})
                .then(function (res) {
                    assert.ok(res);

                    // check event logs
                    const approvalLog = res.logs[0];
                    console.log(approvalLog);
                    assert.strictEqual(approvalLog.args.owner, creatorAccount);
                    assert.strictEqual(approvalLog.args.spender, secondAccount);
                    assert.strictEqual(approvalLog.args.value.toString(), '100');

                    return tokenContract.allowance.call(sender, secondAccount);
                })
                .then(function (allowance) {
                    assert.strictEqual(allowance.toNumber(), 100);
                    return tokenContract.transferFrom(sender, accounts[2], 20, {from: secondAccount});
                })
                .then(function (success) {
                    assert.ok(success);
                    return tokenContract.allowance.call(sender, secondAccount);
                })
                .then(function (allowance) {
                    assert.strictEqual(allowance.toNumber(), 80);
                    return tokenContract.balanceOf.call(accounts[2]);
                })
                .then(function (balance) {
                    assert.strictEqual(balance.toNumber(), 20);
                    return tokenContract.balanceOf.call(creatorAccount);
                })
                .then(function (balance) {
                    assert(balance.plus(20).equals(initialAmount));
                    done();
                });
        });

        it('when msg.sender approves 100 to accounts[1] then account[1] should not be able to withdraw 101 from msg.sender', function (done) {
            let sender = creatorAccount;
            tokenContract.approve(secondAccount, 100, {from: sender})
                .then(function (success) {
                    assert.ok(success);
                    return tokenContract.allowance.call(sender, secondAccount);
                })
                .then(function (allowance) {
                    assert.strictEqual(allowance.toNumber(), 100);
                    return tokenContract.transferFrom(sender, accounts[2], 101, {from: secondAccount});
                })
                .then(function () {
                    done('Should fail');
                })
                .catch(function (e) {
                    assert(e, 'Should fail');
                    return tokenContract.allowance.call(sender, secondAccount);
                })
                .then(function (allowance) {
                    assert.strictEqual(allowance.toNumber(), 100);
                    return tokenContract.balanceOf.call(accounts[2]);
                })
                .then(function (balance) {
                    assert.strictEqual(balance.toNumber(), 0);
                    return tokenContract.balanceOf.call(creatorAccount);
                })
                .then(function (balance) {
                    assert(balance.equals(initialAmount));
                    done();
                });
        });

        it('withdrawal from account with no allowance should fail', function (done) {
            tokenContract.transferFrom(creatorAccount, accounts[2], 60, {from: accounts[1]})
                .then(function () {
                    done('Should fail');
                })
                .catch(function (e) {
                    assert(e, 'Should fail');
                    done();
                })
        });
    });


});