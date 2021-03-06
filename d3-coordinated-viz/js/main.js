//main.js
//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    
 var attrArray = ["pop_1970","pop_1980","pop_1990","pop_2000","pop_2010", "pop_2012", "pop_2014", "pop_2016", "pop_2018"];
  var expressed = attrArray[0]; //initial attribute  
    
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 55,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 1084063]);
    
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

        //map frame dimensions... mod8
        var width = window.innerWidth * 0.5,
        height = 460;
        //create new svg container for the map... mod8
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area conic projection centered on France... mod8
        var projection = d3.geoAlbers()
            .center([0, 44.7])
            .rotate([89.99, 0, 0])
            .parallels([28.36, 45.5])
            .scale(5066.67)
            .translate([width / 2, height / 2]);

            var path = d3.geoPath()
            .projection(projection);

        //use Promise.all to parallelize asynchronous data loading... mod8
        var promises = [];
        promises.push(d3.csv("data/WI_CountiesPop_data.csv")); //load attributes from csv
        promises.push(d3.json("data/states.topojson")); //load background spatial data
        promises.push(d3.json("data/WICounties.topojson")); //load choropleth spatial data
        Promise.all(promises).then(callback);

        function callback(data){
        csvData = data[0];
        statesUS = data[1];
        counties = data[2];

         //place graticule on the map
        setGraticule(map, path);

        
        //translate europe TopoJSON
        // console.log(statesUS.objects);
        var USstates = topojson.feature(statesUS, statesUS.objects.ne_50m_admin_1_states_provinces_lakes),
         wiCounties = topojson.feature(counties, counties.objects.WICounties).features;
        

          //add US states  to map
        var states = map.append("path")
            .datum(USstates)
            .attr("class", "states")
            .attr("d", path);

            
      //join csv data to GeoJSON enumeration units
        wiCounties = joinData(wiCounties, csvData);
        //console.log(wiCounties)
            
          //create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(wiCounties, map, path, colorScale);
        
         //add coordinated visualization to the map
        setChart(csvData, colorScale);
            
        //add dropdown
         createDropdown(csvData);
            

    };
}; //end of setMap()
    
    
//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();
    

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
};
    
    
    
 //function set graticule
function setGraticule(map, path){    
    //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
       
        
       //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        //comment out because no ocean for graticule
//        //Example 2.6 line 5...create graticule lines
//        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
//        
//            .data(graticule.lines()) //bind graticule lines to each element to be created
//            .enter() //create an element for each datum
//            .append("path") //append each element to the svg as a path element
//            .attr("class", "gratLines") //assign class for styling
//            .attr("d", path); //project graticule lines
};
    
 // function join data      
function joinData(wiCounties, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
          //MOD 9 Example 1.1: Joining CSV data to GeoJSON enumeration units in main.js
           //variables for data join
    //var attrArray = ["pop_2010", "pop_2012", "pop_2014", "pop_2016", "pop_2018"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.GEOIDs; //the CSV primary ke

        
        //loop through geojson regions to find correct region
        for (var a=0; a<wiCounties.length; a++){

            var geojsonProps = wiCounties[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.GEOIDs; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    }; 

    return wiCounties;
};
  
    
//function set enumeration units    
function setEnumerationUnits(wiCounties, map, path, colorScale){
    //...REGIONS BLOCK FROM MODULE 8
    //add Counties to map
        var counitesWI = map.selectAll(".counitesWI")
            .data(wiCounties)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "counitesWI " + d.properties.GEOIDs;
               })
            .attr("d", path)
             .style("fill", function(d){
                 //console.log(choropleth(d.properties, colorScale));
            return choropleth(d.properties, colorScale);
        })
        //Example 2.5 line 1...regions event listeners
        .on("mouseover", function(d){
            console.log(d)
            console.log("mouseover");
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
//        //below Example 2.2 line 16...add style descriptor to each path
    var desc = counitesWI.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};
        
 //function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
//        console.log(colorScale(val))
        return colorScale(val);
    } else {
        return "#CCC";
    };
};     
    

    //function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 55,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 1100000]);

    //set bars for each province
     var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.GEOIDs;
        })
       .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
        //below Example 2.2 line 31...add style descriptor to each rect
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 80)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Population in " + expressed.substring(4) + " for each county");

    
    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
}; //end of setChart()

 
    //function to create a dropdown menu for attribute selection... MOD10
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData);
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
    };
    
//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;
    //console.log(expressed);

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".counitesWI")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
            })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
//        })
//        .attr("x", function(d, i){
//            return i * (chartInnerWidth / csvData.length) + leftPadding;
//        })
//        //resize bars
//        .attr("height", function(d, i){
//            return 463 - yScale(parseFloat(d[expressed]));
//        })
//        .attr("y", function(d, i){
//            return yScale(parseFloat(d[expressed])) + topBottomPadding;
//        })
//        //recolor bars
//        .style("fill", function(d){
//            return choropleth(d, colorScale);
     
    updateChart(bars, csvData.length, colorScale);
}; //end of changeAttribute()

    //function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
//            console.log(yScale(parseFloat(d[expressed])));
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

     //at the bottom of updateChart()...add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text("Population in " + expressed.substring(4) + " for each county");
};
    
   
//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.GEOIDs)
        .style("stroke", "blue")
        .style("stroke-width", "2");
    //console.log("highlight")
    //console.log(props)
    setLabel(props);
};   
    
   //function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.GEOIDs)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
 //below Example 2.4 line 21...remove info label
    d3.select(".infolabel")
        .remove();

   
    
}; 
    
   
    
//function to create dynamic label
function setLabel(props){
    //label content

    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed.substring(4) + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.GEOIDs + "_label")
        .html(labelAttribute);
    


    var countyName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name || props.NAME);
    
    
    
};
    
    //function to move info label with mouse
//Example 2.8 line 1...function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
    
})(); //last line of main.js