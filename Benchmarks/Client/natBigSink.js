var totalNeighbours = 0
var neighbours = []
var exited = 0

function mHandler(event){
	function neighbour(ref,totalAmount){
		totalNeighbours = totalAmount
		ref.onmessage = mHandler
		neighbours.push(ref)
		if(neighbours.length == totalAmount){
			postMessage(["actorInit"])
		}
	}

	function exit(){
		exited += 1
		if(exited == totalNeighbours){
			postMessage(["end"])
		}
	}
	switch(event.data[0]){
		case "neighbour":
			neighbour(event.ports[0],event.data[1])
			break;
		case "exit":
			exit()
			break;
		default :
			console.log("Unknown message in sink: " + event.data[0])
	}
}

onmessage = mHandler