const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const reactVersions = ['16.14.0', '17.0.2', '18.2.0']

function run(command, args, cwd, options = {}) {
  execFileSync(command, args, {
    cwd,
    stdio: options.stdio ?? 'pipe',
    encoding: 'utf8',
  })
}

function runAndCapture(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
  }).trim()
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-table-react-compat-'))
  run('npm', ['run', 'build'], projectRoot, { stdio: 'inherit' })
  const tarballName = runAndCapture('npm', ['pack', '--silent'], projectRoot).split('\n').pop()
  const tarballPath = path.join(projectRoot, tarballName)

  try {
    for (const reactVersion of reactVersions) {
      const caseDir = path.join(tempRoot, `react-${reactVersion}`)
      fs.mkdirSync(caseDir, { recursive: true })

      writeJson(path.join(caseDir, 'package.json'), {
        name: `sr-table-react-${reactVersion.replace(/\./g, '-')}-smoke`,
        private: true,
        dependencies: {
          react: reactVersion,
          'react-dom': reactVersion,
          'sr-table': `file:${tarballPath}`,
        },
      })

      run('npm', ['install', '--silent'], caseDir, { stdio: 'inherit' })

      fs.writeFileSync(
        path.join(caseDir, 'smoke.js'),
        `
const React = require('react')
const ReactDOMServer = require('react-dom/server')
const { BaseTable } = require('sr-table')

const html = ReactDOMServer.renderToString(
  React.createElement(BaseTable, {
    primaryKey: 'id',
    columns: [{ code: 'name', name: 'Name', width: 120 }],
    dataSource: [{ id: '1', name: 'Alice' }],
  }),
)

if (!html.includes('Alice')) {
  throw new Error('Rendered markup does not include the expected row value')
}

console.log('react ${reactVersion}: ok')
`.trimStart(),
      )

      run('node', ['smoke.js'], caseDir, { stdio: 'inherit' })
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
    fs.rmSync(tarballPath, { force: true })
  }
}

main()
