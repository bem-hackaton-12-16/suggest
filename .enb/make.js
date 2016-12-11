var levels = [
		{ path: 'libs/bem-core/common.blocks', check: false },
		{ path: 'libs/bem-components/common.blocks', check: false },
		'common.blocks'
	],
	enbBemTechs = require('enb-bem-techs'),
	techs = {
		// essential
		fileProvider: require('enb/techs/file-provider'),
		fileMerge: require('enb/techs/file-merge'),

		// js
		browserJs: require('enb-js/techs/browser-js'),

		// bemhtml
		bemhtml: require('enb-bemxjst/techs/bemhtml'),
		bemjsonToHtml: require('enb-bemxjst/techs/bemjson-to-html')
	};

module.exports = function(config) {

	config.nodes('*.bundles/*', function(nodeConfig) {
		nodeConfig.addTechs([
			[enbBemTechs.levels, { levels: levels }],
			[techs.fileProvider, { target: '?.bemjson.js' }],
			[enbBemTechs.bemjsonToBemdecl],
			[enbBemTechs.deps],
			[enbBemTechs.files],
			// bemhtml
			[techs.bemhtml, {
				sourceSuffixes: ['bemhtml', 'bemhtml.js'],
				forceBaseTemplates: true
			}],

			// html
			[techs.bemjsonToHtml],

			// client bemhtml
			[enbBemTechs.depsByTechToBemdecl, {
				target: '?.bemhtml.bemdecl.js',
				sourceTech: 'js',
				destTech: 'bemhtml'
			}],
			[enbBemTechs.deps, {
				target: '?.bemhtml.deps.js',
				bemdeclFile: '?.bemhtml.bemdecl.js'
			}],
			[enbBemTechs.files, {
				depsFile: '?.bemhtml.deps.js',
				filesTarget: '?.bemhtml.files',
				dirsTarget: '?.bemhtml.dirs'
			}],
			[techs.bemhtml, {
				target: '?.browser.bemhtml.js',
				filesTarget: '?.bemhtml.files',
				sourceSuffixes: ['bemhtml', 'bemhtml.js']
			}],

			// js
			[techs.browserJs, { includeYM: true }],
			[techs.fileMerge, {
				target: '?.js',
				sources: ['?.browser.js', '?.browser.bemhtml.js']
			}],
		]);

		nodeConfig.addTargets(['?.html', '?.js']);
	});
};
