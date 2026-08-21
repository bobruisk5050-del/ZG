# Как добавлять контент — ZAGA GAME

## Фото клуба

Папка: `assets/club/`

- Главное фото: файл с именем **`hero.jpg`** (или `.png` / `.webp`)
- Остальные — любые имена → блок Atmosphere (до 3 фото)

**Через GitHub в браузере:** Upload files → Commit.  
GitHub Actions сам обновит `js/generated/club-images.js` (подожди ~1 минуту).

Локально (если есть Node): `npm run assets`

## Обложки игр

Папка: `assets/games/`

Имя файла ≈ название игры (`beat saber.png`, `gorn.png`…).  
В `js/games.js` поле `image: ""` — поиск обложки автоматический.

После загрузки файлов Actions обновит манифест сам.

## Новая игра (текст)

В `js/games.js` добавь объект в массив `ZAGA_GAMES` (см. README).

## Отзывы / цены / FAQ

- Отзывы: `js/reviews.js`
- Цены и FAQ: `js/main.js` (`PRICES`, `FAQ_DATA`)
