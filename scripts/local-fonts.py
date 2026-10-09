import pathlib
import re
import urllib.request

root = pathlib.Path('dist')
css = urllib.request.urlopen('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Italiana&display=swap').read().decode()
urls = list(dict.fromkeys(re.findall(r'url\((https://[^)]+)\)', css)))
for i, url in enumerate(urls):
    urllib.request.urlretrieve(url, root / 'assets' / f'font-{i}.ttf')
css = re.sub(r'url\((https://[^)]+)\)', lambda m: f'url(/assets/font-{urls.index(m.group(1))}.ttf)', css)
(root / 'fonts.css').write_text(css, encoding='utf-8')
style = root / 'style.css'
text = style.read_text(encoding='utf-8')
if text.startswith('@import'):
    style.write_text(text[text.index('\n')+1:], encoding='utf-8')
html = root / 'index.html'
text = html.read_text(encoding='utf-8')
if '/fonts.css' not in text:
    text = text.replace('<link rel="stylesheet" href="/style.css">', '<link rel="stylesheet" href="/fonts.css"><link rel="stylesheet" href="/style.css">')
    text = text.replace('<link rel="preload" href="/assets/hero.webp"', '<link rel="preload" href="/assets/font-3.ttf" as="font" type="font/ttf" crossorigin>\n  <link rel="preload" href="/assets/hero.webp"')
    html.write_text(text, encoding='utf-8')
print('All fonts stored locally.')
