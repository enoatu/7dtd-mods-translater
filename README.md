# translate-japanese
by enoatu

## How To Use
./src/

## 開発用インストール
7Days To Die のMods でディレクトリ構造を保ったままコピーする
```
gfind . -type f -name "*ocalization*" | gsed "s/ /\\\ /g" | gsed "s/'/\\\'/g" | gxargs -i rsync -R {}  ../7dtd-rh-localization-japanese/resource && cd ../7dtd-rh-localization-japanese
```
実行する(すでに翻訳されていない場合はGoogle翻訳で翻訳される)
```
./src/translate.mjs --modname=Ravenhearst --modversion=7.6.1.2
```
result-に書き出されているので、
7Days To Die のMods に上書きする
```
rsync -R {} ./output ../Mods
```
