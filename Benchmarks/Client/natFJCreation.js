define(function(){
	var construct 	 = function(amountOfActors,configCallback){
		var actorsInitialised = 0
		var actorsDone =  		0
		var benchEnd = 			null

		function sysHandler(event){
			function checkConfig(){
				if(actorsInitialised == amountOfActors){
					configCallback(
						function(be){
							benchEnd 		= be
							actorsDone 	= 0
							for(var i in actors){
								actors[i].postMessage(["newMessage"])
							}
						},
						function(){
							for(var i in actors){
								actors[i].terminate()
							}
						}
					)
				}
			}

			function actorInit(){
				actorsInitialised += 1
				checkConfig()
			}

			function actorDone(){
				actorsDone += 1
				if(actorsDone == amountOfActors){
					benchEnd()
				}
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "actorDone":
					actorDone()
					break;
			}	
		}
		var actors = []
		var count = amountOfActors
		while(count > 0){
			var newActor = new Worker('./natFJCreationActor.js')
			newActor.onmessage = sysHandler
			actors.push(newActor)
			count -= 1
		}
	}

	return function(configs,startCB){
		var amActors = configs[0]
		construct(amActors,startCB)
	}
})