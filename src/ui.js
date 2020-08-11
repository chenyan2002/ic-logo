import logo from 'ic:canisters/logo';
import { IDL, UI, Actor } from '@dfinity/agent';
import Stats from 'stats.js';

const service = Object.assign(...Actor.interfaceOf(logo)._fields.map(([key, val]) => ({[key]: val})));
const t_eval = service['eval'];
class T {};
T.Statement = t_eval.argTypes[0]._type;
T.Repeat = T.Statement._fields.find(variant => variant[0] === 'repeat')[1];
T.List = T.Repeat._components[1]._type._type;
T.Exp = service['evalExp'].argTypes[0];

class StatementRender extends IDL.Visitor {
  visitNumber(t, d) {
    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('argument');
    input.placeholder = t.display();
    input.addEventListener('change', () => { parse(true); });
    // This slide is for Bret Victor's UI
    const slide = document.createElement('input');
    slide.type = 'range';
    slide.style.position = 'relative';
    slide.style.left = '-8em';
    slide.style.top = '-10px';
    slide.addEventListener('input', () => {
      input.value = slide.value;
      parse(true);
    });
    input.addEventListener('focus', () => {
      if (input.value !== '') {
        input.parentElement.appendChild(slide);
        slide.value = +input.value;
      }
    });
    input.addEventListener('blur', () => {
      if (slide.parentElement) {
        slide.parentElement.removeChild(slide);
      }
    });    
    return UI.inputBox(t, { input });
  }
  visitNull(t, d) {
    const input = UI.inputBox(t, {});
    // This is a hack to make sure async parse is run after return
    (async () => {
      await parse(true);
    })().catch(err => {
      console.log("retry");
      setTimeout(() => { parse(true) }, 200);
    });
    return input;
  }
  visitRec(t, ty, d) {
    if (t.name === T.Exp.name) {
      return renderExp(ty);
    }
    return renderStatement(ty);    
  }
  visitOpt(t, ty, d) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('open');
    const form = UI.optForm(ty, { open: checkbox, event: 'change', render: renderStatement });
    return UI.inputBox(t, { form });    
  }
  visitTuple(t, components, d) {
    let config = { render: renderStatement };
    if (t.name === T.List.name) {
      // List/Statements
      config['labelMap'] = {'_0_': '', '_1_': '+'};
      const container = document.createElement('div');
      if (StatementRender.prototype.visitTuple.isIndent) {
        container.style['padding-left'] = '1em';
        StatementRender.prototype.visitTuple.isIndent = false;
      }
      config['container'] = container;
    } else if (t.name === T.Repeat.name) {
      // Repeat
      config['labelMap'] = {'_0_': 'step', '_1_': ''};
      StatementRender.prototype.visitTuple.isIndent = true;
    } else {
      if (components.length > 1) {
        const container = document.createElement('div');
        container.classList.add('popup-form');
        config['container'] = container;
      }
    }
    const form = UI.tupleForm(components, config);
    return UI.inputBox(t, { form });    
  }
  visitRecord(t, fields, d) {
    let config = { render: renderStatement };
    if (fields.length > 1) {
      const container = document.createElement('div');
      container.classList.add('popup-form');
      config['container'] = container;
    }
    const form = UI.recordForm(fields, config);
    return UI.inputBox(t, { form });    
  }
  visitVariant(t, fields, d) {
    const select = document.createElement('select');
    let config = { open: select, event: 'change', render: renderStatement };
    const labelMap = { 'home': '🏠' };
    for (const [key, type] of fields) {
      let option = new Option(key);
      if (labelMap.hasOwnProperty(key)) {
        option.text = labelMap[key];
        option.value = key;
      }
      select.add(option);
    }
    select.selectedIndex = -1;
    select.classList.add('open');
    const form = UI.variantForm(fields, config);
    return UI.inputBox(t, { form });    
  }
}

export function renderStatement(t) {
  return t.accept(new StatementRender(), null);  
}

class ExpRender extends IDL.Visitor {
  visitType(t, d) {
    const input = document.createElement('input');
    input.classList.add('argument');
    input.placeholder = t.display();
    input.addEventListener('change', () => { parse(true); });
    // This slide is for Bret Victor's UI
    const slide = document.createElement('input');
    slide.type = 'range';
    slide.style.position = 'relative';
    slide.style.left = '-8em';
    slide.style.top = '-10px';
    slide.addEventListener('input', () => {
      input.value = slide.value;
      parse(true);
    });
    input.addEventListener('focus', () => {
      if (input.value !== '') {
        input.parentElement.appendChild(slide);
        slide.value = +input.value;
      }
    });
    input.addEventListener('blur', () => {
      if (slide.parentElement) {
        slide.parentElement.removeChild(slide);
      }
    });
    return UI.inputBox(t, { input, parse: parseExp });
  }
}

class ExpParse extends IDL.Visitor {
  visitType(t, v) {
    if (/^[0-9]+$/.test(v)) {
      const number = +v;
      return { Int: number };
    } else {
      return { Var: v };
    }
  }
}
function renderExp(t) {
  return t.accept(new ExpRender(), null);
}
function parseExp(t, config, v) {
  return t.accept(new ExpParse(), v);
}


//export const inputs = [renderStatement(T.Statement)];
export const inputs = t_eval.argTypes.map(arg => renderStatement(arg));
export const renderValue = UI.renderValue;

// Canvas
const N = 600;
export const canvas = document.createElement("canvas");
canvas.id = 'canvas';
canvas.width = N;
canvas.height = N;
const ctx = canvas.getContext('2d');

export const stats = new Stats();
stats.showPanel(0);

export async function renderCanvas(res) {
  const objects = res[0];
  const x = res[1].toNumber();
  const y = res[2].toNumber();
  const dir = res[3].toNumber();
  ctx.clearRect(0, 0, N, N);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  
  stats.begin();
  for (const obj of objects) {
    const start = obj.line.start;
    const end = obj.line.end;
    ctx.beginPath();  
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };
  stats.end();
  
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 4;
  ctx.translate(x,y);
  ctx.rotate(-dir*Math.PI/180);
  ctx.beginPath();
  ctx.moveTo(-10,-10);
  ctx.lineTo(0,0);
  ctx.lineTo(-10,10);
  ctx.stroke();
  ctx.rotate(dir*Math.PI/180);  
  ctx.translate(-x,-y);
}

export async function parse(fake) {
  const args = inputs.map(arg => arg.parse());
  const isReject = inputs.some(arg => arg.isRejected());
  if (isReject) {
    return;
  }
  let res;
  if (fake) {
    res = await logo.fakeEval(...args);
  } else {
    await logo.eval(...args);
    res = await logo.output();
  }
  await renderCanvas(res);
}
