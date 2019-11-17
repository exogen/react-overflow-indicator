const execa = require('execa');

module.exports = {
  transforms: {
    COMPONENTS() {
      const json = execa.sync('scripts/extract-docs.js').stdout;
      const markdown = execa.sync('scripts/markdown-docs.js', {
        input: json
      }).stdout;
      return markdown;
    }
  }
};
