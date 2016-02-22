var url = require('url');
var Q = require('q');
var request = require('request');

// Constants

var USER_AGENT = 'localhost:4000';
var DEFAULT_MARKDOWN_FILENAME = 'README.md';
var DEFAULT_WIKI_INDEX_FILENAME = 'home';
var RAW_GITHUB_BASE_URL = 'https://raw.githubusercontent.com/';
var REGEX = {
  Gist: /^\/([0-9A-Za-z-]+\/[0-9a-f]+)\/raw\/?/,
  RepoMarkdownFile: /^\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+\.(md|mdown|markdown))$/,
  RepoIndex: /^\/(([^\/]+)\/([^\/]+)\/?(.*\/?))$/,
  WikiFile: /^\/(([^\/]+)\/([^\/]+)\/wiki\/?(.*\/?))$/,
  TrailingSlash: /\/$/,
};

// Methods

/**
 * Translate a Gist URL to a raw markdown URL
 * @return {promise}
 */
function _translateGistMarkdownUrl(gitprintPath, deferred) {
  var params = gitprintPath.match(REGEX.Gist);
  return 'https://gist.githubusercontent.com/' + params[1] + '/raw/';
}

/**
 * Translate a Wiki URL to a raw markdown URL
 * @param {string} URL Wiki path
 */
function _translateWikiMarkdownFileUrl(gitprintPath) {
  var params = gitprintPath.match(REGEX.WikiFile);
  var filename = (params[4] || DEFAULT_WIKI_INDEX_FILENAME) + '.md';
  var githubPath = 'wiki/' + params[2] + '/' + params[3] + '/' + filename;
  var url = RAW_GITHUB_BASE_URL + githubPath;
  return url
}

/**
 * @return {promise}
 */
function _translateRepoMarkdownIndexFileUrl(gitprintPath, deferred) {
  var params = gitprintPath.match(REGEX.RepoIndex);
  var githubPath = params[2] + '/' + params[3];
  var githubTree = (params[4] || '').replace('blob/','').replace(REGEX.TrailingSlash, ''); // strip out blob and trailing slash

  // Remove tree/blob from the tree path
  githubTree = githubTree.replace(/^(tree|blob)\//gi, '');

  var requestOptions = {
    url: 'https://github.wdf.sap.corp/api/v3/repos/' + githubPath + '/readme',
    json: true,
    headers: { 'User-Agent': USER_AGENT },
    strictSSL: false
  };

  // Ask Github what README file to use
  request(requestOptions, function(error, response, body) {
    if(error) {
      deferred.reject(error);    
    }

    if(githubTree === '') {
      githubTree = 'master';
    }

    var readmeFilename = body["path"] || DEFAULT_MARKDOWN_FILENAME;
    var url = RAW_GITHUB_BASE_URL + githubPath + '/' + githubTree + '/' + readmeFilename;

    deferred.resolve(url);
  });

  return deferred.promise;
}

/**
 * @return {string}
 */
function _translateRepoMarkdownFileUrl(gitprintPath) {
  var params = gitprintPath.match(REGEX.RepoMarkdownFile);
  var githubTree = params[4];
  var githubPath;

  if(params[3] === 'blob' || params[3] === 'tree') {
    githubPath = params[1] + '/' + params[2] + '/' + params[4];
  } else {
    githubPath = params[1] + '/' + params[2] + '/' + params[3] + '/' + params[4];
  }

  var url = RAW_GITHUB_BASE_URL + githubPath;
  return url
}

function _isRepoIndex(path) {
  return REGEX.RepoIndex.test(path);
}

function _isRepoFile(path) {
  return REGEX.RepoMarkdownFile.test(path);
}

function _isGist(path) {
  return REGEX.Gist.test(path);
}

function _isWikiFile(path) {
  return REGEX.WikiFile.test(path);
}

exports.translate = function(gitprintUrl){
  var deferred = Q.defer();
  var path = url.parse(gitprintUrl).path;
  var valueOrPromise;

  if(_isGist(path)) {
    valueOrPromise = _translateGistMarkdownUrl(path, deferred);
  }
  else if(_isWikiFile(path)) {
    valueOrPromise = _translateWikiMarkdownFileUrl(path);
  }
  else if(_isRepoFile(path)) {
    valueOrPromise = _translateRepoMarkdownFileUrl(path);
  }
  else if(_isRepoIndex(path)) {
    valueOrPromise = _translateRepoMarkdownIndexFileUrl(path, deferred);
  } else {
    throw 'Unrecognised GitHub URL';
  }

  return valueOrPromise;
}

exports.isGist = _isGist;
exports.isRepoFile = _isRepoFile;
exports.isRepoIndex =  _isRepoIndex;
exports.isWikiFile = _isWikiFile;
exports.translateRepoFile = _translateRepoMarkdownFileUrl;
exports.translateRepoIndex = _translateRepoMarkdownIndexFileUrl;
exports.translateGist = _translateGistMarkdownUrl;
exports.REGEX = REGEX;
