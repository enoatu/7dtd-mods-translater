# translate-japanese
by enoatu

## How To Use
./src/

## 開発用インストール
7Days To Die のMods で以下でディレクトリ構造を保ったままコピーする
```
find . -type f -name "*Local*" | sed "s/ /\\\ /g" | sed "s/'/\\\'/g" | xargs -i rsync -R {}  ../7dtd-rh-localization-japanese/resource
```
