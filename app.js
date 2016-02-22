var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var urlHelper = require("./lib/url_helper");
var routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.enable('trust proxy');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// Homepage
app.get('/', routes.index);

// Gists
app.get(urlHelper.REGEX.Gist, routes.render);

// Wiki
app.get(urlHelper.REGEX.WikiFile, routes.render);

// blob markdown
app.get(urlHelper.REGEX.RepoMarkdownFile, routes.render);

// repo readme
app.get(urlHelper.REGEX.RepoIndex, routes.render);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  var err = new Error('I couldn\'t find that file on GitHub');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;