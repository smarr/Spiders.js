var pingRef = null
function mHandler(event){
	function config(pinger){
		pingRef =  pinger
		pingRef.onmessage = mHandler
		postMessage(["pongInit"])
	}

	function ping(){
		pingRef.postMessage(["pong"])
	}

	switch(event.data[0]){
		case "ping":
			ping()
			break;
		case "config":
			config(event.ports[0])
			break;
	}
}

onmessage = mHandler
