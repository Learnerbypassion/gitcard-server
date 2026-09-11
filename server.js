const express = require('express');

const portraitRoute = require('./routes/portrait');
const statsRoute = require('./routes/stats');
const projectsRoute = require('./routes/projects');
const languagesRoute = require('./routes/languages');
const heroRoute = require('./routes/hero');
const briefRoute = require('./routes/brief');
const evaluateRoute = require('./routes/evaluate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
  res.type('text/plain').send(
    [
      'gitcard-server is running.',
      '',
      'Endpoints:',
      '  GET /api/section/hero?username=<user>&theme=<github-dark|light|aurora|cyber>',
      '  GET /api/section/brief?username=<user>&theme=<...>',
      '  GET /api/section/evaluate?username=<user>&theme=<...>',
      '  GET /api/section/portrait?username=<user>&theme=<...>',
      '  GET /api/section/stats?username=<user>&theme=<...>',
      '  GET /api/section/projects?username=<user>&theme=<...>&repos=owner/repo,owner/repo2',
      '  GET /api/section/languages?username=<user>&theme=<...>',
      '',
      'Embed in a README like:',
      '  ![Hero](https://YOUR-APP.onrender.com/api/section/hero?username=learnerbypassion&theme=github-dark)'
    ].join('\n')
  );
});

app.use('/api/section/hero', heroRoute);
app.use('/api/section/brief', briefRoute);
app.use('/api/section/bio', briefRoute);
app.use('/api/section/evaluate', evaluateRoute);
app.use('/api/section/quick-look', evaluateRoute);
app.use('/api/section/portrait', portraitRoute);
app.use('/api/section/stats', statsRoute);
app.use('/api/section/projects', projectsRoute);
app.use('/api/section/languages', languagesRoute);
app.use('/api/section/toolkit', languagesRoute);
app.use('/api/section/stack', languagesRoute);

app.listen(PORT, () => {
  console.log(`gitcard-server listening on port ${PORT}`);
});
