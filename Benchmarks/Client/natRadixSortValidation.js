var dataSize = 		0
var sumSoFar = 		0
var valueSoFar = 	0
var prevValue = 	0
var errorValue1 = 	-1
var errorValue2 =	-1

function mHandle(event){
	function config(ds){
		dataSize = ds
		postMessage(["actorInit"])
	}

	function value(candidate){
		valueSoFar += 1
		if(candidate < prevValue && errorValue1 < 0){
			errorValue2 = candidate
			errorValue1 = valueSoFar - 1 
		}
		prevValue = candidate
		sumSoFar += prevValue	
		if(valueSoFar == dataSize){
			if(this.errorValue1 >= 0){
				//console.log
			}
			else{
				//console.log
			}
			postMessage(["actorExit"])
		}
	}

	function link(ref){
		ref.onmessage = mHandle
	}

	switch(event.data[0]){
		case "config":
			config(event.data[1])
			break;
		case "value":
			value(event.data[1])
			break;
		case "link":
			link(event.ports[0])
			break;
		default :
			console.log("Unknown message: " + event.data[0])
	}
}
onmessage = mHandle