"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ic_userlib_1 = require("ic:userlib");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
// tslint:disable:max-classes-per-file
class Render extends ic_userlib_1.IDL.Visitor {
    visitPrimitive(t, d) {
        return new InputBox(t, null);
    }
    visitNull(t, d) {
        const input = new InputBox(t, null);
        input.input.type = 'hidden';
        return input;
    }
    visitRecord(t, fields, d) {
        const form = new RecordForm(fields);
        return new InputBox(t, form);
    }
    visitVariant(t, fields, d) {
        const form = new VariantForm(fields);
        return new InputBox(t, form);
    }
    visitOpt(t, ty, d) {
        const form = new OptionForm(ty);
        return new InputBox(t, form);
    }
    visitVec(t, ty, d) {
        const form = new VecForm(ty);
        return new InputBox(t, form);
    }
    visitRec(t, ty, d) {
        return renderInput(ty);
    }
    visitService(t, d) {
        return new InputBox(t, null);
    }
    visitFunc(t, d) {
        return new InputBox(t, null);
    }
}
class Parse extends ic_userlib_1.IDL.Visitor {
    visitNull(t, v) {
        return null;
    }
    visitBool(t, v) {
        if (v === 'true') {
            return true;
        }
        if (v === 'false') {
            return false;
        }
        throw new Error(`Cannot parse ${v} as boolean`);
    }
    visitText(t, v) {
        return v;
    }
    visitInt(t, v) {
        return +v;
    }
    visitNat(t, v) {
      return new bignumber_js_1.default(v);
      //return +v;
    }
    visitFixedInt(t, v) {
        return new bignumber_js_1.default(v);
    }
    visitFixedNat(t, v) {
        return new bignumber_js_1.default(v);
    }
    visitPrincipal(t, v) {
        return ic_userlib_1.CanisterId.fromText(v);
    }
    visitService(t, v) {
        return ic_userlib_1.CanisterId.fromText(v);
    }
    visitFunc(t, v) {
        const x = v.split('.', 2);
        return [ic_userlib_1.CanisterId.fromText(x[0]), x[1]];
    }
}
class Random extends ic_userlib_1.IDL.Visitor {
    visitNull(t, v) {
        return null;
    }
    visitBool(t, v) {
        return Math.random() < 0.5;
    }
    visitText(t, v) {
        return Math.random().toString(36).substring(6);
    }
    visitInt(t, v) {
        return new bignumber_js_1.default(this.generateNumber(true));
    }
    visitNat(t, v) {
        return new bignumber_js_1.default(this.generateNumber(false));
    }
    visitFixedInt(t, v) {
        return new bignumber_js_1.default(this.generateNumber(true));
    }
    visitFixedNat(t, v) {
        return new bignumber_js_1.default(this.generateNumber(false));
    }
    generateNumber(signed) {
        const num = Math.floor(Math.random() * 100);
        if (signed && Math.random() < 0.5) {
            return -num;
        }
        else {
            return num;
        }
    }
}
function renderInput(t) {
    return t.accept(new Render(), null);
}
exports.renderInput = renderInput;
function parsePrimitive(t, d) {
    return t.accept(new Parse(), d);
}
function generatePrimitive(t) {
    // TODO: in the future we may want to take a string to specify how random values are generated
    return t.accept(new Random(), '');
}
class InputBox {
    constructor(idl, form = null) {
        this.idl = idl;
        this.form = form;
        this.label = null;
        this.value = undefined;
        const status = document.createElement('div');
        status.className = 'status';
        status.style.display = 'none';
        this.status = status;
        const input = document.createElement('input');
        input.className = 'argument';
        input.placeholder = idl.display();
        this.input = input;
        input.addEventListener('blur', () => {
            if (input.value === '') {
                return;
            }
            this.parse();
        });
        input.addEventListener('focus', () => {
            input.className = 'argument';
        });
    }
    isRejected() {
        return this.value === undefined;
    }
    parse(config = {}) {
        if (this.form) {
            const value = this.form.parse(config);
            this.value = value;
            return value;
        }
        try {
            if (config.random && this.input.value === '') {
                const v = generatePrimitive(this.idl);
                this.value = v;
                return v;
            }
            const value = parsePrimitive(this.idl, this.input.value);
            if (!this.idl.covariant(value)) {
                throw new Error(`${this.input.value} is not of type ${this.idl.display()}`);
            }
            this.status.style.display = 'none';
            this.value = value;
            return value;
        }
        catch (err) {
            this.input.className += ' reject';
            this.status.style.display = 'block';
            this.status.innerHTML = 'InputError: ' + err.message;
            this.value = undefined;
            return undefined;
        }
    }
    render(dom) {
        const container = document.createElement('span');
        if (this.label) {
            const label = document.createElement('span');
            label.innerText = this.label;
            container.appendChild(label);
        }
        if (this.form) {
            this.input.type = 'hidden';
            this.form.render(container);
            const input = this.input;
        } else {
          container.appendChild(this.input);
          container.appendChild(this.status);
        }
        dom.appendChild(container);
    }
}
class InputForm {
    constructor() {
        this.form = [];
        this.open = document.createElement('button');
        this.event = 'change';
    }
    renderForm(dom) {
        if (this.form.length === 0) {
            return;
        }
        if (this.form.length === 1) {
            this.form[0].render(dom);
            return;
        }
        const form = document.createElement('div');
        form.className = 'popup-form';
        this.form.forEach(e => e.render(form));
        dom.appendChild(form);
    }
    render(dom) {
        dom.appendChild(this.open);
        const form = this;
        form.open.addEventListener(form.event, () => {
            while (dom.lastElementChild) {
                if (dom.lastElementChild !== form.open) {
                    dom.removeChild(dom.lastElementChild);
                }
                else {
                    break;
                }
            }
            // Render form
            form.generateForm();
            form.renderForm(dom);
        });
    }
}
class RecordForm extends InputForm {
    constructor(fields) {
        super();
        this.fields = fields;
        this.open.innerText = '...';
        this.event = 'click';
    }
    generateForm() {
        this.form = this.fields.map(([key, type]) => {
            const input = renderInput(type);
            input.label = key + ' ';
            return input;
        });
    }
    render(dom) {
        // No open button for record
        this.generateForm();
        this.renderForm(dom);
    }
    parse(config) {
        const v = {};
        this.fields.forEach(([key, _], i) => {
            const value = this.form[i].parse(config);
            v[key] = value;
        });
        if (this.form.some(input => input.isRejected())) {
            return undefined;
        }
        return v;
    }
}
class VariantForm extends InputForm {
    constructor(fields) {
        super();
        this.fields = fields;
        const select = document.createElement('select');
        for (const [key, type] of fields) {
            const option = document.createElement('option');
            option.innerText = key;
            select.appendChild(option);
        }
        select.selectedIndex = -1;
        select.className = 'open';
        this.open = select;
        this.event = 'change';
    }
    generateForm() {
        const index = this.open.selectedIndex;
        const [_, type] = this.fields[index];
        const variant = renderInput(type);
        this.form = [variant];
    }
    parse(config) {
        const select = this.open;
        const selected = select.options[select.selectedIndex].text;
        const value = this.form[0].parse(config);
        if (value === undefined) {
            return undefined;
        }
        const v = {};
        v[selected] = value;
        return v;
    }
}
class OptionForm extends InputForm {
    constructor(ty) {
        super();
        this.ty = ty;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'open';
        this.open = checkbox;
        this.event = 'change';
    }
    generateForm() {
        if (this.open.checked) {
            const opt = renderInput(this.ty);
            this.form = [opt];
        }
        else {
            this.form = [];
        }
    }
    parse(config) {
        if (this.form.length === 0) {
            return [];
        }
        else {
            const value = this.form[0].parse(config);
            if (value === undefined) {
                return undefined;
            }
            return [value];
        }
    }
}
class VecForm extends InputForm {
    constructor(ty) {
        super();
        this.ty = ty;
        const len = document.createElement('input');
        len.type = 'number';
        len.min = '0';
        len.max = '100';
        len.style.width = '3em';
        len.placeholder = 'length';
        len.className = 'open';
        this.open = len;
        this.event = 'change';
    }
    generateForm() {
        const len = this.open.valueAsNumber;
        this.form = [];
        for (let i = 0; i < len; i++) {
            const t = renderInput(this.ty);
            this.form.push(t);
        }
    }
    renderForm(dom) {
        // Same code as parent class except the single length optimization
        if (this.form.length === 0) {
            return;
        }
        const form = document.createElement('div');
        form.className = 'popup-form';
        this.form.forEach(e => e.render(form));
        dom.appendChild(form);
    }
    parse(config) {
        const value = this.form.map(input => {
            return input.parse(config);
        });
        if (this.form.some(input => input.isRejected())) {
            return undefined;
        }
        return value;
    }
}
//# sourceMappingURL=idl-ui.js.map
