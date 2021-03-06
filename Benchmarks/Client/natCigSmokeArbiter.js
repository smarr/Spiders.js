var totalRounds = 	0
var currentRounds = 	0
var totalSmokers =	0
var smokers = 		[]

function mHandle(event){
	function config(tr,ts){
		totalRounds 	= tr
		totalSmokers 	= ts
	}

	function newSmoker(smokerRef){
		smokers.push(smokerRef)
		smokerRef.onmessage = mHandle
		if(smokers.length == totalSmokers){
			postMessage(["actorInit"])
		}
	}

	function getRandom(upper){
		return Math.floor(Math.random() * (upper - 0) + 0)
	}

	function pickRandom(){
		var index = getRandom(this.totalSmokers)
		var time  = getRandom(1000)
		smokers[index].postMessage(["startSmoking",time])
	}

	function startedSmoking(){
		currentRounds += 1
		if(currentRounds >= totalRounds){
			postMessage(["end"])
		}
		else{
			pickRandom()
		}
	}

	switch(event.data[0]){
		case "config":
			config(event.data[1],event.data[2])
			break;
		case "newSmoker":
			newSmoker(event.ports[0])
			break;
		case "pickRandom":
			pickRandom()
			break;
		case "startedSmoking":
			startedSmoking()
			break;
		default :
			console.log("Unknown message: " + event.data[0])
	}
}
onmessage = mHandle