define(function(){
	var construct 	 = function(amountOfPings,configCallback){
		var pingInitialised =	false
		var pongInitialised = 	false
		var benchEnd 		=	null

		var sysHandler = function(event){
			function checkConfig(){
				if(pingInitialised && pongInitialised){
					configCallback(
						function(be){
							benchEnd = be
							pingWorker.postMessage(["start"])
						},
						function(){
							pingWorker.terminate()
							pongWorker.terminate()
						}
					)
				}
			}

			function pingInit(){
				pingInitialised = true
				checkConfig()
			}

			function pongInit(){
				pongInitialised = true
				checkConfig()
			}

			function pingsExhausted(){
				benchEnd()
			}

			switch(event.data[0]){
				case "checkConfig" :
					checkConfig()
					break;
				case "pingInit" : 
					pingInit()
					break;
				case "pongInit" :
					pongInit()
					break;
				case "pingsExhausted" :
					pingsExhausted()
					break;
			}
		}

		var pingWorker = new Worker('./natPingActor.js')
		pingWorker.onmessage = sysHandler
		var pongWorker = new Worker('./natPongActor.js')
		pongWorker.onmessage = sysHandler
		var chan = new MessageChannel()
		pingWorker.postMessage(["config",amountOfPings],[chan.port1])
		pongWorker.postMessage(["config"],[chan.port2])
	}

	return function(configs,startCB){
		var amPings = configs[0]
		construct(amPings,startCB)
	}
})