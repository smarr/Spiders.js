var sinkRef = null
var sum =	 0

function mHandle(event){
	function config(sink){
		sinkRef = sink
		sinkRef.onmessage = mHandle
		postMessage(["actorInit"])
	}

	function link(ref){
		ref.onmessage = mHandle
	}

	function newVal(val){
		sum += val
	}

	function valEnd(){
		sinkRef.postMessage(["valueMessage",sum])
		sum = 0
	}

	switch(event.data[0]){
		case "config":
			config(event.ports[0])
			break;
		case "link":
			link(event.ports[0])
			break;
		case "newVal":
			newVal(event.data[1])
			break;
		case "valEnd":
			valEnd()
			break;
		default :
			console.log("Unknown message (Combine): " + event.data[0])
	}
}
onmessage = mHandle