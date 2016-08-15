var config 		= {
	//Ping pong 
	pingAmount: 			50000,
	//Count 
	count: 					1000000,
	//Fork join throughput 
	fjThroughputActors: 	20,
	fjThroughputMessages: 	1000,
	//Fork join creation 
	fjCreationActors: 		10,
	//Thread ring 
	threadRingActors: 		20,
	threadRingPings: 		1000,
	//Chameneo 
	chameneoMeetings: 		500,
	chameneoActors: 		10,
	//Big config
	bigActors: 				10,
	bigPings: 				3000,
	//Concurrent Dictionary 
	cDictActors: 			20,
	cDictMsgs: 				500,
	cDictWrite: 			300,
	//Concurrent sorted linked list
	cLinkedListActors: 		10,
	cLinkedListMsgs: 		100,
	cLinkedListWrites: 		10,
	cLinkedListSize: 		10,
	//Producer Consumer
	prodConBuffer: 			50,
	prodConProd: 			5,
	prodConCon: 			5,
	prodConItems: 			100,
	prodConProdCost: 		25,
	prodConConCost: 		25,
	//Philosopher
	philosopherActors: 		10,
	philosopherEating: 		100,
	//Barber
	barberNrHaircuts: 		20,
	barberWaitingRoom: 		100,
	barberProduction: 		500,
	barberHaircut: 			500, 
	//Cigarette Smokers
	cigSmokeRounds: 		500,
	cigSmokeSmokers: 		20,
	//Logistic map
	logMapTerms: 			200,
	logMapSeries: 			9,
	logMapStartRate: 		3.46,
	logMapIncrement:		0.0025,
	//Banking
	bankingAccounts: 		20,
	bankingTransactions: 	500,
	bankingInitialBalance: 	this.bankingAccounts * this.bankingTransactions,
	//Radix sort
	radixSortDataSize: 		500,
	radixSortMaxVal: 		1000,
	//Filter bank
	filterBankColumns: 		8192 * 2,
	filterBankSimulations: 	500,
	filterBankChannels: 	2,
	//Sieve
	sieveLimit: 			100000,
	sieveLocal: 			50000,
	//UCT
	uctMaxNodes: 			20,
	uctAvgCompSize: 		1000,
	uctStdevCompSize: 		500,
	uctBinomial: 			5,
	uctPercent: 			70,
	//Fac loc
	facLocNumPoints: 		10000,
	facLocGridSize: 		500,
	facLocF: 				Math.sqrt(2) * 500,
	facLocAlpha: 			2.0,
	facLocCuttOff: 			3,
	//Trapezoid
	trapezoidPieces: 		1000000,
	trapezoidWorkers: 		20,
	trapezoidLeft: 			1,
	trapezoidRight: 		5,
	//Pi Precision
	piPrecisionWorkers: 	20,
	piPrecisionPrecision: 	5000,
	//Matrix Multiplication
	matMulWorkers: 			20,
	matMulDataLength: 		1024,
	matMulThreshold: 		16384,
	//Quicksort
	quickDataSize: 			5000,
	quickMaxVal: 			1 << 60,
	quickThreshold: 		1000,
	//All pair shortes path
	apspN: 					20,
	apspB: 					5,
	apspW: 					10,
	//Successive over relaxation
	sorRefVal: 				[0.000003189420084871275,0.001846644602759566,0.0032099996270638005,0.0050869220175413146,0.008496328291240363,0.016479973604143234,0.026575660248076397,1.026575660248076397,2.026575660248076397,3.026575660248076397],
	sorDataSizes: 			[2,5,20, 80, 100, 120, 150, 200, 250, 300, 350, 400],
	sorJacobi: 				100,
	sorOmega: 				1.25,
	sorN: 					1,
	//A star search 
	aStarWorkers: 			30,
	aStarThreshold: 		200,
	aStarGridSize: 			5,
	//N queens
	nQueensWorkers: 		20,
	nQueensSize: 			5,
	nQueensThreshold: 		2,
	nQueensSolutions: 		400,
	nQueensPriorities: 		10,
}


var scheduled 	= []
var next 		= function(){
	if(scheduled.length > 0){
		var next = scheduled.pop()
		next()
	}
	else{
		console.log("ALL BENCHMARKS TERMINATED")
	}
}

//Uncomment pairs of benchmark, benchmarks seem to get slower as they go.
var scheduleAll 	= function(){
	/*schedulePingPong()
	scheduleCount()
	scheduleFJThroughput()
	scheduleFJCreation()
	scheduleThreadRing()
	scheduleChameneo()
	scheduleBig()
	scheduleConcDict()
	scheduleLinkedList()
	scheduleProdCon()
	schedulePhilosophers()
	scheduleBarber()
	scheduleCigSmokers()
	scheduleLogMap()
	scheduleBanking()
	scheduleRadixSort()
	scheduleFilterBank()
	scheduleSieve()
	scheduleUCT()
	scheduleFacLoc()
	scheduleTrapezoid()
	schedulePiPrecision()
	scheduleMatMul()
	scheduleQuicksort()
	scheduleApsp()
	scheduleSor()
	scheduleAStar()
	scheduleNQueens()
	scheduleNatPingPong()
	scheduleNatCount()
	scheduleNatFJThroughput()
	scheduleNatFJCreation()
	scheduleNatThreadRing()
	scheduleNatChameneo()
	scheduleNatBig()
	scheduleNatConcDict()
	scheduleNatLinkedList()
	scheduleNatProdCon()
	scheduleNatPhilosophers()
	scheduleNatBarber()
	scheduleNatCigSmokers()
	scheduleNatLogMap()
	scheduleNatBanking()
	scheduleNatRadixSort()
	scheduleNatFilterBank()
	scheduleNatSieve()
	scheduleNatUCT()
	scheduleNatFacLoc()
	scheduleNatTrapezoid()
	scheduleNatPiPrecision()
	scheduleNatMatMul()
	scheduleNatQuicksort()
	scheduleNatApsp()
	scheduleNatSor()
	scheduleNatAStar()
	scheduleNatNQueens()*/
	scheduleBig()
	scheduleNatBig()

}
var scheduleGeneric = function(path,name,args,cycleMessage,completeMessage,scheduleMessage){
	require([path],function(module){
		var bench = function(){
			var stopSystem = null
			var modBench = new Benchmark(name,{
				defer: true,
				async: true,
				fn: function(deffered){
					module(args,function(startFunc,stopFunc){
						stopSystem = stopFunc
						startFunc(function(){
							deffered.resolve()
						})
					})
				},
				teardown: function(){
					stopSystem()
				},
				onCycle: function(){
					console.log(cycleMessage)
				},
				onComplete: function(){
					console.log(completeMessage + this.stats.mean)
					console.log("Error margin: " + this.stats.moe)
					stopSystem()
					next()
				},
			})
			modBench.run()
		}
		scheduled.push(bench)
		console.log(scheduleMessage)
	})
}
var schedulePingPong 		= function(){
	scheduleGeneric('./pingPong','PingPong',[config.pingAmount],"Ping pong cycle completed","Ping pong completed. Mean: ","Ping pong scheduled")
}
var scheduleCount 			= function(){
	scheduleGeneric('./count','Count',[config.count],'Count cycle completed','Count completed. Mean: ','Count scheduled')
}
var scheduleFJThroughput 	= function(){
	scheduleGeneric('./FJThroughput','FJThroughput',[config.fjThroughputActors,config.fjThroughputMessages],'Fork join throughput cycle completed','Fork join throughput completed. Mean: ','Fork join throughput scheduled')
}
var scheduleFJCreation 		= function(){
	scheduleGeneric('./FJCreation','FJCreation',[config.fjCreationActors],'Fork join creation cycle completed','Fork join creation completed. Mean: ','Fork join creation scheduled')
}
var scheduleThreadRing 		= function(){
	scheduleGeneric('./threadRing','ThreadRing',[config.threadRingActors,config.threadRingPings],'Thread ring cycle completed','Thread ring completed. Mean: ','Thread ring scheduled')
}
var scheduleChameneo 		= function(){
	scheduleGeneric('./chameneo','Chameneo',[config.chameneoActors,config.chameneoMeetings],'Chameneo cycle completed','Chameneo completed. Mean: ' ,'Chameneo scheduled')
}
var scheduleBig 			= function(){
	scheduleGeneric('./big','Big',[config.bigActors,config.bigPings],'Big cycle completed','Big completed. Mean: ','Big scheduled')
}
var scheduleConcDict 		= function(){
	scheduleGeneric('./cDict','ConcDict',[config.cDictActors,config.cDictMsgs,config.cDictWrite],'Concurrent Dictionary cycle completed','Concurrent Dictionary completed. Mean: ','Concurrent Dictionary scheduled')
}
var scheduleLinkedList 		= function(){
	scheduleGeneric('./cLinkedList','Linked List',[config.cLinkedListActors,config.cLinkedListMsgs,config.cLinkedListWrites,config.cLinkedListSize],'Linked List cycle completed','Linked list completed. Mean: ','Linked Link scheduled')
}
var scheduleProdCon 		= function(){
	scheduleGeneric('./prodCon','Producer Consumer',[config.prodConBuffer,config.prodConProd,config.prodConCon,config.prodConItems,config.prodConProdCost,config.prodConConCost],'Producer Consumer cycle completed','Producer Consumer completed. Mean: ','Producer Consumer scheduled')
}
var schedulePhilosophers 	= function(){
	scheduleGeneric('./philosopher','Dining Philosophers',[config.philosopherActors,config.philosopherEating],'Dining Philosopher cycle completed','Dining Philosophers completed. Mean: ','Dining Philosophers scheduled')
}
var scheduleBarber 			= function(){
	scheduleGeneric('./barber','Sleeping Barber',[config.barberNrHaircuts,config.barberWaitingRoom,config.barberProduction,config.barberHaircut],'Sleeping Barber cycle completed','Sleeping Barber completed. Mean: ','Sleeping Barber scheduled')
}
var scheduleCigSmokers 		= function(){
	scheduleGeneric('./cigSmoke','Cigarette Smokers',[config.cigSmokeRounds,config.cigSmokeSmokers],'Cigarette Smokers cycle completed','Cigarette Smokers completed. Mean: ','Cigarette Smokers scheduled')
}
var scheduleLogMap 			= function(){
	scheduleGeneric('./logMap','Logistic Map',[config.logMapTerms,config.logMapSeries,config.logMapStartRate,config.logMapIncrement],'Logistic Map cycle completed','Logistic Map completed. Mean: ','Logistic Map scheduled')
}
var scheduleBanking 		= function(){
	scheduleGeneric('./banking','Bank Transaction',[config.bankingAccounts,config.bankingTransactions,config.bankingInitialBalance],'Banking Transactions cycle completed','Banking Transactions completed. Mean: ','Banking Transactions scheduled')
}
var scheduleRadixSort		= function(){
	scheduleGeneric('./radixSort','Radix Sort',[config.radixSortDataSize,config.radixSortMaxVal],'Radix Sort cycle completed','Radix Sort completed. Mean: ','Radix Sort scheduled')
}
var scheduleFilterBank 		= function(){
	scheduleGeneric('./filterBank','Filter Bank',[config.filterBankColumns,config.filterBankSimulations,config.filterBankChannels],'Filter Bank cycle completed','Filter Bank completed. Mean: ','Filter Bank scheduled')
}
var scheduleSieve 			= function(){
	scheduleGeneric('./sieve','Sieve',[config.sieveLimit,config.sieveLocal],'Sieve cycle completed','Sieve completed. Mean: ', 'Sieve scheduled')
}
var scheduleUCT 			= function(){
	scheduleGeneric('./uct','UCT',[config.uctMaxNodes,config.uctAvgCompSize,config.uctStdevCompSize,config.uctBinomial,config.uctBinomial],'UCT cycle completed','UCT completed. Mean: ','UCT scheduled')
}
var scheduleFacLoc 			= function(){
	scheduleGeneric('./facloc','Fac Loc',[config.facLocNumPoints,config.facLocGridSize,config.facLocF,config.facLocAlpha,config.facLocCuttOff],'Fac loc cycle completed','Fac Loc completed. Mean: ' ,'Fac loc scheduled')
}
var scheduleTrapezoid 		= function(){
	scheduleGeneric('./trapezoid','Trapezoid',[config.trapezoidPieces,config.trapezoidWorkers,config.trapezoidLeft,config.trapezoidRight],'Trapezoid cycle completed','Trapezoid completed. Mean: ','Trapezoid scheduled')
}
var schedulePiPrecision 	= function(){
	scheduleGeneric('./precisePi','Pi Precision',[config.piPrecisionWorkers,config.piPrecisionPrecision],'Pi Precision cycle completed','Pi Precision completed. Mean: ','Pi Precision scheduled')
}
var scheduleMatMul 			= function(){
	scheduleGeneric('./matMul','Matrix Multiplication',[config.matMulWorkers,config.matMulDataLength,config.matMulThreshold],'Matrix Multiplication cycle completed','Matrix Multiplication completed. Mean: ','Matrix multiplication scheduled')
}
var scheduleQuicksort 		= function(){
	scheduleGeneric('./quicksort','Quick Sort',[config.quickDataSize,config.quickMaxVal,config.quickThreshold],'Quicksort cycle completed','Quicksort completed. Mean: ','Quicksort scheduled')
}
var scheduleApsp 			= function(){
	scheduleGeneric('./apsp','All pair shortest path',[config.apspN,config.apspB,config.apspW],'All pair shortest path cycle completed','All pair shortes path completed. Mean: ','All pair shortest path scheduled')
}
var scheduleSor 			= function(){
	scheduleGeneric('./sor','Successive over relaxation',[config.sorRefVal,config.sorDataSizes,config.sorJacobi,config.sorOmega,config.sorN],'Successive over relaxation cycle completed','Successive over relaxation completed. Mean: ','Successive over relaxation scheduled')
}
var scheduleAStar 			= function(){
	scheduleGeneric('./astar','A Star Search',[config.aStarWorkers,config.aStarThreshold,config.aStarGridSize],'A star search cycle completed','A star search completed. Mean: ','A star search scheduled')
}
var scheduleNQueens 		= function(){
	scheduleGeneric('nQueens','N Queens',[config.nQueensWorkers,config.nQueensSize,config.nQueensThreshold,config.nQueensSolutions,config.nQueensPriorities],'N Queens cycle completed','N Queens completed. Mean: ' ,'N queens scheduled')
}
var scheduleNatPingPong 		= function(){
	scheduleGeneric('../Client/natPingPong','Native PingPong',[config.pingAmount],"Native Ping pong cycle completed","Native Ping pong completed. Mean: ","Native Ping pong scheduled")
}
var scheduleNatCount 			= function(){
	scheduleGeneric('../Client/natCount','Native Count',[config.count],'Native Count cycle completed','Native Count completed. Mean: ','Native Count scheduled')
}
var scheduleNatFJThroughput 	= function(){
	scheduleGeneric('../Client/natFJThroughput','Native FJThroughput',[config.fjThroughputActors,config.fjThroughputMessages],'Native Fork join throughput cycle completed','Native Fork join throughput completed. Mean: ','Native Fork join throughput scheduled')
}
var scheduleNatFJCreation 		= function(){
	scheduleGeneric('../Client/natFJCreation','Native FJCreation',[config.fjCreationActors],'Native Fork join creation cycle completed','Native Fork join creation completed. Mean: ','Native Fork join creation scheduled')
}
var scheduleNatThreadRing 		= function(){
	scheduleGeneric('../Client/natThreadRing','Native ThreadRing',[config.threadRingActors,config.threadRingPings],'Native Thread ring cycle completed','Native Thread ring completed. Mean: ','Native Thread ring scheduled')
}
var scheduleNatChameneo 		= function(){
	scheduleGeneric('../Client/natChameneo','Native Chameneo',[config.chameneoActors,config.chameneoMeetings],'Native Chameneo cycle completed','Nativie Chameneo completed. Mean: ' ,'Native Chameneo scheduled')
}
var scheduleNatBig 			= function(){
	scheduleGeneric('../Client/natBig','Native Big',[config.bigActors,config.bigPings],'Native Big cycle completed','Native Big completed. Mean: ','Native Big scheduled')
}
var scheduleNatConcDict 		= function(){
	scheduleGeneric('../Client/natCDict','Native ConcDict',[config.cDictActors,config.cDictMsgs,config.cDictWrite],'Native Concurrent Dictionary cycle completed','Native Concurrent Dictionary completed. Mean: ','Native Concurrent Dictionary scheduled')
}
var scheduleNatLinkedList 		= function(){
	scheduleGeneric('../Client/natCLinkedList','Native Linked List',[config.cLinkedListActors,config.cLinkedListMsgs,config.cLinkedListWrites,config.cLinkedListSize],'Native Linked List cycle completed','Native Linked list completed. Mean: ','Native Linked Link scheduled')
}
var scheduleNatProdCon 		= function(){
	scheduleGeneric('../Client/natProdCon','Native Producer Consumer',[config.prodConBuffer,config.prodConProd,config.prodConCon,config.prodConItems,config.prodConProdCost,config.prodConConCost],'Native Producer Consumer cycle completed','Native Producer Consumer completed. Mean: ','Native Producer Consumer scheduled')
}
var scheduleNatPhilosophers 	= function(){
	scheduleGeneric('../Client/natPhilosophers','Native Dining Philosophers',[config.philosopherActors,config.philosopherEating],'Native Dining Philosopher cycle completed','Native Dining Philosophers completed. Mean: ','Native Dining Philosophers scheduled')
}
var scheduleNatBarber 			= function(){
	scheduleGeneric('../Client/natBarber','Native Sleeping Barber',[config.barberNrHaircuts,config.barberWaitingRoom,config.barberProduction,config.barberHaircut],'Native Sleeping Barber cycle completed','Native Sleeping Barber completed. Mean: ','Native Sleeping Barber scheduled')
}
var scheduleNatCigSmokers 		= function(){
	scheduleGeneric('../Client/natCigSmoke','Native Cigarette Smokers',[config.cigSmokeRounds,config.cigSmokeSmokers],'Native Cigarette Smokers cycle completed','Native Cigarette Smokers completed. Mean: ','Native Cigarette Smokers scheduled')
}
var scheduleNatLogMap 			= function(){
	scheduleGeneric('../Client/natLogMap','Native Logistic Map',[config.logMapTerms,config.logMapSeries,config.logMapStartRate,config.logMapIncrement],'Native Logistic Map cycle completed','Native Logistic Map completed. Mean: ','Native Logistic Map scheduled')
}
var scheduleNatBanking 		= function(){
	scheduleGeneric('../Client/natBanking','Native Bank Transaction',[config.bankingAccounts,config.bankingTransactions,config.bankingInitialBalance],'Native Banking Transactions cycle completed','Native Banking Transactions completed. Mean: ','Native Banking Transactions scheduled')
}
var scheduleNatRadixSort		= function(){
	scheduleGeneric('../Client/natRadixSort','Native Radix Sort',[config.radixSortDataSize,config.radixSortMaxVal],'Native Radix Sort cycle completed','Native Radix Sort completed. Mean: ','Native Radix Sort scheduled')
}
var scheduleNatFilterBank 		= function(){
	scheduleGeneric('../Client/natFilterBank','Native Filter Bank',[config.filterBankColumns,config.filterBankSimulations,config.filterBankChannels],'Native Filter Bank cycle completed','Native Filter Bank completed. Mean: ','Native Filter Bank scheduled')
}
var scheduleNatSieve 			= function(){
	scheduleGeneric('../Client/natSieve','Native Sieve',[config.sieveLimit,config.sieveLocal],'Native Sieve cycle completed','Native Sieve completed. Mean:', 'Native Sieve scheduled')
}
var scheduleNatUCT 			= function(){
	scheduleGeneric('../Client/natUct','Native UCT',[config.uctMaxNodes,config.uctAvgCompSize,config.uctStdevCompSize,config.uctBinomial,config.uctBinomial],'Native UCT cycle completed','Native UCT completed. Mean: ','Native UCT scheduled')
}
var scheduleNatFacLoc 			= function(){
	scheduleGeneric('../Client/natFacloc','Native Fac Loc',[config.facLocNumPoints,config.facLocGridSize,config.facLocF,config.facLocAlpha,config.facLocCuttOff],'Native Fac loc cycle completed','Native Fac Loc completed. Mean: ' ,'Native Fac loc scheduled')
}
var scheduleNatTrapezoid 		= function(){
	scheduleGeneric('../Client/natTrapezoid','Native Trapezoid',[config.trapezoidPieces,config.trapezoidWorkers,config.trapezoidLeft,config.trapezoidRight],'Native Trapezoid cycle completed','Native Trapezoid completed. Mean: ','Native Trapezoid scheduled')
}
var scheduleNatPiPrecision 	= function(){
	scheduleGeneric('../Client/natPrecisePi','Native Pi Precision',[config.piPrecisionWorkers,config.piPrecisionPrecision],'Native Pi Precision cycle completed','Native Pi Precision completed. Mean: ','Native Pi Precision scheduled')
}
var scheduleNatMatMul 			= function(){
	scheduleGeneric('../Client/natMatMul','Native Matrix Multiplication',[config.matMulWorkers,config.matMulDataLength,config.matMulThreshold],'Native Matrix Multiplication cycle completed','Native Matrix Multiplication completed. Mean: ','Native Matrix multiplication scheduled')
}
var scheduleNatQuicksort 		= function(){
	scheduleGeneric('../Client/natQuicksort','Native Quick Sort',[config.quickDataSize,config.quickMaxVal,config.quickThreshold],'Native Quicksort cycle completed','Native Quicksort completed. Mean: ','Native Quicksort scheduled')
}
var scheduleNatApsp 			= function(){
	scheduleGeneric('../Client/natApsp','Native All pair shortest path',[config.apspN,config.apspB,config.apspW],'Native All pair shortest path cycle completed','Native All pair shortes path completed. Mean: ','Native All pair shortest path scheduled')
}
var scheduleNatSor 			= function(){
	scheduleGeneric('../Client/natSor','Native Successive over relaxation',[config.sorRefVal,config.sorDataSizes,config.sorJacobi,config.sorOmega,config.sorN],'Native Successive over relaxation cycle completed','Native Successive over relaxation completed. Mean: ','Native Successive over relaxation scheduled')
}
var scheduleNatAStar 			= function(){
	scheduleGeneric('../Client/natAstar','Native A Star Search',[config.aStarWorkers,config.aStarThreshold,config.aStarGridSize],'Native A star search cycle completed','Native A star search completed. Mean: ','Native A star search scheduled')
}
var scheduleNatNQueens 		= function(){
	scheduleGeneric('../Client/natNQueens','Native N Queens',[config.nQueensWorkers,config.nQueensSize,config.nQueensThreshold,config.nQueensSolutions,config.nQueensPriorities],'Native N Queens cycle completed','Native N Queens completed. Mean: ' ,'Native N queens scheduled')
}
$("#runButton").on('click',function(){
	console.log("Scheduled benchmarks: " + scheduled.length)
	next()
})
scheduleAll()

