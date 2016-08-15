var totalCount =  null
var countsLeft =  null
var countRef = 	null


function mHandler(event){
	function config(countNumber,counter){
		totalCount = countNumber
		countsLeft = countNumber
		countRef = counter
		countRef.onmessage = mHandler
		postMessage(["prodInit"])
	}

	function start(){
		countsLeft = this.totalCount
		countRef.postMessage(["inc",true])
		while(countsLeft > 0){
			countRef.postMessage(["inc",false])
			countsLeft -= 1
		}
	}

	switch(event.data[0]){
		case "config":
			config(event.data[1],event.ports[0])
			break;
		case "start":
			start()
			break;
	}
}

onmessage = mHandler