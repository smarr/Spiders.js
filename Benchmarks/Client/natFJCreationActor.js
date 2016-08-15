function mHandler(event){
	function calc(theta){
		var sint 	= Math.sin(theta)
		var res 	= sint * sint
	}

	function newMessage(){
		calc(37.2)
		postMessage(["actorDone"])
	}

	switch(event.data[0]){
		case "newMessage":
			newMessage()
			break;
	}
}

onmessage = mHandler
postMessage(["actorInit"])