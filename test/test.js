var app = require('express')(),
  request = require('supertest'),
  toboggan = require('../toboggan')(request);
  
app.set('views', __dirname + '/views');
app.get('/user', function(req, res){
  res.render('user.jade', {
    foo: 'bar'
  });
});

toboggan.install(app, 'jade');  

describe('toboggan.js', function(){
  
  it('should throw an error when the template name is incorrect', function(done){
    request(app)
      .get('/user')
      .expectTemplate('incorrect')
      .endTemplate(function(err){
        try {
          'user.jade'.should.equal('incorrect')
        } catch (e) {
          err.should.eql(e);
        }
      })
      .end(done);  
  });
  
  it('should not throw an error when the template name is correct', function(done){
    request(app)
      .get('/user')
      .expectTemplate('user.jade')
      .endTemplate(function(err){
        if (err){
          throw new Error('Expected ' + err + ' to be null');
        }
      })
      .end(done);
  });
  
  it('should return an error to the endTemplate function when expectTemplate throws an error', function(done){
    var expectedError = new Error('error');
    
    request(app)
      .get('/user')
      .expectTemplate(function(){
        throw expectedError;
      })
      .endTemplate(function(err){
        err.should.equal(expectedError);
      })
      .end(done);
  });
  
  it('should pass the path passed to response.render to expectedTemplate', function(done){
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        path.should.equal(__dirname + '/views/user.jade');
        verified();
      })
      .end(done);
  });
  
  it('should pass the options passed to response.render to expectTemplate', function(done){
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        options.foo.should.equal('bar');
        verified();
      })
      .end(done);
  });
  
  it('should execute multiple expected functions', function(done){
    var executed1 = false, executed2 = false;
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        executed1 = true;
        verified();
      })
      .expectTemplate(function(path, options, verified){
        executed2 = true;
        verified();
      })
      .end(function(){
        executed1.should.equal(true);
        executed2.should.equal(true);
        done();
      });
  });
  
  it('should wait for the expected template functions before calling .end', function(done){
    var executed = [];
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        setTimeout(function(){
          executed.push(1);
          verified();
        }, 200);
      })
      .expectTemplate(function(path, options, verified){
        setTimeout(function(){
          executed.push(2);
          verified();
        }, 100);
      })
      .end(function(){
        executed.should.eql([2, 1]);
        done();
      });
  });
});
