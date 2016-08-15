define(function(){
	var construct 	 = function(amountOfCounts,configCallback){

		var prodInitialised =	false
		var countInitialised =	false
		var benchEnd 		=	null

		var sysHandler = function(event){
			function checkConfig(){
				if(prodInitialised && countInitialised){
					configCallback(
						function(be){
							benchEnd = be
							prodWorker.postMessage(["start"])
						},
						function(){
							prodWorker.terminate()
							countWorker.terminate()
						}
					)
				}
			}

			function prodInit(){
				prodInitialised = true
				checkConfig()
			}

			function countInit(){
				countInitialised = true
				checkConfig()
			}

			function countsExhausted(){
				benchEnd()
			}

			switch(event.data[0]){
				case "prodInit":
					prodInit()
					break;
				case "countInit":
					countInit()
					break;
				case "countsExhausted":
					countsExhausted()
					break;
			}
		}

		var prodWorker = new Worker('./natCountProducer.js')
		prodWorker.onmessage = sysHandler
		var countWorker = new Worker('./natCountCount.js')
		countWorker.onmessage = sysHandler
		var chan = new MessageChannel()
		prodWorker.postMessage(["config",amountOfCounts],[chan.port1])
		countWorker.postMessage(["config",amountOfCounts],[chan.port2])
	}

	return function(configs,startCB){
		var amCounts = configs[0]
		construct(amCounts,startCB)
	}
})