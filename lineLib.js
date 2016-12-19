/*

Constructs a Line Graph instance and appends itself onto the calling container

*/

function createLineGraph(containerName, cells, dataInterval, start, animations) {

	// D3 plot basics for drawing axes found here:
	// http://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337

	var context;
	var canvas;
	
	var reportingCells = cells.slice(0);
	
	var width, height, oldw, oldh;
	var Data_url;
	
	var marginTop, marginBottom, marginLeft, marginRight,
		yAxisBuffer;
	
	var svg;
	
	var xDomain, yDomain;
	var xAxis, yAxis;
	var numberOfXTicks;
	var numberOfYTicks;

	var pendingData = [];
	var data = [];
	var pastData = [];
	var forwardData = [];

	var pendingDeletion = [];
	var pendingAddition = [];

	var dataBuffer = 3;
	
	var g;
	var line;
	var graphID = parseInt(containerName.split("GRAPH")[1])
	var svgID = "GRAPH"+graphID+"_SVG";
	var slider = $("#GRAPH"+graphID+"-slider");
	
	var transitionDuration = dataInterval;
	
	var svgDocument;
	var serializer;
	
	var svg_str;
	
	var encoder;
	var transitionsOn = animations;
	
	var domainStart = start - transitionDuration*100;
	var domainEnd = start;
	var difference = 0;
	var domainInterval, domainBuffer, domainBufferScale = .2;
	var latestTimeValue;
	var tickTime, differenceInPercent, oldTime;
	
	var lines;
	var pauseDataUpdate = false;
	var allowAlternateAnimation = false;
	var drawing = false;
	var captureFormat = "GIF";
	
	var recordTimer = -1;
	var numberOfSlides;
	
	var indexOflineRecentlyDeleted;
	var zoomModifier = 0.1;
	var zoomClicked = false;
	
	var updating = true;
	var upToDate = true;
	var paused = false;
	
	var init = function(){
		
		initDimensions();

		marginTop = 10;
		marginBottom = 17;
		marginLeft = 40;
		marginRight = 20;
		yAxisBuffer = 20;

		svg = d3.select(containerName)
			.append("svg")
			.attr("class", svgID)
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("xmlns", "http://www.w3.org/2000/svg");




//		xDomain = d3.scale.linear().domain([domainStart, domainEnd]).range([marginLeft, width-marginRight]);
//		yDomain = d3.scale.linear().domain([80, 0]).range([marginTop, height-marginBottom]);
			
//		xAxis = d3.svg.axis().scale(xDomain).orient("bottom");
//		yAxis = d3.svg.axis().scale(yDomain).orient("left");

		recalculateXDomain();
		recalculateYDomain();
		
		svg.append("rect")
			.attr("id", "graph"+graphID+"_whitebg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", "white")
			.attr("visibility", "hidden");	
			


		svg.append("g")
			.attr("id", "graph" + graphID+"-xaxis")
			.attr("class", "axis xaxis")
			.attr("transform", "translate(0, "+(height-marginBottom)+")")
			.call(xAxis)
			.selectAll("path, line")
			.style("fill", "none")
			.style("stroke", "#eee");
		

		// simple plot basics using D3, help found here:
		//http://bl.ocks.org/bunkat/2595950


		reportingCells.forEach(function(d,i){
			data[i] = [];
			pastData[i] = [];
			forwardData[i] = [];
		});
		

		line = d3.svg.line()
			.interpolate("linear")
			.x(function(d, i) { return xDomain(d[0]); })
			.y(function(d, i) { return yDomain(d[1]); });
		  
		lines = svg.append("svg:g")
				.attr("class", "lines")
			.selectAll("path")
				.data(data);
		
		g = lines.enter().append("path")
			.attr("id", function(d,i){
				return "line-"+graphID+"-"+reportingCells[i];
			})
			.attr("class", "line")
			.attr("d", line)
			.style("fill", "none")
			.style("stroke", "#000")
			.style("stroke-width", "1.5px");
			
		svg.append("rect")
			.attr("id", "graph"+graphID+"_whiteBgYaxisLeft")
			.attr("width", (marginLeft-yAxisBuffer)+"px")
			.attr("height", "100%")
			.attr("fill", "white");

		svg.append("g")
			.attr("class", "axis yaxis")
			.attr("transform", "translate("+(marginLeft-yAxisBuffer)+", 0)")
			.call(yAxis)
			.selectAll("path, line")
			.style("fill", "none")
			.style("stroke", "#eee");
			
		svg.selectAll("text")
			.style("font-family", "sans-serif")
			.style("font-size", "11px");
		
		//$("#"+graphID+"-xaxis").attr("visibility","hidden");
		
		calculateDomainInterval();

	}
	
	var initDimensions = function(){
		width = $(containerName).width();
		height = $(containerName).height();
	}
	
	var calculateDomainInterval = function(){
		var domainDifference = domainEnd - domainStart;
		domainBuffer = domainDifference * domainBufferScale;
		domainInterval = domainDifference + domainBuffer;
	}

	var recalculateXDomain = function(){
		numberOfXTicks = width/100;

//		xDomain = d3.scale.linear().domain([domainStart, domainEnd]).range([marginLeft, width-marginRight]);
		xDomain = d3.time.scale().domain([domainStart, domainEnd]).range([marginLeft, width-marginRight]);
		xAxis = d3.svg.axis().scale(xDomain).orient("bottom").tickFormat(d3.time.format("%X")).ticks(numberOfXTicks);
	}

	var recalculateYDomain = function(){
		numberOfYTicks = height/20;
/*
		var domainInputMax = (function(){
					var maximum = d3.max(data.map(function(subArray){
						return d3.max(subArray.map(function(element){
							return (typeof element[1] == "undefined") ? 0 : element[1];
						}))
					}))
					return typeof maximum == "undefined" ? 0 : maximum;
				})();
*/


		var values = [];

		data.forEach(function(subArray){
			subArray.forEach(function(element){
				values.push(element[1]);
			});
		});

		var minAndMax = d3.extent(values);
		var domainInput = typeof minAndMax[0] == "undefined" ? [0, 0] : minAndMax;
//console.log("y scale: " + domainInput);

//		console.log(domainInput + " , length: " + values.length);

		yDomain = d3.scale
			.linear()
			.domain([domainInput[1], domainInput[0]])
			.range([marginTop, height-marginBottom]);

		yAxis = d3.svg.axis().scale(yDomain).orient("left").ticks(numberOfYTicks);

	}
	
	var setDimensions = function(){
		/*
		 * the Dimensions are set to the current width and height global variables.
		 * unless they are changed, dimensions stay the same
		 */

		recalculateYDomain();

		if((oldh-height)!=0){
		
			svg.selectAll(".yaxis")
				.call(yAxis);
				
				
			svg.selectAll("g .axis.xaxis")
				.transition()
				.duration(transitionDuration)
				.ease("linear")
				.call(xAxis);
				
			svg.selectAll(".xaxis")
				.attr("transform", "translate(0, "+(height-marginBottom)+")");
			if(paused)
				redrawLinesOnce();
		}
	}

	this.getDimensions = function(){
		return [domainStart, domainEnd];
	}

	this.manuallySetDimensions = function(start, end){
//		if(isSliderAtEnd())
//			slider.slider("option", "max", domainEnd);

		updating = false;

		domainStart = start;
		domainEnd = end;

		calculateDomainInterval();
		recalculateXDomain();
		recalculateYDomain();
		redrawXAxis(true);
//		updateSlider();
	}
	
	/*
	Detects if the user has changed the dimensions of the graph
	e.g. expanding up or expanding down
	*/
	var dimensionsChanged = function(){
		oldw = width;
		oldh = height;
		
		// refresh width and height variables
		initDimensions();
		
		if(oldw-width != 0 || oldh-height != 0)
			return true;
		else
			return false;
	}
	
	var updateDomain = function(){
		

		if(latestTimeValue >= domainEnd)
//			difference = (latestTimeValue-Math.min(5,domainInterval*.1))-domainEnd;
			difference = latestTimeValue - domainEnd;

//		console.log(difference);

		
//console.log("GRAPH: " + difference);
		if(typeof latestTimeValue != 'undefined' && updating){
			if(difference < 0){
				difference *= Math.pow((Math.exp(difference*.001)-1), 2);
				upToDate = true;
			}/*
			else if(difference < domainInterval && upToDate){
				difference *= .1;
			}*/
			else{
//console.log(Math.pow((Math.exp(-difference*.001)-1), 2));

				difference *= Math.pow((Math.exp(-difference*.001)-1), 2);
				upToDate = true;
			}
		}
		
		if(!updating){
			difference = 0;
		}

		domainEnd += transitionDuration + difference;
		domainStart += transitionDuration + difference;
		
		/*
		 * If the SVG set representing the x axis ticks exceed a certain range,
		 * remove those ticks. Otherwise the x axis extends indefinitely.
		 */

		for(var k=0;$("#graph"+graphID+"-xaxis").children().length > 20; k++){
			$("#graph"+graphID+"-xaxis g:first-child").remove();
		}
	}

	var updateData = function(i){

		if(updating){
			var temp;
			while(forwardData[i].length > 0){
				temp = forwardData[i].shift();

				data[i].push(temp);
			}
		}
	}
	
	/*
	finds the time value of the very left hand side of the graph
	and returns it
	*/
	var findLowerBound = function(dataSet){
		var lowerBound = null;

		if(data[dataSet].length > 0){
			if(data[dataSet][0].length == 2)
				lowerBound = data[dataSet][0][0];
		}
					
		return lowerBound;
	};
	
	/*
	finds the time value of the very right hand side of the graph
	and returns it
	*/
	var findUpperBound = function(dataSet){
		var upperBound = null;
	
		if(data[dataSet].length > 0)
			if(data[dataSet][0].length == 2)
				upperBound = data[dataSet][data[dataSet].length - 1][0];

		return upperBound;
	};
	
	/*
	for the current graph, finds the maximum length of the dataset
	given in the parameter. The number of data sets in the parameter
	could be more than one, and finds the maximum of them
	*/
	var getDataMaxLength = function(sampleDataSet){
		var maxLength = 0;
		
		sampleDataSet.forEach(function(d,i){
			if(d.length > maxLength)
				maxLength = d.length;
		});
		return maxLength;
	}
	
	var clipGraph = function(i){
		var lowerBound, upperBound;
		/*
		Clip extra data from the graph on the left side
		*/
			lowerBound = findLowerBound(i);

			while(lowerBound < domainStart - domainBuffer && lowerBound != null){
				temp = data[i].shift();
				pastData[i].push(temp);
				lowerBound = findLowerBound(i);
			}

		
		/*
		If the graph needs data on the left side, then add that data on the left side
		until the graph fills the desired boundaries
		*/
		if(getDataMaxLength(pastData) > 0){

				var temp;
				lowerBound = findLowerBound(i);
				while(lowerBound > domainStart - dataBuffer && pastData[i].length > 0){
					temp = pastData[i].pop();
					data[i].unshift(temp);
					lowerBound = findLowerBound(i);
				}
		}
		
		/*
		Clip extra data from the graph on the right side
		*/

			upperBound = findUpperBound(i);
			
			while(upperBound > domainEnd + domainBuffer && upperBound != null){
				temp = data[i].pop();
				forwardData[i].unshift(temp);
				upperBound = findUpperBound(i);
			}

		
		/*
		If the graph needs data on the right side, then add that data on the right side
		until the graph fills the desired boundaries
		*/
		if(getDataMaxLength(forwardData) > 0){

				var temp;
//			console.log(upperBound + " " + domainEnd + " " + (domainEnd + domainBuffer));
				upperBound = findUpperBound(i);
				while(upperBound < domainEnd + domainBuffer && forwardData[i].length > 0){
					temp = forwardData[i].shift();
					data[i].push(temp);
					upperBound = findUpperBound(i);
				}

		}
		
	};

	var times = [];

	var tick = function (){
	
		/*
		Used for timing purposes
		*/
		var d = new Date().getTime();
		tickTime = d-oldTime;
		oldTime = d;
		differenceInPercent = (tickTime-transitionDuration)/transitionDuration;
//transitionDuration = tickTime;

		times.push(tickTime);

		while(times.length > 60)
			times.shift();

		var sum = times.reduce(function(a,b){
			return a + b;
		});

		var average = sum/times.length;

//		console.log("GRAPH: " + transitionDuration + " " + tickTime + " " + average + " " + times.length);


		
		if(recordTimer >= 0)
			recordTick(captureFormat);

		updateDomain();

//		console.log("P: " + pastData.length + ", D: " + data.length + ", F: " +forwardData.length + ", R: " + reportingCells);

		if(pendingDeletion.length > 0){
			pendingDeletion.forEach(function(d,i){
				deleteLine(d);
			});
			pendingDeletion = [];
		}


		if(pendingAddition.length > 0){
			pendingAddition.forEach(function(d,i){
				addLine(d);
			});
			pendingAddition = [];
		}
/*
		var test = [];
		forwardData.forEach(function(d,i){
			test.push(i);
		});

		console.log(pastData.length + " " + data.length + " " + forwardData.length + " " + pendingData.length);
*/


		recalculateXDomain();
		recalculateYDomain();

		redrawXAxis(transitionsOn);



		/*
		updateData();
		clipGraph();
		*/
//		updateSlider();
	
		/*
		 * Cut off the tail of each data set and push them into past data
		 * so as to make sure the currently refreshing data set is within
		 * the domain interval
		 */
		

	}
	
	
	var redrawLinesOnce = function(){

		recalculateXDomain();
		recalculateYDomain();

		g.attr("d", line)
			.attr("transform", null);

		svg.selectAll(".xaxis")
			.call(xAxis);

		svg.selectAll(".yaxis")
			.call(yAxis);

	}

	var redrawLines = function(transitions, lineID){
		/*
		The shiftModifier variable is meant to dictate the movement of the graph
		such that it will not shift given an event (like paused)
		*/
		/*
		var shiftModifier;
		var s;
		if(paused){
			shiftModifier = 0;
			paused = false;
			}
		else
			shiftModifier = 1 + difference;
						s = new Date().getTime()

		if(transitions)
		{
			g.attr("d", line)
				.attr("transform", null)
			.transition()
				.duration(transitionDuration)
				.ease("linear")
				.attr("transform", "translate(" + (xDomain(-1)-xDomain(0))*shiftModifier + ")")
				.each("end", function(d,i){
					if(!paused){
						redrawLines(transitionsOn, i);
						
						if(i==0){
							tick();
						}
					}
					
				});
		}
		else
		{
			g.attr("d", line)
				.attr("transform", null)
			.transition()
				.duration(0)
				.delay(transitionDuration)
				.ease("linear")
				.attr("transform", "translate(" + (xDomain(-1)-xDomain(0))*shiftModifier + ")")
				.each("end", function(d,i){
					if(!paused){
						redrawLines(transitionsOn);
						if(i==0)
							tick();
					}
				});
		}*/
	}
	var doneTransitions;
	var redrawXAxis = function(transitions){

		doneTransitions = 0;

		if(transitions){
		
			g.transition()
				.duration(transitionDuration)
				.ease("linear")
				.attr("d", line)
				.each("end", function(d,i){
					if(!paused){

						updateData(i);
						clipGraph(i);

						d3.select(this)
							.attr("d", line);

						doneTransitions++;

						if(doneTransitions >= reportingCells.length){
							doneTransitions = 0;
							tick();
						}

					}
					else{
						clipGraph(i);

						d3.select(this)
							.attr("d", line)
							.attr("transform", null);
					}
				});

			svg.selectAll(".xaxis")
				.transition()
				.duration(transitionDuration)
				.ease("linear")
				.call(xAxis);

			svg.selectAll(".yaxis")
				.transition()
				.duration(transitionDuration)
				.ease("linear")
				.call(yAxis);
				
			
		}
		else{

			g.transition()
				.duration(0)
				.delay(transitionDuration)
				.ease("linear")
				.attr("d", line)
				.each("end", function(d,i){
					if(!paused){
						updateData(i);
						clipGraph(i);

						d3.select(this)
							.attr("d", line)
							.attr("transform", null);

						doneTransitions++;

						if(doneTransitions >= reportingCells.length){
							doneTransitions = 0;

							tick();

						}

					}
					else{
						clipGraph(i);

						d3.select(this)
							.attr("d", line)
							.attr("transform", null);
					}
				});

			svg.selectAll(".xaxis")
				.call(xAxis);
		}

	}
	
	this.getReportingCells = function(){
		return reportingCells;
	}

	this.requestAddLine = function(cellNumber){
		pendingAddition.push(cellNumber);
	};
	
	var addLine = function(cellNumber){
		var numCells = reportingCells.length;

		// extend data array by 1 set
		data[numCells] = [];
		pastData[numCells] = [];
		forwardData[numCells] = [];

		reportingCells.push(cellNumber);

		// include new line
		svg.selectAll(".lines")
			.selectAll("path")
			.data(data)
			.enter()
			.append("path")
			.attr("id", function(d,i){
				return "line-"+graphID+"-"+reportingCells[i];
			})
			.attr("class", "line")
			.attr("d", line)
			.style("fill", "none")
			.style("stroke", "#000")
			.style("stroke-width", "1.5px");
		
		// find all lines and include into update variable
		g = svg.selectAll(".line").filter("path");
	}

	this.requestDelete = function(cellNumber){
		pendingDeletion.push(cellNumber);
	}

	var deleteLine = function(cellNumber){
		var index;
//		index = reportingCells.indexOf(cellNumber);

		reportingCells.forEach(function(d,i){
			if(d == cellNumber)
				index = i;
		});

		indexOflineRecentlyDeleted = index;

		var cellDeleted;
		/*
		Update all data sets by removing the recently deleted line
		*/
		cellDeleted = reportingCells.splice(index, 1);
		data.splice(index, 1);
		pastData.splice(index, 1);
		forwardData.splice(index, 1);

		console.log("Deleted: " + cellDeleted + " at index: " + index + ", with other index: " + reportingCells.indexOf(cellNumber));
		
		pendingData.forEach(function(d,i){
			d.splice(index, 1);
		});
		


		// remove SVG path
		svg.select("#line-"+graphID+"-"+cellNumber).remove();
		g = svg.selectAll(".line").filter("path");
	}
	
	this.zoomIn = function(){
		domainStart += domainInterval*zoomModifier;
		calculateDomainInterval();

		if(paused)
			redrawLinesOnce();
			
		zoomClicked = true;
		if(paused){
			redrawXAxis();
			redrawLinesOnce();
		}
	}
	
	this.zoomOut = function(){
		pauseDataUpdate = true;
		allowAlternateAnimation = true;
		domainStart -= domainInterval * zoomModifier;
		calculateDomainInterval();
		
		if(paused){
			redrawXAxis();
			redrawLinesOnce();
		}
			
		zoomClicked = true;
	}
	
	/*
	initialize the recording process
	*/
	this.startRecording = function(slideLength, pictureFormatInit){

		svgDocument = d3.selectAll("."+svgID)[0][0];

		// grabs the SVG string of the graph
		serializer = new XMLSerializer();
		svg_str = serializer.serializeToString(svgDocument);


		// initialize the GIF encorder
		encoder = new GIFEncoder();
		encoder.setRepeat(0);
		encoder.setDelay(250);
		encoder.start()
	
		captureFormat = pictureFormatInit;

		numberOfSlides = slideLength;
	
		if(captureFormat == "SVG")
			numberOfSlides = 1;
	
		recordTimer=0;
	}
	
	var recordTick = function(format){
	console.log("in record: " + numberOfSlides + " " + recordTimer);
		var pointer;
		if (recordTimer==0){
			canvas = document.getElementById('canvasExample');

			/*
			 * show white background
			 * update its dimensions
			 */
			pointer = $("#graph"+graphID+"_whitebg");
			pointer.attr("visibility","visible");
			pointer.css("width", width.toString()+"px");
			pointer.css("height", height.toString()+"px");
			

			svg.style("width", width.toString()+"px")
				.style("height", height.toString()+"px");
				
			svg.select(".axis")
				.selectAll("path, line")
				.style("fill", "none")
				.style("stroke", "#eee");

			svg.select(".axis")
				.selectAll("text")
				.style("font-family", "sans-serif")
				.style("font-size", "11px");
			
			recordTimer++;

		}


		if (recordTimer >= 0 && recordTimer <= numberOfSlides){	

			svg.select(".axis")
				.selectAll("path, line")
				.style("fill", "none")
				.style("stroke", "#eee");

			svg.select(".axis")
				.selectAll("text")
				.style("font-family", "sans-serif")
				.style("font-size", "11px");
		

			// grabs the SVG string of the graph
			svg_str = serializer.serializeToString(svgDocument);

			// draws the SVG onto a canvas element
			canvg('canvasExample', svg_str);

			// gets the picture written onto the canvas
			canvas = document.getElementById('canvasExample');
			context = canvas.getContext("2d");

			// adds the canvas picture onto the Gif encoder
			encoder.addFrame(context);
			recordTimer++;

		}
		else if (recordTimer >= numberOfSlides)
			finalizeRecording();

	}
	
	/*
	finish the recording process and save to file
	*/
	var finalizeRecording = function(){

		encoder.finish();

		var binary_gif = encoder.stream().getData()
		var data_url;
		
		var a = document.createElement('a');
		a.target = '_blank';		redrawLinesOnce();
		
		if(captureFormat == "SVG"){
			data_url = 'data:application/octet-stream;base64,' + btoa(svg_str);
			a.download    = 'myFile.svg';
		}
		else{
			data_url = 'data:image/gif;base64,'+encode64(binary_gif);
			a.download    = 'myFile.gif';
		}

		a.href = data_url;

		document.body.appendChild(a);
		a.click();

		$("."+svgID).css("width", "100%");
		$("."+svgID).css("height", "100%");

		$("#graph"+graphID+"_whitebg").attr("visibility","hidden");

		recordTimer=-1;

		global_flag = false;
	}
	
	this.takePicture = function(captureFormatInit){
		this.startRecording(1, captureFormatInit);
		recordTick(captureFormatInit);
		finalizeRecording();
	}
	
	this.setAnimation = function(state){
		transitionsOn = state;
	}

	this.setTransitionDuration = function(newTime){
		transitionDuration = newTime;
	}
	
	this.pause = function(){
		updating = false;
		upToDate = false;
		paused = true;
	}
	
	this.play = function(){
		if(paused)
			tick();
		paused = false;
	}

	this.goToEnd = function(){
		updating = true;
	}

	this.setState = function(pausedState, updatingState){
		paused = pausedState;
		updating = updatingState;
	}

	this.getState = function(){
		return [paused, updating];
	}
	
	this.getLastTimeTick = function(){
		return latestTimeValue;
	}

	this.getID = function(){
		return graphID;
	}
	
	this.updateToSlider = function(newDomainEnd){
		domainEnd = newDomainEnd;
		domainStart = domainEnd - domainInterval + domainBuffer;
		reportingCells.forEach(function(d,i){
			clipGraph(i);
		});
//		redrawXAxis(false);
		redrawLinesOnce();
	}
	
	var updateSlider = function(value){
		slider.slider("value", value);
	}

	var isSliderAtEnd = function (){
		return slider.slider("option", "value") == slider.slider("option", "max");
	}


	this.slideData = function(time, incomingData){
	
		if (dimensionsChanged())
			setDimensions();
		
		/*
		 * In the case of asynchronous data sliding, if amount of data
		 * about to be appended to "pendingData" is not equal to amount
		 * of data sets (if a line was removed right after data sliding tick),
		 * remove that data set from incoming data
		 */
		if(incomingData.length != data.length){
			incomingData.splice(indexOflineRecentlyDeleted, 1);
		}
/*
		if(incomingData.length > 0)
			if(incomingData[0].length > 0)
				latestTimeValue = incomingData[0][0];
*/
		latestTimeValue = time;

		pendingData.push(incomingData);

		pendingData.forEach(function(d,i){
			d.forEach(function(d,i){

				forwardData[i].push(d);
			});
		});

		pendingData = [];

		updateSlider(domainEnd);

		slider.slider("option", "max", latestTimeValue);
		
		if(drawing==false){
			oldTime = new Date().getTime() - 1;
			drawing = true;
			//redrawLines(transitionsOn);
			tick();
		}
	}

	init();
};
