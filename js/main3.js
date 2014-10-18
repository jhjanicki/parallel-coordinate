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
		.attr("id",function(d){
			var finalId= d.properties.NAME.replace(" ","");
			finalId = finalId.replace(" ","");
			finalId = finalId.replace(".","");
			return finalId;
		})
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


}; // end of setMap


//takes callback function as a parameter
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


function dehighlight(data){

	var recolorMap = colorScale(data);
	var props = datatest(data);	//standardize json or csv data
	
	var finalId= props.NAME.replace(" ","");
	finalId = finalId.replace(" ","");
	finalId = finalId.replace(".","");
	
	var prov = d3.select("#"+finalId); //designate selector variable for brevity
	var fillcolor = prov.select("desc").text();  //access original color from desc
	prov.style("fill", fillcolor); //reset enumeration unit to orginal color
	
	d3.select("#"+finalId+"label").remove(); //remove info label
	
	
};

function highlight(data){
	var props= datatest(data);
	
	var finalId= props.NAME.replace(" ","");
	finalId = finalId.replace(" ","");
	finalId = finalId.replace(".","");
			
	d3.select("#"+finalId)//select the current county in the dome	
		.style("fill","#000");
		
	var labelAttribute="<h1>"+props[expressed]+"</h1><br><b>"+expressed+"</b>&nbsp;&nbsp;&nbsp;&nbsp;"+props.NAME;
	
	/* var labelName=props.NAME;	 */
	
	var infolabel=d3.select("body").append("div")
		.attr("class","infolabel")
		.attr("id", finalId+"label")
		.html(labelAttribute);
		/*
.append("div")
		.attr("class", "labelname")
		.html(labelName);
*/
			
		
};

function datatest (data){
	
	if(data.properties){
		return data.properties;
	}else{
		return data;
	}
	
};


function moveLabel(){
	var x=d3.event.clientX+10;
	var y=d3.event.clientY-75;
	d3.selectAll(".infolabel")
		.style("margin-left", x+"px")
		.style("margin-top", y+"px");
};







