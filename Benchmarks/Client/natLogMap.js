define(function(){
	var construct 	 = function(amountOfTerms,amountOfSeries,startRate,increment,configCallback){
		var actorsInitialised = 	0
		var benchEnd = 			null

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == (amountOfSeries *  2) +  1){
					configCallback(
						function(be){
							benchEnd 		= be
							masterRef.postMessage(["start"])
						},
						function(){
							masterRef.terminate()
							for(var i in computers){
								computers[i].terminate()
							}
							for(var i in workers){
								workers[i].terminate()
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

		var masterRef = new Worker('./natLogMapMaster.js')
		masterRef.onmessage = sysHandle
		var computers 	= []
		var compCount 	= amountOfSeries - 1
		while(compCount >= 0){
			var newComp = new Worker('./natLogMapRate.js')
			newComp.onmessage = sysHandle
			var rate = startRate + (compCount * increment)
			newComp.postMessage(["config",rate])
			computers.push(newComp)
			compCount -= 1
		}
		var workers 	= []
		var workCount 	= amountOfSeries - 1
		while(workCount >= 0){
			var newWork = new Worker('./natLogMapSeries.js')
			newWork.onmessage = sysHandle
			var masChan = new MessageChannel()
			masterRef.postMessage(["newWorker",amountOfSeries,amountOfTerms],[masChan.port1])
			var raterRef = computers[workCount % computers.length]
			var rateChan = new MessageChannel()
			raterRef.postMessage(["link"],[rateChan.port1])
			newWork.postMessage(["linkMaster"],[masChan.port2])
			newWork.postMessage(["linkRate"],[rateChan.port2])
			var startTerm 		= workCount * increment
			newWork.postMessage(["config",startTerm])
			workers.push(newWork)
			workCount -= 1
		}
	}

	return function(configs,startCB){
		var amTerms 	= configs[0]
		var amSeries 	= configs[1]
		var startRate 	= configs[2]
		var increment 	= configs[3]
		construct(amTerms,amSeries,startRate,increment,startCB)
	}
})