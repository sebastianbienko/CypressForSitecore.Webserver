**CAUTION: The implementation was part of a PoC and has not been tested extensively nor has been used in a real project, yet.**



# Cypress For Sitecore Webserver

This is a simple node API to run cypress on Windows and to be used by Sitecore Projects.
As a starting point the more generic implementation by Dave Leigh has been used: https://github.com/daveaftershok/cypress-node-api-windows
The implementation has been changed in a way to accept additional arguments for test execution to take renderings in account and have Sitecore control Cypress.

It's supposed to be used alongside the [Cypress For Sitecore Module](https://github.com/sebastianbienko/CypressForSitecore)

## Usage

### Install:

1. ```npm install```
2. ```npx cypress open``` This will create the cypress default configuration file and folder structure (including the example test files).

**Optional: Change default cypress configuration (cypress.json)**
Cypress can be configures in different ways: https://docs.cypress.io/guides/references/configuration.html#Overriding-Options

Depending wether you are relying on the cypress.json file for configuration or not, you might change it to something like this:

```json
{
  "reporter": "mochawesome",
  "video": true,
  "baseUrl": "https://habitathome.dev.local",
  "testFiles": "**.spec.js",
  "blacklistHosts": [
    "www.google-analytics.com",
    "*.google-analytics.com",
    "*google-analytics.com"
  ]
}
```

### Run:

```node app.js```

### Endpoints:

#### / (Get)

 *shows current test run status*

#### /run (Post)
*runs tests*

Cypress parameters can be passed as JSON in the body of the request. The request body is not allowed to contain anything else. The expected JSON follows the same rules as the Cypress Module API does (see here: https://docs.cypress.io/guides/guides/module-api.html#cypress-run )

#### /results (Get)

*shows results of last test run add ?v=true for verbose output.*

#### /report (Get)
*Shows the latest test report courtesy of mocha-awesome: https://github.com/adamgruber/mochawesome*

### Sitecore

You can write Sitecore Rendering specific tests by making use of the following functions:



```javascript
//** */
// Those are some helper methods, which do not need to be included in each test file 
//** */

function containsRendering(pageRendering, allowedRendering){
  if (allowedRendering.datasource === undefined || allowedRendering.datasource === null || allowedRendering.datasource === ""){
    return pageRendering.RenderingItemName === replaceWhiteSpaces(allowedRendering.name);
  }else{
    return pageRendering.RenderingItemName === replaceWhiteSpaces(allowedRendering.name) && pageRendering.Datasource === replaceWhiteSpaces(allowedRendering.datasource);
  }
}

function pageHasRelevantRendering(pageRenderings, allowedRenderings){
  return allowedRenderings.some(function(allowedRendering, index) {
      if (pageRenderings.some((pageRendering, index) => containsRendering(pageRendering, allowedRendering))){
          return true;
      }
  })
}

function isRelevant(allowedRenderings){
  try{
    var pageRenderings = Cypress.env('pageRenderings');
    return pageHasRelevantRendering(pageRenderings, allowedRenderings);
  }
  catch(ex){
    return true;
  }
}

function replaceWhiteSpaces(value){
  var find = " ";
  var regEx = RegExp(find, 'g');
  return value.replace(regEx, "-")
}
```

Here an simple example:

```javascript
context('Feature.PageContent', () => {

  const renderings = {
    carousel: {
      name: 'Carousel',
      datasource: ''
    }
  }

  beforeEach(function() {
    //Run before each test
  })

  describe("Carousel Rendering", function() {
    var relevantRenderings = [renderings.carousel];
    if (isRelevant(relevantRenderings)){
      it('Some Carousel Rendering Test', function() {
        cy.visit("/"); //Call Url from specific Page Item
        //Test the rendering
      })
    }
  })
 })
```

A rendering is defined by a "name" and a "datasource" property. The "datasource" property is optional and can be used to have the test run run only for a specific combination of rendering and datasource.

The rendering definitions should be passed to Cypress in the '--env' parameter. The Module API is used to run Cypress, which natively accepts Cypress configuration as JSON object. (Have a look here: https://docs.cypress.io/guides/guides/module-api.html#cypress-run) The configuration can be passed in the body of the "POST" request to the '/run' endpoint and will be used to run Cypress. The following structure is used for passing page rendering informations:

```json
{
  "env":{
    "pageRenderings": [
      {
        "RenderingItemName": "",
        "HelixLayer": 2, //1-3
        "HelixModule": "",
        "Datasource": ""
      }
    ]
  }
}
```

This will be handled on Sitecore site by the Cypress module.

## Misc

* Feel free to replace the ssl certificates ('./server.crt', './key.pem')
* Even though the webserver can in general be used for different purposes in general, you are discouraged to do so, unless your main use case is to use it alongside the Sitecore module.



*Inspired by https://github.com/daveaftershok/cypress-node-api-windows (Dave Leigh)*