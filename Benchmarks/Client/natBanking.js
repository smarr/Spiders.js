define(function(){
	var construct 	 = function(amountOfAccounts,amountOfTransactions,initialBalance,configCallback){
		var actorsInitialised = 	0
		var benchEnd =			null
		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == amountOfAccounts + 1){
					configCallback(
						function(be){
							benchEnd 		= be
							tellerRef.postMessage(["start"])
						},
						function(){
							tellerRef.terminate()
							for(var i in accounts){
								accounts[i].terminate()
							}
						}
					)
				}
			}

			function actorInit(){
				actorsInitialised += 1
				checkConfig()
			}

			function end(){
				benchEnd()
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "end":
					end()
					break;
				default :
					console.log("Unknown message: " + event.data[0])
			}
		}

		var tellerRef = new Worker('./natBankingTeller.js')
		tellerRef.onmessage = sysHandle
		var accounts 	= []
		var accCount 	= amountOfAccounts - 1
		while(accCount >= 0){
			var newAcc = new Worker('./natBankingAccount.js')
			accounts.push(newAcc)
			newAcc.onmessage = sysHandle
			var chan = new MessageChannel()
			tellerRef.postMessage(["newAccount",amountOfAccounts,amountOfTransactions],[chan.port1])
			newAcc.postMessage(["config",initialBalance],[chan.port2])
			accCount -= 1
		}
	}

	return function(configs,startCB){
		var amAccounts 		= configs[0]
		var amTransactions 	= configs[1]
		var initialBalance 	= configs[2]
		construct(amAccounts,amTransactions,initialBalance,startCB)
	}
})