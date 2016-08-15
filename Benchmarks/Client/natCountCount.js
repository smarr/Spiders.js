var totalCount =  null
var countSoFar =  null

function mHandler(event){
	function config(countNumber,someRef){
		totalCount = countNumber
		countSoFar = 0
		someRef.onmessage = mHandler
		postMessage(["countInit"])
	}

	function inc(fresh){
		if(fresh){
			countSoFar = 0
		}
		else{
			countSoFar += 1
			if(countSoFar == totalCount){
				postMessage(["countsExhausted"])
			}
		}
	}

	switch(event.data[0]){
		case "config":
			config(event.data[1],event.ports[0])
			break;
		case "inc":
			inc(event.data[1])
			break;
	}
}

onmessage = mHandler