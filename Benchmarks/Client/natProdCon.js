define(function(){
	var construct 	 = function(bufferSize,amountOfProducers,amountOfConsumers,amountOfItems,prodCost,conCost,configCallback){
		var actorsInitialised = 	0
		var benchEnd =		null

		function sysHandler(event){
			function checkConfig(){
				if(actorsInitialised == amountOfProducers + amountOfConsumers + 1){
					configCallback(
						function(be){
							console.log("Starting")
							benchEnd 		= be
							for(var i in producers){
								producers[i].postMessage(["produce"])
							}
						},
						function(){
							managerRef.terminate()
							for(var i in producers){
								producers[i].terminate()
							}
							for(var i in consumers){
								consumers[i].terminate()
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

		var managerRef = new Worker('./natProdConManager.js')
		managerRef.onmessage = sysHandler
		managerRef.postMessage(["config",bufferSize,amountOfConsumers,amountOfProducers])
		var producers = []
		var prodCount = amountOfProducers
		while(prodCount > 0){
			var newProd = new Worker('./natProdConProducer.js')
			newProd.onmessage = sysHandler
			var manChan = new MessageChannel()
			managerRef.postMessage(["link"],[manChan.port2])
			newProd.postMessage(["config",amountOfItems,prodCost],[manChan.port1])
			producers.push(newProd)
			prodCount -= 1
		}
		var consumers = []
		var conCount = amountOfConsumers
		while(conCount > 0){
			var newCon = new Worker('./natProdConConsumer.js')
			newCon.onmessage = sysHandler
			var manChan = new MessageChannel()
			managerRef.postMessage(["link"],[manChan.port2])
			newCon.postMessage(["config",conCost],[manChan.port1])
			consumers.push(newCon)
			var conChan = new MessageChannel()
			newCon.postMessage(["link"],[conChan.port2])
			managerRef.postMessage(["registerConsumer"],[conChan.port1])
			conCount -= 1
		}	
	}

	return function(configs,startCB){
		var bufferSize 	= configs[0]
		var amProd 		= configs[1]
		var amCon 		= configs[2]
		var amItems		= configs[3]
		var prodCost 	= configs[4]
		var conCost 	= configs[5]
		construct(bufferSize,amProd,amCon,amItems,prodCost,conCost,startCB)
	}
})