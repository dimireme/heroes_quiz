
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement !== 'undefined') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set() {
                // overridden by instance, if it has props
            }
        };
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var list = [{id:0,question:{text:"У кого из героев 4 руки?",img:null},answers:[{text:"Данте",img:null}]},{id:1,question:{text:"Какой герой из героического сундука сразу с абсолютной звездой?",img:null},answers:[{text:"Тесак",img:null}]},{id:2,question:{text:"У какого из перечисленных героев нет Звездного облика?",img:null},answers:[{text:"Маркус",img:null}]},{id:3,question:{text:"Как выглядит портрет героя «Джинджер»?",img:null},answers:[{text:"1 (порядок ответов меняется)",img:null}]},{id:4,question:{text:"Что можно получить, если продать предметы экипировки героев?",img:null},answers:[{text:"Золото",img:null}]},{id:5,question:{text:"Какой характеристикой не обладают герои?",img:null},answers:[{text:"Универсальность",img:null}]},{id:6,question:{text:"Сколько длиться экспедиция в город ангелов?",img:null},answers:[{text:"3 часов",img:null}]},{id:7,question:{text:"У кого из перечисленных героев нет зимнего облика?",img:null},answers:[{text:"Данте",img:null}]},{id:8,question:{text:"Какого цвета капюшон у тесака?",img:null},answers:[{text:"Красный",img:null}]},{id:9,question:{text:"Кто может принять участие в специальных событиях в игре?",img:null},answers:[{text:"Все игроки",img:null}]},{id:10,question:{text:"Что означает цифра рядом с аватаркой в игре?",img:null},answers:[{text:"Уровень команды",img:null}]},{id:11,question:{text:"У кого из героев есть летучая мышь?",img:null},answers:[{text:"Дориан",img:null}]},{id:12,question:{text:"Где можно узнать обо всех изменениях в Доминионе?",img:null},answers:[{text:"Группа Хроники Хаоса",img:null}]},{id:13,question:{text:"Как звали брата Цин Мао?",img:null},answers:[{text:"Цин Лун",img:null}]},{id:14,question:{text:"Какое любимое блюдо у Чаббы?",img:null},answers:[{text:"Отбивная по-хаалански",img:null}]},{id:15,question:{text:"К какому племени принадлежит Джу?",img:null},answers:[{text:"Зараккар",img:null}]},{id:16,question:{text:"Кто из перечисленных героев не пользуется посохом?",img:null},answers:[{text:"Моджо",img:null}]},{id:17,question:{text:"В какой школе учился Безликий?",img:null},answers:[{text:"Школа Мистиков",img:null}]},{id:18,question:{text:"Какой предмет необходим для прокачки уровней титанов?",img:null},answers:[{text:"Зелье титана",img:null}]},{id:19,question:{text:"Какой стихии Титанов нет в Доминионе?",img:null},answers:[{text:"Воздух",img:null}]},{id:20,question:{text:"Как выглядит предмет под названием «рука славы»?",img:null},answers:[{text:"1 (порядок ответов меняется)",img:null}]},{id:21,question:{text:"Как выглядит портрет под название «Безликий»?",img:null},answers:[{text:"2 (порядок ответов меняется)",img:null}]},{id:22,question:{text:"У какого из перечисленных героев нет ангельского облика?",img:null},answers:[{text:"Гелиос",img:null}]},{id:23,question:{text:"Какая фамилия у Джинджер?",img:null},answers:[{text:"Хейс",img:null}]},{id:24,question:{text:"Кем была убита Кира?",img:null},answers:[{text:"Мортхрон",img:null}]},{id:25,question:{text:"Где можно включить звук в игре?",img:null},answers:[{text:"Настройки",img:null}]},{id:26,question:{text:"Нарисованный предмет (ружье)?",img:null},answers:[{text:"Големский крепкобой",img:null}]},{id:27,question:{text:"Чего пока не дарит Валькирия?",img:null},answers:[{text:"Ядро хаоса",img:null}]},{id:28,question:{text:"Сколько уровней в игре Хроники хаоса?",img:null},answers:[{text:"120 уровней",img:null}]},{id:29,question:{text:"Кто из перечисленных героев использует полупрозрачное оружие?",img:null},answers:[{text:"Аврора",img:null}]},{id:30,question:{text:"Кто изображен на рисунке?",img:null},answers:[{text:"Тесак",img:null}]},{id:31,question:{text:"Что из перечисленного не появилось в Доминионе?",img:null},answers:[{text:"Питомец",img:null}]},{id:32,question:{text:"Фанатом какой музыкальной композиции, скорее всего станет Тесак?",img:null},answers:[{text:"Ярость мясника",img:null}]},{id:33,question:{text:"Какая фамилия у Корнелиуса?",img:null},answers:[{text:"Витт",img:null}]},{id:34,question:{text:"На сколько камней душ меняется один камень в магазине камней душ?",img:null},answers:[{text:"100",img:null}]},{id:35,question:{text:"За какие трофеи войны гильдий можно приобрести Зелье Титана?",img:null},answers:[{text:"Бронзовый трофей войны гильдий",img:null}]},{id:36,question:{text:"На какой карте в кампании Базальты?",img:null},answers:[{text:"Раскаленное сердце",img:null}]},{id:37,question:{text:"Как называется родная планета Карха?",img:null},answers:[{text:"Даган-Нур",img:null}]},{id:38,question:{text:"Как называется любимое оружие Джинжер?",img:null},answers:[{text:"Нобиль",img:null}]},{id:39,question:{text:"Кого из героев можно получить из сундука с полной звездностью?",img:null},answers:[{text:"Тесак",img:null}]},{id:40,question:{text:"Какие герои ходят по главной площади?",img:null},answers:[{text:"Команда защиты арены",img:null}]},{id:41,question:{text:"Какая из этих миссий в главе Искаженная?",img:null},answers:[{text:"Печать огня",img:null}]},{id:42,question:{text:"Кто из героев не держит оружие в каждой руке?",img:null},answers:[{text:"Маркус",img:null}]},{id:43,question:{text:"В какой из глав мисс Роковой перевал?",img:null},answers:[{text:"Кристальный престол",img:null}]},{id:44,question:{text:"В какой из глав кампании миссия Темные воды?",img:null},answers:[{text:"Проклятые воды",img:null}]},{id:45,question:{text:"Какого типа урона нет в игре?",img:null},answers:[{text:"Ментальный урон",img:null}]},{id:46,question:{text:"Какого рейтинга пока нет в игре?",img:null},answers:[{text:"Дар Стихий",img:null}]},{id:47,question:{text:"Какой сервер открылся последний?",img:null},answers:[{text:"С наибольшим номером",img:null}]},{id:48,question:{text:"Что из перечисленного появилось в игре позже всего?",img:null},answers:[{text:"Долина Титанов",img:null}]},{id:49,question:{text:"Сколько энергии можно получить использовав предмет Энергия в бутылке?",img:null},answers:[{text:"200",img:null}]},{id:50,question:{text:"Сколько опыта можно получить использовав Большое зелье опыта?",img:null},answers:[{text:"1500",img:null}]},{id:51,question:{text:"В какой день недели можно сразиться с любым боссом в запределье?",img:null},answers:[{text:"В воскресенье",img:null}]},{id:52,question:{text:"Кому отводится победа на ГА если обе команды живы?",img:null},answers:[{text:"Защищающемуся игроку",img:null}]},{id:53,question:{text:"Какого ранга нет в игре?",img:null},answers:[{text:"Зеленый +2",img:null}]},{id:54,question:{text:"Как называется предмет (зеленая перчатка)?",img:null},answers:[{text:"Пробиватель стен",img:null}]},{id:55,question:{text:"Как выглядит предмет под названием «потерянное кольцо»?",img:null},answers:[{text:"Желтое кольцо",img:null}]},{id:56,question:{text:"Как называется предмет фиол дудка?",img:null},answers:[{text:"Песнь сирены",img:null}]},{id:57,question:{text:"Из чего не могут состоять предметы экипировки героев?",img:null},answers:[{text:"Руны",img:null}]},{id:58,question:{text:"У кого из этих героев нет капюшона?",img:null},answers:[{text:"Цин Мао",img:null}]},{id:59,question:{text:"У кого из героев нет маски?",img:null},answers:[{text:"Пеппи",img:null}]},{id:60,question:{text:"У кого из героев нет маски?",img:null},answers:[{text:"Арахна",img:null}]},{id:61,question:{text:"Кто из перечисленных героев не пользуется посохом?",img:null},answers:[{text:"Моджо",img:null}]},{id:62,question:{text:"У кого из героев нет чемпионского облика?",img:null},answers:[{text:"Зири",img:null}]},{id:63,question:{text:"У кого из перечисленных героев нет механического облика?",img:null},answers:[{text:"Зири",img:null}]},{id:64,question:{text:"Кто из этих героев в базовом облике носит шляпу?",img:null},answers:[{text:"Фобос",img:null}]},{id:65,question:{text:"Откуда начинают свое пути шествие герои?",img:null},answers:[{text:"Пепельная тропа",img:null}]},{id:66,question:{text:"В какой из глав находиться миссия «Вечная ночь»?",img:null},answers:[{text:"Царство хаоса",img:null}]},{id:67,question:{text:"Какая из этих миссий в главе Искаженная магия?",img:null},answers:[{text:"Лавовый разлом",img:null}]},{id:68,question:{text:"В какой из глав мисс Роковой перевал?",img:null},answers:[{text:"Кристальный престол",img:null}]},{id:69,question:{text:"Сколько уровней находиться между двумя точками сохранения в Подземелье?",img:null},answers:[{text:"10",img:null}]},{id:70,question:{text:"Камни душ какого титана нельзя получить в подземелье?",img:null},answers:[{text:"Гиперреон",img:null}]},{id:71,question:{text:"За сколько Артефактных монет можно продать фрагмент любого артефакта?",img:null},answers:[{text:"50",img:null}]},{id:72,question:{text:"Как называется этот артефакт (красная книга)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/115-min.jpg",alt:"Кодекс воина, артефакт игры Хроники хаоса"}},answers:[{text:"Кодекс война",img:null}]},{id:73,question:{text:"Какой максимальный уровень артификтного сундука?",img:null},answers:[{text:"10",img:null}]},{id:74,question:{text:"У кого из героев оружие только в одной руке?",img:null},answers:[{text:"Эльмир",img:null}]},{id:75,question:{text:"Что нельзя купить за трофеи войны гильдий?",img:null},answers:[{text:"Искра мощи",img:null}]},{id:76,question:{text:"В какой из глав находиться миссия «Гнилой овраг»?",img:null},answers:[{text:"Плато Хардана",img:null}]},{id:77,question:{text:"Какая из этих миссий находиться в Главе «Нордланд»?",img:null},answers:[{text:"Вечная мерзлота",img:null}]},{id:79,question:{text:"Каким образом нельзя получить бронзовый трофей войны гильдий?",img:null},answers:[{text:"Награда в экспедиции",img:null}]},{id:80,question:{text:"Как называется этот артефакт ?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/109-min.jpg",alt:""}},answers:[{text:"Посох возрождения",img:null}]},{id:81,question:{text:"Какая из этих миссий находиться в Главе «Нордланд»?",img:null},answers:[{text:"Старые доки",img:null}]},{id:82,question:{text:"Какой Артефакт принадлежит Пеппи?",img:null},answers:[{text:"Кольцо интеллекта",img:null},{text:"Подружка-вертушка",img:null},{text:"Манускрипт пустоты",img:null}]},{id:83,question:{text:"С какого уровня команды можно попасть на гранд арену?",img:null},answers:[{text:"50",img:null}]},{id:84,question:{text:"Сколько сундуков можно открыть в башне за день?",img:null},answers:[{text:"45",img:null}]},{id:85,question:{text:"Как называется этот предмет (синий шит)?",img:null},answers:[{text:"Щит следопыта",img:null}]},{id:86,question:{text:"Как зовут этого героя ?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/643-3.jpg",alt:"Герой Эльмир, игра Хроники Хаоса"}},answers:[{text:"Эльмир",img:null}]},{id:87,question:{text:"Как выглядит портрет героя по имени «Криста»?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/110-min.jpg",alt:"Иконка героя Криста в игре Хроники хаоса"}}]},{id:88,question:{text:"Как выглядит портрет героя по имени Карх?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/111-min.jpg",alt:"Портрет героя Карх в игре Хроники хаоса"}}]},{id:89,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/113-min.jpg",alt:"Артефакт у Маркуса в игре Хроники хаоса"}},answers:[{text:"Маркус",img:null}]},{id:90,question:{text:"У кого из героев не весеннего облика?",img:null},answers:[{text:"Тея",img:null}]},{id:91,question:{text:"Кто из этих героев может сражаться с воздушным шариком в руке?",img:null},answers:[{text:"Йорген",img:null}]},{id:92,question:{text:"Как выглядит портрет титана по имени «Молох»?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/114-min.jpg",alt:"Молох титан в игре Хроники хаоса"}}]},{id:93,question:{text:"Как выглядит портрет титана по имени «Ангус»?",img:null},answers:[{text:"Танк стихии земля",img:null}]},{id:94,question:{text:"Какая миссия находится в главе Бескрайние снега?",img:null},answers:[{text:"Скользкий путь",img:null}]},{id:95,question:{text:"Сущность Карха?",img:null},answers:[{text:"Первый арт у Карха многоглазая штука",img:null}]},{id:96,question:{text:"Грозовой оберег?",img:null},answers:[{text:"Первый арт у Кристы палица с тремя кристаллами",img:null}]},{id:97,question:{text:"Ветвь Анчара?",img:null},answers:[{text:"Зеленая ветвь",img:null}]},{id:98,question:{text:"Безмолвный хранитель?",img:null},answers:[{text:"Зеленый посох с черепом козы",img:null}]},{id:99,question:{text:"Как зовут этого титана?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/116-min.jpg",alt:"Игнис титан огня в игре Хроники хаоса"}},answers:[{text:"Игнис",img:null}]},{id:100,question:{text:"Сколько душ героя нужно для эволюции до абсолютной звезды?",img:null},answers:[{text:"300",img:null}]},{id:101,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/117-min.jpg",alt:"Артефакт Небулы из игры Хроники хаоса"}},answers:[{text:"Небула",img:null}]},{id:102,question:{text:"Где нельзя получить зелье титанов?",img:null},answers:[{text:"Круг призыва",img:null}]},{id:103,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/118-min.jpg",alt:"Артефакт Джу игра Хроники хаоса"}},answers:[{text:"Джу",img:null}]},{id:104,question:{text:"Какой артефакт принадлежит этому герою (Руфус)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/119-min.jpg",alt:"Руфис герой игры Хроники хаоса"}},answers:[{text:"Кольцо силы",img:null},{text:"Щит Ракаши",img:null}]},{id:105,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/120-min.jpg",alt:"Артефакт Тесака в игре Хроники хаоса"}},answers:[{text:"Тесак",img:null}]},{id:106,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/121-min.jpg",alt:"Артефакт Эльмира в игре Хроники хаоса"}},answers:[{text:"Эльмир",img:null}]},{id:107,question:{text:"Какая из этих миссий находится в главе Царство хаоса?",img:null},answers:[{text:"Цветы мандрагоры",img:null}]},{id:108,question:{text:"Какая из этих миссий находится в главе Архипелаг?",img:null},answers:[{text:"Отмель Грига",img:null}]},{id:109,question:{text:"В какой из глав находится миссия Лавовый разлом?",img:null},answers:[{text:"Искаженная магия",img:null}]},{id:110,question:{text:"Как выглядит иконка умения Умная стрела?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/23-min.jpg",alt:"Умение Умная стрела в игре Хроники хаоса"}}]},{id:111,question:{text:"Как выглядит иконка умения рикошет?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/129-min.jpg",alt:"Умение рикошет в игре Хроники хаоса"}}]},{id:112,question:{text:"Как выглядит иконка умения Армагеддон?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/130.jpg",alt:"Иконка умения Армагеддон в игре Хроники хаоса"}}]},{id:113,question:{text:"Какой артефакт принадлежит этому герою (Карх)?",img:null},answers:[{text:"Фолиант алхимика",img:null},{text:"Сущность Карха",img:null},{text:"Кольцо ловкости",img:null}]},{id:114,question:{text:"В какой из глав находится миссия Мелководье?",img:null},answers:[{text:"Проклятые воды",img:null}]},{id:115,question:{text:"В какой из глав находится миссия Спасительный рывок?",img:null},answers:[{text:"Проклятые воды",img:null}]},{id:116,question:{text:"В какой из глав находится миссия «Поселок камнетесов»?",img:null},answers:[{text:"Кристальный престол",img:null}]},{id:117,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/131-min.jpg",alt:"Иконка умения героя Галахада в игре Хроники Хаоса"}},answers:[{text:"Галахад",img:null}]},{id:118,question:{text:"Какая из этих миссий находится в главе «Искаженная магия»?",img:null},answers:[{text:"Заросшая тропа",img:null}]},{id:119,question:{text:"Как выглядит иконка умения «Изменчивые пески»?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/132-min.jpg",alt:"Иконка умения Изменчивые пески в игре Хроники хаоса"}}]},{id:120,question:{text:"Откуда нельзя получить камни душ героя?",img:null},answers:[{text:"Экспедиции",img:null}]},{id:121,question:{text:"Какой артефакт принадлежит этому герою (Тея)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-2.jpg",alt:"Тея Хроники Хаоса"}},answers:[{text:"Посох возрождения",img:null},{text:"Том тайного знания",img:null},{text:"Кольцо интеллекта",img:null}]},{id:122,question:{text:"Какая из этих миссий находится в главе «Раскол племен»?",img:null},answers:[{text:"Обрыв времен",img:null}]},{id:123,question:{text:"В какой главе находится миссия «Стоянка торговцев»?",img:null},answers:[{text:"Во власти огня",img:null}]},{id:124,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/133-min.jpg",alt:"Артефакт героя Безликий в игре Хроники хаоса"}},answers:[{text:"Безликий",img:null}]},{id:125,question:{text:"Как выглядит иконка «Зелья Недомогания»?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/134-min.jpg",alt:"Иконка Зелье Недомогания в игре Хроники хаоса"}}]},{id:126,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/135-min.jpg",alt:"Артефакт Цин Мао в игре Хроники Хаоса"}},answers:[{text:"Цин Мао",img:null}]},{id:127,question:{text:"В какой из глав находится миссия «Сирены»?",img:null},answers:[{text:"Проклятые воды",img:null}]},{id:128,question:{text:"Какая из этих миссий находится в главе «Кристальный престол»?",img:null},answers:[{text:"Роковой перевал",img:null}]},{id:129,question:{text:"В какой из глав находится миссия «Перевалочный пункт»?",img:null},answers:[{text:"Архипелаг",img:null}]},{id:130,question:{text:"Какая из этих миссий находится в главе «Плато Хардана»?",img:null},answers:[{text:"Святилище предков",img:null}]},{id:131,question:{text:"Какая из этих миссий находится в главе «Раскол племен»?",img:null},answers:[{text:"Равнина титанов",img:null}]},{id:132,question:{text:"Какая из этих миссий находится в главе Чащоба Коданг?",img:null},answers:[{text:"Мост Утопца",img:null},{text:"Ядовитые плети",img:null}]},{id:134,question:{text:"В какой из глав находится миссия «Монолит вражды»?",img:null},answers:[{text:"Раскаленное сердце",img:null}]},{id:135,question:{text:"Какой артефакт принадлежит этому герою (Эльмир)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-13.jpg",alt:"Герой Эльмир, игра Хроники Хаоса"}},answers:[{text:"Кольцо ловкости",img:null},{text:"Клинки множества истин",img:null},{text:"Фолиант алхимика",img:null}]},{id:136,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/136-min.jpg",alt:"Артефакт Хайди в игре Хроники хаоса"}},answers:[{text:"Хайди",img:null}]},{id:137,question:{text:"Какой артефакт принадлежит этому герою (Безликий)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-7.jpg",alt:"Герой Безликий, игра Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null},{text:"Покров отшельника",img:null},{text:"Манускрипт пустоты",img:null}]},{id:138,question:{text:"Как выглядит иконка умения рождение звезд?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/137-min.jpg",alt:"Умение Рождение звезд в игре Хроники хаоса"}}]},{id:139,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/138-min.jpg",alt:"Артефакт Джинжер в игре Хроники хаоса"}},answers:[{text:"Джинжер",img:null}]},{id:140,question:{text:"Какой артефакт принадлежит этому герою (Темная звезда)?",img:null},answers:[{text:"Кольцо ловкости",img:null},{text:"Плач Арелона",img:null},{text:"Фолиант алхимика",img:null}]},{id:141,question:{text:"Какой артефакт принадлежит этому герою (Лютер)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-29.jpg",alt:"Лютер герой игры Хроники Хаоса"}},answers:[{text:"Кольцо силы",img:null},{text:"Молот праведного суда",img:null}]},{id:142,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/139-min.jpg",alt:"1 артефакт героя Гелиос в игре Хроники хаоса"}},answers:[{text:"Гелиос",img:null}]},{id:143,question:{text:"Как выглядит иконка умения свинцовая буря?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/140-min.jpg",alt:"Иконка умения Свинцовая буря в игре Хроники хаоса"}}]},{id:144,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/141-min.jpg",alt:"Артефакт героя Фокс, игра Хроники хаоса"}},answers:[{text:"Фокс",img:null}]},{id:145,question:{text:"Какой артефакт принадлежит этому герою (Кира)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-9.jpg",alt:"Герой Кира, игра Хроники Хаоса"}},answers:[{text:"Кольцо ловкости",img:null},{text:"Лезвия Октавианы",img:null},{text:"Фолиант Алхимика",img:null}]},{id:146,question:{text:"В какой из глав находится миссия «Живые горы»?",img:null},answers:[{text:"Плато Хардана",img:null}]},{id:147,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/142-min.jpg",alt:"1 артефакт героя Астерот в игре Хроники хаоса"}},answers:[{text:"Астарот",img:null}]},{id:148,question:{text:"Какая из этих миссий находится в главе «Раскол племен»?",img:null},answers:[{text:"Оружейные стойки",img:null}]},{id:149,question:{text:"У кого из перечисленных героев Чемпионский облик покупается за золотые трофеи?",img:null},answers:[{text:"Джу",img:null},{text:"Дориан",img:null},{text:"Майя",img:null},{text:"Зири",img:null},{text:"Тесак",img:null},{text:"Йорген",img:null},{text:"Гелиос",img:null}]},{id:156,question:{text:"Какой максимальный уровень дара стихий может быть у героя?",img:null},answers:[{text:"30",img:null}]},{id:157,question:{text:"Какой характеристикой не обладают герои?",img:null},answers:[{text:"Меткость",img:null}]},{id:158,question:{text:"Кто из героев «ребенок-звезда»?",img:null},answers:[{text:"Гелиос",img:null}]},{id:159,question:{text:"Какого цвета волос нет у обликов Зири?",img:null},answers:[{text:"Белый",img:null}]},{id:160,question:{text:"У кого из перечисленных героев нет варварского облика?",img:null},answers:[{text:"Джу",img:null}]},{id:161,question:{text:"У кого из героев есть кот?",img:null},answers:[{text:"Астрид",img:null}]},{id:162,question:{text:"Какого сундука нет в игре?",img:null},answers:[{text:"Рунного",img:null}]},{id:163,question:{text:"У кого из перечисленных героев чемпионский облик покупается за серебряные трофеи?",img:null},answers:[{text:"Кай",img:null},{text:"Галахад",img:null},{text:"Исмаил",img:null},{text:"Судья",img:null},{text:"Пеппи",img:null},{text:"Джинджер",img:null},{text:"Тея",img:null}]},{id:170,question:{text:"В каком облике повязка на лице Эльмира красного цвета?",img:null},answers:[{text:"Зимний",img:null}]},{id:171,question:{text:"Чего нельзя получить в экспедиции?",img:null},answers:[{text:"Артефактная монета",img:null}]},{id:172,question:{text:"Как называется этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640.jpg",alt:"Артефакт завет защитника, игра Хроники Хаоса"}},answers:[{text:"Завет защитника",img:null}]},{id:173,question:{text:"Как зовут этого героя?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-1.jpg",alt:"Герой Лизн, игра Хроники Хаоса"}},answers:[{text:"Лиэн",img:null}]},{id:174,question:{text:"Какой стихии Титанов нет в Доминионе?",img:null},answers:[{text:"Металл",img:null}]},{id:175,question:{text:"На какой позиции не могут находиться герои?",img:null},answers:[{text:"Левая линия",img:null}]},{id:176,question:{text:"Сколько очков активности гильдии можно получить за повышение уровня символа героя раз в день?",img:null},answers:[{text:"700",img:null}]},{id:177,question:{text:"У кого из героев нет романтического облика?",img:null},answers:[{text:"Зири",img:null}]},{id:178,question:{text:"Какого сундука нет в магазине войны гильдий?",img:null},answers:[{text:"Обычный сундук",img:null}]},{id:179,question:{text:"Как выглядит портрет героя по имени Белзликий?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-2.jpg",alt:"Герой Безликий, игра Хроники Хаоса"}}]},{id:180,question:{text:"Какой из данных героев поддержки может снимать эффекты контроля?",img:null},answers:[{text:"Небула",img:null}]},{id:181,question:{text:"Какого ранга героев нет в игре?",img:null},answers:[{text:"Красный +4",img:null}]},{id:182,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-3.jpg",alt:"Артефакт Королева цветов, игра Хроники Хаоса"}},answers:[{text:"Королева цветов",img:null}]},{id:183,question:{text:"Какой максимальный уровень имеет «Благосклонность Валькирии»?",img:null},answers:[{text:"16",img:null}]},{id:184,question:{text:"Урон по титанам какой стихии увеличивает артефакт «Жезл Сиунгура»?",img:null},answers:[{text:"Титаны огня",img:null}]},{id:185,question:{text:"Кто присылает на почту изумруды за повышение ранга героя?",img:null},answers:[{text:"Венди",img:null}]},{id:186,question:{text:"Какой из этих героев не имеет оружия в руках?",img:null},answers:[{text:"Зири",img:null}]},{id:187,question:{text:"Какой лабиринт можно найти на карте кампании?",img:null},answers:[{text:"Былых надежд",img:null}]},{id:188,question:{text:"На каком уровне команды становится доступно мгновенное прохождение башни?",img:null},answers:[{text:"90",img:null}]},{id:189,question:{text:"Где можно получить камни душ героя Джет?",img:null},answers:[{text:"Магазин камней душ",img:null}]},{id:190,question:{text:"Какую характеристику добавляет Тотем Духа Воды всем титанам огня?",img:null},answers:[{text:"Никакую",img:null}]},{id:191,question:{text:"Какую характеристику нельзя улучшить через символы?",img:null},answers:[{text:"Выносливость",img:null}]},{id:192,question:{text:"Какую характеристику добавляет Тотем духа Земли всем Титанам Земли?",img:null},answers:[{text:"Здоровье",img:null}]},{id:193,question:{text:"Камни душ каких героев можно купить в магазине башни?",img:null},answers:[{text:"Нет правильного ответа",img:null}]},{id:194,question:{text:"Сколько титанов одной стихии должно быть в команде, чтобы активировать умение Тотема Духа Стихии?",img:null},answers:[{text:"3",img:null}]},{id:195,question:{text:"Урон по титанам какой стихии увеличивает артефакт «Душа Андвари»?",img:null},answers:[{text:"Титаны воды",img:null}]},{id:196,question:{text:"Как зовут этого героя ?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-4.jpg",alt:"Герой Хайди, игра Хроники Хаоса"}},answers:[{text:"Хайди",img:null}]},{id:197,question:{text:"У кого из перечисленных героев нет звездного облика?",img:null},answers:[{text:"Судья",img:null}]},{id:198,question:{text:"Кому присуждается победа, если после отведенного времени в бою на Гранд Арене нет победителя?",img:null},answers:[{text:"Защищающемуся игроку",img:null}]},{id:199,question:{text:"Как выглядит портрет титана по имени Ангус?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-5.jpg",alt:"Титан Ангус, игра Хроники Хаоса"}}]},{id:200,question:{text:"Какой роли героя нет в игре?",img:null},answers:[{text:"Убийца",img:null}]},{id:201,question:{text:"Урон по титанам какой стихии увеличивает артефакт «Зверь Рагни»?",img:null},answers:[{text:"Титаны земли",img:null}]},{id:202,question:{text:"У какого из перечисленных героев больше 2 рук?",img:null},answers:[{text:"Карх",img:null}]},{id:203,question:{text:"Как выглядит портрет героя по имени Цин Мао?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-6.jpg",alt:"Герой Цин Мао, игра Хроники Хаоса"}}]},{id:204,question:{text:"Какой богине поклоняется Зири?",img:null},answers:[{text:"Акреб Умми",img:null}]},{id:205,question:{text:"Какой герой плод любви человека и титана?",img:null},answers:[{text:"Майя",img:null}]},{id:206,question:{text:"Как называется предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-7.jpg",alt:"Жнец, игра Хроники Хаоса"}},answers:[{text:"Жнец",img:null}]},{id:207,question:{text:"Как зовут принцессу Дремиров?",img:null},answers:[{text:"Астрид",img:null}]},{id:208,question:{text:"Что нельзя получить в магазине дружбы?",img:null},answers:[{text:"Зеленый предмет",img:null}]},{id:209,question:{text:"Какое усиление невозможно получить в башне?",img:null},answers:[{text:"Ускорение героев",img:null}]},{id:210,question:{text:"Как зовут демона, заточенного в щит Руфуса?",img:null},answers:[{text:"Ракаши",img:null}]},{id:211,question:{text:"Какого сундука нет в игре?",img:null},answers:[{text:"Рунного сундука",img:null}]},{id:212,question:{text:"Какая вредная привычка присуща Руфусу?",img:null},answers:[{text:"Пьет",img:null}]},{id:213,question:{text:"Какого типа урона нет в игре?",img:null},answers:[{text:"Метафизический",img:null}]},{id:214,question:{text:"Рыцарем какого ордена является Лютер?",img:null},answers:[{text:"Святого Брана",img:null}]},{id:215,question:{text:"У кого есть кибернетический облик?",img:null},answers:[{text:"Зири",img:null}]},{id:216,question:{text:"У кого есть кибернетический облик?",img:null},answers:[{text:"Сатори",img:null}]},{id:217,question:{text:"У кого нет чемпионского облика?",img:null},answers:[{text:"Корнелиус",img:null}]},{id:218,question:{text:"У кого из героев нет зимнего облика?",img:null},answers:[{text:"Цин Мао",img:null}]},{id:219,question:{text:"Что создает Селеста в темной форме?",img:null},answers:[{text:"Проклятое пламя",img:null}]},{id:220,question:{text:"Из какой галактики прибыл Орион?",img:null},answers:[{text:"Неизвестно",img:null}]},{id:221,question:{text:"Какой дневной лимит очков за обмен предметов на очки активности гильдии?",img:null},answers:[{text:"2000",img:null}]},{id:222,question:{text:"Сколько разных масок может вызвать Пеппи умением «Маскарад»?",img:null},answers:[{text:"4",img:null}]},{id:223,question:{text:"Где невозможно получить Монеты Валькирии?",img:null},answers:[{text:"Экспедиции",img:null}]},{id:224,question:{text:"В какой главе кампании рука из земли держит топор?",img:null},answers:[{text:"7",img:null}]},{id:225,question:{text:"Кто из перечисленных героев не может парить над землей?",img:null},answers:[{text:"Небула",img:null}]},{id:226,question:{text:"Сколько звезд у Гелиоса при призыве из героического сундука?",img:null},answers:[{text:"2 звезды",img:null}]},{id:227,question:{text:"Что из перечисленного нельзя получить из сундука камней облика?",img:null},answers:[{text:"Камень облика выносливости",img:null}]},{id:228,question:{text:"За захват какой цели можно получить максимум очков в войне гильдий?",img:null},answers:[{text:"Цитадель",img:null}]},{id:229,question:{text:"Каких героев можно купить в магазине турнира стихий?",img:null},answers:[{text:"Небула, Карх",img:null}]},{id:230,question:{text:"Что нельзя найти на 50 этаже башни?",img:null},answers:[{text:"Босс башни",img:null}]},{id:231,question:{text:"Как зовут этого титана?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-8.jpg",alt:"Титан Авалон, игра Хроники Хаоса"}},answers:[{text:"Авалон",img:null}]},{id:232,question:{text:"Пассивное умение какого героя не работает после его смерти?",img:null},answers:[{text:"Джет",img:null}]},{id:233,question:{text:"Пассивное умение какого героя не работает после его смерти?",img:null},answers:[{text:"Андвари",img:null}]},{id:234,question:{text:"Камни душ какого из этих Титанов нельзя получить за победу в подземелье?",img:null},answers:[{text:"Эдем",img:null}]},{id:235,question:{text:"За какую валюту можно прокачать тотем Духа Стихий?",img:null},answers:[{text:"Трофеи войны гильдий, изумруды",img:null}]},{id:236,question:{text:"Какую характеристику добавляет Тотем Духа Огня всем титанам огня?",img:null},answers:[{text:"Атака",img:null}]},{id:237,question:{text:"Кто из этих героев не может накладывать эффект ослепления на противников?",img:null},answers:[{text:"Сорвиголова",img:null}]},{id:238,question:{text:"Какого умения в игре нет?",img:null},answers:[{text:"Истинная тьма",img:null}]},{id:239,question:{text:"Сколько максимум можно обнаружить на этаже башни?",img:null},answers:[{text:"3",img:null}]},{id:240,question:{text:"Сколько этапов в Межсерверном турнире стихий?",img:null},answers:[{text:"7",img:null}]},{id:241,question:{text:"Как зовут этого титана?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/643.jpg",alt:"Титан Сильва, игра Хроники Хаоса"}},answers:[{text:"Сильва",img:null}]},{id:242,question:{text:"От атак титанов какой стихии защищает корона огня в нападении?",img:null},answers:[{text:"Земли",img:null}]},{id:243,question:{text:"От атак титанов какой стихии защищает корона воды в защите?",img:null},answers:[{text:"Любой стихии",img:null}]},{id:244,question:{text:"У какого героя нет энергии?",img:null},answers:[{text:"Астрид и Лукас",img:null}]},{id:245,question:{text:"Какие параметры дают Артефакты Титанов: печать атаки, печать защиты и печать баланса?",img:null},answers:[{text:"Здоровье, атака",img:null}]},{id:246,question:{text:"Сколько окон максимум можно обнаружить на этаже Башни?",img:null},answers:[{text:"3",img:null}]},{id:247,question:{text:"Где невозможно получить ядро хаоса?",img:null},answers:[{text:"Торговец артефактами",img:null}]},{id:248,question:{text:"Что нельзя получить в артефактом сундуке?",img:null},answers:[{text:"Ключ от артефактного сундука",img:null},{text:"Зелье титана",img:null}]},{id:249,question:{text:"В какой из глав находится миссия «Живые горы»?",img:null},answers:[{text:"Плато Хардана",img:null}]},{id:250,question:{text:"Как выглядит портрет героя Джинжер?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/643-1.jpg",alt:"Герой Джинжер, игра Хроники Хаоса"}}]},{id:251,question:{text:"Как выглядит портрет героя по имени Белзикий?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/643-2.jpg",alt:"Герой Безликий, игра Хроники Хаоса"}}]},{id:252,question:{text:"Откуда нельзя получить камни душ героя?",img:null},answers:[{text:"Ежедневные задания",img:null}]},{id:253,question:{text:"У кого из перечисленных героев нет маскарадного облика?",img:null},answers:[{text:"Йорген",img:null}]},{id:254,question:{text:"Как выглядит иконка умения Зенит?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/643-4.jpg",alt:"Умение Зенит, игра Хроники Хаоса"}}]},{id:255,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/643-5.jpg",alt:"Маска гнева, артефакт Моджо, игра Хроники Хаоса"}},answers:[{text:"Моджо",img:null}]},{id:257,question:{text:"Какого типа обликов не существует?",img:null},answers:[{text:"Осенний облик",img:null},{text:"Южный Облик",img:null}]},{id:258,question:{text:"Какой артефакт принадлежит этому герою (Судья)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-16.jpg",alt:"Судья хроники хаоса"}},answers:[{text:"Том Тайного Знания",img:null},{text:"Карта бесконечных звезд",img:null},{text:"Кольцо интеллекта",img:null}]},{id:260,question:{text:"Какой демон был мастером артефактов стихии Огня?",img:null},answers:[{text:"Рагни",img:null}]},{id:261,question:{text:"Какую характеристику Хайди нельзя прокачать с помощью рун?",img:null},answers:[{text:"Физическая атака",img:null},{text:"Здоровье",img:null}]},{id:263,question:{text:"Какой максимальный уровень артефактного сундука?",img:null},answers:[{text:"10",img:null}]},{id:264,question:{text:"Какой артефакт принадлежит этому герою (Джинжер)?",img:null},answers:[{text:"Нобль Мк.2",img:null},{text:"Фолиант Алхимика",img:null},{text:"Кольцо ловкости",img:null}]},{id:265,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/643-6.jpg",alt:"Артефакт героя Данте, игра Хроники Хаоса"}},answers:[{text:"Данте",img:null}]},{id:266,question:{text:"Сколько попыток атак есть у чемпиона в Войне Гильдий?",img:null},answers:[{text:"2",img:null}]},{id:267,question:{text:"У кого из этих героев нет капюшона?",img:null},answers:[{text:"Дориан",img:null}]},{id:268,question:{text:"За какое действие можно получить Очки активности гильдии?",img:null},answers:[{text:"Повышение уровня символа",img:null},{text:"Трата энергии",img:null}]},{id:269,question:{text:"У кого из перечисленных героев нет демонического облика?",img:null},answers:[{text:"Небула",img:null}]},{id:270,question:{text:"Как выглядит иконка умения Оковы ветра?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/644.jpg",alt:"Оковы ветра, первое умения Кая, игра Хроники Хаоса"}}]},{id:271,question:{text:"Что нужно сделать, чтобы получить фрагмент истории в Гирвил-Сити?",img:null},answers:[{text:"Пройти миссию на 3 звезды",img:null}]},{id:272,question:{text:"От атак титанов какой стихии защищает корона земли в нападении?",img:null},answers:[{text:"Воды",img:null}]},{id:273,question:{text:"Мест добычи душ какого героя больше всего на карте кампании?",img:null},answers:[{text:"Моджо",img:null}]},{id:275,question:{text:"Как выглядит иконка умения солнечный ветер?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-1.jpg",alt:"Умение Солнечный ветер, игра Хроники Хаоса"}}]},{id:276,question:{text:"Как выглядит иконка умения генератор помех?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-2.jpg",alt:"Умение Генератор помех, игра Хроники Хаоса"}}]},{id:277,question:{text:"Как выглядит иконка умения тьма наступает?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-3.jpg",alt:"Умение Тьма наступает, игра Хроники Хаоса"}}]},{id:278,question:{text:"Как выглядит иконка умения пламенный покров?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-4.jpg",alt:"Умение пламенный покров, игра Хроники Хаоса"}}]},{id:279,question:{text:"Как выглядит иконка умения кристалл Селиаса?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-5.jpg",alt:"Умение кристалл Селиаса, игра Хроники Хаоса"}}]},{id:281,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-6.jpg",alt:"Артефакт Зири, игра Хроники Хаоса"}},answers:[{text:"Зири",img:null}]},{id:282,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-7.jpg",alt:"Артефакт Руфуса, игра Хроники Хаоса."}},answers:[{text:"Руфус",img:null}]},{id:283,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-8.jpg",alt:"Артефакт Эльмира, игра Хроники Хаоса"}},answers:[{text:"Эльмир",img:null}]},{id:285,question:{text:"Какой артефакт принадлежит этому герою (Кай)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-10.jpg",alt:"Герой Кай, игра Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null},{text:"Мантия скитальца",img:null},{text:"Манускрипт пустоты",img:null}]},{id:287,question:{text:"Какой артефакт принадлежит этому герою Арахна?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-12.jpg",alt:"Герой Арахна, игра Хроники Хаоса"}},answers:[{text:"Дрон-отшельник",img:null},{text:"Завет защитника",img:null},{text:"Кольцо ловкости",img:null}]},{id:289,question:{text:"Как выглядит иконка умения Пытка бессилием?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/645-14.jpg",alt:"Умение Пытка бессилием, игра Хроники Хаоса"}}]},{id:290,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338.jpg",alt:"Артефакт Корнелиуса, игра Хроники Хаоса"}},answers:[{text:"Корнелиус",img:null}]},{id:291,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-1.jpg",alt:"Артефакт Селесты, игра Хроники Хаоса"}},answers:[{text:"Селеста",img:null}]},{id:292,question:{text:"Как выглядит иконка умения Едкий выстрел?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-2.jpg",alt:"Умение Едкий выстрел, игра Хроники Хаоса"}}]},{id:293,question:{text:"Как выглядит иконка умения Канонада?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-3.jpg",alt:"Иконка умения Канонада, игра Хроники Хаоса"}}]},{id:294,question:{text:"Какой артефакт принадлежит этому герою (Ларс)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-4.jpg",alt:"Кольцо интеллекта. Игра Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null},{text:"Грозовой оберег",img:null},{text:"Манускрипт пустоты",img:null}]},{id:295,question:{text:"Какой артефакт принадлежит этому герою (Дориан)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-9.jpg",alt:"Герой Дориан, игра Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null},{text:"Кровоточащая сталь",img:null},{text:"Том тайного знания",img:null}]},{id:296,question:{text:"Как выглядит иконка умения Искры чувств?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-5.jpg",alt:"Искры Чувств, игра Хроники Хаоса"}}]},{id:297,question:{text:"Какой артефакт принадлежит этому герою (Аврора)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-6.jpg",alt:"Герой Аврора, игра Хроники Хаоса"}},answers:[{text:"Наследство Селиаса",img:null},{text:"Книга иллюзий",img:null},{text:"Кольцо силы",img:null}]},{id:298,question:{text:"Как выглядит иконка умения Натиск Хищника?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-8.jpg",alt:"Умение Натиск Хищника, героя Астрид и Лукас, игра Хроники Хаоса"}}]},{id:299,question:{text:"Какой артефакт принадлежит этому герою (Астрид и Лукас)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/338-10.jpg",alt:"Герой Астрид и Лукас, игра Хроники Хаоса"}},answers:[{text:"Кольцо ловкости",img:null},{text:"Мушкет принцессы",img:null},{text:"Фолиант алхимика",img:null}]},{id:300,question:{text:"Как называется этот предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/649.jpg",alt:"Тиара Ривасара предмет, игра Хроники Хаоса"}},answers:[{text:"Тиара Ривасара",img:null}]},{id:301,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/649-1.jpg",alt:"Умение знамение, игра Хроники Хаоса"}},answers:[{text:"Знамение",img:null}]},{id:302,question:{text:"Как выглядит портрет титана по имени Авалон?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/640-8.jpg",alt:"Титан Авалон, игра Хроники Хаоса"}}]},{id:303,question:{text:"Какой артефакт принадлежит этому герою (Джу)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/649-2.jpg",alt:"Кости Зараккар, артефакт героя Джу, игра Хроники Хаоса."}},answers:[{text:"Кости Зараккар",img:null},{text:"Кодекс воина",img:null},{text:"Кольцо силы",img:null}]},{id:304,question:{text:"Как выглядит портрет героя по имени Джет?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651.jpg",alt:"Джет герой в игре Хроники Хаоса"}}]},{id:305,question:{text:"Как выглядит портрет героя по имени Селеста?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651-1.jpg",alt:"Герой Селеста, игра Хроники Хаоса"}}]},{id:306,question:{text:"Как зовут этого героя?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651-2.jpg",alt:"Маркус герой в игре Хроники Хаоса"}},answers:[{text:"Маркус",img:null}]},{id:307,question:{text:"Как зовут этого титана ?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651-3.jpg",alt:"Гиперион титан в игре Хроники Хаоса"}},answers:[{text:"Гиперион",img:null}]},{id:308,question:{text:"Как зовут этого героя?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651-4.jpg",alt:"Лютер герой игры Хроники Хаоса"}},answers:[{text:"Лютер",img:null}]},{id:309,question:{text:"Как зовут этого героя?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651-5.jpg",alt:"Орион герой игры Хроники Хаоса"}},answers:[{text:"Орион",img:null}]},{id:310,question:{text:"Кто умеет притягивать врагов цепью?",img:null},answers:[{text:"Тесак",img:null}]},{id:311,question:{text:"Какой магией владеет Дориан?",img:null},answers:[{text:"Магией крови",img:null}]},{id:312,question:{text:"Сколько всего героев в игре?",img:null},answers:[{text:"47",img:null}]},{id:313,question:{text:"Что нельзя купить в магазине дружбы?",img:null},answers:[{text:"Зеленый предмет",img:null}]},{id:314,question:{text:"Как зовут вожака орков из 3й главы кампании?",img:null},answers:[{text:"Гро Булгор",img:null}]},{id:315,question:{text:"Где добываются черепа?",img:null},answers:[{text:"Башня",img:null}]},{id:316,question:{text:"Где можно включить звуки и музыку в игре?",img:null},answers:[{text:"Настройки",img:null}]},{id:317,question:{text:"Какую способность Корнелиус приобрел будучи в плену у темных магов?",img:null},answers:[{text:"Подавление магии",img:null}]},{id:318,question:{text:"Сколько уровней Подземелья нужно пройти, чтобы выполнить последнее задание Оракула?",img:null},answers:[{text:"2000",img:null}]},{id:319,question:{text:"Как зовут одного из боссов Запределья?",img:null},answers:[{text:"Брог Завоеватель",img:null}]},{id:320,question:{text:"Что дает Оракул из Подземелья?",img:null},answers:[{text:"Титанит и Карты Предсказаний",img:null}]},{id:321,question:{text:"Где стражей ждет Архидемон?",img:null},answers:[{text:"В Горниле Ужаса",img:null}]},{id:322,question:{text:"Как выглядит иконка умения Темная Сделка?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1.jpg",alt:"иконка умения Темная Сделка"}}]},{id:323,question:{text:"Кем Лилит приходилась Архидемону?",img:null},answers:[{text:"Первой женой",img:null}]},{id:324,question:{text:"Какое испытание Валькирий есть на карте экспедиций?",img:null},answers:[{text:"Испытание мужества",img:null}]},{id:325,question:{text:"Что можно купить за монеты турнира стихий?",img:null},answers:[{text:"Фрагменты артефактов титанов",img:null}]},{id:326,question:{text:"За какую валюту можно прокачать артефакты Титанов: Печать Атаки, Печать Защиты, Печать Баланса?",img:null},answers:[{text:"Золото, Изумруды",img:null}]},{id:327,question:{text:"Как зовут ледяную птицу, обитающую в Нордланде?",img:null},answers:[{text:"Астрильд",img:null}]},{id:328,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-1.jpg",alt:"Артефакт Астрид и Лукас Хроники Хаоса"}},answers:[{text:"Астрид и Лукас",img:null}]},{id:329,question:{text:"Что отец Исмаила хотел сделать с ним в детстве?",img:null},answers:[{text:"Принести в жертву богам",img:null}]},{id:330,question:{text:"Какую характеристику нельзя улучшить через символы?",img:null},answers:[{text:"Мудрость",img:null}]},{id:331,question:{text:"У кого из этих героев 4 облика, включая базовый?",img:null},answers:[{text:"Пеппи",img:null}]},{id:332,question:{text:"Какой босс Запределья обитает в лагере Покорителей?",img:null},answers:[{text:"Брог Завоеватель",img:null}]},{id:333,question:{text:"Как называется этот расходуемый предмет?",img:null},answers:[{text:"Большой сундук камней облика",img:null}]},{id:334,question:{text:"В каком городе находится Сеймур?",img:null},answers:[{text:"Гирвил-Сити",img:null}]},{id:335,question:{text:"Кто является последним боссом Кампании?",img:null},answers:[{text:"Сеймур",img:null}]},{id:336,question:{text:"Какое из этих укреплений в Войне Гильдий надо захватывать титанами?",img:null},answers:[{text:"Источник Стихий",img:null}]},{id:337,question:{text:"Какое звание носит Аврора?",img:null},answers:[{text:"Паладин Ривасара",img:null}]},{id:338,question:{text:"Как выглядит портрет героя по имени Тея?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-2.jpg",alt:"Тея Хроники Хаоса"}}]},{id:339,question:{text:"Кем Лилит приходилась Архидемону?",img:null},answers:[{text:"Первой женой",img:null}]},{id:340,question:{text:"Какое оружие держит в руках Валькирия?",img:null},answers:[{text:"Копье",img:null}]},{id:341,question:{text:"Как выглядит предмет под названием Секира?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-3.jpg",alt:"Секира, Хроники Хаоса"}}]},{id:342,question:{text:"Какой народ проживал в Гирвил-Сити?",img:null},answers:[{text:"Дреммеры",img:null}]},{id:343,question:{text:"Как выглядит портрет героя по имени Темная Звезда?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-4.jpg",alt:"Темная Звезда Хроники Хаоса"}}]},{id:344,question:{text:"Размер награды в час за 41 место на гранд Арене?",img:null},answers:[{text:"41",img:null}]},{id:345,question:{text:"Кто наносит ответный удар при получении союзником критических ударов?",img:null},answers:[{text:"Гелиос",img:null}]},{id:346,question:{text:"Как выглядит портрет титана по имени Эдем?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-5.jpg",alt:"Эдем титан Хроники Хаоса"}}]},{id:347,question:{text:"Сколько опыта можно получить использовав Великое зелье опыта?",img:null},answers:[{text:"7500",img:null}]},{id:348,question:{text:"Как выглядит портрет титана по имени Нова?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-6.jpg",alt:"Нова титан Хроники Хаоса"}}]},{id:349,question:{text:"У кого из перечисленных героев нет Весеннего облика?",img:null},answers:[{text:"Майя",img:null}]},{id:350,question:{text:"Как выглядит предмет Харунский шлем?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-7.jpg",alt:"Харунский Шлем Хроники Хаоса"}}]},{id:351,question:{text:"Как выглядит сфера призыва?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-8.jpg",alt:"Сфера призыва Хроники Хаоса"}}]},{id:352,question:{text:"Какого сундука нет в игре?",img:null},answers:[{text:"Рунный",img:null}]},{id:353,question:{text:"Какого множителя не бывает при обмене изумрудов?",img:null},answers:[{text:"25",img:null}]},{id:354,question:{text:"Кто проживает в 10-й главе кампании?",img:null},answers:[{text:"Тифон",img:null}]},{id:355,question:{text:"Как зовут этого героя?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-9.jpg",alt:"Безликий герой Хроники Хаоса"}},answers:[{text:"Безликий",img:null}]},{id:356,question:{text:"Какой титул носит Тея?",img:null},answers:[{text:"Целительница Древней Рощи",img:null}]},{id:357,question:{text:"У кого из магов самый длинный посох?",img:null},answers:[{text:"Гелиос",img:null}]},{id:358,question:{text:"Как выглядит предмет под названием клинок Бессмертных?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-10.jpg",alt:"клинок Бессмертных Хроники Хаоса"}}]},{id:359,question:{text:"Как называется миссия, в которой ты впервые сражаешься с Архидемоном?",img:null},answers:[{text:"Вотчина Архидемона",img:null}]},{id:360,question:{text:"Как называется статуя во 2 -й главе кампании?",img:null},answers:[{text:"Монумент Мерона",img:null}]},{id:361,question:{text:"Что находится во власти огня?",img:null},answers:[{text:"Глава 1",img:null}]},{id:362,question:{text:"Кто из этих героев является принцессой?",img:null},answers:[{text:"Астрид",img:null}]},{id:363,question:{text:"Что нельзя обменять на активность гильдии?",img:null},answers:[{text:"Зелье опыта",img:null}]},{id:364,question:{text:"Как называется этот артефакт титана?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-11.jpg",alt:"Печать Баланса Хроники Хаоса"}},answers:[{text:"Печать Баланса",img:null}]},{id:365,question:{text:"Как называется этот артефакт титана?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-12.jpg",alt:"Зверь Рагни Хроники Хаоса"}},answers:[{text:"Зверь Рагни",img:null}]},{id:366,question:{text:"У кого из этих героев пока есть только Базовый Облик?",img:null},answers:[{text:"Сатори",img:null}]},{id:367,question:{text:"Как выглядит портрет титана по имени Сильва?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-13.jpg",alt:"Сильва титан Хроники Хаоса"}}]},{id:368,question:{text:"Какой босс Запределья обитает в пещерах Отчаяния?",img:null},answers:[{text:"Илисса Ткачиха",img:null}]},{id:369,question:{text:"Какой артефакт принадлежит этому герою (Лиэн)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-14.jpg",alt:"Лизн Хроники Хаоса"}},answers:[{text:"Том тайного знания",img:null}]},{id:370,question:{text:"Как выглядит расходуемый предмет под названием Редкий артефактный свиток?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-15.jpg",alt:"Редкий артефактный свиток, Хроники Хаоса"}}]},{id:371,question:{text:"Как выглядит расходуемый предмет Ключ от артефактного сундука?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-16.jpg",alt:"Ключ от артефактного сундука в игре Хроники Хаоса"}}]},{id:372,question:{text:"Как выглядит иконка умения Сингулярность ужаса?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-17.jpg",alt:"Сингулярность ужаса, Хроники Хаоса"}}]},{id:373,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-18.jpg",alt:"Неотвратимая расплата Хроники Хаоса"}},answers:[{text:"Неотвратимая расплата",img:null}]},{id:374,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-19.jpg",alt:"Артефакт героя Сорвиголова игра Хроники Хаоса"}},answers:[{text:"Сорвиголова",img:null}]},{id:375,question:{text:"Какие ресурсы нельзя получить в Запределье?",img:null},answers:[{text:"Камни душ героев",img:null}]},{id:376,question:{text:"Как зовут этого титана?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-20.jpg",alt:"Араджи титан Хроники Хаоса"}},answers:[{text:"Араджи",img:null}]},{id:377,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-21.jpg",alt:"Сфера артефактов титанов Хроники Хаоса"}},answers:[{text:"Сфера артефактов титанов",img:null}]},{id:378,question:{text:"Сколько укреплений в войне гильдий надо захватить, чтобы получить максимум очков?",img:null},answers:[{text:"10",img:null}]},{id:379,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-22.jpg",alt:"Артефакт Кристы игра Хроники Хаоса"}},answers:[{text:"Криста",img:null}]},{id:380,question:{text:"Чей свет укажет на клад в 50000 золотых монет, скрытый на островах?",img:null},answers:[{text:"Маяк",img:null}]},{id:381,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-23.jpg",alt:"Ужас магов Хроники Хаоса"}},answers:[{text:"Ужас магов",img:null}]},{id:382,question:{text:"Кем была Кира до того, как стала мстительным духом?",img:null},answers:[{text:"Королевским стражем",img:null}]},{id:383,question:{text:"Как разблокировать магазин Камней душ?",img:null},answers:[{text:"Прокачать любого героя до абсолютной звезды",img:null}]},{id:384,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-24.jpg",alt:"Духи исцеляют меня игра Хроники Хаоса"}},answers:[{text:"Духи исцеляют меня",img:null}]},{id:385,question:{text:"Какой босс Запределья обитает в раскаленной бездне?",img:null},answers:[{text:"Ваджар Испепелитель",img:null}]},{id:386,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-25.jpg",alt:"Подарок от Бокси игра Хроники Хаоса"}},answers:[{text:"Подарок от Бокси",img:null}]},{id:387,question:{text:"Сколько разделов в рейтинге лучших игроков?",img:null},answers:[{text:"7",img:null}]},{id:388,question:{text:"Какой артефакт принадлежит этому герою (Фокс)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-26.jpg",alt:"Фокс герой игра Хроники Хаоса"}},answers:[{text:"Шрапнельная пушка",img:null},{text:"Кольцо ловкости",img:null},{text:"Фолиант алхимика",img:null}]},{id:389,question:{text:"Как выглядит расходуемый предмет под названием Сундук Титанов-Защитников?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-27.jpg",alt:"Сундук Титанов-Защитников Хроники Хаоса"}}]},{id:390,question:{text:"В какой из глав находится миссия Кораблекрушение?",img:null},answers:[{text:"Проклятые воды",img:null}]},{id:392,question:{text:"Какой артефакт принадлежит этому герою (Астарот)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-28.jpg",alt:"Астарот герой игры Хроники Хаоса"}},answers:[{text:"Завет защитника",img:null},{text:"Коса искупления",img:null},{text:"Кольцо силы",img:null}]},{id:393,question:{text:"В каком герое живет душа черного лиса?",img:null},answers:[{text:"Сатори",img:null}]},{id:394,question:{text:"Как зовут этого титана?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-30.jpg",alt:"Эдем титан игра Хроники Хаоса"}},answers:[{text:"Эдем",img:null}]},{id:395,question:{text:"Как выглядит иконка умения смертоносный ливень?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-31.jpg",alt:"Смертоносный ливень иконка умения Хроники Хаоса"}}]},{id:396,question:{text:"Как выглядит артефакт титана под названием Стреломет Андвари?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-32.jpg",alt:"Стреломет Андвари Хроники Хаоса"}}]},{id:397,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1.jpg",alt:"иконка умения Темная Сделка"}},answers:[{text:"Темная сделка",img:null}]},{id:398,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-33.jpg",alt:"Артефакт Хроники Хаоса"}},answers:[{text:"Фокс",img:null}]},{id:399,question:{text:"Как выглядит расходуемый предмет под названием Рунный амулет?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-34.jpg",alt:"Рунный амулет Хроники Хаоса"}}]},{id:400,question:{text:"Как называется этот предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-35.jpg",alt:"Необычный артефактный металл Хроники Хаоса"}},answers:[{text:"Необычный артефактный металл",img:null}]},{id:401,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-36.jpg",alt:"Стихийная артефактная эссенция Хроники Хаоса"}},answers:[{text:"Стихийная артефактная эссенция",img:null}]},{id:402,question:{text:"Как выглядит иконка умения Огненный таран?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-37.jpg",alt:"Огненный таран Хроники Хаоса"}}]},{id:403,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-38.jpg",alt:"Артефакт Чаббы Хроники Хаоса"}},answers:[{text:"Чабба",img:null}]},{id:404,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-39.jpg",alt:"Необычная артефактная эссенция Хроники Хаоса"}},answers:[{text:"Необычная артефактная эссенция",img:null}]},{id:405,question:{text:"Какой артефакт принадлежит этому герою (Исмаил)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-40.jpg",alt:"Исмаил Хроники Хаоса"}},answers:[{text:"Фолиант алхимика",img:null},{text:"Карта скрытого демона",img:null},{text:"Кольцо ловкости",img:null}]},{id:406,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-41.jpg",alt:"Зелье опыта Хроники Хаоса"}},answers:[{text:"Зелье опыта",img:null}]},{id:407,question:{text:"Как выглядит расходуемый предмет под названием Превосходный артефактный металл?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-42.jpg",alt:"Превосходный артефактный металл Хроники Хаоса"}}]},{id:408,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-43.jpg",alt:"Великое зелье опыта Хроники Хаоса"}},answers:[{text:"Великое зелье опыта",img:null}]},{id:409,question:{text:"Какой артефакт принадлежит этому герою (Сатори)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-44.jpg",alt:"Сатори Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null},{text:"Веер черного лиса",img:null},{text:"Манускрипт пустоты",img:null}]},{id:410,question:{text:"Как выглядит расходуемый предмет под названием Безупречный артефактный свиток?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-45.jpg",alt:"Безупречный артефактный свиток Хроники Хаоса"}}]},{id:411,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02.jpg",alt:"Билет викторины Хроники Хаоса"}},answers:[{text:"Билет викторины",img:null}]},{id:412,question:{text:"Как выглядит расходуемый предмет под названием Большое зелье опыта?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-1.jpg",alt:"Большое зелье опыта Хроники Хаоса"}}]},{id:413,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-2.jpg",alt:"Энергия в бутылке"}},answers:[{text:"Энергия в бутылке",img:null}]},{id:414,question:{text:"Как называется этот расходуемый предмет под названием Зловещая шкатулка?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-3.jpg",alt:"Зловещая шкатулка"}}]},{id:415,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-4.jpg",alt:"Артефакт Майи"}},answers:[{text:"Майя",img:null}]},{id:416,question:{text:"Какой артефакт принадлежит этому герою (Корнелиус)?",img:null},answers:[{text:"Том Тайного Знания",img:null},{text:"Посох архивариуса",img:null},{text:"Кольцо интеллекта",img:null}]},{id:417,question:{text:"Как выглядит иконка умения Опустошение?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-5.jpg",alt:"Опустошение умение Астарота"}}]},{id:419,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-6.jpg",alt:"Артефакт Ориона"}},answers:[{text:"Орион",img:null}]},{id:420,question:{text:"Как выглядит расходуемый предмет под названием Сундук титанов поддержки?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-7.jpg",alt:"Сундук титанов поддержки"}}]},{id:421,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/02-8.jpg",alt:"Артефакт Йоргена Хроники Хаоса"}},answers:[{text:"Йорген",img:null}]},{id:422,question:{text:"Как выглядит иконка умения Дыхание преисподней?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-46.jpg",alt:"Дыхание преисподней умение Хроники Хаоса"}}]},{id:423,question:{text:"Как выглядит иконка умения Пронзающий свет?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-47.jpg",alt:"Пронзающий свет умение Хроники Хаоса"}}]},{id:424,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-48.jpg",alt:"Безупречная артефактная эссенция Хроники Хаоса"}},answers:[{text:"Безупречная артефактная эссенция",img:null}]},{id:425,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-49.jpg",alt:"Артефакт героя Темная Звезда Хроники Хаоса"}},answers:[{text:"Темная Звезда",img:null}]},{id:426,question:{text:"Как называется этот предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-50.jpg",alt:"Серпы королевы теней"}},answers:[{text:"Серпы королевы теней",img:null}]},{id:427,question:{text:"Как называется этот расходуемый предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-51.jpg",alt:"Сундук супертитанов Хроники Хаоса"}},answers:[{text:"Сундук Супертитанов",img:null}]},{id:428,question:{text:"Как выглядит иконка умения Стальные небеса?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-52.jpg",alt:"Стальные небеса Хроники Хаоса"}}]},{id:429,question:{text:"Как выглядит иконка умения Одержимость?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-53.jpg",alt:"Одержимость"}}]},{id:430,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-54.jpg",alt:"Исмаил"}},answers:[{text:"Исмаил",img:null}]},{id:431,question:{text:"Как выглядит иконка умения Вихрь лезвий?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-55.jpg",alt:"Вихрь лезвий"}}]},{id:432,question:{text:"Как выглядит иконка умения Клинки Бури?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-56.jpg",alt:"Клинки Бури"}}]},{id:433,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-57.jpg",alt:"Артефакт Фобоса Хроники Хаоса"}},answers:[{text:"Фобос",img:null}]},{id:434,question:{text:"Как выглядит Череп?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-63.jpg",alt:"Череп"}}]},{id:435,question:{text:"Как выглядит расходуемый предмет под названием Артефактная эссенция?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-58.jpg",alt:"Артефактная эссенция"}}]},{id:436,question:{text:"Какой артефакт принадлежит этому герою (Лилит)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-59.jpg",alt:"Лилит герой Хроники Хаоса"}},answers:[{text:"Манускрипт пустоты",img:null},{text:"Дьявольский контракт",img:null},{text:"Кольцо силы",img:null}]},{id:437,question:{text:"Где невозможно получить Артефактные монеты?",img:null},answers:[{text:"Экспедиции",img:null}]},{id:438,question:{text:"Как выглядит иконка умения Отмщение?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-60.jpg",alt:"Отмщение иконка умения Хроники Хаоса"}}]},{id:439,question:{text:"Как называется этот предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-61.jpg",alt:"Всевидящее око"}},answers:[{text:"Всевидящее око",img:null}]},{id:440,question:{text:"Как выглядит предмет под названием Пояс Гиганта?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-62.jpg",alt:"Пояс Гиганта"}}]},{id:441,question:{text:"Как выглядит портрет героя по имени Дориан?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-64.jpg",alt:"Дориан"}}]},{id:442,question:{text:"За что покупаются Камни облика Титана?",img:null},answers:[{text:"Бронзовые Трофеи Войны Гильдий",img:null}]},{id:443,question:{text:"Сколько времени должно пройти между получениями бесплатной энергии в ежедневном задании?",img:null},answers:[{text:"1 час",img:null}]},{id:444,question:{text:"Какой из этих обликов не может принять Лукас, питомец Астрид?",img:null},answers:[{text:"Облик белки",img:null}]},{id:445,question:{text:"Кто из этих героев был воскрешен из мертвых?",img:null},answers:[{text:"Кира",img:null}]},{id:446,question:{text:"Как зовут питомца Астрид?",img:null},answers:[{text:"Лукас",img:null}]},{id:447,question:{text:"Как называется этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3.jpg",alt:"Печать Защиты артефакт титанов игра Хроники Хаоса"}},answers:[{text:"Печать Защиты",img:null}]},{id:448,question:{text:"Какое оружие обладает именем Нобль?",img:null},answers:[{text:"Пулемет Джинджер",img:null}]},{id:449,question:{text:"Кто заведует Лавкой редкостей?",img:null},answers:[{text:"Венди",img:null}]},{id:450,question:{text:"Мастером какой стихии является Андвари?",img:null},answers:[{text:"Стихии Земли",img:null}]},{id:451,question:{text:"Какой уровень подземелья нужно пройти чтобы получить рамку Первобытных глубин?",img:null},answers:[{text:"15 000",img:null}]},{id:452,question:{text:"Кому из героев принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-1.jpg",alt:"Артефакт Арахны игра Хроники Хаоса"}},answers:[{text:"Арахна",img:null}]},{id:453,question:{text:"Как выглядит артефакт титана под названием Круговерть Сиунгура?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-2.jpg",alt:"Артефакт Круговерть Сиунгура Хроники Хаоса"}}]},{id:454,question:{text:"Как выглядит иконка умения Аннигилятор?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-3.jpg",alt:"Анигилятор Хроники Хаоса"}}]},{id:455,question:{text:"В чем преимущество проведения множественных рейдов миссий в кампании?",img:null},answers:[{text:"Они гарантируют выпадение минимум 1 фрагмента предмета за каждые 10 миссий",img:null}]},{id:456,question:{text:"Как зовут этого героя?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-4.jpg",alt:"Гелиос Хроники Хаоса"}},answers:[{text:"Гелиос",img:null}]},{id:457,question:{text:"Как выглядит предмет под названием Всевидец?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-5.jpg",alt:"Всевидец Хроники Хаоса"}}]},{id:458,question:{text:"Сколько раз в день можно получить бесплатную энергию за выполнение Ежедневного задания?",img:null},answers:[{text:"3",img:null}]},{id:459,question:{text:"Какой из этих рамок аватара нет в игре?",img:null},answers:[{text:"Рамка смотрителя башни",img:null}]},{id:460,question:{text:"Сколько знаков дружбы можно получить за день, не считая подарков из группы?",img:null},answers:[{text:"1000",img:null}]},{id:461,question:{text:"Как зовут этого героя?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-6.jpg",alt:"Андвари Хроники Хаоса"}},answers:[{text:"Андвари",img:null}]},{id:462,question:{text:"Что нужно сделать, чтобы разблокировать стикер героя?",img:null},answers:[{text:"Призвать героя",img:null}]},{id:463,question:{text:"В каком магазине можно приобрести камни облика титана?",img:null},answers:[{text:"Магазин Войны Гильдий",img:null}]},{id:464,question:{text:"Как называется этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-7.jpg",alt:"Корона воды Хроники Хаоса"}},answers:[{text:"Корона воды",img:null}]},{id:465,question:{text:"Как выглядит монумент Гранд Арены?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-8.jpg",alt:"Монета Гранд Арены Хроники Хаоса"}}]},{id:466,question:{text:"Что нельзя купить в магазине войны гильдий?",img:null},answers:[{text:"Рунный монолит",img:null}]},{id:467,question:{text:"Как называется этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-9.jpg",alt:"Злюка Коба Хроники Хаоса"}},answers:[{text:"Злюка Коба",img:null}]},{id:468,question:{text:"Сколько противников нужно победить, чтобы перейти во 2-ой этап Турнира Стихий?",img:null},answers:[{text:"5",img:null}]},{id:469,question:{text:"Как часто можно бесплатно переходить из гильдии в гильдию?",img:null},answers:[{text:"Раз в 8 часов",img:null}]},{id:470,question:{text:"Каких обликов нет в игре?",img:null},answers:[{text:"Летних",img:null}]},{id:471,question:{text:"Кто из этих героев имеет инопланетное происхождение?",img:null},answers:[{text:"Орион",img:null}]},{id:472,question:{text:"Как выглядит предмет под названием Жезл Упрямства?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-10.jpg",alt:"Жезл Упрямства Хроники Хаоса"}}]},{id:473,question:{text:"Сколько Камней облика содержит Большой Сундук Камней облика?",img:null},answers:[{text:"150",img:null}]},{id:474,question:{text:"Как выглядит портрет героя по имени Руфус?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-11.jpg",alt:"Руфус Хроники Хаоса"}}]},{id:475,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-12.jpg",alt:"Карающие стрелы Хроники Хаоса"}},answers:[{text:"Карающие стрелы",img:null}]},{id:476,question:{text:"Как можно получить Малый сундук душ героев?",img:null},answers:[{text:"Заходить в игру 28 дней в течении месяца",img:null}]},{id:477,question:{text:"Как называется этот предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-65.jpg",alt:"Потерянное кольцо Хроники Хаоса"}},answers:[{text:"Потерянное кольцо",img:null}]},{id:478,question:{text:"Кто помогает героям пройти башню на 130 уровне команды?",img:null},answers:[{text:"Валькирия",img:null}]},{id:479,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-66.jpg",alt:"Мстительные души Хроники Хаоса"}},answers:[{text:"Мстительные души",img:null}]},{id:480,question:{text:"Каким способом нельзя получить Бронзовый Трофей Войны Гильдий?",img:null},answers:[{text:"Награда в Экспедиции",img:null}]},{id:481,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-67.jpg",alt:""}},answers:[{text:"Лиэн",img:null}]},{id:482,question:{text:"Какова главная цель жизни Астарота?",img:null},answers:[{text:"Спалить мир дотла",img:null}]},{id:483,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-13.jpg",alt:""}},answers:[{text:"Карх",img:null}]},{id:484,question:{text:"Внешность кого из дремерских мастеров Стихий нельзя найти в игре?",img:null},answers:[{text:"Сиунгур",img:null}]},{id:485,question:{text:"Какой артефакт принадлежит этому герою (Орион)? ",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651-5.jpg",alt:"Орион герой игры Хроники Хаоса"}},answers:[{text:"Манускрипт пустоты",img:null},{text:"Арсенал DD-901",img:null},{text:"Кольцо интеллекта",img:null}]},{id:486,question:{text:"Какой артефакт принадлежит этому герою (Данте)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-14-75x75.jpg",alt:"Данте герой Хроники Хаоса"}},answers:[{text:"Посох возрождения",img:null}]},{id:487,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-15-74x75.jpg",alt:""}},answers:[{text:"Криста",img:null}]},{id:488,question:{text:"Как выглядит иконка умения Насмешка Ракаши?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-17.jpg",alt:""}}]},{id:489,question:{text:"Где растет чай, который использует Марта?",img:null},answers:[{text:"В лесах Зараккара",img:null}]},{id:490,question:{text:"Как называется этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-18.jpg",alt:""}},answers:[{text:"Левый и правый",img:null}]},{id:491,question:{text:"У кого из этих героев в базовом облике нет капюшона?",img:null},answers:[{text:"Дориан",img:null}]},{id:492,question:{text:"Как выглядит артефакт титана под названием Браслеты Сиунгура?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-19-75x72.jpg",alt:"Браслеты Сиунгура"}}]},{id:493,question:{text:"Как называется этот предмет?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-20-75x75.jpg",alt:""}},answers:[{text:"Пробудившаяся Сила",img:null}]},{id:494,question:{text:"Как выглядит иконка умения Руна подавления?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-21-75x72.jpg",alt:"Умение Руна подавления"}}]},{id:495,question:{text:"Как называется умение с этой иконкой?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-22.jpg",alt:"Иконка умения Контроль Хроники Хаоса"}},answers:[{text:"Контроль",img:null}]},{id:496,question:{text:"Какой артефакт принадлежит этому герою (Зири)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-23-74x75.jpg",alt:"Зири Хроники Хаоса"}},answers:[{text:"Жало Акреб Умми",img:null},{text:"Завет защитника",img:null},{text:"Кольцо силы",img:null}]},{id:498,question:{text:"Как выглядит иконка умения Средоточение ненависти?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-25-75x75.jpg",alt:"Средоточение ненависти"}}]},{id:499,question:{text:"Какой характеристикой не обладают герои?",img:null},answers:[{text:"Универсальность",img:null}]},{id:500,question:{text:"Какого типа урона нет в игре?",img:null},answers:[{text:"Ментальный",img:null}]},{id:501,question:{text:"У какого из перечисленных героев больше 2 рук?",img:null},answers:[{text:"Данте",img:null}]},{id:502,question:{text:"Как выглядит иконка умения Кристаллический Штурм?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-26-75x74.jpg",alt:"Кристаллический Штурм"}}]},{id:503,question:{text:"Как выглядит иконка умения Я заберу твою жизнь?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-27-75x73.jpg",alt:"Я заберу твою жизнь"}}]},{id:504,question:{text:"Как выглядит артефакт титана под названием Корона Земли?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-28.jpg",alt:"Корона земли Хроники Хаоса"}}]},{id:505,question:{text:"Как выглядит иконка умения Открытое сердце?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-75x75.jpg",alt:"Открытое сердце Хроники Хаоса"}}]},{id:507,question:{text:"Какой артефакт принадлежит этому герою (Гелиос)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/3-4.jpg",alt:"Гелиос Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null},{text:"Жезл тысячи солнц",img:null},{text:"Том тайного знания",img:null}]},{id:508,question:{text:"Как выглядит иконка умения Проводимость?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-2-75x75.jpg",alt:"Проводимость Хроники Хаоса"}}]},{id:509,question:{text:"Какой Артефакт принадлежит этому герою (Джет)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/651-75x75.jpg",alt:"Джет герой в игре Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null}]},{id:510,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-3.jpg",alt:"Артефакт Андвари Хроники Хаоса"}},answers:[{text:"Андвари",img:null}]},{id:511,question:{text:"Как выглядит иконка умения Шпионский Окрас?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-4.jpg",alt:"Шпионский Окрас Хроники Хаоса"}}]},{id:512,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-5-75x75.jpg",alt:"Артефакт Джета Хроники Хаоса"}},answers:[{text:"Джет",img:null}]},{id:513,question:{text:"Какой артефакт принадлежит этому герою (Криста)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/639-75x75.jpg",alt:"Портрет Кристы, игра Хроники Хаоса"}},answers:[{text:"Кольцо интеллекта",img:null},{text:"Цеп нетающей боли",img:null},{text:"Том тайного знания",img:null}]},{id:514,question:{text:"Какому герою принадлежит этот артефакт?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/1-67-75x72.jpg",alt:""}},answers:[{text:"Корнелиус",img:null}]},{id:515,question:{text:"Как выглядит иконка умения Меня не остановить?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-6-75x75.jpg",alt:"Меня не остановить Хроники Хаоса"}}]},{id:516,question:{text:"Какой артефакт принадлежит этому герою (Тесак)?",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-7-75x73.jpg",alt:"Тесак Хроники Хаоса"}},answers:[{text:"Завет защитника",img:null}]},{id:518,question:{text:"Как выглядит иконка умения Рука подавления?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-9-73x75.jpg",alt:"Руна подавления Хроники Хаоса"}}]},{id:519,question:{text:"Как выглядит иконка умения Потеря памяти?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-10-69x75.jpg",alt:"Потеря памяти Хроники Хаоса"}}]},{id:520,question:{text:"Как выглядит иконка умения Эликсир бодрости?",img:null},answers:[{text:"",img:{src:"http://morevokne.ru/wp-content/uploads/2018/03/5-11.jpg",alt:""}}]},{id:521,question:{text:"Сколько фонтанов на площади в небесном городе?",img:null},answers:[{text:"1",img:null}]},{id:522,question:{text:"Души какого героя не дарит девочка Бокси за просмотр видео?",img:null},answers:[{text:"Джет",img:null}]},{id:523,question:{text:"Сколько выстрелов делает Джинджер при помощи умения Свинцовая буря?",img:null},answers:[{text:"7",img:null}]},{id:524,question:{text:"Сколько рун в общей сложности получает каждый участник гильдии за максимум очков активности?",img:null},answers:[{text:"27",img:null}]},{id:525,question:{text:"Какой герой не является стрелком?",img:null},answers:[{text:"нет ответа",img:null}]},{id:526,question:{text:"Какой герой Умеет закапываться?",img:null},answers:[{text:"Скорее всего Зири",img:null}]},{id:527,question:{text:"Какой герой считает что его война никогда не кончится?",img:null},answers:[{text:"Небула",img:null}]},{id:528,question:{text:"Какой из этих героев не является танком?",img:null},answers:[{text:"Исмаил",img:null}]},{id:529,question:{text:"Какого артефакта не существует?",img:null},answers:[{text:"Мушкет охотницы",img:null},{text:"Сущность Архидемона",img:null},{text:"Топоры множества истин",img:null},{text:"Астральная проекция",img:null}]},{id:530,question:{text:"Кто из героев меняет свой облик из Тьмы в Свет, из Света в Тьму?",img:null},answers:[{text:"Селеста",img:null}]},{id:531,question:{text:"Сколько монет душ стоит 25 душ героя Джет?",img:null},answers:[{text:"25000",img:null}]},{id:532,question:{text:"Сколько голов у ледяного пса в подчинении Шаваракка?",img:null},answers:[{text:"3",img:null}]}];

    /* src\components\input.svelte generated by Svelte v3.12.0 */

    const file = "src\\components\\input.svelte";

    function create_fragment(ctx) {
    	var label, input, dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			attr_dev(input, "type", ctx.type);
    			input.value = ctx.value;
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-axtcvq");
    			add_location(input, file, 20, 1, 421);
    			attr_dev(label, "class", ctx.className);
    			add_location(label, file, 19, 0, 392);
    			dispose = listen_dev(input, "input", ctx.handleInput);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			ctx.input_binding(input);
    		},

    		p: function update(changed, ctx) {
    			if (changed.type) {
    				attr_dev(input, "type", ctx.type);
    			}

    			if (changed.value) {
    				prop_dev(input, "value", ctx.value);
    			}

    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (changed.className) {
    				attr_dev(label, "class", ctx.className);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label);
    			}

    			ctx.input_binding(null);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

        let { className = '', placeholder = '', value = '', type = 'text' } = $$props;

    	let inputRef;
    	const setFocus = () => inputRef.focus();

    	const handleInput = (event) => {
    		dispatch('input', {
    			value: event.target.value,
            });
    	};

    	const writable_props = ['className', 'placeholder', 'value', 'type'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('inputRef', inputRef = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('className' in $$props) $$invalidate('className', className = $$props.className);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    	};

    	$$self.$capture_state = () => {
    		return { className, placeholder, value, type, inputRef };
    	};

    	$$self.$inject_state = $$props => {
    		if ('className' in $$props) $$invalidate('className', className = $$props.className);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('inputRef' in $$props) $$invalidate('inputRef', inputRef = $$props.inputRef);
    	};

    	return {
    		className,
    		placeholder,
    		value,
    		type,
    		inputRef,
    		setFocus,
    		handleInput,
    		input_binding
    	};
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["className", "placeholder", "value", "type", "setFocus"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Input", options, id: create_fragment.name });
    	}

    	get className() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setFocus() {
    		return this.$$.ctx.setFocus;
    	}

    	set setFocus(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\counter.svelte generated by Svelte v3.12.0 */

    const file$1 = "src\\components\\counter.svelte";

    function create_fragment$1(ctx) {
    	var div, t0, t1, t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(ctx.count);
    			t1 = text(" / ");
    			t2 = text(ctx.total);
    			attr_dev(div, "class", "svelte-1unj4kq");
    			add_location(div, file$1, 5, 0, 61);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.count) {
    				set_data_dev(t0, ctx.count);
    			}

    			if (changed.total) {
    				set_data_dev(t2, ctx.total);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { count, total } = $$props;

    	const writable_props = ['count', 'total'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Counter> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('total' in $$props) $$invalidate('total', total = $$props.total);
    	};

    	$$self.$capture_state = () => {
    		return { count, total };
    	};

    	$$self.$inject_state = $$props => {
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('total' in $$props) $$invalidate('total', total = $$props.total);
    	};

    	return { count, total };
    }

    class Counter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["count", "total"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Counter", options, id: create_fragment$1.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.count === undefined && !('count' in props)) {
    			console.warn("<Counter> was created without expected prop 'count'");
    		}
    		if (ctx.total === undefined && !('total' in props)) {
    			console.warn("<Counter> was created without expected prop 'total'");
    		}
    	}

    	get count() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get total() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set total(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\image.svelte generated by Svelte v3.12.0 */

    const file$2 = "src\\components\\image.svelte";

    function create_fragment$2(ctx) {
    	var img_1;

    	const block = {
    		c: function create() {
    			img_1 = element("img");
    			attr_dev(img_1, "src", ctx.src);
    			attr_dev(img_1, "alt", ctx.alt);
    			attr_dev(img_1, "width", ctx.width);
    			attr_dev(img_1, "height", ctx.height);
    			attr_dev(img_1, "class", "svelte-u1b8az");
    			add_location(img_1, file$2, 5, 0, 85);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, img_1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(img_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { img } = $$props;
    	const { src, alt, width=50, height=50 } = img;

    	const writable_props = ['img'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Image> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('img' in $$props) $$invalidate('img', img = $$props.img);
    	};

    	$$self.$capture_state = () => {
    		return { img };
    	};

    	$$self.$inject_state = $$props => {
    		if ('img' in $$props) $$invalidate('img', img = $$props.img);
    	};

    	return { img, src, alt, width, height };
    }

    class Image extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["img"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Image", options, id: create_fragment$2.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.img === undefined && !('img' in props)) {
    			console.warn("<Image> was created without expected prop 'img'");
    		}
    	}

    	get img() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\record.svelte generated by Svelte v3.12.0 */

    const file$3 = "src\\components\\record.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.answer = list[i];
    	return child_ctx;
    }

    // (11:2) {#if question.img}
    function create_if_block_1(ctx) {
    	var current;

    	var image = new Image({
    		props: { img: ctx.question.img },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			image.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(11:2) {#if question.img}", ctx });
    	return block;
    }

    // (16:3) {#if answer.img}
    function create_if_block(ctx) {
    	var current;

    	var image = new Image({
    		props: { img: ctx.answer.img },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			image.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(image, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(image.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(image.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(image, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(16:3) {#if answer.img}", ctx });
    	return block;
    }

    // (13:1) {#each answers as answer}
    function create_each_block(ctx) {
    	var div, span, t0_value = ctx.answer.text + "", t0, t1, t2, current;

    	var if_block = (ctx.answer.img) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			add_location(span, file$3, 14, 12, 344);
    			attr_dev(div, "class", "answer svelte-ilatwj");
    			add_location(div, file$3, 13, 2, 311);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.answer.img) if_block.p(changed, ctx);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (if_block) if_block.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(13:1) {#each answers as answer}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var div1, div0, span, t0_value = ctx.id+1 + "", t0, t1, t2_value = ctx.question.text + "", t2, t3, t4, current;

    	var if_block = (ctx.question.img) && create_if_block_1(ctx);

    	let each_value = ctx.answers;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(". ");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(span, "class", "svelte-ilatwj");
    			add_location(span, file$3, 9, 8, 182);
    			attr_dev(div0, "class", "question svelte-ilatwj");
    			add_location(div0, file$3, 8, 1, 151);
    			attr_dev(div1, "class", "container svelte-ilatwj");
    			add_location(div1, file$3, 7, 0, 126);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(div0, t3);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div1, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.question.img) if_block.p(changed, ctx);

    			if (changed.answers) {
    				each_value = ctx.answers;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (if_block) if_block.d();

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { item } = $$props;

    	const { id, question, answers } = item;

    	const writable_props = ['item'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Record> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('item' in $$props) $$invalidate('item', item = $$props.item);
    	};

    	$$self.$capture_state = () => {
    		return { item };
    	};

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate('item', item = $$props.item);
    	};

    	return { item, id, question, answers };
    }

    class Record extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["item"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Record", options, id: create_fragment$3.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.item === undefined && !('item' in props)) {
    			console.warn("<Record> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Record>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Record>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\questions.svelte generated by Svelte v3.12.0 */
    const { window: window_1 } = globals;

    const file$4 = "src\\pages\\questions.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (44:1) {#each filteredQuestions as item (item.id)}
    function create_each_block$1(key_1, ctx) {
    	var first, current;

    	var record = new Record({
    		props: { item: ctx.item },
    		$$inline: true
    	});

    	const block = {
    		key: key_1,

    		first: null,

    		c: function create() {
    			first = empty();
    			record.$$.fragment.c();
    			this.first = first;
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(record, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var record_changes = {};
    			if (changed.filteredQuestions) record_changes.item = ctx.item;
    			record.$set(record_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(record.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(record.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(first);
    			}

    			destroy_component(record, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(44:1) {#each filteredQuestions as item (item.id)}", ctx });
    	return block;
    }

    function create_fragment$4(ctx) {
    	var div0, t0, t1, div1, t3, div2, each_blocks = [], each_1_lookup = new Map(), current, dispose;

    	let input_props = {
    		className: "input",
    		placeholder: "вопрос...",
    		value: ctx.search
    	};
    	var input = new Input({ props: input_props, $$inline: true });

    	ctx.input_binding(input);
    	input.$on("input", ctx.handleInput);

    	var counter = new Counter({
    		props: {
    		count: ctx.count,
    		total: ctx.total
    	},
    		$$inline: true
    	});

    	let each_value = ctx.filteredQuestions;

    	const get_key = ctx => ctx.item.id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input.$$.fragment.c();
    			t0 = space();
    			counter.$$.fragment.c();
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "ESC - очистить фильтр";
    			t3 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(div0, "class", "questions__header svelte-1pu6ozy");
    			add_location(div0, file$4, 35, 0, 895);
    			attr_dev(div1, "class", "info-message svelte-1pu6ozy");
    			add_location(div1, file$4, 40, 0, 1077);
    			attr_dev(div2, "id", "answers");
    			attr_dev(div2, "class", "answers");
    			add_location(div2, file$4, 42, 0, 1132);
    			dispose = listen_dev(window_1, "keydown", ctx.handleKeydown);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(input, div0, null);
    			append_dev(div0, t0);
    			mount_component(counter, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var input_changes = {};
    			if (changed.search) input_changes.value = ctx.search;
    			input.$set(input_changes);

    			var counter_changes = {};
    			if (changed.count) counter_changes.count = ctx.count;
    			if (changed.total) counter_changes.total = ctx.total;
    			counter.$set(counter_changes);

    			const each_value = ctx.filteredQuestions;

    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div2, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    			check_outros();
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);

    			transition_in(counter.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			transition_out(counter.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div0);
    			}

    			ctx.input_binding(null);

    			destroy_component(input);

    			destroy_component(counter);

    			if (detaching) {
    				detach_dev(t1);
    				detach_dev(div1);
    				detach_dev(t3);
    				detach_dev(div2);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

        let search = '';
        let searchRef;

        const handleInput = ({ detail }) => {
            $$invalidate('search', search = detail.value);
    	};

        const handleKeydown = (event) => {
            if (event.code === 'Escape') {
                searchRef.setFocus();
                window.scrollTo({ top: 0, behavior: "smooth"}); // TODO: doesn't work.
                $$invalidate('search', search = '');
            }
        };

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('searchRef', searchRef = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('search' in $$props) $$invalidate('search', search = $$props.search);
    		if ('searchRef' in $$props) $$invalidate('searchRef', searchRef = $$props.searchRef);
    		if ('filteredQuestions' in $$props) $$invalidate('filteredQuestions', filteredQuestions = $$props.filteredQuestions);
    		if ('count' in $$props) $$invalidate('count', count = $$props.count);
    		if ('total' in $$props) $$invalidate('total', total = $$props.total);
    	};

    	let filteredQuestions, count, total;

    	$$self.$$.update = ($$dirty = { search: 1, filteredQuestions: 1 }) => {
    		if ($$dirty.search) { $$invalidate('filteredQuestions', filteredQuestions = list.filter(({ question, answers }) => {
            		const re = new RegExp(search, 'i');
            		return (
            			re.test(question.text) ||
            			answers.some(answer => re.test(answer.text))
            		);
            	})); }
    		if ($$dirty.filteredQuestions) { $$invalidate('count', count = filteredQuestions.length); }
    	};

    	$$invalidate('total', total = list.length);

    	return {
    		search,
    		searchRef,
    		handleInput,
    		handleKeydown,
    		filteredQuestions,
    		count,
    		total,
    		input_binding
    	};
    }

    class Questions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Questions", options, id: create_fragment$4.name });
    	}
    }

    /* src\app.svelte generated by Svelte v3.12.0 */

    const file$5 = "src\\app.svelte";

    function create_fragment$5(ctx) {
    	var main, current;

    	var questions = new Questions({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			questions.$$.fragment.c();
    			attr_dev(main, "class", "svelte-1k4x1t9");
    			add_location(main, file$5, 4, 0, 73);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(questions, main, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(questions.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(questions.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(main);
    			}

    			destroy_component(questions);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$5.name });
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
