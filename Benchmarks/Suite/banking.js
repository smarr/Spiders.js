define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfAccounts,amountOfTransactions,initialBalance,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfAccounts + 1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								tellerRef.start()
							},
							function(){
								killAll()
							}
						)
					}
				},

				actorInit: function(){
					this.actorsInitialised += 1
					this.checkConfig()
				},

				end: function(){
					this.benchEnd()
				}
			}

			var tellerBehaviour = {
				totalAccounts: 			0,
				totalTransactions: 		0,
				accounts: 				[],
				currentTransactions: 	0,

				newAccount: function(totalAccounts,totalTransactions,accountRef){
					this.totalAccounts 		= totalAccounts
					this.totalTransactions 	= totalTransactions
					this.accounts.push(accountRef)
					if(this.totalAccounts == this.accounts.length){
						this.system.actorInit()
					}
				},

				getRandom: function(upper){
					return Math.floor(Math.random() * (upper - 0) + 0)
				},

				start: function(){
					var i = 0
					while(i < this.totalTransactions){
						this.generateWork()
						i++
					}
				},

				generateWork: function(){
					var sourceAccount 	= this.getRandom(this.accounts.length)
					var destAccount 	= this.getRandom(this.accounts.length)
					if(destAccount == sourceAccount){
						destAccount = (destAccount + 1) % this.accounts.length
					}
					var amount 			= this.getRandom(1000)
					this.accounts[sourceAccount].credit(this,amount,this.accounts[destAccount])
				},

				transactionDone: function(){
					this.currentTransactions += 1
					if(this.currentTransactions == this.totalTransactions){
						this.system.end()
					}
				}

			}

			var accountBehaviour = {
				balance: 0,

				config: function(initialBalance){
					this.balance = initialBalance
					this.system.actorInit()
				},

				credit: function(teller,amount,destination){
					this.balance -= amount
					var fut = destination.debit(amount)
					this.onResolve(fut,function(){
						teller.transactionDone()
					})
				},

				debit: function(amount){
					this.balance += amount
					return 'ok'
				}

			}


			systemActor(sysBehaviour)
			var tellerRef = actor(tellerBehaviour)
			var accounts 	= []
			var accCount 	= amountOfAccounts - 1
			while(accCount >= 0){
				var newAcc = actor(accountBehaviour)
				accounts.push(newAcc)
				newAcc.config(initialBalance)
				tellerRef.newAccount(amountOfAccounts,amountOfTransactions,newAcc)
				accCount -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amAccounts 		= configs[0]
		var amTransactions 	= configs[1]
		var initialBalance 	= configs[2]
		construct(amAccounts,amTransactions,initialBalance,startCB)
	}
})