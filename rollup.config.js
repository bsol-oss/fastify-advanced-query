import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import json from '@rollup/plugin-json'

import packageJSON from './package.json'
const input = './index.js'

export default {
    input,
    output: [
        {
            file: packageJSON.main,
            format: 'umd',
            name: 'index'
        },
        {
            file: packageJSON.module,
            format: 'esm'
        }
    ],
    plugins: [
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        json(),
        resolve(),
        commonjs(),
        terser()
    ],
    external: [...Object.keys(packageJSON.peerDependencies)]
}

