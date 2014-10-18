//global variables
var keyArray=["Nemonychidae","Anthribidae","Attelabidae","Brentidae"];
var expressed = keyArray[3];

window.onload=initialize();

function initialize(){
	setMap();
}

function setMap(){



	var width = 960;
	var height= 500;
	
	var map= d3.select("body")
			.append("svg")
			.attr("width",width)
			.attr("height",height);
			
	
/*
var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);
*/

var projection = d3.geo.albers()
    .rotate([96, 0])
    .center([6.6, 44.7])
    .parallels([29.5, 45.5])
    .scale(3000)
    .translate([width / 2, height / 2])
    .precision(.1);
	

var graticule = d3.geo.graticule()
    .extent([[-98 - 45, 38 - 45], [-98 + 45, 38 + 45]])
    .step([5, 5]);
    
var path = d3.geo.path()
    			.projection(projection);

/* note add graticule to map after projection */
map.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);
    
    var gratBackground=map.append("path")
    	.datum(graticule.outline)
    	.attr("class","gratBackground")
    	.attr("d",path)
    	
    var gratLines=map.selectAll(".gratLines")
    	.data(graticule.lines)
    	.enter()
    	.append("path")
    	.attr("class","gratLines")
    	.attr("d",path);
	
	//keep	
	
	
	
	
	d3.json("data/states.topojson", function(error, wi){
	/* console.log(wi); */
	
	var counties = map.append("path")
		.datum(topojson.object(wi,wi.objects.states))
		.attr("class","counties2")
		.attr("d",path)
	});
		


d3.csv("data/weevilData.csv", function(csvData){

	var recolorMap = colorScale(csvData);
	
	drawPcp(csvData);
	
	d3.json("data/wi_new.topojson", function(error,wi){
		
		
		var jsonCounties=wi.objects.WiCounties.geometries;
		//loops through csv to assign each csv value to json county
		for(var i=0;i<csvData.length;i++){
			var csvCounty=csvData[i]; //the current county
			var csvCountyName=csvCounty.NAME;
			
			//loop through counties to find the right county
			for (var a=0; a<jsonCounties.length;a++){
				if(jsonCounties[a].properties.NAME==csvCountyName){
					for (var b=0; b<keyArray.length;b++){
						var key=keyArray[b];
						var beetle=parseFloat(csvCounty[key]);
						jsonCounties[a].properties[key]=beetle;
					};
					
					jsonCounties[a].properties.name=csvCounty.name;
					break;
				};
			};
		};

		var counties = map.selectAll(".counties")
	.data(topojson.object(wi,wi.objects.WiCounties).geometries)
	.enter()
	.append("path")
	.attr("class","counties")
	.attr("id",function(d){return d.properties.NAME})
	.attr("d",path)
	.style("fill", function(d) { //color enumeration units
					return choropleth(d, recolorMap);
				})
	.on("mouseover", highlight)
	.on("mouseout", dehighlight)
	.on("mousemove", moveLabel)
	.append("desc") //append the current color as a desc element
					.text(function(d) { 
						return choropleth(d, recolorMap); 
			   		});

	

		
	});
});

	
	
	
	
	
//d3.json("data/wi_new.topojson", function(error, wi){

	//this block must be between the two callback functions json and csv */
//	var counties = map.selectAll(".counties")
//	.data(topojson.object(wi,wi.objects.WiCounties).geometries)
//	.enter()
//	.append("path")
//	.attr("class","counties")
//	.attr("id",function(d){return d.properties.NAME})
//	.attr("d",path)
	
			
		//var jsonCounties=wi.objects.WiCounties.geometries;
			//console.log(jsonCounties);
		
		

		
//	});



/*
d3.csv("data/weevilData.csv", function(error, csvData){
	console.log(csvData);

});
*/

};

function colorScale(csvData){

	//create quantile classes with color scale
	var color = d3.scale.quantile() //designate quantile scale generator
		.range([
			
			"#fdcc8a",
			"#fc8d59",
			"#e34a33",
			"#b30000"
		]);
		
		//set min and max data values as domain
	color.domain([
		d3.min(csvData, function(d) { return Number(d[expressed]); }),
		d3.max(csvData, function(d) { return Number(d[expressed]); })
	]);

	//return the color scale generator
	return color;	

};
	
function choropleth(d, recolorMap){
	//<-setMap d3.json provinces.style
	
	//Get data value
	var value = d.properties[expressed];
	//If value exists, assign it a color; otherwise assign gray
	if (value) {
		return recolorMap(value);
	} else {
		return "#fef0d9";
	};
};

function drawPcp(csvData){
	//pcp dimensions
	var width = 960;
	var height = 200;
		
	//create attribute names array for pcp axes
	var keys = [], attributes = [];
	//fill keys array with all property names
	for (var key in csvData[0]){
		keys.push(key);
	};
	//fill attributes array with only the attribute names
	for (var i=2; i<keys.length; i++){
		attributes.push(keys[i]);
	};
	
	//create horizontal pcp coordinate generator
	var coordinates = d3.scale.ordinal() //create an ordinal scale for plotting axes
		.domain(attributes) //horizontally space each attribute's axis evenly
		.rangePoints([0, width]); //set the horizontal scale width as the SVG width
		
    var axis = d3.svg.axis() //create axis generator
		.orient("left"); //orient generated axes vertically
	
	//create vertical pcp scale
	scales = {}; //object to hold scale generators
	attributes.forEach(function(att){ //for each attribute
    	scales[att] = d3.scale.linear() //create a linear scale generator for the attribute
        	.domain(d3.extent(csvData, function(data){ //compute the min and max values of the scale
				return +data[att]; //create array of data values to compute extent from
			})) 
        	.range([height, 0]); //set the height of each axis as the SVG height
	});
	
	var line = d3.svg.line(); //create line generator
	
	//create a new svg element with the above dimensions
	var pcplot = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "pcplot") //for styling
		.append("g") //append container element
		.attr("transform", d3.transform( //change the container size/shape
			"scale(0.8, 0.6),"+ //shrink
			"translate(96, 50)")); //move
			
	var pcpBackground = pcplot.append("rect") //background for the pcp
		.attr("x", "-30")
		.attr("y", "-35")
		.attr("width", "1020")
		.attr("height", "270")
		.attr("rx", "15")
		.attr("ry", "15")
		.attr("class", "pcpBackground");
	
	//add lines
	var pcpLines = pcplot.append("g") //append a container element
		.attr("class", "pcpLines") //class for styling lines
		.selectAll("path") //prepare for new path elements
		.data(csvData) //bind data
		.enter() //create new path for each line
		.append("path") //append each line path to the container element
		.attr("id", function(d){
			return d.NAME; //id each line by admin code
		})
		.attr("d", function(d){
			return line(attributes.map(function(att){ //map coordinates for each line to arrays object for line generator
				return [coordinates(att), scales[att](d[att])]; //x and y coordinates for line at each axis
			}));
		})
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
	
	//add axes	
	var axes = pcplot.selectAll(".attribute") //prepare for new elements
		.data(attributes) //bind data (attribute array)
		.enter() //create new elements
		.append("g") //append elements as containers
		.attr("class", "axes") //class for styling
		.attr("transform", function(d){
			return "translate("+coordinates(d)+")"; //position each axis container
		})
		.each(function(d){ //invoke the function for each axis container element
			d3.select(this) //select the current axis container element
				.call(axis //call the axis generator to create each axis path
					.scale(scales[d]) //generate the vertical scale for the axis
					.ticks(0) //no ticks
					.tickSize(0) //no ticks, I mean it!
				)
				.attr("id", d) //assign the attribute name as the axis id for restyling
				.style("stroke-width", "5px") //style each axis		
				.on("click", function(){ //click listener
					sequence(this, csvData);
				});	
		});
		
	pcplot.select("#"+expressed) //select the expressed attribute's axis for special styling
		.style("stroke-width", "10px");
};


function highlight(data){
	//<-setMap d3.json provinces.on("mouseover"...
	//<-drawPcp pcpLines.on("mouseover"...
	
	var props = datatest(data);	//standardize json or csv data
	
	d3.select("#"+props.NAME) //select the current province in the DOM
		.style("fill", "#de2d26"); //set the enumeration unit fill to black
	
	//highlight corresponding pcp line
	d3.selectAll(".pcpLines") //select the pcp lines
		.select("#"+props.NAME) //select the right pcp line
		.style("stroke","#ffd700"); //restyle the line
		
	var labelAttribute = "<h1>"+props[expressed]+"</h1><br><b>"+expressed+"</b>"; //html string for attribute in dynamic label
	var labelName = props.name; //html string for name to go in child div
	
	//create info label div
	var infolabel = d3.select("body").append("div")
		.attr("class", "infolabel") //for styling label
		.attr("id", props.name+"label") //for future access to label div
		.html(labelAttribute) //add text
		.append("div") //add child div for feature name
		.attr("class", "labelname") //for styling name
		.html(labelName); //add feature name to label
};

function datatest(data){
	if (data.properties){ //if json data
		return data.properties;
	} else { //if csv data
		return data;
	};
};


function dehighlight(data){
	var props = datatest(data);	//standardize json or csv data
	
	var prov = d3.select("#"+props.name); //designate selector variable for brevity
	var fillcolor = prov.select("desc").text(); //access original color from desc
	prov.style("fill", fillcolor); //reset enumeration unit to orginal color
	
	//dehighlight corresponding pcp line
	d3.selectAll(".pcpLines") //select the pcp lines
		.select("#"+props.name) //select the right pcp line
		.style("stroke","#1e90ff"); //restyle the line
	
	d3.select("#"+props.adm1_code+"label").remove(); //remove info label
};

function moveLabel() {
		var x = d3.event.clientX+10; //horizontal label coordinate based mouse position stored in d3.event
		var y = d3.event.clientY-75; //vertical label coordinate
		
		d3.select(".infolabel") //select the label div for moving
			.style("margin-left", x+"px") //reposition label horizontal
			.style("margin-top", y+"px"); //reposition label vertical
};

function sequence(axis, csvData){
		//<-drawPcp axes.each.on("click"...
		
		//restyle the axis
		d3.selectAll(".axes") //select every axis
			.style("stroke-width", "5px"); //make them all thin
		axis.style.strokeWidth = "10px"; //thicken the axis that was clicked as user feedback
		
		expressed = axis.id; //change the class-level attribute variable
		
		//recolor the map
		d3.selectAll(".counties") //select every province
			.style("fill", function(d) { //color enumeration units
				return choropleth(d, colorScale(csvData)); //->
			})
			.select("desc") //replace the color text in each province's desc element
			.text(function(d) {
				return choropleth(d, colorScale(csvData)); //->
			});
	};
