import logo from 'ic:canisters/logo';
import * as UI from './ui';
import './logo.css';

function renderUI(dom) {  
  let container = document.createElement('div');
  UI.inputs.forEach(arg => arg.render(container));
  dom.appendChild(container);

  //UI.renderValue(UI.type, UI.inputs[0], { repeat: { _0_:6, _1_:[{_0_:{left:null}, _1_:[]}] } });
  
  dom.appendChild(document.createElement('div'));
  const draw = document.createElement('button');
  draw.innerText = 'Draw';
  dom.appendChild(draw);
  draw.addEventListener('click', () => {
    UI.parse(false);
  });
  
  dom.appendChild(document.createElement('div'));
  const clear = document.createElement('button');
  clear.innerText = 'Clear';
  dom.appendChild(clear);
  clear.addEventListener('click', () => {
    (async () => {
      await logo.clear();
      const res = await logo.output();
      await UI.renderCanvas(res);
    })();
  });
}

async function init() {
  document.body.appendChild(UI.stats.dom);
  
  const left = document.createElement('div');  
  left.appendChild(UI.canvas);
  
  const right = document.createElement('div');
  renderUI(right);

  const box = document.createElement('div');
  box.style.display = 'flex';
  box.appendChild(left);
  box.appendChild(right);
  document.body.appendChild(box);

  const res = await logo.output();
  UI.renderCanvas(res);
}

init();

