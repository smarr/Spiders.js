var dataSize = 	0
var maxValue = 	0

function mHandle(event){
	function config(ds,mv){
		dataSize = ds
		maxValue = mv
		postMessage(["actorInit"])
	}

	function getRandom(upper){
		return Math.floor(Math.random() * (upper - 0) + 0)
	}

	function nextActor(nextRef){
		var i = 0
		while(i < dataSize){
			var candidate = getRandom(100000) % maxValue
			nextRef.postMessage(["value",candidate])
			i++
		}
		postMessage(["actorExit"])
	}

	switch(event.data[0]){
		case "config":
			config(event.data[1],event.data[2])
			break;
		case "nextActor":
			nextActor(event.ports[0])
			break;
		default :
			console.log("Unknown message: " + event.data[0])
	}
}
onmessage = mHandle