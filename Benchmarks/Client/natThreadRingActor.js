var allNeighbours = 	null
var myNeighbour =	null
function mHandler(event){
	function ping(pingsLeft){
		if(pingsLeft > 0){
			pingsLeft = pingsLeft - 1
			myNeighbour.postMessage(["ping",pingsLeft])
		}
		else{
			myNeighbour.postMessage(["stop",allNeighbours])
		}
	}

	function stop(stopsLeft){
		if(stopsLeft > 0){
			stopsLeft = stopsLeft - 1
			myNeighbour.postMessage(["stop",stopsLeft])
		}
		else{
			postMessage(["traversalDone"])
		}
	}

	function neighbour(ref,totalActors){
		myNeighbour 	= ref
		myNeighbour.onmessage = mHandler
		allNeighbours 	= totalActors
		postMessage(["actorInit"])
	}

	function newLink(chanPort){
		chanPort.onmessage = mHandler
	}

	switch(event.data[0]){
		case "ping":
			ping(event.data[1])
			break;
		case "stop":
			stop(event.data[1])
			break;
		case "neighbour":
			neighbour(event.ports[0],event.data[1])
		case "newLink":
			newLink(event.ports[0])
	}
}

onmessage = mHandler