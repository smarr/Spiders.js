var count = 0

function mHandle(event){
	function valueMessage(val){
		count += 1
	}

	function link(ref){
		ref.onmessage = mHandle
	}

	switch(event.data[0]){
		case "valueMessage":
			valueMessage(event.data[1])
			break;
		case "link":
			link(event.ports[0])
			break;
		default :
			console.log("Unknown message (Sink): " + event.data[0])
	}
}
onmessage = mHandle
postMessage(["actorInit"])