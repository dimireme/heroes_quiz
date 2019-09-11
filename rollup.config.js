import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import rootImport from 'rollup-plugin-root-import';
import json from 'rollup-plugin-json';
import copy from 'rollup-plugin-copy';

const production = !process.env.ROLLUP_WATCH;
console.log('build: ', production);
export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/bundle.js'
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file  better for performance
			css: css => {
				css.write('public/bundle.css');
			}
		}),
		
		rootImport({
			root: `${__dirname}/src`,
			useEntry: 'prepend',
		}),
		
		json({
			exclude: 'node_modules/**',
			
			// for tree-shaking, properties will be declared as
			// variables, using either `var` or `const`
			preferConst: true, // Default: false
			
			// ignores indent and generates the smallest code
			compact: true, // Default: false
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration 
		// consult the documentation for details:
		// https://github.com/rollup/rollup-plugin-commonjs
		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		}),
		commonjs(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser(),
		
		// Copy app from public to docs folder
		production && copy({
			targets: [ { src: 'public/*', dest: 'docs' } ],
			verbose: true,
			hook: 'writeBundle',
		})
	],
	watch: {
		clearScreen: false
	}
};
