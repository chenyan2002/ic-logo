import logo from 'ic:canisters/logo';
import { IDL, UI, UICore } from 'ic:userlib';
import './logo.css';

class T {};
T.Exp = IDL.Rec();
T.List = IDL.Rec();
T.Statement = IDL.Rec()
T.List.fill(IDL.Opt(IDL.Record({'_0_': T.Statement, '_1_': T.List})))
T.Statements = T.List
T.Exp.fill(
  IDL.Variant({'Add': IDL.Record({'_0_': T.Exp, '_1_': T.Exp}), 'Int': IDL.Int,
   'Var': IDL.Text}))
T.Statement.fill(
  IDL.Variant({'repeat': IDL.Record({'_0_': IDL.Nat, '_1_': T.Statements}),
               'home': IDL.Null, 'left': IDL.Null, 'forward': T.Exp, 'right': IDL.Null}))
T.type = IDL.Func([T.Statement], [], []);

const N = 600;

async function renderCanvas(ctx, res) {
  const objects = res[0];
  const x = res[1].toNumber();
  const y = res[2].toNumber();
  const dir = res[3].toNumber();
  ctx.clearRect(0, 0, N, N);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  for (const obj of objects) {
    const start = obj.line.start;
    const end = obj.line.end;
    ctx.beginPath();  
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };
  
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

async function parse(inputs, ctx, fake) {
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
  await renderCanvas(ctx, res);
}

function renderUI(func, dom, ctx) {
  const inputs = [];
  
  let container = document.createElement('div');
  func.argTypes.forEach(arg => {
    const input = UI.renderInput(arg);
    inputs.push(input);
    input.render(container);
  });
  dom.appendChild(container);
  
  dom.appendChild(document.createElement('div'));
  const draw = document.createElement('button');  
  draw.innerText = 'Draw';
  dom.appendChild(draw);
  draw.addEventListener('click', () => {
    parse(inputs, ctx, false);
  });
  
  dom.appendChild(document.createElement('div'));
  const clear = document.createElement('button');
  clear.innerText = 'Clear';
  dom.appendChild(clear);
  clear.addEventListener('click', () => {
    (async () => {
      await logo.clear();
      const res = await logo.output();
      await renderCanvas(ctx, res);
    })();
  });

  // Customize UI
  UI.Render.prototype.visitNumber = (t,d) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('argument');
    input.placeholder = t.display();
    input.addEventListener('change', () => { parse(inputs, ctx, true); });
    // This slide is for Bret Victor's UI
    const slide = document.createElement('input');
    slide.type = 'range';
    slide.style.position = 'relative';
    slide.style.left = '-8em';
    slide.style.top = '-10px';
    slide.addEventListener('input', () => {
      input.value = slide.value;
      parse(inputs, ctx, true);
    });
    input.addEventListener('focus', () => {
      if (input.value !== '') {
        input.parentElement.appendChild(slide);
        slide.value = +input.value;
      }
    });
    input.addEventListener('blur', () => {
      slide.parentElement.removeChild(slide);
    });
    
    return UI.inputBox(t, { input });
  };
  UI.Render.prototype.visitNull = (t,d) => {
    const input = UI.inputBox(t, {});
    // This is a hack to make sure async parse is run after return
    (async () => {
      await parse(inputs, ctx, true);
    })().catch(err => {
      console.log("retry");
      setTimeout(() => { parse(inputs, ctx, true) }, 200);
    });
    return input;
  };
  UI.Render.prototype.visitRecord = (t, fields, d) => {
    let config = {};
    if (t.name === IDL.Record({'_0_': T.Statement, '_1_': T.List}).name) {
      // List/Statements
      config['labelMap'] = {'_0_': '', '_1_': '+'};
      const container = document.createElement('div');
      if (UI.Render.prototype.visitRecord.isIndent) {
        container.style['padding-left'] = '1em';
        UI.Render.prototype.visitRecord.isIndent = false;
      }
      config['container'] = container;
    } else if (t.name === IDL.Record({'_0_': IDL.Nat, '_1_': T.Statements}).name) {
      // Repeat
      config['labelMap'] = {'_0_': 'step', '_1_': ''};
      UI.Render.prototype.visitRecord.isIndent = true;
    } else {
      if (fields.length > 1) {
        const container = document.createElement('div');
        container.classList.add('popup-form');
        config['container'] = container;
      }
    }
    const form = UI.recordForm(fields, config);
    return UI.inputBox(t, { form });
  };
  UI.Render.prototype.visitVariant = (t, fields, d) => {
    const select = document.createElement('select');
    for (const [key, type] of fields) {
      const option = document.createElement('option');
      option.innerText = key;
      select.appendChild(option);
    }
    select.selectedIndex = -1;
    select.classList.add('open');
    let config = { open: select, event: 'change' };
    const form = UI.variantForm(fields, config);
    return UI.inputBox(t, { form });
  }
}

class ExpRender extends IDL.Visitor {
  visitType(t, d) {
    const input = document.createElement('input');
    input.classList.add('argument');
    input.placeholder = t.display();
    return inputBox(t, { input });
  }
}


async function init() {
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;

  const left = document.createElement('div');  
  const ctx = canvas.getContext('2d');
  const res = await logo.output();
  renderCanvas(ctx, res);
  left.appendChild(canvas);
  
  const right = document.createElement('div');
  const func = T.type; //logo.__actorInterface()['eval'];  
  renderUI(func, right, ctx);

  const box = document.createElement('div');
  box.style.display = 'flex';
  box.appendChild(left);
  box.appendChild(right);
  document.body.appendChild(box);  
}

init();
