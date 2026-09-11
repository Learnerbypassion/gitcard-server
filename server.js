const express = require('express');

const portraitRoute = require('./routes/portrait');
const statsRoute = require('./routes/stats');
const projectsRoute = require('./routes/projects');

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
      '  GET /api/section/portrait?username=<user>&theme=<github-dark|light|aurora|cyber>',
      '  GET /api/section/stats?username=<user>&theme=<...>',
      '  GET /api/section/projects?username=<user>&theme=<...>&repos=owner/repo,owner/repo2',
      '',
      'Embed in a README like:',
      '  ![Portrait](https://YOUR-APP.onrender.com/api/section/portrait?username=octocat&theme=github-dark)'
    ].join('\n')
  );
});

app.use('/api/section/portrait', portraitRoute);
app.use('/api/section/stats', statsRoute);
app.use('/api/section/projects', projectsRoute);

app.listen(PORT, () => {
  console.log(`gitcard-server listening on port ${PORT}`);
});
