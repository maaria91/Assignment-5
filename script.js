console.log("Assignment 5");

var margin = {t:50,r:100,b:50,l:50};
var width = document.getElementById('map').clientWidth - margin.r - margin.l,
    height = document.getElementById('map').clientHeight - margin.t - margin.b;

var canvas = d3.select('.canvas');
var plot = canvas
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','canvas')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//TODO: set up a mercator projection, and a d3.geo.path() generator
//Center the projection at the center of Boston
var bostonLngLat = [-71.088066,42.315520]; //from http://itouchmap.com/latlong.html
var projection = d3.geo.mercator()
    .translate([width/2,height/2])
    .center(bostonLngLat)
    .scale(200000);


var pathGenerator = d3.geo.path().projection(projection);

//TODO: create a color scale
var colorScale = d3.scale.linear().domain([0,100000]).range(['white','purple']);


//TODO: create a d3.map() to store the value of median HH income per block group
var incomeHH = d3.map();


//TODO: import data, parse, and draw
queue()
    .defer(d3.json, "data/bos_census_blk_group.geojson")
    .defer(d3.json, "data/bos_neighborhoods.geojson")
    .defer(d3.csv, "data/acs2013_median_hh_income.csv", parse)
    .await(function(err, block, hood){

        draw(block, hood);})




function draw(block, hood) {
    plot.selectAll('.block-groups')
        .data(block.features)
        .enter()
        .append('g')
        .append('path')
        .attr('class', 'block-groups')
        .attr('d', pathGenerator)
        .style('fill', function (d) {
            var income = incomeHH.get(d.properties.geoid).income;
            if (income == 0) {
                return '#E8FFEB'
            }
            else {
                return colorScale(income)
            }
        })
        .call(attachTooltip)

    var plot2 = plot.append('g').attr('class','hood').selectAll('.label')
        .data(hood.features)
        .enter()
        .append('g')
        .attr('class', 'label')



    plot2.append('path')
        .attr('class','boundries')
        .attr('d', pathGenerator)
        .attr('fill', 'none')
        .style('stroke-width', '.5px')
        .style('stroke', 'white')

        plot2.append('text')
        .text(function (d) {
               var hoodName = (d.properties.Name);
                return hoodName
        })
        .attr('x', function (d) {
            return pathGenerator.centroid(d)[0];
        })
        .attr('y', function (d) {
            return pathGenerator.centroid(d)[1];
        })
}


function attachTooltip(selection){
    selection
        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');

            tooltip
                .transition()
                .style('opacity',1);

            var income = incomeHH.get(d.properties.geoid).income;

            tooltip.select('#HHincome').html(income);

        })

        .on('mousemove',function(){
            var xy = d3.mouse(canvas.node());

            var tooltip = d3.select('.custom-tooltip');

            tooltip
                .style('left',xy[0]+20+'px')
                .style('top',(xy[1]+20)+'px');
        })
        .on('mouseleave',function(){
            var tooltip = d3.select('.custom-tooltip')
                .transition()
                .style('opacity',0);
        })
}

function parse(d) {
    incomeHH.set(d.geoid, {
        'nameBlock': d.name,
        'income': +d.B19013001
    });
}