const exphbs = require('express-handlebars');

module.exports = exphbs.create({
  extname: 'hbs',
  defaultLayout: 'main',
  // create custom helpers
  helpers: {
    truncate(str) {
      if (str.length > 20) {
        str = str.substr(0, 20) + '..';
      }
      return str;
    },
    href(board) {
      return `href="/boards/${board}"`;
    },
    onclick(board, id) {
      return `onclick="window.location = '/${board}/${id}'"`;
    }
  }
});
