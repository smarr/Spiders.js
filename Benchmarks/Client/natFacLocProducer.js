var quadRef = 		null
var gridSize = 		null
var numPoints = 	null
var itemsProduced = 	0

function mHandle(event){

	function makePoint(xVal,yVal){
		return {
			x: xVal,
			y: yVal,
		}
	}

	function getRand(upper,lower){
		return Math.floor(Math.random() * (upper - lower) + lower)
	}

	function config(quad,gs,nums){
		quadRef 	= quad
		quadRef.onmessage = mHandle
		gridSize 	= gs
		numPoints 	= nums
		postMessage(["actorInit"])
	}

	function produceConsumer(){
		var xVal 	= getRand(gridSize,0)
		var yVal 	= getRand(gridSize,0)
		var point 	= makePoint(xVal,yVal)
		var chan = new MessageChannel()
		chan.port2.onmessage = mHandle
		quadRef.postMessage(["customerMsg",JSON.stringify(point)],[chan.port1])
		itemsProduced += 1	 
	}

	function nextCustomerMsg(){
		if(itemsProduced < numPoints){
			produceConsumer()
		}
		else{
			quadRef.postMessage(["requestExit"])
			postMessage(["actorExit"])
		}
	}

	switch(event.data[0]){
		case "config":
			config(event.ports[0],event.data[1],event.data[2])
			break;
		case "produceConsumer":
			produceConsumer()
			break;
		case "nextCustomerMsg":
			nextCustomerMsg()
			break;
		default :
			console.log("Unknown message (Producer): " + event.data[0])
	}
}
onmessage = mHandle