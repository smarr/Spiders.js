var totalAmMess = 	null
var currentAmMess =  null

function mHandler(event){
	function config(amMess){
		totalAmMess 	= amMess
		currentAmMess 	= 0
		postMessage(["actorInit"])
	}

	function calc(theta){
		var sint 	= Math.sin(theta)
		var res 	= sint * sint
	}

	function newMessage(fresh){
		if(fresh){
			currentAmMess = 0
		}
		else{
			currentAmMess += 1
			calc(37.2)
			if(currentAmMess == totalAmMess){
				postMessage(["actorDone"])
			}
		}
	}

	switch(event.data[0]){
		case "config":
			config(event.data[1])
			break;
		case "newMessage":
			newMessage(event.data[1])
			break;
	}
}


onmessage = mHandler