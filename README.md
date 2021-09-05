# translate-japanese
by enoatu

## How To Use
./src/

## 開発用インストール
ダウンロードする(7dtd verと mod バージョンも控える)

- Ravenhearst
  - https://gitlab.com/jaxteller718
  - https://gitlab.com/jaxteller718/rh_76_server/-/commits/main/
- DarknessFalls
  - https://gitlab.com/KhaineGB
  - https://gitlab.com/KhaineGB/darknessfallsa19client/-/commits/master/
- ZombieDayz
  - https://dev.azure.com/joshferrell/_git/ZombieDayz
  - https://dev.azure.com/joshferrell/_git/ZombieDayz/commits

mod をダウンロードし、"Mods" に移動し，ディレクトリ構造を保ったままコピーする
```
gfind . -type f -name "*ocalization*" | gsed "s/ /\\\ /g" | gsed "s/'/\\\'/g" | gxargs -i rsync -R {}  ../7dtd-mods-translater/resource/ZombieDayz/a19.6b-V9.2
```

実行する(すでに翻訳されていない場合はGoogle翻訳で翻訳される)
```
./src/translate.mjs --modname=Ravenhearst --modversion=a19.6b-7.6.1.2
./src/translate.mjs --modname=ZombieDayz --modversion=a19.6b-V9.2
./src/translate.mjs --modname=DarknessFalls --modversion=a19.6b-V3.6
```
