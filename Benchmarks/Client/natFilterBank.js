define(function(){
	var construct 	 = function(amountOfColumns,amountOfSimulations,amountOfChannels,configCallback){
		var actorsInitialised = 	0
		var actorsExited =		0
		var benchEnd = 			null

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == 6 + amountOfChannels + amountOfChannels * 6){
					configCallback(
						function(be){
							benchEnd 		= be
							producerRef.postMessage(["nextMessage"])
						},
						function(){
							producerRef.terminate()
							sinkRef.terminate()
							combineRef.terminate()
							integrateRef.terminate()
							branchesRef.terminate()
							sourceRef.terminate()
							for(var i in miscActors){
								miscActors[i].terminate()
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
					console.log("Unknown message (System): " + event.data[0])
			}
		}

		var producerRef = new Worker('./natFilterBankProducer.js')
		producerRef.onmessage = sysHandle
		var sinkRef = new Worker('./natFilterBankSink.js')
		sinkRef.onmessage = sysHandle
		var combineRef = new Worker('./natFilterBankCombine.js')
		combineRef.onmessage = sysHandle
		var c1 = new MessageChannel()
		sinkRef.postMessage(["link"],[c1.port2])
		combineRef.postMessage(["config"],[c1.port1])
		var integrateRef = new Worker('./natFilterBankIntegrator.js')
		integrateRef.onmessage = sysHandle
		var c2 = new MessageChannel()
		combineRef.postMessage(["link"],[c2.port2])
		integrateRef.postMessage(["config",amountOfChannels],[c2.port1])
		var branchesRef = new Worker('./natFilterBankBranch.js')
		branchesRef.onmessage = sysHandle
		var c3 = new MessageChannel()
		integrateRef.postMessage(["link"],[c3.port2])
		branchesRef.postMessage(["config"],[c3.port1])
		var H = {}
		var F = {}
		for(var j = 0; j < amountOfChannels;j++){
			H[j] = {}
			F[j] = {}
			for(var i = 0; i < amountOfColumns;i++){
				H[j][i] = (1.0 * i * amountOfColumns) + (1.0 * j * amountOfChannels) + j + i + j + 1;
				F[j][i] = (1.0 * i * j) + (1.0 * j * j) + j + i
			}
		}
		var miscActors = []
		for(var i = 0;i < amountOfChannels;i++){
			var taggedRef = new Worker('./natFilterBankTaggedForward.js')
			miscActors.push(taggedRef)
			taggedRef.onmessage = sysHandle
			var c4 = new MessageChannel()
			integrateRef.postMessage(["link"],[c4.port2])
			taggedRef.postMessage(["config",i],[c4.port1])
			var firFilt2Ref = new Worker('./natFilterBankFirFilter.js')
			miscActors.push(firFilt2Ref)
			firFilt2Ref.onmessage = sysHandle
			var c5 = new MessageChannel()
			taggedRef.postMessage(["link"],[c5.port2])
			firFilt2Ref.postMessage(["config",i + ".2",amountOfColumns],[c5.port1])
			for(var c in F[i]){
				firFilt2Ref.postMessage(["newCoef",F[i][c]])
			}
			firFilt2Ref.postMessage(["configDone"])
			var delayRef = new Worker('./natFilterBankDelay.js')
			miscActors.push(delayRef)
			delayRef.onmessage = sysHandle
			var c6 = new MessageChannel()
			firFilt2Ref.postMessage(["link"],[c6.port2])
			delayRef.postMessage(["config",i + ".2",amountOfColumns - 1],[c6.port1])
			var sampleFiltRef = new Worker('./natFilterBankSampleFilter.js')
			miscActors.push(sampleFiltRef)
			sampleFiltRef.onmessage = sysHandle
			var c7 = new MessageChannel()
			delayRef.postMessage(["link"],[c7.port2])
			sampleFiltRef.postMessage(["config",amountOfColumns],[c7.port1])
			var firFiltRef = new Worker('./natFilterBankFirFilter.js')
			miscActors.push(firFiltRef)
			firFiltRef.onmessage = sysHandle
			var c8 = new MessageChannel()
			sampleFiltRef.postMessage(["link"],[c8.port2])
			firFiltRef.postMessage(["config",i + ".1",amountOfColumns],[c8.port1])
			for(var c in H[i]){
				firFiltRef.postMessage(["newCoef",H[i][c]])
			}
			firFiltRef.postMessage(["configDone"])
			var firstRef = new Worker('./natFilterBankDelay.js')
			miscActors.push(firstRef)
			firstRef.onmessage = sysHandle
			var c9 = new MessageChannel()
			firFiltRef.postMessage(["link"],[c9.port2])
			firstRef.postMessage(["config",i + ".1",amountOfColumns -1],[c9.port1])
			var bankRef = new Worker('./natFilterBankBank.js')
			miscActors.push(bankRef)
			bankRef.onmessage = sysHandle
			var c10 = new MessageChannel()
			var c11 = new MessageChannel()
			integrateRef.postMessage(["link"],[c10.port2])
			firstRef.postMessage(["link"],[c11.port2])
			bankRef.postMessage(["linkFirst"],[c11.port1])
			bankRef.postMessage(["config",i,amountOfColumns],[c10.port1])
			var c12 = new MessageChannel()
			bankRef.postMessage(["link"],[c12.port2])
			branchesRef.postMessage(["newBank"],[c12.port1])
		}
		branchesRef.postMessage(["configDone"])
		var sourceRef = new Worker('./natFilterBankSource.js')
		sourceRef.onmessage = sysHandle
		var c13 = new MessageChannel()
		producerRef.postMessage(["link"],[c13.port2])
		sourceRef.postMessage(["linkProducer"],[c13.port1])
		var c14 = new MessageChannel()
		branchesRef.postMessage(["link"],[c14.port2])
		sourceRef.postMessage(["linkBranches"],[c14.port1])
		sourceRef.postMessage(["configDone"])
		var c15 = new MessageChannel()
		sourceRef.postMessage(["link"],[c15.port2])
		producerRef.postMessage(["config",amountOfSimulations],[c15.port1])
	}

	return function(configs,startCB){
		var amColumns 		= configs[0]
		var amSimulations 	= configs[1]
		var amChannels 		= configs[2]
		construct(amColumns,amSimulations,amChannels,startCB)
	}
})