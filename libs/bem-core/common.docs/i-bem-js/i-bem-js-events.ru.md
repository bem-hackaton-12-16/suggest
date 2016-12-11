<a name="events"></a>
## События

В `i-bem.js` поддерживается два вида событий:

* **DOM-события** — события на DOM-узле, связанном с блоком или элементом.
  Отражают взаимодействие пользователя с интерфейсом (клик, наведение мыши, ввод текста и т.п.).
  DOM-события обычно обрабатывает тот экземпляр блока или элемента, на DOM-узлах которого они возникают.
* **БЭМ-события** — собственные события, генерируемые блоком или элементом.
  Позволяют организовать API для [взаимодействия с блоком][interact].
  БЭМ-события обычно обрабатывает экземпляр, отслеживающий состояние других блоков или элементов, на которых генерируются события.

DOM-события следует использовать только во взаимодействиях экземпляра со своим DOM-узлом или блока со своими элементами.
Для взаимодействия с другими блоками или элементами предназначены БЭМ-события.

<a name="dom-events"></a>
### DOM-события

Работа с DOM-событиями в `i-bem-dom` полностью реализована средствами фреймворка jQuery.

#### Подписка на DOM-события

##### Из экземпляра

Для подписки на DOM-события из экземпляра служит метод `_domEvents()`, создающий специальный объект
[менеджера событий](#manager).
Метод принимает один опциональный параметр, задающий контекст, который может быть разных типов:

* `elemInstance` `{Elem|BemDomCollection}` – экземпляр или коллекция элементов.
* `elemClass` `{String|Function|Object}` — класс, имя или описание элемента.
  Описанием служит хеш вида `{ elem : MyElem, modName : 'my-mod', modVal : 'my-val' }` или `{ elem : 'my-elem', modName : 'my-mod', modVal : 'my-val' }`.
* `document` `{Document|jQuery}` — документ
* `window` `{Window|jQuery}` — окно

[Менеджер событий](#manager) обладает необходимым интерфейсом для подписки на события и отписки от них.

**Пример:** В момент [инициализации экземпляра блока][init] `my-block` выполняется подписка на событие `click`,
при наступлении которого блок выставляет себе [модификатор][states] `size` в значение `big`.

```js
bemDom.declBlock('my-block', {
    onSetMod : {
        'js' : {
            'inited': function() {
                this._domEvents().on('click', function() {
                    this.setMod('size', 'big');
                });
            }
        }
    }
});
```

**Пример:** При [инициализации экземпляра блока][init] `my-form` выполняется подписка на событие `click` элемента `button`,
при наступлении которого будет вызвана функция-обработчик `_onSubmit`.

```js
bemDom.declBlock('my-form', {
    onSetMod : {
        'js' : {
            'inited': function() {
                this._domEvents('button').on('click', this._onSubmit);
            }
        }
    },

    _onSubmit : function() { /* ... */ }
});
```

***

**NB** Функция-обработчик выполняется в контексте того экземпляра, от которого создавался
[менеджер событий](#manager).

***

##### Из класса

Для подписки на DOM-события из класса служит статический метод `_domEvents()`, создающий специальный объект
[менеджера событий](#manager).
Метод принимает один опциональный параметр, задающий контекст, который может быть разных типов:

* `elemClass` `{String|Function|Object}` — класс, имя или описание элемента.
  Описанием служит хеш вида `{ elem : MyElem, modName : 'my-mod', modVal : 'my-val' }` или `{ elem : 'my-elem', modName : 'my-mod', modVal : 'my-val' }`.
* `document` `{Document|jQuery}` — документ
* `window` `{Window|jQuery}` — окно

[Менеджер событий](#manager) обладает необходимым интерфейсом для подписки на события и отписки от них.

**Пример:** При [инициализации класса блока][init-class] `my-form` выполняется подписка на событие `click` всех элементов `button` внутри любого блока `my-form`,
при наступлении которого выполнится инициализация блока `my-form` (если он уже не проинициализирован) и у полученного экземпляра будет вызвана функция-обработчик `_onSubmit`.

```js
bemDom.declBlock('my-form', {
    _onSubmit : function() { /* ... */ }
}, {
    lazyInit : true,

    onInit : function() {
        this._domEvents('button').on('click', this.prototype._onSubmit);
    }
});
```

***

**NB** Функция-обработчик выполняется в контексте того экземпляра, внутри которого случилось событие.

***

#### Удаление подписки на DOM-событие

Удаление подписки на DOM-события выполняется автоматически при уничтожении экземпляра.
Тем не менее, с помощью [менеджера событий](#manager) можно удалить подписки вручную во время работы экземпляра.

```js
_stopKeysListening : function() {
    this._domEvents().un('keydown', this._onKeydown);  // удаляем обработчик события 'keydown'
}
```

#### Объект DOM-события

Первым аргументом функция-обработчик получает jQuery-объект DOM-события — [`{jQuery.Event}`](https://api.jquery.com/category/events/event-object/).

Это позволяет использовать методы объекта `stopPropagation` и `preventDefault` для управления всплытием события и реакцией на него браузера.

```js
bemDom.declBlock('my-form', {
    onSetMod : {
        'js' : {
            'inited': function() {
                this._domEvents('button').on('click', function(e) {
                    e.stopPropagation(); // останавливаем всплытие события
                    this._onSubmit();
                });
            }
        }
    },

    _onSubmit : function() {
        /* ... */
    }
});
```

<a name="bem-events"></a>
### БЭМ-события

В отличие от DOM-событий, БЭМ-события генерируются не на DOM-элементах, а на **экземплярах** блоков и элементов.

<a name="bem-events-subscribe"></a>
#### Генерация БЭМ-события

Для генерации БЭМ-события используется метод экземпляра `_emit(event, [data])`.

* `event` `{String|events:Event}` — имя или объект события.
* `[data]` `{*}` — дополнительные данные для события, которые будут доступны во втором аргументе обработчика.

При взаимодействие пользователя с элементом управления блока возникают DOM-события.
В ходе их обработки блоком можно создавать БЭМ-события. Это позволяет реализовать уровень абстракции над DOM-событиями.

Например, при клике по кнопке `button` (DOM-событие `click`) **БЭМ-событие** `click` генерируется только в том случае,
если у блока в этот момент не установлен модификатор `disabled`:

```js
bemDom.declBlock('button', {
    onSetMod: {
        'js': {
            'inited': function() {
                this._domEvents().on('click', this._onClick); // подписка на DOM-событие "click"
            }
        }
    },

    _onClick: function() {
        if(!this.hasMod('disabled')) {
            this._emit('click'); // создание БЭМ-события "click"
        }
    }
});
```

<a name="bem-events-subscribe"></a>
#### Подписка на БЭМ-события

##### Из экземпляра

Для подписки на БЭМ-события из экземпляра служит метод `_events()`, создающий специальный объект
[менеджера событий](#manager).
Метод принимает один опциональный параметр, задающий контекст, который может быть разных типов:

* `entityInstance` `{Elem|BemDomCollection}` – экземпляр или коллекция БЭМ-сущностей.
* `entityClass` `{String|Function|Object}` — класс, имя или описание БЭМ-сущности.
  Описанием служит хеш вида
  `{ block : MyBlock, modName : 'my-mod', modVal : 'my-val' }`,
  `{ elem : MyElem, modName : 'my-mod', modVal : 'my-val' }`
  или `{ elem : 'my-elem', modName : 'my-mod', modVal : 'my-val' }`.

[Менеджер событий](#manager) обладает необходимым интерфейсом для подписки на события и отписки от них, в том числе для работы
с [событиями на изменения модификатора](#manager-mods).

**Пример:** В момент инициализации HTML-формы (экземпляра блока `my-form`) выполняется поиск вложенной в форму кнопки `button` и подписка на ее БЭМ-событие `click`.
В результате при нажатии на кнопку (экземпляр блока `button`) будет выполнен метод `_onSubmit` формы (экземпляр блока `my-form`).

```js
modules.define('my-form', ['i-bem-dom', 'button'], function(provide, bemDom, Button) {

provide(bemDom.declBlock(this.name, {
    onSetMod: {
        'js': {
            'inited': function() {
                this._events(this.findChildBlock(Button))
                    .on('click', this._onSubmit);
            }
        }
    },

    _onSubmit: function() { /* ... */ }
}));

});
```

##### Из класса

Для подписки на БЭМ-события из класса служит статический метод `_events()`, создающий специальный объект
[менеджера событий](#manager).
Метод принимает один опциональный параметр, задающий контекст, который может быть разных типов:

* `entityClass` `{String|Function|Object}` — класс, имя или описание БЭМ-сущности.
  Описанием служит хеш вида
  `{ block : MyBlock, modName : 'my-mod', modVal : 'my-val' }`,
  `{ elem : MyElem, modName : 'my-mod', modVal : 'my-val' }`
  или `{ elem : 'my-elem', modName : 'my-mod', modVal : 'my-val' }`.

[Менеджер событий](#manager) обладает необходимым интерфейсом для подписки на события и отписки от них, в том числе для работы
с [событиями на изменения модификатора](#manager-mods).

**Пример:** При [инициализации класса блока][init-class] `my-form` выполняется подписка на событие `click`
любого блока `button` внутри любого `my-form`,
при наступлении которого выполнится инициализация блока `my-form` (если он уже не проинициализирован)
и у полученного экземпляра будет вызвана функция-обработчик `_onSubmit`.

```js
modules.define('my-form', ['i-bem-dom', 'button'], function(provide, bemDom, Button) {

provide(bemDom.declBlock(this.name, {
    _onSubmit: function() { /* ... */ }
}, {
    lazyInit : true,

    onInit : function() {
        this._events(Button).on('click', this.prototype._onSubmit);
    }
}));

});
```

***

**NB** Функция-обработчик выполняется в контексте того экземпляра класса, производящего подписку, внутри которого случилось событие.

***

<a name="manager"></a>
### Объект менеджера событий

Менеджер событий служит для унификации работы со всеми видами событий.
Обладает API:

Метод `on(event, [data], fn)` служит для подписки на событие `event`,
обработчика `fn`, с возможностью передачи опциональных данных `data`. Принимает аргументы:

* `event` `String|Object` — имя события, хеш для [события при изменении модификатора](#manager-mods),
  или объект события (`jQuery.Event` для DOM-событий или `events:Event` для БЭМ-событий).
* `[data]` `*` — дополнительные данные для события, которые будут доступны в поле `data` объекта события.
* `fn` `Function` — функция-обработчик события.

Метод `once(event, [data], fn)` служит для единоразовой подписки на событие `event`,
обработчика `fn`, с возможностью передачи опциональных данных `data`. Аргументы аналогичны методу `on()`.

Метод `un([event], [fn])` служит для удаления подписки на события. Принимает аргументы:

* `[event]` `String|Object` — опциональное имя события, хеш для [события при изменении модификатора](#manager-mods),
  или объект события (`jQuery.Event` для DOM-событий или `events:Event` для БЭМ-событий).
  В случае, если аргумент не указан, происходит удаление подписок на все события.
* `[fn]` `Function` — функция-обработчик события. В случае, если аргумент не указан, происходит удаление
  всех обработчиков события `event`.

<a name="manager-mods"></a>
#### События при изменении модификаторов

В случае с БЭМ-событиями, существуют специальные события на изменение модификаторов, которые генерируются автоматически.
Для работы с такими событиями используется специальный хеш с полями:

* `modName` `{String}` – имя модификатора.
* `modVal` `{String}` – значение модификатора. Со значением `*` производится подписка на установку модификатора
  в **любое** значение. Со значением `''` – на **удаление** модификатора.

**Пример:** В момент инициализации блок `my-form` подписывается на событие изменения модификатора у вложенного блока `button`.
К примеру, можно подписаться на:

* установку модификатора `disabled` в любое значение;

```js
modules.define('my-form', ['i-bem-dom', 'button'], function(provide, bemDom, Button) {

bemDom.declBlock('form', {
    onSetMod: {
        'js': {
            'inited': function() {
                this._event(this.findChildBlock(Button))
                    .on({ modName : 'disabled', modVal : '*' }, this._onButtonDisabledChange);
            }
        }
    },

    _onButtonDisabledChange() {}
});

});
```

* установку модификатора `'disabled'` в значение `'true'`;

```js
this._event(this.findChildBlock(Button)).on({ modName : 'disabled', modVal : 'true' }, this._onButtonDisable);
```

* удаление модификатора `'disabled'`;

```js
this._event(this.findChildBlock(Button)).on({ modName : 'disabled', modVal : '' }, this._onButtonEnable);
```

<a name="event"></a>
### Объект БЭМ-события

При вызове функция-обработчик получает аргументом объект, описывающий БЭМ-событие.
Класс объекта БЭМ-события `events.Event` определен в [ym][]-модуле [`events`](../../common.blocks/events/events.ru.md) библиотеки bem-core.
Объект содержит поля:

* `type` `{String}` — тип события. Аналогично [jQuery.Event.type](https://api.jquery.com/event.type/).
* `target` `{i-bem-dom:Entity}` — экземпляр блока или элемнта, в котором произошло БЭМ-событие.
* `data` `{*}` — произвольные дополнительные данные, переданные как аргумент `data` при подписке на БЭМ-событие.
* `result` `{*}` — последнее значение, возвращенное обработчиком данного события.
  Аналогично [jQuery.Event.result](https://api.jquery.com/event.result/).


[ym]: https://github.com/ymaps/modules

[i-bem]: https://ru.bem.info/libs/bem-core/current/desktop/i-bem/jsdoc/

[i-bem__dom]: https://ru.bem.info/libs/bem-core/current/desktop/i-bem/jsdoc/

[decl]: ./i-bem-js-decl.ru.md

[dom]: ./i-bem-js-dom.ru.md

[states]: ./i-bem-js-states.ru.md

[events]: ./i-bem-js-states.ru.md

[init]: ./i-bem-js-init.ru.md

[init-lazy]: ./i-bem-js-init.ru.md#init-lazy

[init-class]: ./i-bem-js-init.ru.md#init-class

[interact]: ./i-bem-js-interact.ru.md
