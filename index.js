const path = require('path');
const fs = require('fs');
const Crawler = require('crawler');

const file_path = path.join(process.cwd(), 'comments.json');

const comments = JSON.parse(fs.readFileSync(file_path));

const c = new Crawler({
    maxConnections : 1,
    rateLimit: 1000,
    jQuery: {
      name: 'cheerio',
      options: {
        xmlMode: true,
	normalizeWhitespace: true,
        decodeEntities: false,
      }
    },

    callback(error, res, done) {
        if(error){
            console.log(error);
        } else {
            const $ = res.$;
            console.log('parse', res.request.href);
            for (const comment of $('.tm-user-comments__comment').toArray()) {
              const user = $('.tm-user-info__user > a', comment).last();
              const data = user.text().trim();
              const url = user.attr('href').trim();
              const header = $('.tm-user-comments__header-link', comment)?.text().trim();
              const body = $('.tm-comment__body-content > div', comment)?.html().trim();
              if (! body) continue;

              const [ article_url, comment_hash ] = url.split('#');

              if (! comments[article_url]) comments[article_url] = { header, comments: {} };

              comments[article_url].comments[comment_hash] = { data, body };
            }

        }
        done();
    }
});


//const user = 'nin-jin';
const users = ['vintage'];

const max_pages = 1;

for (const user of users) {
  for (let i = 1; i <= max_pages; i++) {
    const url = `https://habr.com/ru/users/${user}/comments/page${i}/`;
    c.queue(url);
  }
}


c.on('drain', () => {
   fs.writeFileSync(file_path, JSON.stringify(comments, null, '  '));
   console.log(`${file_path} saved`);
});
