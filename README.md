# LVGL UI Editor

Визуальный редактор интерфейсов LVGL, который генерирует **LispBM-код** для платы
[ESP32-P4 Dashboard](https://github.com/raskol092/VESC-Express-P4-Dash-) (VESC Express + мост LispBM ↔ LVGL).
Интерфейс на русском и английском, есть светлая и тёмная тема.

*English: a visual LVGL editor that generates LispBM code (`main.lisp` + `ui/`) ready to upload to the board.
Build and run instructions are below; the UI language can be switched in the header.*

## Что нужно

- **Node.js 20+** (проверено на 20 и 22) и npm
- современный браузер (Chrome, Edge, Firefox, Safari)

## Запуск для работы

```bash
git clone https://github.com/raskol092/lvgl-editor.git
cd lvgl-editor
npm ci              # установка зависимостей (или npm install)
npm run dev         # сервер разработки
```

Откройте адрес из консоли — обычно <http://localhost:5173>. Проекты хранятся в браузере (IndexedDB),
поэтому ничего настраивать не нужно.

## Сборка

```bash
npm run build:web   # готовый сайт в папке dist/
npm run preview     # посмотреть собранную версию (http://localhost:4173)
```

Папку `dist/` можно выложить на любой статический хостинг. Если сайт лежит не в корне домена,
задайте путь: `VITE_BASE_PATH=/my-app/ npm run build:web`.

> `npm run build` дополнительно запускает проверку типов `tsc -b`. В проекте пока есть старые
> предупреждения TypeScript (неиспользуемые переменные и т. п.), поэтому для сборки используйте `build:web`.

## Проверка

```bash
npm test            # unit-тесты (vitest)
npm run lint        # ESLint
```

## Публикация на GitHub Pages

При пуше в `main` workflow `.github/workflows/deploy-pages.yml` сам собирает и публикует сайт.
Один раз включите в репозитории **Settings → Pages → Source: GitHub Actions**.

## Как получить код для платы

1. **Новый проект** → экран **800×480** (размер дисплея платы) или свой размер.
2. Соберите интерфейс: компоненты добавляются кликом по палитре или перетаскиванием; картинки, иконки
   и шрифты — в **Ресурсах**; цвета — в **Темах**; поведение — во вкладке **Логика** и в событиях.
3. Кнопка **Скачать ZIP** создаёт архив:

   ```
   main.lisp                 точка входа
   ui/ui.lisp                экраны и виджеты
   ui/ui_events.lisp         обработчики событий
   ui/ui_logic.lisp          логика из вкладки «Логика»
   assets/*.bin, font/*.bin  картинки и шрифты в формате VESC
   ```

4. Откройте `main.lisp` в **VESC Tool** (вкладка Lisp) и нажмите **Upload** — строки `(import …)` упакуют
   остальные файлы. Плата должна быть прошита прошивкой с мостом LVGL
   (см. репозиторий [VESC-Express-P4-Dash-](https://github.com/raskol092/VESC-Express-P4-Dash-);
   для тем нужна версия с функцией `lv-theme-set`).

Вкладка **Код** показывает сгенерированные файлы без скачивания.

## Предпросмотр

Вкладка **Предпросмотр** запускает настоящую LVGL в браузере (WebAssembly). Готовая сборка лежит в
`public/wasm/`; пересобирать её нужно только при изменении `wasm/`:

```bash
# нужен Emscripten SDK (https://emscripten.org) и исходники LVGL v9.5
export EMSDK=$HOME/emsdk
export LVGL_DIR=$HOME/lvgl          # путь к LVGL (по умолчанию ищется ../lvgl рядом с wasm/)
./wasm/build.sh                     # результат копируется в public/wasm/
```

## Управление

| Действие | Как |
| --- | --- |
| Добавить компонент | клик по палитре или перетаскивание на холст |
| Масштаб холста | колесо мыши (в точке курсора) |
| Сдвиг холста | зажать пробел и тянуть |
| Изменить текст метки/кнопки/флажка | второй клик или двойной клик по компоненту |
| Выбрать картинку | клик по компоненту «Изображение» → выбрать в менеджере ресурсов |
| Растянуть с сохранением пропорций | тянуть за угол (изображение, дуга, слайдер и др.) |
| Отменить / повторить | Ctrl+Z / Ctrl+Y |
| Справка | F1 |

## Структура

```
src/codegen/lisp/     генератор LispBM (ui, события, логика, main.lisp, ресурсы)
src/components/       панели редактора (холст, свойства, логика, темы…)
src/resources/        менеджер картинок, иконок и шрифтов
src/i18n/             русский / английский
wasm/                 исходники предпросмотра LVGL (Emscripten)
```
