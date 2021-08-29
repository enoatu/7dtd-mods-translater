# translate-japanese
by enoatu

## How To Use
./src/

## 開発用インストール
7Days To Die のMods でディレクトリ構造を保ったままコピーする
```
find . -type f -name "*Local*" | sed "s/ /\\\ /g" | sed "s/'/\\\'/g" | xargs -i rsync -R {}  ../7dtd-rh-localization-japanese/resource
```
実行する(すでに翻訳されていない場合はGoogle翻訳で翻訳される)
```
./src/translate.mjs
```
result-に書き出されているので、
7Days To Die のMods に上書きする
