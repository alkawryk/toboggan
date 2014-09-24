# toboggan

  A mock template engine and testing framework for express
  
  
## Installation

    $ npm install toboggan
    
## Motivation 
  
  Testing your express routes is good. Having a slow test suite is bad. You want to ensure your views are working with the correct data, but testing by
  inspecting DOM elements (or similar) is brittle. 

  toboggan mocks out any actual template rendering, regardless of which engine your real app uses, and provides test hooks which lets you verify the
  template path and variables.
  
  Let's take a look at the following simplified example. Suppose you have a route set up like below:
  
```js
app.get('/user', function(req, res){
  new User({id: req.param('id')}).fetch().then(function(user){
    res.render('user', {
      user: user.toJSON()
    });
  });
});
```

  Now suppose you want to write some tests for the route. What can you do? You could certainly check for a correct status code or maybe even perform a
  string search for the username you expect to appear in the rendered HTML, for example. But this relies too much on how the view ends up displaying the
  information and less on the pure data you had made available to the view. And how do you know the correct template was even used to begin with?
  
  Here is how you might write your tests using toboggan:
  
```js
describe('GET /user', function(){
  it('should display the information for the user', function(done){
    request(app)
      .get('/user')
      .send({id: 1})
      .expectTemplate('user')
      .expectTemplate(function(path, options, verified){
        new User({id: 1}).fetch().then(function(user){
          options.user.should.eql(user.toJSON());
          verified();
        });
      })
      .end(done);
  });
});
```

  Toboggan introduces a new chainable `.expectTemplate` function to supertest for verifying template related assertions, like the name of the template or the variables
  passed to the view. Best of all, you don't waste precious time actually rendering the view so your test suite remains fast. 
  
## Usage 

  Toboggan works with `supertest` and `express`. To use it, pass the `supertest` library to toboggan and install the mock template engine using the `.install` method:
  
```js
var request = require('supertest'),
  toboggan = require('toboggan')(request),
  app = require('express')();
  
  // more app set up here ... 
  
  toboggan.install(app);
```

  Ontop of the regular `.expect` and `.end` supertest functions, you will now have access to `.expectTemplate` and `.endTemplate` functions, described below. 

## Supported APIs

### .expectTemplate(string or fn)

  Adds a template related assertion. When the only argument is a string, the name of the actual template rendered should equal the supplied parameter. 
  
  When the supplied parameter is a function, the body of the function is executed and passed `path`, `options`, and `verified` parameters, where:
* `path` is the full file path of the template. 
* `options` contains the values passed as the second parameter to `.render`
* `verified` needs to be called when you're done 
  
  Note that asynchronous verifications are supported. Also note that `.expectTemplate` can be called multiple times, and all functions will finish executing
  before `.end` executes. 

### .endTemplate(fn)

  Any function passed to `.endTemplate` will execute after the template has rendered and all of the expected assertions have finished executing. Any 
  errors arising during the executing of an assertion will be passed as the first parameter to `fn`. 
  
  This method is chainable and the functions will execute in the order that they are passed.
  
## License

  MIT 
  