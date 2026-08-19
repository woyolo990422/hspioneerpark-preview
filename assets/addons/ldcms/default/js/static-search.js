
(function () {
  var input = document.getElementById('static-search');
  var form = input && input.form;
  var results = document.getElementById('search-results');
  var summary = document.getElementById('search-summary');
  var entries = [];
  fetch('search-index.json').then(function (response) { return response.json(); }).then(function (data) {
    entries = data;
    var query = new URLSearchParams(location.search).get('search') || '';
    input.value = query;
    if (query) render(query);
  });
  function render(query) {
    var keyword = query.trim().toLowerCase();
    var matches = keyword ? entries.filter(function (entry) { return (entry.title + ' ' + entry.description + ' ' + entry.text).toLowerCase().includes(keyword); }).slice(0, 50) : [];
    summary.textContent = keyword ? '找到 ' + matches.length + ' 个相关页面' : '请输入关键词';
    results.innerHTML = '';
    matches.forEach(function (entry) {
      var article = document.createElement('article');
      var link = document.createElement('a');
      link.href = entry.path === '/' ? 'index.html' : entry.path.replace(/^\//, '');
      link.textContent = entry.title;
      var paragraph = document.createElement('p');
      paragraph.textContent = entry.description || entry.text.slice(0, 140);
      article.append(link, paragraph);
      results.appendChild(article);
    });
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var query = input.value.trim();
    history.replaceState(null, '', query ? '?search=' + encodeURIComponent(query) : 'search.html');
    render(query);
  });
})();
