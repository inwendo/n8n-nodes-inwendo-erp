const { src, dest } = require('gulp');

function buildIcons() {
	return src('icons/**/*.{svg,png}', { encoding: false }).pipe(dest('dist/icons'));
}

function buildJson() {
	return src('nodes/**/*.json').pipe(dest('dist/nodes'));
}

exports['build:icons'] = async function () {
	await buildIcons();
	await buildJson();
};
