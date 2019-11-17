#!/usr/bin/env node
const path = require('path');
const escape = require('escape-html');

let json = '';
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    json += chunk;
  }
});

process.stdin.on('end', () => {
  buildDocs(JSON.parse(json));
});

function buildDocs(components) {
  for (const filename in components) {
    const component = components[filename];
    const componentName = path.basename(filename, '.js');
    console.log(`\n### ${componentName}\n`);
    if (component.description) {
      console.log(`${component.description}\n`);
    }
    const propNames = Object.keys(component.props || {});
    if (propNames.length) {
      console.log(`#### Props\n`);
      console.log('<table>');
      console.log('<thead>');
      console.log('<tr>');
      console.log('<th>Name</th>');
      console.log('<th colspan="2">Type</th>');
      console.log('<th>Default</th>');
      console.log('<th>Description</th>');
      console.log('</tr>');
      console.log('</thead>');
      console.log('<tbody>');
      propNames.forEach(name => {
        const prop = component.props[name];
        const required = s =>
          prop.required ? `<strong title="Required">${s}</strong>` : s;
        const extraRows = [];
        let type = renderType(prop.type, extraRows, 0, true);
        if (type.includes('\n')) {
          type = `\n${type}\n`;
        }
        console.log(`<tr>`);
        console.log(
          `<td valign="top" rowspan="${extraRows.length + 1}">${required(
            name
          )}</td>`
        );
        console.log(`<td valign="top" colspan="2">${type}</td>`);
        console.log(
          `<td valign="top" align="right" rowspan="${extraRows.length +
            1}">${renderValue(prop.defaultValue)}</td>`
        );
        if (prop.description) {
          console.log(
            `<td valign="top" valign="top" rowspan="${extraRows.length + 1}">`
          );
          console.log(`\n${prop.description}\n`);
          console.log(`</td>`);
        } else {
          console.log(
            `<td valign="top" valign="top" rowspan="${extraRows.length +
              1}"></td>`
          );
        }
        console.log('</tr>');
        extraRows.forEach(row => {
          console.log(`<tr>${row}</tr>`);
        });
      });
      console.log('</tbody>');
      console.log('</table>');
    }
  }
}

const TYPES = {
  string: 'String',
  number: 'Number',
  func: 'Function',
  bool: 'Boolean',
  element: 'React&nbsp;Element',
  object: 'Object',
  node: 'Node'
};

function renderShape(value, extraRows, topLevel) {
  const ref = topLevel ? null : ++REF_COUNTER;
  const nextPos = topLevel
    ? extraRows.length
    : extraRows.push(
        `<td colspan="2"><a name="shape-${ref}"><sup>${ref}</sup>&thinsp;Object</a></td>`
      );
  extraRows.splice(
    nextPos,
    0,
    ...Object.keys(value).map(key => {
      const name = value[key].required
        ? `<strong title="Required">${key}</strong>`
        : key;
      const type = renderType(value[key], extraRows);
      return `<td valign="top">${name}</td><td valign="top">${type}</td>`;
    })
  );
  if (topLevel) {
    return 'Object';
  }
  const tooltip = `{ ${Object.keys(value).join(', ')} }`;
  return `<a href="#shape-${ref}" title="${tooltip}">Object&thinsp;<sup>${ref}</sup></a>`;
}

let REF_COUNTER = 0;

function renderType(value, extraRows = [], depth = 0, topLevel = false) {
  if (!value) {
    return '';
  }
  const indent = Array(2 * depth + 1).join('&nbsp;');
  if (value.name in TYPES) {
    return TYPES[value.name];
  }
  if (value.name === 'enum') {
    return `One&nbsp;of… <br>\n${indent}&nbsp;&nbsp;${value.value
      .map(t => renderValue(t, depth + 1))
      .join(` <br>\n${indent}&nbsp;&nbsp;`)}`;
  }
  if (value.name === 'union') {
    return `One&nbsp;of… <br>\n${indent}&nbsp;&nbsp;${value.value
      .map(t => renderType(t, extraRows, depth + 1))
      .join(` <br>\n${indent}&nbsp;&nbsp;`)}`;
  }
  if (value.name === 'arrayOf' || value.name === 'objectOf') {
    return `${
      value.name === 'arrayOf' ? 'Array' : 'Object'
    }&nbsp;of… <br>\n${indent}&nbsp;&nbsp;${renderType(
      value.value,
      extraRows,
      depth + 1
    )}`;
  }
  if (value.name === 'shape') {
    return renderShape(value.value, extraRows, topLevel);
  }
  throw new Error(`Unsupported type: ${value.name}`);
}

const CODE_CHARS = {
  '\0': '<code title="null character">\\0</code>',
  '\t': '<code title="tab">\\t</code>',
  '\n': '<code title="line feed">\\n</code>',
  '\r': '<code title="carriage return">\\r</code>',
  '\u00A0': '<code title="non-breaking space">\\u00A0</code>'
};

function renderValue(value, indent = 0) {
  if (!value) {
    return '';
  }
  if (value.value === 'undefined') {
    return '';
  }
  if (value.value.match(/^\/.*\/[ig]*$/)) {
    return `<pre>${value.value}</pre>`;
  }
  if (value.value.match(/^true|false$/)) {
    return value.value;
  }
  if (value.value.match(/^[ \d./*+-]*$/)) {
    // eslint-disable-next-line no-eval
    return escape('' + eval(value.value));
  }
  if (value.value.match(/^"([^"]|[\\"])+"$/)) {
    // eslint-disable-next-line no-eval
    return escape(eval(value.value)).replace(/./g, match => {
      return CODE_CHARS[match] || match;
    });
  }
  if (value.value === '[]') {
    return `<code title="empty array">[]</code>`;
  }
  if (value.value === '{}') {
    return `<code title="empty object">{}</code>`;
  }
  return value.value;
}
