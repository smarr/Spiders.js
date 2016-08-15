define(function(){
	var construct 	 = function(maxNodes,avgComp,stdComp,binomial,percent,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd = 			null
		var totalSpawned = 		1
		var totalEnded = 		0
		var nodeInfo = {}
		var spawned = []

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == 1){
					configCallback(
						function(be){
							benchEnd 		= be
							rootRef.postMessage(["generateTree"])
						},
						function(){
							rootRef.terminate()
							for(var i in spawned){
								spawned[i].terminate()
							}
						}
					)
				}
			}

			function actorInit(){
				actorsInitialised += 1
				checkConfig()
			}

			function actorExit(){
				actorsExited += 1
				if(actorsExited == totalActors){
					benchEnd()
				}
			}

			function end(){
				benchEnd()
			}

			function spawnNodeP1(root,height,id,comp,urgent,partId){
				nodeInfo[partId] = [root,height,id,comp,urgent]
			}

			function spawnNodeP2(partId,parent){
				var c = new MessageChannel()
				parent.postMessage(["childSpawned"],[c.port1])
				var root 	= nodeInfo[partId][0]
				var height 	= nodeInfo[partId][1]
				var id 	   	= nodeInfo[partId][2]
				var comp 	= nodeInfo[partId][3]
				var urgent 	= nodeInfo[partId][4]
				var nodeRef = new Worker('./natUctNode.js')
				nodeRef.onmessage = sysHandle
				spawned.push(nodeRef)
				nodeRef.onmessage = sysHandle
				nodeRef.postMessage(["link"],[c.port2])
				nodeRef.postMessage(["linkParent"],[parent])
				nodeRef.postMessage(["config",height,id,comp,urgent,binomial],[root])
				nodeRef.postMessage(["tryGenerate"])
				totalSpawned += 1
 			}

			function endNode(id){
				totalEnded += 1
				if(totalEnded == totalSpawned){
					end()
				}
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "actorExit":
					actorExit()
					break;
				case "end":
					end()
					break;
				case "spawnNodeP1":
					spawnNodeP1(event.ports[0],event.data[1],event.data[2],event.data[3],event.data[4],event.data[5])
					break;
				case "spawnNodeP2":
					spawnNodeP2(event.data[1],event.ports[0])
					break;
				case "endNode":
					endNode(event.data[1])
					break;
				default :
					console.log("Unknown message (System): " + event.data[0])
			}
		}

		var rootRef = new Worker('./natUctRoot.js')
		rootRef.onmessage = sysHandle
		rootRef.postMessage(["config",maxNodes,avgComp,stdComp,binomial,percent])
	}

	return function(configs,startCB){
		var maxNodes 	= configs[0]
		var avgComp 	= configs[1]
		var stdComp 	= configs[2]
		var binomial 	= configs[3]
		var percent 	= configs[4]
		construct(maxNodes,avgComp,stdComp,binomial,percent,startCB)

		//setTimeout(function(){
		//},500)
	}
})