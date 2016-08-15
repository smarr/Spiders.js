var totalWorkers = 	0
var workersDone = 	0
function mHandler(event){
	function config(tw){
		totalWorkers = tw
		postMessage(["actorInit"])
	}

	function workerDone(){
		workersDone += 1
		if(workersDone == totalWorkers){
			postMessage(["end"])
		}
	}

	function link(ref){
		ref.onmessage = mHandler
	}

	switch(event.data[0]){
		case "config":
			config(event.data[1])
			break;
		case "workerDone":
			workerDone()
			break;
		case "link":
			link(event.ports[0])
			break;
		default :
			console.log("Unknown message: " + event.data[0])
	}
}
onmessage = mHandler
