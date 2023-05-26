/**
 * Define the include function for absolute file name
 *
 * @type {string} path
 */
global.base_dir = __dirname;
global.abs_path = function(path) {
	return base_dir + path;
}
global.include = function(file) {
	return require(abs_path('/' + file));
}
