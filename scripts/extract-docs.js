#!/usr/bin/env node
const fs = require('fs');
const reactDocs = require('react-docgen');
const displayNameHandler = require('react-docgen-displayname-handler').default;

const files = ['src/index.js'];

const resolver = reactDocs.resolver.findAllComponentDefinitions;
const handlers = reactDocs.defaultHandlers.concat([displayNameHandler]);

console.log(
  JSON.stringify(
    files.reduce((output, file) => {
      const src = fs.readFileSync(file, 'utf8');
      const components = reactDocs.parse(src, resolver, handlers);
      components.forEach(component => {
        output[component.displayName] = component;
      });
      return output;
    }, {})
  )
);
