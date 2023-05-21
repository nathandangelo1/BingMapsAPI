var map;
var dest;
var lat;
var lon;
const credentials =
  "AsnjENk9o2btta0rJzurVwsuleYaFxsWcc78p0Bop4TjK4M7PdNcjX1JyCXi6C45";
var layer,
  pageIdx = 0,
  queryOptions,
  numResults;
//Query URL to the POI data source
var sdsDataSourceUrl =
  "https://spatial.virtualearth.net/REST/v1/data/Microsoft/PointsOfInterest";

navigator.geolocation.getCurrentPosition(function (position) {
  lat = position.coords.latitude;
  lon = position.coords.longitude;
});

function GetMap() {
  map = new Microsoft.Maps.Map("#myMap", {
    credentials: credentials,
    /*      "AsnjENk9o2btta0rJzurVwsuleYaFxsWcc78p0Bop4TjK4M7PdNcjX1JyCXi6C45",*/
    zoom: 13,
  });

  Microsoft.Maps.loadModule("Microsoft.Maps.AutoSuggest", function () {
    var manager = new Microsoft.Maps.AutosuggestManager({
      map: map,
      businessSuggestions: true,
    });

    manager.attachAutosuggest(
      "#searchBox",
      "#searchBoxContainer",
      selectedSuggestion
    );
  });

  document
    .getElementById("fetchLocal")
    .addEventListener("click", fetchLocalSearch);
  document
    .getElementById("searchBox")
    .addEventListener("keyup", function (event) {
      // If the user presses the "Enter" key on the keyboard
      if (event.code === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("fetchLocal").click();
      }
    });

  let buttons = document.getElementsByClassName("btnnearby");

  for (var i = 0; i < buttons.length; i++) {
    let button = buttons[i];
    button.addEventListener("click", function (e) {
      let buttonValue = button.value;
      NearbyLocations(buttonValue);
    });
  }
  document
    .getElementById("pageForwardButton")
    .addEventListener("click", pageForward);
  document
    .getElementById("pageBackwardButton")
    .addEventListener("click", pageBackwards);
}

function NearbyLocations(value) {
  map.layers.clear();
  if (typeof Microsoft.Maps.Directions !== "undefined") {
    directionsManager.clearDisplay();
  }
  //Create an infobox to display content for each result.
  infobox = new Microsoft.Maps.Infobox(map.getCenter(), { visible: false });
  infobox.setMap(map);

  //Create a layer for the results.
  layer = new Microsoft.Maps.Layer();
  map.layers.insert(layer);

  //Add a click event to the layer to show an infobox when a pushpin is clicked.
  Microsoft.Maps.Events.addHandler(layer, "click", function (e) {
    var m = e.target.metadata;
    dest = m;

    infobox.setOptions({
      htmlContent: `<div id="infoboxText" style="background: #f5f7f6; color: #000000; padding: 5px;">
      <div class="pull-right">
      <a id="ibox-close" class="infobox-close" onclick="closeInfoBox()">x
      </a></div><h2>${m.DisplayName.toString()}</h2><p>${
        m.AddressLine.toString() + ", " + m.Locality.toString()
      }</p><button id="btn-getdirections" type="button">Get Directions</button>
      </div>
      `,
      // title: m.DisplayName,
      // description: m.AddressLine + ", " + m.Locality,
      location: e.target.getLocation(),
      visible: true,
    });

    document
      .getElementById("btn-getdirections")
      .addEventListener("click", () => {
        //map.layers.clear();
        closeInfoBox();
        GetDirections();
      });
  });

  //Load the Bing Spatial Data Services module.
  Microsoft.Maps.loadModule("Microsoft.Maps.SpatialDataService", function () {
    //Add an event handler for when the map moves.
    // Microsoft.Maps.Events.addHandler(map, "viewchangeend", getNearByLocations);
    // Microsoft.Maps.Events.addHandler(map, "viewchangeend", getNearByLocations);

    //Trigger an initial search.
    getNearByLocations(value);
  });
}

function closeInfoBox() {
  infobox.setOptions({ visible: false });
}

async function fetchLocalSearch() {
  let query = document.getElementById("searchBox").value;
  let point = map.getCenter();
  const lat1 = point.latitude;
  const lon1 = point.longitude;
  if (query != "" && point && credentials) {
    const LOCALSEARCHAPI_URL = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${query}&userLocation=${
      lat1 + "," + lon1
    }&key=${credentials}`;
    try {
      const response = await fetch(LOCALSEARCHAPI_URL);
      const res = await response.json();
      console.log(res);
      Search(res);
    } catch (err) {
      console.error(err);
    }
  }
}

function Search(res) {
  r = res.resourceSets[0].resources;
  //Remove any previous results from the map.
  map.entities.clear();
  layer.clear();
  //map.layers.clear();
  if (typeof Microsoft.Maps.Directions !== "undefined") {
    directionsManager.clearDisplay();
  }

  if (r && r.length > 0) {
    var pin,
      pins = [],
      locs = [],
      output = "Results:<br/>";

    for (var i = 0; i < r.length; i++) {
      let coords = r[i].point.coordinates;
      if (coords[0] !== "undefined" || coords[1] !== "undefined") {
        //const point = new Microsoft.Maps.Point();
        var location = new Microsoft.Maps.Location(coords[0], coords[1]);
        //Create a pushpin for each result.
        pin = new Microsoft.Maps.Pushpin(location, {
          title: r[i].name,
          subTitle: r[i].Address.addressLine,
          text: i + 1 + "",
        });
        pins.push(pin);
        locs.push(location);

        output += i + 1 + ") " + r[i].name + "<br/>";
      }
    }

    //Add the pins to the map
    layer.push(pins);

    //Display list of results
    document.getElementById("resultList").innerHTML = output;
    openNav();

    //Determine a bounding box to best view the results.
    var bounds;

    if (r.length == 1) {
      bounds = r[0].bestView;
    } else {
      //Use the locations from the results to calculate a bounding box.
      bounds = Microsoft.Maps.LocationRect.fromLocations(locs);
    }

    map.setView({ bounds: bounds });
  }
}

function GetDirections() {
  closeNav();
  layer.clear();
  //Load the directions module.
  Microsoft.Maps.loadModule("Microsoft.Maps.Directions", function () {
    if (typeof directionsManager === "undefined") {
      //myVariable is undefined
      //Create an instance of the directions manager.
      directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
    } else {
      directionsManager.clearAll();
    }
    //Specify where to display the route instructions.
    directionsManager.setRenderOptions({
      itineraryContainer: "#directionsItinerary",
    });

    //Specify where to display the input panel
    directionsManager.showInputPanel("directionsPanel");
    //Create waypoints to route between.

    var origination = new Microsoft.Maps.Directions.Waypoint({
      address: "Current Location",
      location: new Microsoft.Maps.Location(lat, lon),
    });
    directionsManager.addWaypoint(origination);

    var destination = new Microsoft.Maps.Directions.Waypoint({
      address: dest.DisplayName.toString(),
      location: new Microsoft.Maps.Location(dest.Latitude, dest.Longitude),
    });
    directionsManager.addWaypoint(destination);

    //Specify the element in which the itinerary will be rendered.
    directionsManager.setRenderOptions({
      itineraryContainer: "#directionsItinerary",
    });

    //Calculate directions.
    directionsManager.calculateDirections();
  });
}

function getNearByLocations(value) {
  //Remove any existing data from the layer.
  //layer.clear();
  //map.entities.clear();

  //Hide infobox.
  infobox.setOptions({ visible: false });

  //Create a query to get nearby data.
  var queryOptions = {
    queryUrl: sdsDataSourceUrl,
    top: 10,
    inlineCount: true,
    spatialFilter: {
      spatialFilterType: "nearby",
      location: map.getCenter(),
      radius: 10,
    },
    filter: new Microsoft.Maps.SpatialDataService.Filter(
      "EntityTypeID",
      "eq",
      value //restaurants, hotels, nightlife
    ),
  };

  (queryOptions.skip = pageIdx * 10),
    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(
      queryOptions,
      map,
      function (data, inlineCount) {
        //Add results to the layer.
        //layer.add(data);

        //Store the number of results available.
        numResults = inlineCount;

        if (data.length > 0) {
          //Calculate the start and end result index.
          var start = pageIdx * 10 + 1;
          var end = start + data.length - 1;

          document.getElementById("pageInfo").innerText =
            "Results: " +
            start +
            " - " +
            end +
            " of " +
            inlineCount +
            " results";

          //Create a list of the results.
          var listHTML = ["<table>"],
            locations = [];

          for (var i = 0; i < data.length; i++) {
            //Create HTML for each line item in the list.

            //Add a column of index numbers.
            listHTML.push("<tr><td>", start + i, ") </td>");

            //Create a link that calls a function, pass in the EntityID of a result into the rel attribute for cross referencing the list item to the shape.
            listHTML.push(
              '<td><a href="javascript:void(0);" rel="',
              data[i].metadata.EntityID,
              '" ',
              "onclick=\"listItemClicked('",
              data[i].metadata.EntityID,
              "');\">",
              data[i].metadata.DisplayName,
              "</a></td>"
            );

            //Create a column to display the distance to the location.
            listHTML.push(
              "<td>",
              data[i].metadata.__Distance.toFixed(2),
              " km(s)</td></tr>"
            );

            //Add the result number to the pushpin.
            data[i].setOptions({ text: start + i + "" });

            locations.push(data[i].getLocation());
          }

          listHTML.push("</table>");

          document.getElementById("resultList").innerHTML = listHTML.join("");

          //Add results to the data layer.
          layer.add(data);

          //Set the map view to show all the locations.
          //Add padding to account for the pushpins pixel size.
          map.setView({
            bounds: Microsoft.Maps.LocationRect.fromLocations(locations),
            padding: 30,
          });
          openNav();
        }
      }
    );
}

function listItemClicked(entityId) {
  //When an item in the list is clicked, look up its pushpin by entitiyId.
  var shapes = layer.getPrimitives();

  for (var i = 0; i < shapes.length; i++) {
    if (shapes[i].metadata.EntityID == entityId) {
      //Center the map over the pushpin and zoom in.
      map.setView({ center: shapes[i].getLocation(), zoom: 15 });
      break;
    }
  }
}

function pageBackwards() {
  if (pageIdx > 0) {
    pageIdx--;
    getNearByLocations();
  }
}

function pageForward() {
  //Ensure that paging does not exceed the number of results.
  if ((pageIdx + 1) * 10 < numResults) {
    pageIdx++;
    getNearByLocations();
  }
}

function highlightListItem(e) {
  var shapeId = e.target.metadata.EntityID;

  var elm = getListItemById(shapeId);

  //Highlight the list item to indicate that its shape has been hovered.
  elm.style.background = "LightGreen";

  //Remove the highlighting after a second.
  setTimeout(function () {
    elm.style.background = "white";
  }, 1000);
}

function getListItemById(shapeId) {
  var listItems = document
    .getElementById("resultList")
    .getElementsByTagName("a");

  for (var i = 0; i < listItems.length; i++) {
    var rel = listItems[i].getAttribute("rel");
    if (rel === shapeId) {
      return listItems[i];
    }
  }

  return null;
}

function selectedSuggestion(result) {
  //Remove previously selected suggestions from the map.
  map.entities.clear();

  map.setView({ bounds: result.bestView });
}
/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}
